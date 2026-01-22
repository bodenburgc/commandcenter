/**
 * Family Calendar Configuration
 * Colors for each calendar (URLs are in api-proxy/.env)
 */

export interface CalendarConfig {
  name: string;
  color: string;
}

export const KITCHEN_CALENDARS: CalendarConfig[] = [
  { name: 'Home', color: '#EBAB21' },        // Yellow
  { name: 'Kristine', color: '#E91E63' },    // Pink
  { name: 'KristineWork', color: '#9C27B0' }, // Purple
  { name: 'Corby', color: '#000000' },       // Black
  { name: 'CorbyWork', color: '#000000' },   // Black
  { name: 'CorbyBode', color: '#009688' },   // Teal
  { name: 'McCoy', color: '#4CAF50' },       // Green
  { name: 'Knox', color: '#00BFFF' },        // Bright Blue
  { name: 'Ripley', color: '#FF6D01' },      // Orange
  { name: 'Holidays', color: '#607D8B' },    // Gray
  { name: 'Wrestling', color: '#9C27B0' },   // Purple
  { name: 'Work', color: '#1A73E8' },        // Google Blue (for Office display)
];

// Office layout - calendars to show (work-focused)
export const OFFICE_CALENDARS = ['Work', 'CorbyWork', 'CorbyBode', 'Corby'];

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
