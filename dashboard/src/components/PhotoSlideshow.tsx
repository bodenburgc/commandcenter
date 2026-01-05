import { useState, useEffect } from 'react';

const SLIDE_INTERVAL = 15000; // 15 seconds
const MAX_PHOTOS = 100; // Maximum photos to check for

export function PhotoSlideshow() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Scan for available photos on mount
  useEffect(() => {
    const findPhotos = async () => {
      const found: string[] = [];

      // Check for photos named photo1.jpg through photo{MAX_PHOTOS}.jpg
      for (let i = 1; i <= MAX_PHOTOS; i++) {
        const extensions = ['jpg', 'jpeg', 'png', 'webp'];

        for (const ext of extensions) {
          try {
            const url = `/photos/photo${i}.${ext}`;
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok) {
              found.push(url);
              break; // Found this photo, move to next number
            }
          } catch {
            // Photo doesn't exist, continue
          }
        }
      }

      if (found.length > 0) {
        // Shuffle photos
        const shuffled = found.sort(() => Math.random() - 0.5);
        setPhotos(shuffled);
      }
      setLoading(false);
    };

    findPhotos();

    // Re-scan every 5 minutes in case photos were updated
    const interval = setInterval(findPhotos, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotate through photos
  useEffect(() => {
    if (photos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, SLIDE_INTERVAL);

    return () => clearInterval(interval);
  }, [photos.length]);

  if (loading) {
    return (
      <div className="widget h-full">
        <div className="card-header">Photos</div>
        <div className="text-tv-sm text-dash-muted">Loading photos...</div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="widget h-full flex flex-col">
        <div className="card-header">Photos</div>
        <div className="text-tv-sm text-dash-muted mb-2">No photos found</div>
        <div className="text-tv-xs text-dash-muted">
          Run sync script to import from iCloud:
          <code className="block mt-2 bg-dash-border/50 px-2 py-1 rounded text-xs">
            ./scripts/sync-photos.sh
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black">
      <img
        key={photos[currentIndex]}
        src={photos[currentIndex]}
        alt={`Photo ${currentIndex + 1}`}
        className="w-full h-full object-contain animate-fade-in"
        onError={() => {
          // Skip broken images
          if (photos.length > 1) {
            setCurrentIndex((prev) => (prev + 1) % photos.length);
          }
        }}
      />
      {/* Photo counter */}
      <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 rounded-full text-xs text-white/70">
        {currentIndex + 1} / {photos.length}
      </div>
    </div>
  );
}
