import express from 'express';
import Parser from 'rss-parser';

export const newsRouter = express.Router();

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Kitchen-Command-Center/1.0',
  },
});

// News feed configuration
const NEWS_FEEDS = [
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
  {
    name: 'St. Croix 360',
    url: 'https://www.stcroix360.com/feed/',
  },
];

// Cache for news data
let cachedNews = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Fetch and parse a single feed
async function fetchFeed(feedConfig) {
  try {
    const feed = await parser.parseURL(feedConfig.url);

    return feed.items.slice(0, 10).map((item, index) => ({
      id: `${feedConfig.name}-${index}-${item.guid || item.link}`,
      title: item.title || 'Untitled',
      source: feedConfig.name,
      link: item.link || '',
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
      description: item.contentSnippet || item.content || '',
    }));
  } catch (error) {
    console.error(`Error fetching ${feedConfig.name} feed:`, error.message);
    return [];
  }
}

// Main endpoint
newsRouter.get('/', async (req, res) => {
  try {
    const now = Date.now();

    // Use cache if valid
    if (cachedNews && now - cacheTimestamp < CACHE_DURATION) {
      console.log('Returning cached news data');
      return res.json(cachedNews);
    }

    console.log('Fetching fresh news from all sources...');

    // Fetch all feeds in parallel
    const results = await Promise.all(
      NEWS_FEEDS.map((feed) => fetchFeed(feed))
    );

    // Flatten, dedupe by title, filter by age, and sort by date
    const seenTitles = new Set();
    const currentTime = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    const allItems = results
      .flat()
      .filter((item) => {
        // Filter out articles older than 24 hours
        const pubTime = new Date(item.pubDate).getTime();
        if (currentTime - pubTime > maxAge) return false;

        // Dedupe by title
        const normalizedTitle = item.title.toLowerCase().trim();
        if (seenTitles.has(normalizedTitle)) return false;
        seenTitles.add(normalizedTitle);
        return true;
      })
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    const response = {
      items: allItems,
      meta: {
        count: allItems.length,
        sources: NEWS_FEEDS.map((f) => f.name),
        fetchedAt: new Date().toISOString(),
      },
    };

    // Update cache
    cachedNews = response;
    cacheTimestamp = now;

    res.json(response);
  } catch (error) {
    console.error('News endpoint error:', error);
    res.status(500).json({
      error: 'Failed to fetch news',
      message: error.message,
    });
  }
});

// Force refresh endpoint
newsRouter.post('/refresh', async (req, res) => {
  cachedNews = null;
  cacheTimestamp = 0;
  res.json({ message: 'Cache cleared, next request will fetch fresh data' });
});
