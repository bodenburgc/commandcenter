import express from 'express';
import ical from 'node-ical';

export const calendarRouter = express.Router();

// Calendar configuration - 11 family calendars
const CALENDARS = [
  {
    name: 'Home',
    url: 'https://calendar.google.com/calendar/ical/rbign4tavseamech15rub73bpo%40group.calendar.google.com/private-0dab1430fd9bfc9ec28c1d3f2df48b7f/basic.ics',
  },
  {
    name: 'Kristine',
    url: 'https://calendar.google.com/calendar/ical/bodenburgk%40gmail.com/private-546476c4f57288a5993f7a470dd9bac5/basic.ics',
  },
  {
    name: 'KristineWork',
    url: 'https://outlook.office365.com/owa/calendar/61f43b67499b4dbc9259e1c7284569fe@nerdherdpro.com/c06aed08d1024be498165252cc11be4111143249975685112976/calendar.ics',
  },
  {
    name: 'Corby',
    url: 'https://calendar.google.com/calendar/ical/bodenburgc%40gmail.com/private-bc0e359141047fa8baba9f23b77aa027/basic.ics',
  },
  {
    name: 'CorbyWork',
    url: 'https://calendar.google.com/calendar/ical/cbodenburg%40scalesadvertising.com/private-a374761ae54b95123e00bd8c7223f5a1/basic.ics',
  },
  {
    name: 'CorbyBode',
    url: 'https://calendar.google.com/calendar/ical/corby%40bode.design/private-dc07c908bd21d5dde42ddb7e0019775e/basic.ics',
  },
  {
    name: 'McCoy',
    url: 'https://calendar.google.com/calendar/ical/mccoybodenburg%40gmail.com/private-d978b9fef3bb17da9633494fc3753606/basic.ics',
  },
  {
    name: 'Knox',
    url: 'https://calendar.google.com/calendar/ical/knoxbodenburg%40gmail.com/private-5fad57a71427654aae6008580c326c7d/basic.ics',
  },
  {
    name: 'Ripley',
    url: 'https://calendar.google.com/calendar/ical/ripleybodenburg%40gmail.com/private-c0bf7210c9fd8d68279d34bf19bfa503/basic.ics',
  },
  {
    name: 'Holidays',
    url: 'https://calendar.google.com/calendar/ical/en.usa%23holiday%40group.v.calendar.google.com/public/basic.ics',
  },
  {
    name: 'Wrestling',
    url: 'https://calendar.google.com/calendar/ical/0b0702e5d8f35a65194e86a220b631530c8cfd027a9630407b225017af102ae6%40group.calendar.google.com/private-ea6666a3bd67adbb22195505835ec7f3/basic.ics',
  },
];

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

// Fetch and parse a single calendar
async function fetchCalendar(calConfig) {
  try {
    const events = await ical.async.fromURL(calConfig.url);
    const parsedEvents = [];

    for (const [key, event] of Object.entries(events)) {
      if (event.type !== 'VEVENT') continue;

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

    // Fetch all calendars in parallel
    const results = await Promise.all(
      CALENDARS.map((cal) => fetchCalendar(cal))
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
