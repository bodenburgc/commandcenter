import { useState, useEffect } from 'react';

export function GlassClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const displayHours = hours % 12 || 12;

  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col items-start">
      {/* Date - above time */}
      <div className="text-left -mb-6">
        <span className="ios-date-display">
          {dateStr}
        </span>
      </div>

      {/* Time - floating text */}
      <div className="text-left">
        <span className="ios-time-display">
          {displayHours}:{minutes}
        </span>
      </div>
    </div>
  );
}
