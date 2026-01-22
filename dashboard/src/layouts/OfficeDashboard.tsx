import { useState } from 'react';
import { PhotoBackground } from '../components/PhotoBackground';
import { OfficeHeader } from '../components/office/OfficeHeader';
import { WorkCalendarShelf } from '../components/office/WorkCalendarShelf';
import { TodoShelf } from '../components/office/TodoShelf';
import { RevenueWidget } from '../components/office/RevenueWidget';

export function OfficeDashboard() {
  const [photoInfo, setPhotoInfo] = useState({ index: 0, total: 0 });

  return (
    <div className="min-h-screen w-screen overflow-hidden bg-[#141414]">
      {/* Photo background with 15-minute rotation */}
      <PhotoBackground
        slideInterval={900000}
        onPhotoChange={(index, total) => setPhotoInfo({ index, total })}
      />

      {/* Fixed header - time and weather */}
      <OfficeHeader />

      {/* Main content area - scrollable shelves */}
      <div className="relative z-20 min-h-screen pt-28 pb-20">
        {/* Work Calendar Shelf */}
        <WorkCalendarShelf />

        {/* Task Shelves (Scales, BODE) */}
        <TodoShelf />

        {/* Photo counter - subtle */}
        {photoInfo.total > 0 && (
          <div className="fixed bottom-20 right-8 text-sm text-white/30 z-20">
            {photoInfo.index + 1} / {photoInfo.total}
          </div>
        )}
      </div>

      {/* Fixed revenue widget at bottom */}
      <RevenueWidget />
    </div>
  );
}
