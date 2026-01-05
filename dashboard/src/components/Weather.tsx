import { useState, useEffect } from 'react';

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
}

// WMO Weather interpretation codes
const weatherCodes: Record<number, { icon: string; description: string }> = {
  0: { icon: '☀️', description: 'Clear sky' },
  1: { icon: '🌤️', description: 'Mainly clear' },
  2: { icon: '⛅', description: 'Partly cloudy' },
  3: { icon: '☁️', description: 'Overcast' },
  45: { icon: '🌫️', description: 'Foggy' },
  48: { icon: '🌫️', description: 'Depositing rime fog' },
  51: { icon: '🌧️', description: 'Light drizzle' },
  53: { icon: '🌧️', description: 'Moderate drizzle' },
  55: { icon: '🌧️', description: 'Dense drizzle' },
  61: { icon: '🌧️', description: 'Slight rain' },
  63: { icon: '🌧️', description: 'Moderate rain' },
  65: { icon: '🌧️', description: 'Heavy rain' },
  66: { icon: '🌨️', description: 'Light freezing rain' },
  67: { icon: '🌨️', description: 'Heavy freezing rain' },
  71: { icon: '❄️', description: 'Slight snow' },
  73: { icon: '❄️', description: 'Moderate snow' },
  75: { icon: '❄️', description: 'Heavy snow' },
  77: { icon: '🌨️', description: 'Snow grains' },
  80: { icon: '🌦️', description: 'Slight showers' },
  81: { icon: '🌦️', description: 'Moderate showers' },
  82: { icon: '🌦️', description: 'Violent showers' },
  85: { icon: '🌨️', description: 'Slight snow showers' },
  86: { icon: '🌨️', description: 'Heavy snow showers' },
  95: { icon: '⛈️', description: 'Thunderstorm' },
  96: { icon: '⛈️', description: 'Thunderstorm with hail' },
  99: { icon: '⛈️', description: 'Thunderstorm with heavy hail' },
};

const getWeatherInfo = (code: number) => {
  return weatherCodes[code] || { icon: '❓', description: 'Unknown' };
};

// River Falls, WI coordinates
const LATITUDE = 44.8614;
const LONGITUDE = -92.6277;

export function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FChicago&forecast_days=5`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather fetch failed');

        const data = await response.json();
        setWeather(data);
        setError(null);
      } catch (err) {
        setError('Unable to fetch weather');
        console.error('Weather error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="widget">
        <div className="card-header">Weather</div>
        <div className="text-tv-base text-dash-muted">Loading...</div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="widget">
        <div className="card-header">Weather</div>
        <div className="text-tv-sm text-red-400">{error || 'No data'}</div>
      </div>
    );
  }

  const current = weather.current;
  const daily = weather.daily;
  const currentWeather = getWeatherInfo(current.weather_code);

  return (
    <div className="widget">
      <div className="card-header">River Falls, WI</div>

      {/* Current conditions */}
      <div className="flex items-center gap-6 mb-6">
        <span className="text-[5rem]">{currentWeather.icon}</span>
        <div>
          <div className="text-tv-2xl font-light">
            {Math.round(current.temperature_2m)}°F
          </div>
          <div className="text-tv-sm text-dash-muted">
            {currentWeather.description}
          </div>
        </div>
      </div>

      {/* Current details */}
      <div className="flex gap-8 mb-6 text-tv-xs text-dash-muted">
        <div>
          <span className="opacity-60">Humidity:</span> {current.relative_humidity_2m}%
        </div>
        <div>
          <span className="opacity-60">Wind:</span> {Math.round(current.wind_speed_10m)} mph
        </div>
      </div>

      {/* 5-day forecast */}
      <div className="border-t border-dash-border pt-4">
        <div className="grid grid-cols-5 gap-4">
          {daily.time.slice(0, 5).map((date, i) => {
            const dayWeather = getWeatherInfo(daily.weather_code[i]);
            const dayName = i === 0 ? 'Today' : new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });

            return (
              <div key={date} className="text-center">
                <div className="text-tv-xs text-dash-muted mb-2">{dayName}</div>
                <div className="text-3xl mb-2">{dayWeather.icon}</div>
                <div className="text-tv-xs">
                  <span className="text-dash-text">{Math.round(daily.temperature_2m_max[i])}°</span>
                  <span className="text-dash-muted mx-1">/</span>
                  <span className="text-dash-muted">{Math.round(daily.temperature_2m_min[i])}°</span>
                </div>
                {daily.precipitation_probability_max[i] > 20 && (
                  <div className="text-tv-xs text-blue-400 mt-1">
                    {daily.precipitation_probability_max[i]}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
