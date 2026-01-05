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

const CALENDARS = [
  { entity: 'calendar.family', name: 'Family', color: '#4285F4' },
  { entity: 'calendar.bodenburgc_gmail_com', name: 'Corby', color: '#34A853' },
  { entity: 'calendar.knoxbodenburg_gmail_com', name: 'Knox', color: '#EA4335' },
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

const formatDay = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((eventDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

const isAllDay = (start: string): boolean => {
  return !start.includes('T');
};

interface GlassCalendarProps {
  maxEvents?: number;
}

export function GlassCalendar({ maxEvents = 5 }: GlassCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

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

        const allEvents: CalendarEvent[] = [];

        console.log('Fetching calendars from:', HA_URL);
        console.log('Token exists:', !!HA_TOKEN);

        await Promise.all(
          CALENDARS.map(async (cal) => {
            try {
              const url = `${HA_URL}/api/calendars/${cal.entity}?start=${now.toISOString()}&end=${endDate.toISOString()}`;
              console.log('Fetching:', cal.entity);

              const response = await fetch(url, {
                headers: { Authorization: `Bearer ${HA_TOKEN}` },
              });

              console.log(`${cal.entity} response:`, response.status);

              if (response.ok) {
                const data = await response.json();
                console.log(`${cal.entity} events:`, data.length);
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
              console.error(`Error fetching ${cal.entity}:`, err);
            }
          })
        );

        if (cancelled) return;

        console.log('Total events found:', allEvents.length);
        allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        setEvents(allEvents.slice(0, maxEventsRef.current));
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('Calendar fetch error:', err);
        setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="glass-panel text-shadow">
        <div className="glass-header">Upcoming</div>
        <div className="text-white/50">Loading...</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="glass-panel text-shadow">
        <div className="glass-header">Upcoming</div>
        <div className="text-white/50 text-center py-2">No upcoming events</div>
      </div>
    );
  }

  return (
    <div className="glass-panel text-shadow">
      <div className="glass-header">Upcoming</div>

      {/* Horizontal scrolling event list */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {events.map((event, idx) => (
          <div
            key={`${event.summary}-${idx}`}
            className="flex-shrink-0 flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2 min-w-[200px]"
          >
            {/* Color indicator */}
            <div
              className="w-1 h-10 rounded-full flex-shrink-0"
              style={{ backgroundColor: event.color }}
            />

            {/* Event details */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {event.summary}
              </div>
              <div className="text-xs text-white/60 flex items-center gap-2">
                <span>{formatDay(event.start)}</span>
                <span className="text-white/30">•</span>
                <span>
                  {isAllDay(event.start) ? 'All day' : formatTime(event.start)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
