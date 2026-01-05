import { useState, useEffect, useCallback } from 'react';

interface PhotoStripProps {
  onPhotoChange?: (index: number, total: number) => void;
}

interface PhotoManifest {
  count: number;
  photos: string[];
  lastSync: string;
}

const SLIDE_INTERVAL = 30000; // 30 seconds

export function PhotoStrip({ onPhotoChange }: PhotoStripProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFirst, setShowFirst] = useState(true); // Toggle between two image layers

  // Load photos from manifest only
  const loadPhotos = useCallback(async () => {
    try {
      const response = await fetch('/photos/photos.json', { cache: 'no-store' });
      if (response.ok) {
        const manifest: PhotoManifest = await response.json();
        console.log(`[PhotoStrip] Loaded manifest: ${manifest.count} photos`);
        if (manifest.photos && manifest.photos.length > 0) {
          // Shuffle the photos
          const shuffled = manifest.photos
            .map(p => `/photos/${p}`)
            .sort(() => Math.random() - 0.5);
          setPhotos(shuffled);
        }
      } else {
        console.error('[PhotoStrip] Failed to load photos.json');
      }
    } catch (err) {
      console.error('[PhotoStrip] Error loading manifest:', err);
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    loadPhotos();
    const interval = setInterval(loadPhotos, 10 * 60 * 1000); // Refresh every 10 mins
    return () => clearInterval(interval);
  }, [loadPhotos]);

  // Photo slideshow rotation - simple toggle approach
  useEffect(() => {
    if (photos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
      setShowFirst((prev) => !prev); // Toggle layers for crossfade
    }, SLIDE_INTERVAL);

    return () => clearInterval(interval);
  }, [photos.length]);

  // Notify parent of photo changes
  useEffect(() => {
    if (onPhotoChange && photos.length > 0) {
      onPhotoChange(currentIndex, photos.length);
    }
  }, [currentIndex, photos.length, onPhotoChange]);

  // Preload next image
  useEffect(() => {
    if (photos.length > 1) {
      const next = (currentIndex + 1) % photos.length;
      const img = new Image();
      img.src = photos[next];
    }
  }, [currentIndex, photos]);

  // Calculate which photo each layer should show
  const prevIndex = (currentIndex - 1 + photos.length) % photos.length;

  if (photos.length === 0) {
    return (
      <div className="h-full w-full bg-gradient-to-t from-black/80 to-black/40 flex items-center justify-center">
        <div className="text-white/30 text-lg">
          No photos in /public/photos
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative overflow-hidden bg-black">
      {/* Layer 1 - Always rendered */}
      <img
        src={photos[showFirst ? currentIndex : prevIndex]}
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out"
        style={{ opacity: showFirst ? 1 : 0 }}
      />

      {/* Layer 2 - Always rendered */}
      <img
        src={photos[showFirst ? prevIndex : currentIndex]}
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] ease-in-out"
        style={{ opacity: showFirst ? 0 : 1 }}
      />
    </div>
  );
}
