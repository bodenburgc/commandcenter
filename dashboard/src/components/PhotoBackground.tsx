import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

const SLIDE_INTERVAL = 15000; // 15 seconds
const MAX_PHOTOS = 100;
const FADE_DURATION = 1500;

interface PhotoBackgroundProps {
  onPhotoChange?: (index: number, total: number) => void;
  children?: ReactNode; // Clock/content to render between layers
}

interface PhotoData {
  src: string;
  hasMask: boolean;
  fgSrc?: string;
}

export function PhotoBackground({ onPhotoChange, children }: PhotoBackgroundProps) {
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [layerA, setLayerA] = useState<PhotoData | null>(null);
  const [layerB, setLayerB] = useState<PhotoData | null>(null);
  const [showLayerA, setShowLayerA] = useState(true);
  const currentIndexRef = useRef(0);
  const preloadedRef = useRef<Set<string>>(new Set());
  const onPhotoChangeRef = useRef(onPhotoChange);

  useEffect(() => {
    onPhotoChangeRef.current = onPhotoChange;
  }, [onPhotoChange]);

  // Preload an image
  const preloadImage = (src: string): Promise<boolean> => {
    if (preloadedRef.current.has(src)) return Promise.resolve(true);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        preloadedRef.current.add(src);
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = src;
    });
  };

  // Check if mask exists for a photo
  const checkMask = async (photoUrl: string): Promise<PhotoData> => {
    const baseName = photoUrl.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    const fgUrl = `${baseName}_fg.png`;

    try {
      const response = await fetch(fgUrl, { method: 'HEAD' });
      if (response.ok) {
        return { src: photoUrl, hasMask: true, fgSrc: fgUrl };
      }
    } catch {
      // Mask doesn't exist
    }

    return { src: photoUrl, hasMask: false };
  };

  // Scan for available photos on mount
  useEffect(() => {
    const findPhotos = async () => {
      const found: PhotoData[] = [];

      for (let i = 1; i <= MAX_PHOTOS; i++) {
        const extensions = ['jpg', 'jpeg', 'png', 'webp'];

        for (const ext of extensions) {
          try {
            const url = `/photos/photo${i}.${ext}`;
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) {
              const loaded = await preloadImage(url);
              if (loaded) {
                const photoData = await checkMask(url);
                found.push(photoData);
                // Preload foreground if it exists
                if (photoData.fgSrc) {
                  preloadImage(photoData.fgSrc);
                }
              }
              break;
            }
          } catch {
            // Photo doesn't exist
          }
        }
      }

      if (found.length > 0) {
        setPhotos(found);
        setLayerA(found[0]);
        setLayerB(found[0]);
        onPhotoChangeRef.current?.(0, found.length);
      }
    };

    findPhotos();

    const interval = setInterval(findPhotos, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotate through photos
  useEffect(() => {
    if (photos.length <= 1) return;

    const interval = setInterval(async () => {
      const nextIndex = (currentIndexRef.current + 1) % photos.length;
      const nextPhoto = photos[nextIndex];

      // Preload next image and its foreground
      await preloadImage(nextPhoto.src);
      if (nextPhoto.fgSrc) {
        await preloadImage(nextPhoto.fgSrc);
      }

      // Load next image into the hidden layer, then crossfade
      if (showLayerA) {
        setLayerB(nextPhoto);
        requestAnimationFrame(() => {
          setShowLayerA(false);
        });
      } else {
        setLayerA(nextPhoto);
        requestAnimationFrame(() => {
          setShowLayerA(true);
        });
      }

      currentIndexRef.current = nextIndex;
      onPhotoChangeRef.current?.(nextIndex, photos.length);
    }, SLIDE_INTERVAL);

    return () => clearInterval(interval);
  }, [photos, showLayerA]);

  if (photos.length === 0) {
    return (
      <>
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        {children && (
          <div className="fixed inset-0 z-10 flex items-start justify-center pt-8">
            {children}
          </div>
        )}
      </>
    );
  }

  // Depth effect disabled
  const hasDepthEffect = false;

  return (
    <>
      {/* Background layers (z-0) */}
      <div className="fixed inset-0 z-0 overflow-hidden bg-black">
        {/* Layer A - Background */}
        {layerA && (
          <img
            src={layerA.src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out"
            style={{
              opacity: showLayerA ? 1 : 0,
              transitionDuration: `${FADE_DURATION}ms`
            }}
          />
        )}

        {/* Layer B - Background */}
        {layerB && (
          <img
            src={layerB.src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out"
            style={{
              opacity: showLayerA ? 0 : 1,
              transitionDuration: `${FADE_DURATION}ms`
            }}
          />
        )}

        {/* Subtle vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
      </div>

      {/* Middle layer - Clock/Content (z-5) - only when depth effect is active */}
      {children && (
        <div className="fixed inset-0 z-5 pointer-events-none">
          {children}
        </div>
      )}

      {/* Foreground layers (z-10) - Subject on top of clock */}
      {hasDepthEffect && (
        <div className="fixed inset-0 z-10 overflow-hidden pointer-events-none">
          {/* Layer A - Foreground */}
          {layerA?.fgSrc && (
            <img
              src={layerA.fgSrc}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out"
              style={{
                opacity: showLayerA ? 1 : 0,
                transitionDuration: `${FADE_DURATION}ms`
              }}
            />
          )}

          {/* Layer B - Foreground */}
          {layerB?.fgSrc && (
            <img
              src={layerB.fgSrc}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out"
              style={{
                opacity: showLayerA ? 0 : 1,
                transitionDuration: `${FADE_DURATION}ms`
              }}
            />
          )}
        </div>
      )}
    </>
  );
}
