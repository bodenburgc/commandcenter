import { Clock } from '../components/Clock';
import { Weather } from '../components/Weather';
import { CameraGrid } from '../components/CameraGrid';
import { Thermostat } from '../components/Thermostat';
import { EnergyMonitor } from '../components/EnergyMonitor';
import { Calendar } from '../components/Calendar';
import { PhotoSlideshow } from '../components/PhotoSlideshow';

export function OfficeDashboard() {
  return (
    <div className="min-h-screen w-screen bg-dash-bg tv-safe">
      {/* Main Grid Layout - optimized for 55" TV @ 1080p */}
      <div className="grid grid-cols-12 grid-rows-6 gap-4 h-screen p-[2.5%]">
        {/* Top Left - Clock */}
        <div className="col-span-3 row-span-2">
          <Clock />
        </div>

        {/* Top Center - Photo Slideshow */}
        <div className="col-span-6 row-span-3">
          <PhotoSlideshow />
        </div>

        {/* Top Right - Calendar */}
        <div className="col-span-3 row-span-4">
          <Calendar maxEvents={10} />
        </div>

        {/* Middle Left - Thermostat & Energy */}
        <div className="col-span-3 row-span-2 grid grid-rows-2 gap-4">
          <Thermostat />
          <EnergyMonitor />
        </div>

        {/* Bottom Center - Cameras */}
        <div className="col-span-6 row-span-3">
          <CameraGrid columns={3} maxCameras={6} />
        </div>

        {/* Bottom Left - Weather */}
        <div className="col-span-3 row-span-2">
          <Weather />
        </div>

        {/* Bottom Right - Empty for now or future widget */}
        <div className="col-span-3 row-span-2">
          {/* Could add another widget here */}
        </div>
      </div>
    </div>
  );
}
