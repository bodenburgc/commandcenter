import { useState, useEffect, useCallback } from 'react';

interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  calendar: string;
}

const HA_URL = import.meta.env.VITE_HA_URL || 'http://localhost:8123';
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN || '';

const CALENDARS = [
  { entity: 'calendar.family', name: 'Family' },
  { entity: 'calendar.bodenburgc_gmail_com', name: 'Corby' },
  { entity: 'calendar.bodenburgk_gmail_com', name: 'Knox' },
  { entity: 'calendar.mccoybodenburg_gmail_com', name: 'McCoy' },
  { entity: 'calendar.ripley_bodenburg', name: 'Ripley' },
  { entity: 'calendar.wrestling_events', name: 'Wrestling' },
  { entity: 'calendar.home', name: 'Home' },
];

interface GreetingProps {
  name?: string;
}

export function Greeting({ name = 'Corby' }: GreetingProps) {
  const [greeting, setGreeting] = useState('');
  const [nextEvent, setNextEvent] = useState<CalendarEvent | null>(null);
  const [timeUntil, setTimeUntil] = useState('');

  // Update greeting based on time of day
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();

      if (hour < 12) {
        setGreeting('Good morning');
      } else if (hour < 17) {
        setGreeting('Good afternoon');
      } else {
        setGreeting('Good evening');
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch next calendar event
  const fetchNextEvent = useCallback(async () => {
    try {
      const now = new Date();
      const endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours ahead

      const allEvents: CalendarEvent[] = [];

      await Promise.all(
        CALENDARS.map(async (cal) => {
          try {
            const response = await fetch(
              `${HA_URL}/api/calendars/${cal.entity}?start=${now.toISOString()}&end=${endDate.toISOString()}`,
              {
                headers: { Authorization: `Bearer ${HA_TOKEN}` },
              }
            );

            if (response.ok) {
              const data = await response.json();
              data.forEach((event: { summary: string; start: { dateTime?: string; date?: string }; end: { dateTime?: string; date?: string } }) => {
                const startTime = event.start.dateTime || event.start.date || '';
                // Skip all-day events for "next event" display
                if (event.start.dateTime) {
                  allEvents.push({
                    summary: event.summary,
                    start: startTime,
                    end: event.end.dateTime || event.end.date || '',
                    calendar: cal.name,
                  });
                }
              });
            }
          } catch {
            // Ignore individual calendar errors
          }
        })
      );

      // Sort by start time and get the next one
      allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      if (allEvents.length > 0) {
        setNextEvent(allEvents[0]);
      } else {
        setNextEvent(null);
      }
    } catch {
      setNextEvent(null);
    }
  }, []);

  useEffect(() => {
    fetchNextEvent();
    const interval = setInterval(fetchNextEvent, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNextEvent]);

  // Update time until next event
  useEffect(() => {
    if (!nextEvent) {
      setTimeUntil('');
      return;
    }

    const updateTimeUntil = () => {
      const now = new Date();
      const eventTime = new Date(nextEvent.start);
      const diffMs = eventTime.getTime() - now.getTime();

      if (diffMs < 0) {
        setTimeUntil('now');
        return;
      }

      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 60) {
        setTimeUntil(`in ${diffMins} min`);
      } else if (diffHours < 24) {
        const mins = diffMins % 60;
        if (mins > 0) {
          setTimeUntil(`in ${diffHours}h ${mins}m`);
        } else {
          setTimeUntil(`in ${diffHours} hour${diffHours > 1 ? 's' : ''}`);
        }
      } else {
        setTimeUntil('tomorrow');
      }
    };

    updateTimeUntil();
    const interval = setInterval(updateTimeUntil, 60000);
    return () => clearInterval(interval);
  }, [nextEvent]);

  return (
    <div className="text-center text-shadow-lg">
      <div className="text-glass-greeting font-light text-white mb-2">
        {greeting}, {name}.
      </div>

      {nextEvent && timeUntil && (
        <div className="text-glass-subtitle font-normal text-white/90">
          {nextEvent.summary} {timeUntil}
        </div>
      )}

      {!nextEvent && (
        <div className="text-glass-subtitle font-normal text-white/70">
          No upcoming events
        </div>
      )}
    </div>
  );
}
