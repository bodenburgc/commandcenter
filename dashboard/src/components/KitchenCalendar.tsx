import React, { useState, useEffect } from 'react';
import { KITCHEN_CALENDARS } from '../config/calendars';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  calendar: string;
  color: string;
}

interface DailyForecast {
  date: string;
  code: number;
  high: number;
  low: number;
  precip: number;
}

// SVG Weather Icons (Apple-style flat design)
const WeatherIcon = ({ code, className = '' }: { code: number; className?: string }) => {
  const icons: Record<number, React.ReactNode> = {
    // Clear
    0: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    // Partly cloudy
    1: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><circle cx="8" cy="8" r="3.5"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.76 3.76l1.06 1.06M12.18 12.18l1.06 1.06M3.76 12.24l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 15.5a4 4 0 014-4h1a3 3 0 013 3v.5a2 2 0 01-2 2H9a2.5 2.5 0 010-5" fill="currentColor" opacity="0.9"/></svg>,
    2: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><circle cx="8" cy="8" r="3.5"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.76 3.76l1.06 1.06M12.18 12.18l1.06 1.06M3.76 12.24l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 15.5a4 4 0 014-4h1a3 3 0 013 3v.5a2 2 0 01-2 2H9a2.5 2.5 0 010-5" fill="currentColor" opacity="0.9"/></svg>,
    // Cloudy
    3: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 19a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 10h.5a4.5 4.5 0 01.5 8.97V19H6z"/></svg>,
    // Fog
    45: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M3 10h18M3 14h18M3 18h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>,
    48: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M3 10h18M3 14h18M3 18h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>,
    // Light rain
    51: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 13a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 4h.5a4.5 4.5 0 01.5 8.97V13H6z"/><path d="M8 17v2M12 17v2M16 17v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    53: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 13a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 4h.5a4.5 4.5 0 01.5 8.97V13H6z"/><path d="M8 17v2M12 17v2M16 17v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    55: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M7 15v4M11 15v4M15 15v4M9 17v4M13 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    // Rain
    61: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 13a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 4h.5a4.5 4.5 0 01.5 8.97V13H6z"/><path d="M8 17v2M12 17v2M16 17v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    63: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M7 15v4M11 15v4M15 15v4M9 17v4M13 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    65: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M7 15v4M11 15v4M15 15v4M9 17v4M13 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    // Freezing rain
    66: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><circle cx="8" cy="17" r="1.5"/><circle cx="12" cy="19" r="1.5"/><circle cx="16" cy="17" r="1.5"/></svg>,
    67: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><circle cx="8" cy="17" r="1.5"/><circle cx="12" cy="19" r="1.5"/><circle cx="16" cy="17" r="1.5"/></svg>,
    // Snow
    71: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M12 14v8M8.5 16l7 4M15.5 16l-7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    73: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M12 14v8M8.5 16l7 4M15.5 16l-7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    75: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M12 14v8M8.5 16l7 4M15.5 16l-7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    77: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><circle cx="8" cy="17" r="1.5"/><circle cx="12" cy="19" r="1.5"/><circle cx="16" cy="17" r="1.5"/></svg>,
    // Showers
    80: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 13a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 4h.5a4.5 4.5 0 01.5 8.97V13H6z"/><path d="M8 17v2M12 17v2M16 17v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    81: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M7 15v4M11 15v4M15 15v4M9 17v4M13 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    82: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M7 15v4M11 15v4M15 15v4M9 17v4M13 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    // Snow showers
    85: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M12 14v8M8.5 16l7 4M15.5 16l-7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    86: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M12 14v8M8.5 16l7 4M15.5 16l-7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    // Thunderstorm
    95: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M13 11l-2 5h4l-2 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
    96: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M13 11l-2 5h4l-2 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
    99: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M13 11l-2 5h4l-2 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
  };
  // Default fallback icon (partly cloudy)
  const defaultIcon = <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 19a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 10h.5a4.5 4.5 0 01.5 8.97V19H6z"/></svg>;
  return icons[code] || defaultIcon;
};

const LATITUDE = 44.8614;
const LONGITUDE = -92.6277;

interface DayGroup {
  date: Date;
  label: string;
  events: CalendarEvent[];
}

// Uses Vite proxy in dev, direct URL in production
const API_URL = import.meta.env.VITE_API_URL || '';

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const getDayLabel = (date: Date): string => {
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
  });
};

const getDateLabel = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

// Get local date key (YYYY-MM-DD in local timezone)
const getLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const groupEventsByDay = (events: CalendarEvent[]): DayGroup[] => {
  const groups: Map<string, DayGroup> = new Map();

  events.forEach((event) => {
    // Use local date for grouping, not UTC
    const dateKey = getLocalDateKey(event.start);
    if (!groups.has(dateKey)) {
      const localDate = new Date(event.start);
      localDate.setHours(0, 0, 0, 0);
      groups.set(dateKey, {
        date: localDate,
        label: getDayLabel(localDate),
        events: [],
      });
    }
    groups.get(dateKey)!.events.push(event);
  });

  // Sort events within each day
  groups.forEach((group) => {
    group.events.sort((a, b) => {
      // All-day events first
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      return a.start.getTime() - b.start.getTime();
    });
  });

  // Return sorted by date
  return Array.from(groups.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
};

const getCalendarColor = (calendarName: string): string => {
  const cal = KITCHEN_CALENDARS.find((c) => c.name === calendarName);
  return cal?.color || '#888888';
};

// Check if event should be displayed as all-day (either marked all-day OR spans multiple days)
const isDisplayedAsAllDay = (event: CalendarEvent): boolean => {
  if (event.allDay) return true;

  // If event spans more than 23 hours, treat as all-day
  const durationMs = event.end.getTime() - event.start.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  return durationHours >= 23;
};

// Determine if text should be dark based on background color brightness
const shouldUseDarkText = (hexColor: string): boolean => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5; // Use dark text for light backgrounds
};

export function KitchenCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute to re-filter past events
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch weather forecast
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=America%2FChicago&forecast_days=6`;
        const response = await fetch(url);
        if (!response.ok) return;
        const data = await response.json();

        // Index 0 = today, 1-5 = next 5 days
        const forecasts: DailyForecast[] = data.daily.time.slice(0, 6).map((date: string, idx: number) => ({
          date,
          code: data.daily.weather_code[idx],
          high: Math.round(data.daily.temperature_2m_max[idx]),
          low: Math.round(data.daily.temperature_2m_min[idx]),
          precip: data.daily.precipitation_probability_max[idx] || 0,
        }));
        setForecast(forecasts);
      } catch (err) {
        console.error('Weather fetch error:', err);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${API_URL}/api/calendars`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // Transform API response to CalendarEvent[]
        const transformedEvents: CalendarEvent[] = data.events.map(
          (e: {
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
          })
        );

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
      <div className="h-full flex items-center justify-center">
        <div className="text-white/50 text-xl">Loading calendars...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-white/50 text-xl mb-2">{error}</div>
        <div className="text-white/30 text-sm">
          Make sure the API proxy is running on port 3001
        </div>
      </div>
    );
  }

  const dayGroups = groupEventsByDay(events);

  // Separate today from upcoming days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  // Find events that started today
  const todayGroup = dayGroups.find(g => {
    const groupDate = new Date(g.date);
    groupDate.setHours(0, 0, 0, 0);
    return groupDate.getTime() === today.getTime();
  });

  // Find ongoing multi-day events (started before today but end AFTER today starts)
  // For all-day events ending at midnight, check if end is strictly greater than today start
  const ongoingEvents = events.filter(event => {
    const eventStart = new Date(event.start);
    eventStart.setHours(0, 0, 0, 0);
    const eventEnd = new Date(event.end);

    // For all-day events, the end date at midnight means the event ended the previous day
    // So we need end date > today (not >=) for all-day events
    if (event.allDay) {
      const endDate = new Date(eventEnd);
      endDate.setHours(0, 0, 0, 0);
      // All-day event must end AFTER today (not on today at midnight)
      return eventStart.getTime() < today.getTime() && endDate.getTime() > today.getTime();
    }

    // For timed events, check if event spans across today
    return eventStart.getTime() < today.getTime() && eventEnd.getTime() > today.getTime();
  });

  // Filter out past events (events that have already ended)
  const filterPastEvents = (eventList: CalendarEvent[]): CalendarEvent[] => {
    return eventList.filter(event => {
      // Keep all-day events for the whole day
      if (event.allDay) return true;
      // Keep events that haven't ended yet
      return event.end.getTime() > currentTime.getTime();
    });
  };

  // Combine today's events with ongoing events, then filter past
  const todayEvents = filterPastEvents([
    ...ongoingEvents,
    ...(todayGroup?.events || [])
  ]).sort((a, b) => {
    // All-day and ongoing events first
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    return a.start.getTime() - b.start.getTime();
  });

  // Get next 5 days starting from tomorrow
  const upcomingGroups = dayGroups.filter(g => {
    const groupDate = new Date(g.date);
    groupDate.setHours(0, 0, 0, 0);
    return groupDate.getTime() > today.getTime();
  }).slice(0, 5);

  // Helper to check if a multi-day event spans a given date
  const eventSpansDate = (event: CalendarEvent, date: Date): boolean => {
    const eventStart = new Date(event.start);
    eventStart.setHours(0, 0, 0, 0);
    const eventEnd = new Date(event.end);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    if (event.allDay) {
      const endDate = new Date(eventEnd);
      endDate.setHours(0, 0, 0, 0);
      return eventStart.getTime() <= targetDate.getTime() && endDate.getTime() > targetDate.getTime();
    }

    return eventStart.getTime() <= targetDate.getTime() && eventEnd.getTime() > targetDate.getTime();
  };

  // Generate 5 consecutive days starting from tomorrow
  const generateUpcomingDays = (): DayGroup[] => {
    const days: DayGroup[] = [];
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (let i = 0; i < 5; i++) {
      const date = new Date(tomorrow);
      date.setDate(date.getDate() + i);
      const dateKey = getLocalDateKey(date);

      // Find events that START on this day
      const existingGroup = upcomingGroups.find(g => {
        return getLocalDateKey(g.date) === dateKey;
      });

      // Find multi-day events that SPAN this day (started earlier but still ongoing)
      const spanningEvents = events.filter(event => {
        const eventStartDate = new Date(event.start);
        eventStartDate.setHours(0, 0, 0, 0);
        // Only include if it started before this day AND spans this day
        return eventStartDate.getTime() < date.getTime() && eventSpansDate(event, date);
      });

      // Combine events for this day
      const dayEvents = [
        ...spanningEvents,
        ...(existingGroup?.events || [])
      ].sort((a, b) => {
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;
        return a.start.getTime() - b.start.getTime();
      });

      days.push({
        date,
        label: getDayLabel(date),
        events: dayEvents,
      });
    }
    return days;
  };

  const fiveDays = generateUpcomingDays();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Spacer to push calendar to ~50% from top */}
      <div className="flex-1" />

      {/* 5-Column Upcoming Calendar */}
      <div className="flex gap-4 mb-6">
        {fiveDays.map((group, index) => {
          // forecast[0] = today, so tomorrow (index 0) uses forecast[1]
          const dayForecast = forecast[index + 1];
          return (
          <div key={`day-${index}`} className="flex-1 flex flex-col min-w-0">
            {/* Day Header with Weather */}
            <div className="mb-3 shrink-0 pb-2 border-b border-white/10 text-center">
              {/* Weather Icon - Top */}
              {dayForecast && (
                <div className="flex items-center justify-center gap-2 mb-1">
                  <WeatherIcon code={dayForecast.code} className="w-8 h-8 text-white" />
                  <div className="text-lg font-medium text-white">
                    {dayForecast.high}°
                    <span className="text-white/50 font-normal">/{dayForecast.low}°</span>
                  </div>
                </div>
              )}
              {/* Precipitation if > 0 */}
              {dayForecast && dayForecast.precip > 0 && (
                <div className="text-blue-400 text-xs mb-1">{dayForecast.precip}% precip</div>
              )}
              {/* Day + Date - Single Line */}
              <div className="text-sm text-white/70 text-shadow uppercase tracking-wide">
                {group.label.toUpperCase()} {getDateLabel(group.date)}
              </div>
            </div>

            {/* Events for this day */}
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-hide">
              {group.events.length > 0 ? (
                group.events.map((event) => (
                  isDisplayedAsAllDay(event) ? (
                    // All-day events: solid color background like Google Calendar
                    <div
                      key={event.id}
                      className="rounded px-2 py-1"
                      style={{ backgroundColor: event.color }}
                    >
                      <div
                        className="text-sm font-medium truncate"
                        style={{ color: shouldUseDarkText(event.color) ? '#0A1B2B' : '#ffffff' }}
                      >
                        {event.title}
                      </div>
                    </div>
                  ) : (
                    // Timed events: glass with left border
                    <div
                      key={event.id}
                      className="glass rounded-lg px-2 py-1.5"
                      style={{ borderLeft: `3px solid ${event.color}` }}
                    >
                      <div className="text-xs text-white/70 text-shadow">
                        {formatTime(event.start)}
                      </div>
                      <div className="text-sm text-white font-medium truncate text-shadow">
                        {event.title}
                      </div>
                    </div>
                  )
                ))
              ) : (
                <div className="text-xs text-white/30 text-center py-4">
                  No events
                </div>
              )}
            </div>
          </div>
        );
        })}
      </div>

      {/* Today's Events - Bottom Left, Width of 3 calendar columns */}
      <div className="mt-auto" style={{ width: 'calc(60% + 1rem)' }}>
        <div className="flex items-center justify-between mb-2 text-shadow border-b border-white/20 pb-2">
          <div className="text-xl font-semibold text-white">Today</div>
          {/* Today's Weather */}
          {forecast[0] && (
            <div className="flex items-center gap-2">
              <WeatherIcon code={forecast[0].code} className="w-6 h-6 text-white" />
              <div className="text-base text-white">
                {forecast[0].high}°
                <span className="text-white/50">/{forecast[0].low}°</span>
              </div>
              {forecast[0].precip > 0 && (
                <div className="text-blue-400 text-sm">{forecast[0].precip}%</div>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {todayEvents.length > 0 ? (
            todayEvents.map((event) => (
              isDisplayedAsAllDay(event) ? (
                // All-day events: solid color background
                <div
                  key={event.id}
                  className="rounded-lg px-3 py-1.5"
                  style={{ backgroundColor: event.color }}
                >
                  <div
                    className="text-base font-medium truncate"
                    style={{ color: shouldUseDarkText(event.color) ? '#0A1B2B' : '#ffffff' }}
                  >
                    {event.title}
                  </div>
                </div>
              ) : (
                // Timed events: glass with left border, inline time and title
                <div
                  key={event.id}
                  className="glass rounded-lg px-3 py-1.5 flex items-center gap-3"
                  style={{ borderLeft: `4px solid ${event.color}` }}
                >
                  <div className="text-sm text-white/70 text-shadow whitespace-nowrap">
                    {formatTime(event.start)} - {formatTime(event.end)}
                  </div>
                  <div className="text-base text-white font-medium truncate text-shadow">
                    {event.title}
                  </div>
                </div>
              )
            ))
          ) : (
            <div className="text-white/40 text-lg py-4">
              No events today
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Note: todayEvents includes both events starting today AND ongoing multi-day events
