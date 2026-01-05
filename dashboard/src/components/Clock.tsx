import { useState, useEffect } from 'react';

export function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };
  const dateString = time.toLocaleDateString('en-US', dateOptions);

  return (
    <div className="widget flex flex-col items-center justify-center">
      <div className="flex items-baseline gap-2">
        <span className="text-tv-clock font-light tracking-tight tabular-nums">
          {displayHours}:{minutes}
        </span>
        <div className="flex flex-col items-start">
          <span className="text-tv-lg font-light text-dash-muted">{ampm}</span>
          <span className="text-tv-sm font-mono text-dash-muted tabular-nums">:{seconds}</span>
        </div>
      </div>
      <div className="text-tv-base text-dash-muted mt-2">{dateString}</div>
    </div>
  );
}
