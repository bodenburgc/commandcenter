import { useState } from 'react';
import { PhotoBackground } from '../components/PhotoBackground';
import { GlassClock } from '../components/GlassClock';
import { GlassWeather } from '../components/GlassWeather';
import { GlassCalendar } from '../components/GlassCalendar';

export function GlassDashboard() {
  const [photoInfo, setPhotoInfo] = useState({ index: 0, total: 0 });

  return (
    <div className="min-h-screen w-screen overflow-hidden">
      {/* Photo background with depth effect - clock renders between layers */}
      <PhotoBackground
        onPhotoChange={(index, total) => setPhotoInfo({ index, total })}
      >
        {/* This renders between background and foreground for depth effect */}
        <div className="w-full pt-12">
          <GlassClock />
        </div>
      </PhotoBackground>

      {/* Content layer - always on top */}
      <div className="relative z-20 min-h-screen w-screen glass-safe flex flex-col pointer-events-none">
        {/* Weather - top right corner */}
        <div className="flex justify-end pointer-events-auto">
          <GlassWeather />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Bottom - Calendar strip */}
        <div className="mb-4 pointer-events-auto">
          <GlassCalendar maxEvents={5} />
        </div>

        {/* Photo counter - subtle at bottom right */}
        {photoInfo.total > 0 && (
          <div className="absolute bottom-4 right-4 text-sm text-white/40 text-shadow">
            {photoInfo.index + 1} / {photoInfo.total}
          </div>
        )}
      </div>
    </div>
  );
}
