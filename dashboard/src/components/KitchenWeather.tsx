import React, { useState, useEffect } from 'react';

interface WeatherData {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
  };
}

// SVG Weather Icons (Apple-style flat design)
const WeatherIcon = ({ code, className = '' }: { code: number; className?: string }) => {
  const icons: Record<number, React.ReactNode> = {
    0: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    1: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><circle cx="8" cy="8" r="3.5"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.76 3.76l1.06 1.06M12.18 12.18l1.06 1.06M3.76 12.24l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 15.5a4 4 0 014-4h1a3 3 0 013 3v.5a2 2 0 01-2 2H9a2.5 2.5 0 010-5" fill="currentColor" opacity="0.9"/></svg>,
    2: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><circle cx="8" cy="8" r="3.5"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.76 3.76l1.06 1.06M12.18 12.18l1.06 1.06M3.76 12.24l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M10 15.5a4 4 0 014-4h1a3 3 0 013 3v.5a2 2 0 01-2 2H9a2.5 2.5 0 010-5" fill="currentColor" opacity="0.9"/></svg>,
    3: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 19a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 10h.5a4.5 4.5 0 01.5 8.97V19H6z"/></svg>,
    45: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M3 10h18M3 14h18M3 18h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>,
    48: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M3 10h18M3 14h18M3 18h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>,
    51: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 13a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 4h.5a4.5 4.5 0 01.5 8.97V13H6z"/><path d="M8 17v2M12 17v2M16 17v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    53: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 13a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 4h.5a4.5 4.5 0 01.5 8.97V13H6z"/><path d="M8 17v2M12 17v2M16 17v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    55: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M7 15v4M11 15v4M15 15v4M9 17v4M13 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    61: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 13a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 4h.5a4.5 4.5 0 01.5 8.97V13H6z"/><path d="M8 17v2M12 17v2M16 17v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    63: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M7 15v4M11 15v4M15 15v4M9 17v4M13 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    65: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M7 15v4M11 15v4M15 15v4M9 17v4M13 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    71: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M12 14v8M8.5 16l7 4M15.5 16l-7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    73: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M12 14v8M8.5 16l7 4M15.5 16l-7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    75: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M12 14v8M8.5 16l7 4M15.5 16l-7 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    95: <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 11a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 2h.5a4.5 4.5 0 01.5 8.97V11H6z"/><path d="M13 11l-2 5h4l-2 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
  };
  const defaultIcon = <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 19a4 4 0 01-.78-7.93A5.5 5.5 0 0116.5 10h.5a4.5 4.5 0 01.5 8.97V19H6z"/></svg>;
  return <>{icons[code] || defaultIcon}</>;
};

const weatherDescriptions: Record<number, string> = {
  0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Cloudy',
  45: 'Foggy', 48: 'Foggy',
  51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
  61: 'Rain', 63: 'Rain', 65: 'Heavy Rain',
  66: 'Freezing Rain', 67: 'Freezing Rain',
  71: 'Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Snow',
  80: 'Showers', 81: 'Showers', 82: 'Heavy Showers',
  85: 'Snow Showers', 86: 'Snow Showers',
  95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm',
};

const getWeatherDescription = (code: number) => {
  return weatherDescriptions[code] || 'Unknown';
};

const LATITUDE = 44.8614;
const LONGITUDE = -92.6277;

const getDayName = (dateStr: string, index: number): string => {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

interface KitchenWeatherProps {
  showForecast?: boolean;
}

export function KitchenWeather({ showForecast = true }: KitchenWeatherProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&hourly=temperature_2m,weather_code,precipitation_probability&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago&forecast_days=2`;

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
    const interval = setInterval(fetchWeather, 10 * 60 * 1000); // 10 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading || !weather) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-white/50 text-xl">Loading weather...</div>
      </div>
    );
  }

  const { current, daily } = weather;

  // Current weather only mode (for top-right corner)
  if (!showForecast) {
    // Today's high/low from daily data
    const todayHigh = Math.round(daily.temperature_2m_max[0]);
    const todayLow = Math.round(daily.temperature_2m_min[0]);

    // Get current hour index for hourly forecast
    const now = new Date();
    const currentHour = now.getHours();
    const hourlyStartIndex = weather.hourly.time.findIndex((t) => {
      const hour = new Date(t).getHours();
      return hour >= currentHour;
    });

    // Get next 6 hours
    const nextHours = weather.hourly.time.slice(hourlyStartIndex, hourlyStartIndex + 6);
    const nextTemps = weather.hourly.temperature_2m.slice(hourlyStartIndex, hourlyStartIndex + 6);
    const nextCodes = weather.hourly.weather_code.slice(hourlyStartIndex, hourlyStartIndex + 6);
    const nextPrecip = weather.hourly.precipitation_probability.slice(hourlyStartIndex, hourlyStartIndex + 6);

    // Sunrise/Sunset
    const sunrise = new Date(daily.sunrise[0]);
    const sunset = new Date(daily.sunset[0]);
    const formatTime = (date: Date) => {
      const h = date.getHours();
      const m = date.getMinutes().toString().padStart(2, '0');
      return `${h > 12 ? h - 12 : h}:${m}${h >= 12 ? 'p' : 'a'}`;
    };

    const formatHour = (timeStr: string) => {
      const date = new Date(timeStr);
      const hour = date.getHours();
      if (hour === currentHour) return 'Now';
      return hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`;
    };

    return (
      <div className="text-shadow text-right">
        {/* Icon + Current Temp */}
        <div className="flex items-center justify-end gap-4">
          <WeatherIcon code={current.weather_code} className="w-20 h-20 text-white" />
          <div className="ios-weather-temp-lg">
            {Math.round(current.temperature_2m)}°
          </div>
        </div>
        {/* Description */}
        <div className="text-white/70 text-xl -mt-1 uppercase tracking-wide">
          {getWeatherDescription(current.weather_code)}
        </div>
        {/* High/Low + Feels */}
        <div className="text-white/50 text-lg mt-1">
          H:{todayHigh}° L:{todayLow}° · Feels {Math.round(current.apparent_temperature)}°
        </div>
        {/* Wind + Sunrise/Sunset */}
        <div className="text-white/40 text-sm mt-1">
          Wind {Math.round(current.wind_speed_10m)} mph · ↑{formatTime(sunrise)} ↓{formatTime(sunset)}
        </div>
        {/* Hourly forecast */}
        <div className="flex justify-end gap-5 mt-4 pt-3 border-t border-white/10">
          {nextHours.map((time, idx) => (
            <div key={time} className="flex flex-col items-center">
              <div className="text-white/50 text-sm">{formatHour(time)}</div>
              <WeatherIcon code={nextCodes[idx]} className="w-8 h-8 text-white my-1" />
              <div className="text-white text-base font-medium">{Math.round(nextTemps[idx])}°</div>
              {nextPrecip[idx] > 0 && (
                <div className="text-blue-400 text-xs mt-0.5">{nextPrecip[idx]}%</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col text-shadow">
      {/* Current Weather - Top Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <WeatherIcon code={current.weather_code} className="w-16 h-16 text-white" />
          <div>
            <div className="text-6xl font-light text-white">
              {Math.round(current.temperature_2m)}°
            </div>
            <div className="text-lg text-white/70">
              {getWeatherDescription(current.weather_code)}
            </div>
          </div>
        </div>
        <div className="text-right text-white/60">
          <div className="text-lg">Feels {Math.round(current.apparent_temperature)}°</div>
          <div className="text-sm">Wind {Math.round(current.wind_speed_10m)} mph</div>
          <div className="text-sm">Humidity {current.relative_humidity_2m}%</div>
        </div>
      </div>

      {/* 5-Day Forecast - Horizontal Row */}
      <div className="flex justify-between gap-2 flex-1">
        {daily.time.slice(1, 6).map((date, idx) => {
          const weatherCode = daily.weather_code[idx + 1];
          const high = Math.round(daily.temperature_2m_max[idx + 1]);
          const low = Math.round(daily.temperature_2m_min[idx + 1]);
          const precip = daily.precipitation_probability_max[idx + 1];

          return (
            <div
              key={date}
              className="flex-1 glass rounded-xl p-3 flex flex-col items-center justify-center"
            >
              <div className="text-sm text-white/70 font-medium">
                {getDayName(date, idx + 1)}
              </div>
              <WeatherIcon code={weatherCode} className="w-10 h-10 text-white my-1" />
              <div className="text-lg font-medium text-white">{high}°</div>
              <div className="text-sm text-white/50">{low}°</div>
              {precip > 0 && (
                <div className="text-xs text-blue-300 mt-1">{precip}%</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
