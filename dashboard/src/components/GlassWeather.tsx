import { useState, useEffect } from 'react';

interface WeatherData {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_probability_max: number[];
  };
}

const weatherCodes: Record<number, { icon: string; description: string }> = {
  0: { icon: '☀️', description: 'Clear' },
  1: { icon: '🌤️', description: 'Mostly Clear' },
  2: { icon: '⛅', description: 'Partly Cloudy' },
  3: { icon: '☁️', description: 'Cloudy' },
  45: { icon: '🌫️', description: 'Foggy' },
  48: { icon: '🌫️', description: 'Foggy' },
  51: { icon: '🌧️', description: 'Drizzle' },
  53: { icon: '🌧️', description: 'Drizzle' },
  55: { icon: '🌧️', description: 'Drizzle' },
  61: { icon: '🌧️', description: 'Rain' },
  63: { icon: '🌧️', description: 'Rain' },
  65: { icon: '🌧️', description: 'Heavy Rain' },
  66: { icon: '🌨️', description: 'Freezing Rain' },
  67: { icon: '🌨️', description: 'Freezing Rain' },
  71: { icon: '❄️', description: 'Snow' },
  73: { icon: '❄️', description: 'Snow' },
  75: { icon: '❄️', description: 'Heavy Snow' },
  77: { icon: '🌨️', description: 'Snow' },
  80: { icon: '🌦️', description: 'Showers' },
  81: { icon: '🌦️', description: 'Showers' },
  82: { icon: '🌦️', description: 'Heavy Showers' },
  85: { icon: '🌨️', description: 'Snow Showers' },
  86: { icon: '🌨️', description: 'Snow Showers' },
  95: { icon: '⛈️', description: 'Thunderstorm' },
  96: { icon: '⛈️', description: 'Thunderstorm' },
  99: { icon: '⛈️', description: 'Thunderstorm' },
};

const getWeatherInfo = (code: number) => {
  return weatherCodes[code] || { icon: '❓', description: 'Unknown' };
};

const LATITUDE = 44.8614;
const LONGITUDE = -92.6277;
const LOCATION = 'River Falls';

export function GlassWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago&forecast_days=7`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather fetch failed');

        const data = await response.json();
        setWeather(data);
      } catch (err) {
        console.error('Weather error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !weather) {
    return (
      <div className="glass-panel text-shadow">
        <div className="text-white/60 text-sm">{LOCATION}</div>
        <div className="text-white/50">Loading...</div>
      </div>
    );
  }

  const { current, daily } = weather;
  const currentWeather = getWeatherInfo(current.weather_code);
  const todayHigh = Math.round(daily.temperature_2m_max[0]);
  const todayLow = Math.round(daily.temperature_2m_min[0]);

  return (
    <div className="text-shadow p-4">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{currentWeather.icon}</span>
        <div>
          <div className="text-4xl font-light text-white">
            {Math.round(current.temperature_2m)}°
          </div>
          <div className="text-sm text-white/60">
            {todayHigh}° / {todayLow}°
          </div>
        </div>
      </div>
    </div>
  );
}
