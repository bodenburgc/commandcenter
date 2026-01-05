import { useState, useEffect, useCallback } from 'react';

interface ThermostatState {
  currentTemp: number;
  targetTemp: number;
  humidity: number;
  hvacMode: string;
  hvacAction: string;
  presetMode: string;
}

const HA_URL = import.meta.env.VITE_HA_URL || 'http://localhost:8123';
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN || '';

const ENTITY_ID = 'climate.upstairs';

const hvacIcons: Record<string, string> = {
  heat: '🔥',
  cool: '❄️',
  heat_cool: '🔄',
  off: '⏸️',
};

const hvacActionLabels: Record<string, string> = {
  heating: 'Heating',
  cooling: 'Cooling',
  idle: 'Idle',
  off: 'Off',
};

export function Thermostat() {
  const [state, setState] = useState<ThermostatState | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchState = useCallback(async () => {
    try {
      const response = await fetch(`${HA_URL}/api/states/${ENTITY_ID}`, {
        headers: {
          Authorization: `Bearer ${HA_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch thermostat state');
      }

      const data = await response.json();
      setState({
        currentTemp: Math.round(data.attributes.current_temperature),
        targetTemp: Math.round(data.attributes.temperature),
        humidity: Math.round(data.attributes.current_humidity || 0),
        hvacMode: data.state,
        hvacAction: data.attributes.hvac_action || 'idle',
        presetMode: data.attributes.preset_mode || 'none',
      });
      setError(false);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching thermostat:', err);
      setError(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    // Refresh every 30 seconds
    const interval = setInterval(fetchState, 30000);
    return () => clearInterval(interval);
  }, [fetchState]);

  if (loading) {
    return (
      <div className="widget">
        <div className="card-header">Thermostat</div>
        <div className="text-tv-sm text-dash-muted">Loading...</div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="widget">
        <div className="card-header">Thermostat</div>
        <div className="text-tv-sm text-red-400">Unable to connect</div>
      </div>
    );
  }

  const isActive = state.hvacAction === 'heating' || state.hvacAction === 'cooling';

  return (
    <div className="widget">
      <div className="card-header flex items-center justify-between">
        <span>Upstairs</span>
        <span className="text-lg">{hvacIcons[state.hvacMode] || '🌡️'}</span>
      </div>

      {/* Main temperature display */}
      <div className="flex items-center justify-center gap-6 mb-4">
        <div className="text-center">
          <div className="text-tv-2xl font-light">{state.currentTemp}°</div>
          <div className="text-tv-xs text-dash-muted">Current</div>
        </div>
        <div className="text-tv-lg text-dash-muted">→</div>
        <div className="text-center">
          <div className={`text-tv-xl font-light ${isActive ? 'text-orange-400' : ''}`}>
            {state.targetTemp}°
          </div>
          <div className="text-tv-xs text-dash-muted">Target</div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between p-3 bg-dash-border/30 rounded-lg">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isActive ? 'bg-orange-400 animate-pulse' : 'bg-green-500'
            }`}
          />
          <span className="text-tv-xs">
            {hvacActionLabels[state.hvacAction] || state.hvacAction}
          </span>
        </div>
        <div className="text-tv-xs text-dash-muted">
          💧 {state.humidity}%
        </div>
      </div>

      {/* Mode indicator */}
      {state.presetMode !== 'none' && (
        <div className="mt-3 text-tv-xs text-center text-dash-muted">
          Mode: {state.presetMode.charAt(0).toUpperCase() + state.presetMode.slice(1)}
        </div>
      )}
    </div>
  );
}
