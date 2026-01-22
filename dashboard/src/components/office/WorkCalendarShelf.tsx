import { useState, useEffect } from 'react';
import { ContentShelf } from './ContentShelf';
import { CalendarCard } from './CalendarCard';
import { KITCHEN_CALENDARS, OFFICE_CALENDARS } from '../../config/calendars';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  calendar: string;
  color: string;
}

const API_URL = import.meta.env.VITE_API_URL || '';

const getCalendarColor = (calendarName: string): string => {
  const cal = KITCHEN_CALENDARS.find((c) => c.name === calendarName);
  return cal?.color || '#888888';
};

export function WorkCalendarShelf() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${API_URL}/api/calendars`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // Transform and filter for work calendars only
        const transformedEvents: CalendarEvent[] = data.events
          .filter((e: { calendar: string }) => OFFICE_CALENDARS.includes(e.calendar))
          .map((e: {
            id: string;
            title: string;
            start: string;
            end: string;
            allDay: boolean;
            calendar: string;
          }) => ({
            id: e.id,
            title: e.title,
            start: new Date(e.start),
            end: new Date(e.end),
            allDay: e.allDay,
            calendar: e.calendar,
            color: getCalendarColor(e.calendar),
          }));

        setEvents(transformedEvents);
        setError(null);
      } catch (err) {
        console.error('Calendar fetch error:', err);
        setError('Unable to load calendars');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <ContentShelf title="Work Calendar">
        <div className="text-white/50 text-lg">Loading calendar...</div>
      </ContentShelf>
    );
  }

  if (error) {
    return (
      <ContentShelf title="Work Calendar">
        <div className="text-white/50 text-lg">{error}</div>
      </ContentShelf>
    );
  }

  // Get upcoming events (today and next 7 days)
  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const upcomingEvents = events
    .filter(e => e.end >= now && e.start <= weekFromNow)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 10); // Show up to 10 events

  return (
    <ContentShelf title="Work Calendar">
      {upcomingEvents.length > 0 ? (
        upcomingEvents.map((event) => (
          <CalendarCard
            key={event.id}
            title={event.title}
            start={event.start}
            end={event.end}
            allDay={event.allDay}
            color={event.color}
            calendar={event.calendar}
          />
        ))
      ) : (
        <div className="netflix-card w-72 min-w-72 p-4 bg-white/5">
          <div className="text-white/40 text-center">No upcoming work events</div>
        </div>
      )}
    </ContentShelf>
  );
}
