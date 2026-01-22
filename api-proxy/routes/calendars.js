import express from 'express';
import ical from 'node-ical';

export const calendarRouter = express.Router();

// Calendar configuration - URLs loaded from environment variables
const CALENDARS = [
  { name: 'Home', url: process.env.CAL_HOME_URL },
  { name: 'Kristine', url: process.env.CAL_KRISTINE_URL },
  { name: 'KristineWork', url: process.env.CAL_KRISTINEWORK_URL },
  { name: 'Corby', url: process.env.CAL_CORBY_URL },
  { name: 'CorbyWork', url: process.env.CAL_CORBYWORK_URL },
  { name: 'CorbyBode', url: process.env.CAL_CORBYBODE_URL },
  { name: 'McCoy', url: process.env.CAL_MCCOY_URL },
  { name: 'Knox', url: process.env.CAL_KNOX_URL },
  { name: 'Ripley', url: process.env.CAL_RIPLEY_URL },
  { name: 'Holidays', url: process.env.CAL_HOLIDAYS_URL },
  { name: 'Wrestling', url: process.env.CAL_WRESTLING_URL },
  { name: 'Work', url: process.env.CAL_WORK_URL }, // Office display work calendar
].filter(cal => cal.url); // Only include calendars with URLs configured

// Cache for calendar data
let cachedEvents = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper to check if event is within date range
function isEventInRange(event, startDate, endDate) {
  if (!event.start) return false;

  const eventStart = event.start instanceof Date ? event.start : new Date(event.start);
  const eventEnd = event.end instanceof Date ? event.end : new Date(event.end || eventStart);

  return eventStart <= endDate && eventEnd >= startDate;
}

// Helper to determine if event is all-day
function isAllDay(event) {
  // If the type is explicitly 'date' (not 'date-time'), it's all-day
  if (event.start && typeof event.start === 'object' && event.start.dateOnly) {
    return true;
  }
  // Check if time is midnight to midnight
  if (event.start && event.end) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    if (
      start.getHours() === 0 &&
      start.getMinutes() === 0 &&
      end.getHours() === 0 &&
      end.getMinutes() === 0
    ) {
      return true;
    }
  }
  return false;
}

// Fetch and parse a single calendar (with recurring event expansion)
async function fetchCalendar(calConfig, rangeStart, rangeEnd) {
  try {
    const events = await ical.async.fromURL(calConfig.url);
    const parsedEvents = [];

    for (const [key, event] of Object.entries(events)) {
      if (event.type !== 'VEVENT') continue;

      // Handle recurring events
      if (event.rrule) {
        try {
          // Get all occurrences within our date range
          const occurrences = event.rrule.between(rangeStart, rangeEnd, true);

          // Get original event's time-of-day (rrule returns UTC dates, we need to preserve local time)
          const originalStart = new Date(event.start);
          const originalEnd = event.end ? new Date(event.end) : originalStart;
          const duration = originalEnd.getTime() - originalStart.getTime();

          for (const occurrence of occurrences) {
            // Check if this occurrence is excluded (EXDATE)
            const isExcluded = event.exdate && Object.values(event.exdate).some(exdate => {
              const exTime = new Date(exdate).getTime();
              return Math.abs(exTime - occurrence.getTime()) < 1000 * 60 * 60; // Within 1 hour
            });

            if (isExcluded) continue;

            // Create occurrence with correct time
            // Handle all-day vs timed events differently
            let occurrenceStart;
            const eventIsAllDay = isAllDay(event);

            if (eventIsAllDay) {
              // For all-day events, use UTC date but LOCAL midnight
              // This ensures the date displays correctly in the local timezone
              occurrenceStart = new Date(
                occurrence.getUTCFullYear(),
                occurrence.getUTCMonth(),
                occurrence.getUTCDate(),
                0, 0, 0  // Local midnight, not UTC
              );
            } else {
              // For timed events, combine:
              // - Year/Month/Day from the occurrence (local time from rrule)
              // - Hour/Minute/Second from the original event (local time)
              occurrenceStart = new Date(
                occurrence.getFullYear(),
                occurrence.getMonth(),
                occurrence.getDate(),
                originalStart.getHours(),
                originalStart.getMinutes(),
                originalStart.getSeconds()
              );
            }
            const occurrenceEnd = new Date(occurrenceStart.getTime() + duration);

            parsedEvents.push({
              id: `${key}-${occurrenceStart.toISOString()}`,
              title: event.summary || 'Untitled Event',
              start: occurrenceStart,
              end: occurrenceEnd,
              allDay: isAllDay(event),
              calendar: calConfig.name,
              location: event.location || null,
              description: event.description || null,
            });
          }
        } catch (rruleError) {
          console.error(`Error expanding rrule for ${event.summary}:`, rruleError.message);
        }
      } else {
        // Non-recurring event
        parsedEvents.push({
          id: key,
          title: event.summary || 'Untitled Event',
          start: event.start,
          end: event.end || event.start,
          allDay: isAllDay(event),
          calendar: calConfig.name,
          location: event.location || null,
          description: event.description || null,
        });
      }
    }

    return parsedEvents;
  } catch (error) {
    console.error(`Error fetching ${calConfig.name} calendar:`, error.message);
    return [];
  }
}

// Main endpoint
calendarRouter.get('/', async (req, res) => {
  try {
    const now = Date.now();

    // Use cache if valid
    if (cachedEvents && now - cacheTimestamp < CACHE_DURATION) {
      console.log('Returning cached calendar data');
      return res.json(cachedEvents);
    }

    console.log('Fetching fresh calendar data from all sources...');

    // Date range: today to 14 days from now
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);
    endDate.setHours(23, 59, 59, 999);

    // Fetch all calendars in parallel (pass date range for recurring event expansion)
    const results = await Promise.all(
      CALENDARS.map((cal) => fetchCalendar(cal, startDate, endDate))
    );

    // Flatten and filter events
    const allEvents = results
      .flat()
      .filter((event) => isEventInRange(event, startDate, endDate))
      .map((event) => ({
        ...event,
        start: event.start instanceof Date ? event.start.toISOString() : event.start,
        end: event.end instanceof Date ? event.end.toISOString() : event.end,
      }))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    const response = {
      events: allEvents,
      meta: {
        count: allEvents.length,
        calendars: CALENDARS.map((c) => c.name),
        fetchedAt: new Date().toISOString(),
        range: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
    };

    // Update cache
    cachedEvents = response;
    cacheTimestamp = now;

    res.json(response);
  } catch (error) {
    console.error('Calendar endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch calendars',
      message: error.message,
    });
  }
});

// Force refresh endpoint
calendarRouter.post('/refresh', async (req, res) => {
  cachedEvents = null;
  cacheTimestamp = 0;
  res.json({ message: 'Cache cleared, next request will fetch fresh data' });
});
