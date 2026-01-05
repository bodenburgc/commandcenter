import { useState, useEffect } from 'react';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  pubDate: Date;
  link: string;
}

// Uses Vite proxy in dev, direct URL in production
const API_URL = import.meta.env.VITE_API_URL || '';

const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'Just now';
};

export function NewsStrip() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch news from API
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`${API_URL}/api/news`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        const transformedNews: NewsItem[] = data.items.map(
          (item: {
            id: string;
            title: string;
            source: string;
            pubDate: string;
            link: string;
          }) => ({
            id: item.id,
            title: item.title,
            source: item.source,
            pubDate: new Date(item.pubDate),
            link: item.link,
          })
        );

        setNews(transformedNews);
        setError(null);
      } catch (err) {
        console.error('News fetch error:', err);
        setError('Unable to load news');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 15 * 60 * 1000); // 15 minutes
    return () => clearInterval(interval);
  }, []);

  // Rotate through headlines
  useEffect(() => {
    if (news.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 10000); // 10 seconds per headline

    return () => clearInterval(interval);
  }, [news.length]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="text-white/40 text-lg">Loading news...</div>
      </div>
    );
  }

  if (error || news.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="text-white/40 text-lg">
          {error || 'No news available'}
        </div>
      </div>
    );
  }

  const currentNews = news[currentIndex];

  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="text-center max-w-4xl">
        {/* Headline */}
        <div
          key={currentNews.id}
          className="animate-fade-in"
        >
          <div className="text-2xl text-white font-light tracking-wide text-shadow" style={{ fontFamily: 'Inter, sans-serif' }}>
            {currentNews.title}
          </div>
          <div className="text-base text-white/50 flex items-center justify-center gap-2 text-shadow mt-1">
            <span>{currentNews.source}</span>
            <span>•</span>
            <span>{getTimeAgo(currentNews.pubDate)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
