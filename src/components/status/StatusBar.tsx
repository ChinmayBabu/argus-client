import { useDashboardStore } from '../../stores/dashboardStore';
import './StatusBar.css';

export default function StatusBar() {
  const systemStatus = useDashboardStore((state) => state.systemStatus);
  const telemetry = useDashboardStore((state) => state.telemetry);
  const mission = useDashboardStore((state) => state.mission);

  return (
    <div className="status-bar">
      <div className="status-section">
        <div className={`status-indicator ${systemStatus.websocket_connected ? 'connected' : 'disconnected'}`}>
          <span className="indicator-dot" />
          <span className="indicator-text">{systemStatus.websocket_connected ? 'CONNECTED' : 'OFFLINE'}</span>
        </div>
      </div>

      <div className="status-section">
        {mission && (
          <div className="status-item">
            <span className="status-label">Mission:</span>
            <span className="status-value">{mission.name}</span>
          </div>
        )}
        {telemetry && (
          <div className="status-item">
            <span className="status-label">Alt:</span>
            <span className="status-value">{(telemetry.altitude / 1000).toFixed(1)} km</span>
          </div>
        )}
      </div>

      <div className="status-section">
        <div className="status-item">
          <span className="status-label">FPS:</span>
          <span className="status-value">{systemStatus.fps}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Server:</span>
          <span className="status-value">{systemStatus.server_url.replace('ws://', '').replace('wss://', '')}</span>
        </div>
      </div>

      <div className="status-section">
        <span className="status-time">{new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
