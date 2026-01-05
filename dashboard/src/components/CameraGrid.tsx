import { useState, useEffect, useCallback } from 'react';

interface Camera {
  entityId: string;
  name: string;
}

const CAMERAS: Camera[] = [
  { entityId: 'camera.driveway', name: 'Driveway' },
  { entityId: 'camera.garage', name: 'Garage' },
  { entityId: 'camera.patio', name: 'Patio' },
  { entityId: 'camera.pool_area', name: 'Pool Area' },
  { entityId: 'camera.basement', name: 'Basement' },
  { entityId: 'camera.crawl_space', name: 'Crawl Space' },
  { entityId: 'camera.ripley_s_room', name: "Ripley's Room" },
];

const HA_URL = import.meta.env.VITE_HA_URL || 'http://localhost:8123';
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN || '';

interface CameraGridProps {
  columns?: number;
  maxCameras?: number;
  refreshInterval?: number;
}

function CameraImage({ camera, onClick }: { camera: Camera; onClick: () => void }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchImage = useCallback(async () => {
    try {
      const response = await fetch(
        `${HA_URL}/api/camera_proxy/${camera.entityId}`,
        {
          headers: {
            Authorization: `Bearer ${HA_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch camera image');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Clean up old URL
      setImageUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return url;
      });
      setError(false);
      setLoading(false);
    } catch (err) {
      console.error(`Error fetching ${camera.name}:`, err);
      setError(true);
      setLoading(false);
    }
  }, [camera.entityId, camera.name]);

  useEffect(() => {
    fetchImage();
    // Refresh every 10 seconds
    const interval = setInterval(fetchImage, 10000);

    return () => {
      clearInterval(interval);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [fetchImage]);

  return (
    <div
      className="relative aspect-video bg-dash-border rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-dash-accent transition-all"
      onClick={onClick}
    >
      {loading && !imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center text-dash-muted">
          <div className="animate-pulse">Loading...</div>
        </div>
      )}

      {error && !imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center text-dash-muted text-sm">
          <span>Offline</span>
        </div>
      )}

      {imageUrl && (
        <img
          src={imageUrl}
          alt={camera.name}
          className="w-full h-full object-cover"
        />
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <span className="text-sm font-medium">{camera.name}</span>
      </div>
    </div>
  );
}

export function CameraGrid({ columns = 3, maxCameras = 6 }: CameraGridProps) {
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const displayCameras = CAMERAS.slice(0, maxCameras);

  // Full screen view for selected camera
  if (selectedCamera) {
    return (
      <div
        className="fixed inset-0 bg-black z-50 flex flex-col"
        onClick={() => setSelectedCamera(null)}
      >
        <div className="p-4 text-tv-base font-medium">{selectedCamera.name}</div>
        <div className="flex-1 flex items-center justify-center p-4">
          <CameraImage
            camera={selectedCamera}
            onClick={() => setSelectedCamera(null)}
          />
        </div>
        <div className="p-4 text-tv-xs text-dash-muted text-center">
          Click anywhere to close
        </div>
      </div>
    );
  }

  return (
    <div className="widget h-full">
      <div className="card-header">Cameras</div>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {displayCameras.map((camera) => (
          <CameraImage
            key={camera.entityId}
            camera={camera}
            onClick={() => setSelectedCamera(camera)}
          />
        ))}
      </div>

      {CAMERAS.length > maxCameras && (
        <div className="mt-3 text-tv-xs text-dash-muted text-center">
          +{CAMERAS.length - maxCameras} more cameras
        </div>
      )}
    </div>
  );
}
