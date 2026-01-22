import { useState, useEffect } from 'react';

const LATITUDE = 44.8614;
const LONGITUDE = -92.6277;

interface WeatherData {
  temp: number;
  high: number;
  low: number;
  code: number;
}

// Weather code to emoji
const getWeatherEmoji = (code: number): string => {
  const weatherMap: Record<number, string> = {
    0: '☀️', // Clear sky
    1: '🌤️', 2: '⛅', 3: '☁️', // Partly cloudy
    45: '🌫️', 48: '🌫️', // Fog
    51: '🌧️', 53: '🌧️', 55: '🌧️', // Drizzle
    61: '🌧️', 63: '🌧️', 65: '🌧️', // Rain
    66: '🌨️', 67: '🌨️', // Freezing rain
    71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️', // Snow
    80: '🌧️', 81: '🌧️', 82: '🌧️', // Rain showers
    85: '🌨️', 86: '🌨️', // Snow showers
    95: '⛈️', 96: '⛈️', 99: '⛈️', // Thunderstorm
  };
  return weatherMap[code] || '🌡️';
};

export function OfficeHeader() {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch weather
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=America%2FChicago`;
        const response = await fetch(url);
        if (!response.ok) return;

        const data = await response.json();
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          high: Math.round(data.daily.temperature_2m_max[0]),
          low: Math.round(data.daily.temperature_2m_min[0]),
          code: data.current.weather_code,
        });
      } catch (err) {
        console.error('Weather fetch error:', err);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000); // 10 minutes
    return () => clearInterval(interval);
  }, []);

  // Format time
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent px-8 py-6 z-30">
      <div className="flex items-center justify-between">
        {/* Time and Date */}
        <div className="flex items-baseline gap-4">
          <span className="text-5xl font-light text-white">
            {formatTime(time)}
          </span>
          <span className="text-xl text-white/70">
            {formatDate(time)}
          </span>
        </div>

        {/* Weather */}
        {weather && (
          <div className="flex items-center gap-4">
            <span className="text-4xl">{getWeatherEmoji(weather.code)}</span>
            <div className="text-right">
              <div className="text-3xl font-light text-white">{weather.temp}°F</div>
              <div className="text-sm text-white/60">
                H: {weather.high}° L: {weather.low}°
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
