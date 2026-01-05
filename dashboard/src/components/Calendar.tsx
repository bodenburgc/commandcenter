import { useState, useEffect, useRef } from 'react';

interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  calendar: string;
  color: string;
}

const HA_URL = import.meta.env.VITE_HA_URL || 'http://localhost:8123';
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN || '';

// Calendar config with colors
const CALENDARS = [
  { entity: 'calendar.family', name: 'Family', color: '#4285F4' },
  { entity: 'calendar.bodenburgc_gmail_com', name: 'Corby', color: '#34A853' },
  { entity: 'calendar.bodenburgk_gmail_com', name: 'Knox', color: '#EA4335' },
  { entity: 'calendar.mccoybodenburg_gmail_com', name: 'McCoy', color: '#FBBC05' },
  { entity: 'calendar.ripley_bodenburg', name: 'Ripley', color: '#FF6D01' },
  { entity: 'calendar.wrestling_events', name: 'Wrestling', color: '#9C27B0' },
  { entity: 'calendar.home', name: 'Home', color: '#00BCD4' },
];

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((eventDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const isAllDay = (start: string, end: string): boolean => {
  // All-day events typically have date-only format or span exactly 24 hours
  return !start.includes('T') ||
    (new Date(end).getTime() - new Date(start).getTime() >= 24 * 60 * 60 * 1000);
};

interface CalendarProps {
  maxEvents?: number;
}

export function Calendar({ maxEvents = 8 }: CalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const maxEventsRef = useRef(maxEvents);

  useEffect(() => {
    maxEventsRef.current = maxEvents;
  }, [maxEvents]);

  useEffect(() => {
    let cancelled = false;

    const fetchEvents = async () => {
      try {
        const now = new Date();
        const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead

        const startStr = now.toISOString();
        const endStr = endDate.toISOString();

        const allEvents: CalendarEvent[] = [];

        // Fetch events from each calendar
        await Promise.all(
          CALENDARS.map(async (cal) => {
            try {
              const response = await fetch(
                `${HA_URL}/api/calendars/${cal.entity}?start=${startStr}&end=${endStr}`,
                {
                  headers: { Authorization: `Bearer ${HA_TOKEN}` },
                }
              );

              if (response.ok) {
                const data = await response.json();
                data.forEach((event: { summary: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string } }) => {
                  allEvents.push({
                    summary: event.summary,
                    start: event.start.dateTime || event.start.date || '',
                    end: event.end.dateTime || event.end.date || '',
                    calendar: cal.name,
                    color: cal.color,
                  });
                });
              }
            } catch (err) {
              console.error(`Error fetching ${cal.name}:`, err);
            }
          })
        );

        if (cancelled) return;

        // Sort by start time
        allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        setEvents(allEvents.slice(0, maxEventsRef.current));
        setError(false);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching calendars:', err);
        setError(true);
        setLoading(false);
      }
    };

    fetchEvents();
    // Refresh every 5 minutes
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="widget h-full">
        <div className="card-header">Calendar</div>
        <div className="text-tv-sm text-dash-muted">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="widget h-full">
        <div className="card-header">Calendar</div>
        <div className="text-tv-sm text-red-400">Unable to load calendars</div>
      </div>
    );
  }

  // Group events by date
  const groupedEvents: Record<string, CalendarEvent[]> = {};
  events.forEach((event) => {
    const dateKey = formatDate(event.start);
    if (!groupedEvents[dateKey]) {
      groupedEvents[dateKey] = [];
    }
    groupedEvents[dateKey].push(event);
  });

  return (
    <div className="widget h-full flex flex-col">
      <div className="card-header">Upcoming</div>

      <div className="flex-1 overflow-hidden">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-tv-sm text-dash-muted text-center py-8">
            No upcoming events
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedEvents).map(([dateLabel, dateEvents]) => (
              <div key={dateLabel}>
                <div className="text-tv-xs font-medium text-dash-muted mb-2">
                  {dateLabel}
                </div>
                <div className="space-y-2">
                  {dateEvents.map((event, idx) => (
                    <div
                      key={`${event.summary}-${idx}`}
                      className="flex items-start gap-3 p-2 rounded-lg bg-dash-border/20"
                    >
                      <div
                        className="w-1 self-stretch rounded-full flex-shrink-0"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {event.summary}
                        </div>
                        <div className="text-xs text-dash-muted flex items-center gap-2">
                          <span>
                            {isAllDay(event.start, event.end)
                              ? 'All day'
                              : formatTime(event.start)}
                          </span>
                          <span className="opacity-50">•</span>
                          <span>{event.calendar}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
