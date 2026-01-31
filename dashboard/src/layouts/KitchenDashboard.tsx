import { useState, useCallback, useEffect } from 'react';
import { GlassClock } from '../components/GlassClock';
import { KitchenWeather } from '../components/KitchenWeather';
import { KitchenCalendar } from '../components/KitchenCalendar';
import { NewsStrip } from '../components/NewsStrip';
import { PhotoStrip } from '../components/PhotoStrip';

/**
 * Kitchen Command Center - Vertical Layout (1080x1920)
 * MagicMirror Style: Fullscreen photo background with floating widgets
 *
 * Layers:
 * - z-0: Fullscreen photo slideshow background
 * - z-1: Gradient overlay for text readability
 * - z-10: Content widgets (clock, weather, calendar, news)
 *
 * URL params:
 * - ?rotate=90 or ?rotate=270 for Fire TV rotation (landscape -> portrait)
 * - ?scale=0.8 to scale down content (0.5 to 1.5, default 1)
 */

// Check for rotation parameter (for Fire TV which can't rotate natively)
const getRotation = (): number => {
  const urlParams = new URLSearchParams(window.location.search);
  const rotate = urlParams.get('rotate');
  if (rotate === '90' || rotate === '270') {
    return parseInt(rotate);
  }
  return 0;
};

// Get initial scale (checks localStorage first, then URL, then defaults)
const getInitialScale = (): number => {
  // Check localStorage first (persisted from keyboard adjustments)
  const saved = localStorage.getItem('dashboardScale');
  if (saved) {
    const parsed = parseFloat(saved);
    if (!isNaN(parsed) && parsed >= 0.2 && parsed <= 1.5) {
      return parsed;
    }
  }

  // Check URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const scale = urlParams.get('scale');
  const rotation = urlParams.get('rotate');

  if (scale) {
    const parsed = parseFloat(scale);
    if (!isNaN(parsed) && parsed >= 0.2 && parsed <= 1.5) {
      return parsed;
    }
  }

  // Default scale for Fire TV rotation (compensates for pixel density difference)
  if (rotation === '90' || rotation === '270') {
    return 0.4;
  }

  return 1;
};

export function KitchenDashboard() {
  const [photoInfo, setPhotoInfo] = useState({ index: 0, total: 0 });
  const [scale, setScale] = useState(getInitialScale);
  const [showScale, setShowScale] = useState(false);
  const rotation = getRotation();

  const handlePhotoChange = useCallback((index: number, total: number) => {
    setPhotoInfo({ index, total });
  }, []);

  // Keyboard shortcuts to adjust scale on the fly
  // + or = : increase scale by 0.05
  // - : decrease scale by 0.05
  // 0 : reset to default (0.3 for rotated, 1 for normal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let newScale = scale;

      if (e.key === '+' || e.key === '=') {
        newScale = Math.min(1.5, scale + 0.05);
      } else if (e.key === '-') {
        newScale = Math.max(0.2, scale - 0.05);
      } else if (e.key === '0') {
        newScale = rotation ? 0.4 : 1;
        localStorage.removeItem('dashboardScale');
      } else {
        return;
      }

      newScale = Math.round(newScale * 100) / 100; // Round to 2 decimals
      setScale(newScale);
      localStorage.setItem('dashboardScale', String(newScale));

      // Show scale indicator briefly
      setShowScale(true);
      setTimeout(() => setShowScale(false), 1500);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scale, rotation]);

  // Rotation styles for Fire TV (landscape device displaying portrait content)
  // Fire TV: 1920x1080 → rotated to 1080x1920
  // Width becomes viewport height (1080), height becomes viewport width (1920)
  const rotationStyle = rotation ? {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    width: '100vh',   // 1080px (viewport height)
    height: '100vw',  // 1920px (viewport width)
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
  } : {};

  // Scale styles for content only (not background)
  // Using zoom instead of transform:scale to avoid empty space around content
  const contentScaleStyle = scale !== 1 ? {
    zoom: scale,
  } : {};

  return (
    <div
      className="h-screen w-screen bg-black overflow-hidden relative"
      style={rotationStyle}
    >
      {/* Layer 0: Fullscreen Photo Background */}
      <div className="absolute inset-0 z-0">
        <PhotoStrip onPhotoChange={handlePhotoChange} />
      </div>

      {/* Layer 1: Gradient Overlay for readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/70 via-black/30 to-black/60 pointer-events-none" />

      {/* Layer 2: Content (scaled independently of background) */}
      <div className="relative z-10 h-full flex flex-col p-6 gap-4" style={contentScaleStyle}>
        {/* Top Row: Clock + Current Weather */}
        <section className="flex items-start justify-between shrink-0">
          <GlassClock />
          <KitchenWeather showForecast={false} />
        </section>

        {/* Calendar Section (includes Today + Reminders at bottom) */}
        <section className="flex-1 min-h-0 overflow-hidden">
          <KitchenCalendar />
        </section>

        {/* News Ticker */}
        <section className="h-[80px] shrink-0">
          <NewsStrip />
        </section>

        {/* Photo counter - subtle overlay */}
        {photoInfo.total > 0 && (
          <div className="absolute bottom-2 right-6 text-sm text-white/40 text-shadow">
            {photoInfo.index + 1} / {photoInfo.total}
          </div>
        )}

        {/* Scale indicator - shows when adjusting with keyboard */}
        {showScale && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-xl text-2xl font-medium">
            Scale: {scale.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
}
