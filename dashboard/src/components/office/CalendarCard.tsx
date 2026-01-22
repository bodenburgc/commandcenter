interface CalendarCardProps {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color: string;
  calendar: string;
}

export function CalendarCard({ title, start, end, allDay, color }: CalendarCardProps) {
  // Format time
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format date
  const formatDate = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const eventDate = new Date(date);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate.getTime() === today.getTime()) return 'Today';
    if (eventDate.getTime() === tomorrow.getTime()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Determine if text should be dark based on background color brightness
  const shouldUseDarkText = (hexColor: string): boolean => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  };

  const textColor = shouldUseDarkText(color) ? '#1a1a1a' : '#ffffff';

  return (
    <div
      className="netflix-card w-72 min-w-72 p-4"
      style={{ backgroundColor: color }}
    >
      {/* Event title */}
      <div
        className="text-base font-semibold mb-2 line-clamp-2"
        style={{ color: textColor }}
      >
        {title}
      </div>

      {/* Date and time */}
      <div
        className="text-sm"
        style={{ color: textColor, opacity: 0.8 }}
      >
        {formatDate(start)}
        {!allDay && (
          <>
            {' '}
            <span style={{ opacity: 0.6 }}>|</span>{' '}
            {formatTime(start)} - {formatTime(end)}
          </>
        )}
        {allDay && <span className="ml-2 opacity-60">All day</span>}
      </div>
    </div>
  );
}
