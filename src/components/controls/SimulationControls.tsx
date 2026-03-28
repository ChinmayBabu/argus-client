import { useState, useEffect } from 'react';
import { useDashboardStore } from '../../stores/dashboardStore';
import { api } from '../../services/api';
import './SimulationControls.css';

// Map UI scenario IDs → simulation attack modes
const SCENARIOS = [
  { id: 'normal_ops',      name: 'Normal Operations',      mode: 'NORMAL'           },
  { id: 'gps_spoof',       name: 'GPS Spoofing Attack',    mode: 'GPS_SPOOFING'      },
  { id: 'comm_loss',       name: 'Signal Jamming',         mode: 'SIGNAL_JAMMING'    },
  { id: 'thermal',         name: 'Thermal Anomaly',        mode: 'THERMAL_ANOMALY'   },
  { id: 'battery_degrade', name: 'Battery Drain',          mode: 'POWER_DRAIN'       },
  { id: 'ddos',            name: 'DDoS Attack',            mode: 'DDOS'              },
  { id: 'cmd_injection',   name: 'Command Injection',      mode: 'COMMAND_INJECTION' },
  { id: 'sensor_freeze',   name: 'Sensor Freeze / Replay', mode: 'SENSOR_FREEZE'     },
];

const SPEED_OPTIONS = [0.5, 1, 2, 5];

export default function SimulationControls() {
  const simulation     = useDashboardStore(s => s.simulation);
  const setSimulation  = useDashboardStore(s => s.setSimulation);
  const addEvent       = useDashboardStore(s => s.addEvent);

  const [selectedScenario, setSelectedScenario] = useState('normal_ops');
  const [simConnected, setSimConnected]           = useState(false);
  const [sending, setSending]                     = useState(false);

  // Poll simulation status every 3 seconds
  useEffect(() => {
    const poll = async () => {
      const status = await api.getSimulationStatus();
      setSimConnected(status.connected);
      if (!status.connected && simulation.is_running) {
        setSimulation({ is_running: false });
      }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [simulation.is_running, setSimulation]);

  const sendControl = async (action: 'set_mode' | 'set_speed' | 'stop', opts?: { mode?: string; speed?: number }) => {
    if (sending) return;
    setSending(true);
    const result = await api.simulationControl(action, opts);
    setSending(false);

    if (!result.success) {
      addEvent({
        id:        `ctrl-err-${Date.now()}`,
        timestamp: Date.now() / 1000,
        type:      'warning',
        message:   `Control command failed: ${result.error ?? 'simulation not connected'}`,
      });
    }
  };

  const handleStart = async () => {
    const scenario = SCENARIOS.find(s => s.id === selectedScenario) ?? SCENARIOS[0];
    setSimulation({ is_running: true, scenario_name: scenario.name });

    addEvent({
      id:        `ctrl-start-${Date.now()}`,
      timestamp: Date.now() / 1000,
      type:      'info',
      message:   `Scenario activated: ${scenario.name}`,
    });

    await sendControl('set_mode', { mode: scenario.mode });
  };

  const handleStop = async () => {
    setSimulation({ is_running: false });
    await sendControl('set_mode', { mode: 'NORMAL' });

    addEvent({
      id:        `ctrl-stop-${Date.now()}`,
      timestamp: Date.now() / 1000,
      type:      'info',
      message:   'Simulation reset to NORMAL — all attacks cleared',
    });
  };

  const handleSpeedChange = async (speed: number) => {
    setSimulation({ speed_multiplier: speed });
    await sendControl('set_speed', { speed });
  };

  const simStatus = simConnected ? 'online' : 'offline';

  return (
    <div className="simulation-controls">
      {/* Header */}
      <div className="controls-header">
        <span>Simulation Control</span>
        <div className={`status-indicator ${simulation.is_running && simConnected ? 'running' : 'stopped'}`}>
          {simulation.is_running && simConnected ? 'LIVE' : simConnected ? 'STANDBY' : 'OFFLINE'}
        </div>
      </div>

      <div className="controls-body">
        {/* Sim process connection indicator */}
        <div className={`sim-link-row sim-link-${simStatus}`}>
          <span className={`sim-dot sim-dot-${simStatus}`} />
          <span className="sim-link-label">
            SIMULATION {simConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Play / Stop */}
        <div className="control-buttons">
          {!simulation.is_running ? (
            <button
              className="btn btn-start"
              onClick={handleStart}
              disabled={sending}
            >
              <span className="btn-icon">▶</span> Activate
            </button>
          ) : (
            <button
              className="btn btn-pause"
              onClick={handleStop}
              disabled={sending}
            >
              <span className="btn-icon">⏸</span> Standby
            </button>
          )}
          <button
            className="btn btn-stop"
            onClick={handleStop}
            disabled={sending}
          >
            <span className="btn-icon">⏹</span> Reset
          </button>
        </div>

        {/* Speed */}
        <div className="speed-control">
          <span className="speed-label">Speed:</span>
          <div className="speed-buttons">
            {SPEED_OPTIONS.map(speed => (
              <button
                key={speed}
                className={`speed-btn ${simulation.speed_multiplier === speed ? 'active' : ''}`}
                onClick={() => handleSpeedChange(speed)}
                disabled={sending}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Scenario / Attack selector */}
        <div className="scenario-control">
          <span className="scenario-label">Scenario:</span>
          <select
            className="scenario-select"
            value={selectedScenario}
            onChange={e => setSelectedScenario(e.target.value)}
            disabled={simulation.is_running}
          >
            {SCENARIOS.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Mission elapsed time */}
        <div className="simulation-time">
          <span className="time-label">Mission Time:</span>
          <span className="time-value">{formatTime(simulation.current_time)}</span>
        </div>
      </div>
    </div>
  );
}

function formatTime(unix: number): string {
  if (!unix) return '--:--:--';
  const d = new Date(unix * 1000);
  return d.toLocaleTimeString('en-GB', { hour12: false });
}
