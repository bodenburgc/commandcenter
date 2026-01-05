import { useState, useEffect, useCallback } from 'react';

interface EnergyState {
  currentPower: number;
  dailyEnergy: number;
  monthlyEnergy: number;
}

const HA_URL = import.meta.env.VITE_HA_URL || 'http://localhost:8123';
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN || '';

// Only the entities we care about
const ENTITIES = {
  power: 'sensor.sense_energy_monitor_power',
  daily: 'sensor.sense_energy_monitor_daily_energy',
  monthly: 'sensor.sense_energy_monitor_monthly_energy',
};

export function EnergyMonitor() {
  const [state, setState] = useState<EnergyState | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchState = useCallback(async () => {
    try {
      const [powerRes, dailyRes, monthlyRes] = await Promise.all([
        fetch(`${HA_URL}/api/states/${ENTITIES.power}`, {
          headers: { Authorization: `Bearer ${HA_TOKEN}` },
        }),
        fetch(`${HA_URL}/api/states/${ENTITIES.daily}`, {
          headers: { Authorization: `Bearer ${HA_TOKEN}` },
        }),
        fetch(`${HA_URL}/api/states/${ENTITIES.monthly}`, {
          headers: { Authorization: `Bearer ${HA_TOKEN}` },
        }),
      ]);

      if (!powerRes.ok || !dailyRes.ok || !monthlyRes.ok) {
        throw new Error('Failed to fetch energy data');
      }

      const [powerData, dailyData, monthlyData] = await Promise.all([
        powerRes.json(),
        dailyRes.json(),
        monthlyRes.json(),
      ]);

      setState({
        currentPower: parseFloat(powerData.state) || 0,
        dailyEnergy: parseFloat(dailyData.state) || 0,
        monthlyEnergy: parseFloat(monthlyData.state) || 0,
      });
      setError(false);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching energy:', err);
      setError(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    // Refresh every 10 seconds for real-time feel
    const interval = setInterval(fetchState, 10000);
    return () => clearInterval(interval);
  }, [fetchState]);

  if (loading) {
    return (
      <div className="widget">
        <div className="card-header">Energy</div>
        <div className="text-tv-sm text-dash-muted">Loading...</div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="widget">
        <div className="card-header">Energy</div>
        <div className="text-tv-sm text-red-400">Unable to connect</div>
      </div>
    );
  }

  // Color based on power usage
  const getPowerColor = (watts: number) => {
    if (watts < 500) return 'text-green-400';
    if (watts < 2000) return 'text-yellow-400';
    if (watts < 5000) return 'text-orange-400';
    return 'text-red-400';
  };

  // Format power with appropriate unit
  const formatPower = (watts: number) => {
    if (watts >= 1000) {
      return { value: (watts / 1000).toFixed(1), unit: 'kW' };
    }
    return { value: Math.round(watts).toString(), unit: 'W' };
  };

  const power = formatPower(state.currentPower);

  return (
    <div className="widget">
      <div className="card-header flex items-center gap-2">
        <span>⚡</span>
        <span>Energy</span>
      </div>

      {/* Current Power - Large Display */}
      <div className="text-center mb-4">
        <div className={`text-tv-2xl font-light ${getPowerColor(state.currentPower)}`}>
          {power.value}
          <span className="text-tv-base ml-1">{power.unit}</span>
        </div>
        <div className="text-tv-xs text-dash-muted">Current Usage</div>
      </div>

      {/* Daily & Monthly Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-dash-border/30 rounded-lg">
          <div className="text-tv-sm font-medium">
            {state.dailyEnergy.toFixed(1)}
            <span className="text-tv-xs text-dash-muted ml-1">kWh</span>
          </div>
          <div className="text-tv-xs text-dash-muted">Today</div>
        </div>
        <div className="text-center p-3 bg-dash-border/30 rounded-lg">
          <div className="text-tv-sm font-medium">
            {state.monthlyEnergy.toFixed(0)}
            <span className="text-tv-xs text-dash-muted ml-1">kWh</span>
          </div>
          <div className="text-tv-xs text-dash-muted">This Month</div>
        </div>
      </div>
    </div>
  );
}
