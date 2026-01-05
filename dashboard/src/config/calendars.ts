/**
 * Family Calendar Configuration
 * 11 calendars from the original MagicMirror setup
 */

export interface CalendarConfig {
  name: string;
  url: string;
  color: string;
}

export const KITCHEN_CALENDARS: CalendarConfig[] = [
  {
    name: 'Home',
    url: 'https://calendar.google.com/calendar/ical/rbign4tavseamech15rub73bpo%40group.calendar.google.com/private-0dab1430fd9bfc9ec28c1d3f2df48b7f/basic.ics',
    color: '#EBAB21', // Yellow
  },
  {
    name: 'Kristine',
    url: 'https://calendar.google.com/calendar/ical/bodenburgk%40gmail.com/private-546476c4f57288a5993f7a470dd9bac5/basic.ics',
    color: '#E91E63', // Pink
  },
  {
    name: 'KristineWork',
    url: 'https://outlook.office365.com/owa/calendar/61f43b67499b4dbc9259e1c7284569fe@nerdherdpro.com/c06aed08d1024be498165252cc11be4111143249975685112976/calendar.ics',
    color: '#9C27B0', // Purple
  },
  {
    name: 'Corby',
    url: 'https://calendar.google.com/calendar/ical/bodenburgc%40gmail.com/private-bc0e359141047fa8baba9f23b77aa027/basic.ics',
    color: '#000000', // Black
  },
  {
    name: 'CorbyWork',
    url: 'https://calendar.google.com/calendar/ical/cbodenburg%40scalesadvertising.com/private-a374761ae54b95123e00bd8c7223f5a1/basic.ics',
    color: '#000000', // Black
  },
  {
    name: 'CorbyBode',
    url: 'https://calendar.google.com/calendar/ical/corby%40bode.design/private-dc07c908bd21d5dde42ddb7e0019775e/basic.ics',
    color: '#009688', // Teal
  },
  {
    name: 'McCoy',
    url: 'https://calendar.google.com/calendar/ical/mccoybodenburg%40gmail.com/private-d978b9fef3bb17da9633494fc3753606/basic.ics',
    color: '#00BFFF', // Bright Blue
  },
  {
    name: 'Knox',
    url: 'https://calendar.google.com/calendar/ical/knoxbodenburg%40gmail.com/private-5fad57a71427654aae6008580c326c7d/basic.ics',
    color: '#4CAF50', // Green
  },
  {
    name: 'Ripley',
    url: 'https://calendar.google.com/calendar/ical/ripleybodenburg%40gmail.com/private-c0bf7210c9fd8d68279d34bf19bfa503/basic.ics',
    color: '#FF6D01', // Orange
  },
  {
    name: 'Holidays',
    url: 'https://calendar.google.com/calendar/ical/en.usa%23holiday%40group.v.calendar.google.com/public/basic.ics',
    color: '#607D8B', // Gray
  },
  {
    name: 'Wrestling',
    url: 'https://calendar.google.com/calendar/ical/0b0702e5d8f35a65194e86a220b631530c8cfd027a9630407b225017af102ae6%40group.calendar.google.com/private-ea6666a3bd67adbb22195505835ec7f3/basic.ics',
    color: '#9C27B0', // Purple
  },
];

// News feed URLs
export const NEWS_FEEDS = [
  {
    name: 'MPR News',
    url: 'https://www.mprnews.org/feed/minnesota',
  },
  {
    name: 'Star Tribune',
    url: 'https://www.startribune.com/local/index.rss2',
  },
  {
    name: 'KARE11',
    url: 'https://www.kare11.com/feeds/syndication/rss/news',
  },
];
