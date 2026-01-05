import { useState, useEffect } from 'react';

interface SystemInfo {
  haConnected: boolean;
  lastUpdate: Date;
  networkDevices?: number;
}

export function SystemStatus() {
  const [status, setStatus] = useState<SystemInfo>({
    haConnected: false,
    lastUpdate: new Date(),
  });

  useEffect(() => {
    // Check Home Assistant connection
    const checkConnection = async () => {
      try {
        // This will work once HA is running
        const haUrl = import.meta.env.VITE_HA_URL || 'http://192.168.1.132:8123';
        const response = await fetch(`${haUrl}/api/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        setStatus((prev) => ({
          ...prev,
          haConnected: response.ok,
          lastUpdate: new Date(),
        }));
      } catch {
        setStatus((prev) => ({
          ...prev,
          haConnected: false,
          lastUpdate: new Date(),
        }));
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="widget">
      <div className="card-header">System</div>

      <div className="space-y-4">
        {/* Home Assistant Status */}
        <div className="flex items-center justify-between">
          <span className="text-tv-xs text-dash-muted">Home Assistant</span>
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                status.haConnected ? 'bg-green-500' : 'bg-yellow-500'
              }`}
            />
            <span className="text-tv-xs">
              {status.haConnected ? 'Connected' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Dashboard Status */}
        <div className="flex items-center justify-between">
          <span className="text-tv-xs text-dash-muted">Dashboard</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-tv-xs">Running</span>
          </div>
        </div>

        {/* Last Update */}
        <div className="flex items-center justify-between">
          <span className="text-tv-xs text-dash-muted">Last Check</span>
          <span className="text-tv-xs font-mono">
            {status.lastUpdate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Network IP */}
      <div className="mt-4 pt-4 border-t border-dash-border">
        <div className="text-tv-xs text-dash-muted/60 font-mono text-center">
          192.168.1.132:5173
        </div>
      </div>
    </div>
  );
}
