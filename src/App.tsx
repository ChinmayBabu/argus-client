import { useState, useEffect, useCallback, useRef } from 'react';
import { useDashboardStore } from './stores/dashboardStore';
import { wsService } from './services/websocket';
import type { User, TelemetryFrame, Threat, MissionEvent } from './types';

// Components
import Auth from './components/auth/Auth';
import MissionMap from './components/map/MissionMap';
import TelemetryPanel from './components/telemetry/TelemetryPanel';
import SignalGraphs from './components/signals/SignalGraphs';
import ThreatPanel from './components/threats/ThreatPanel';
import SimulationControls from './components/controls/SimulationControls';
import MissionLogs from './components/logs/MissionLogs';
import BlockchainPanel from './components/blockchain/BlockchainPanel';
import StatusBar from './components/status/StatusBar';

import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const setTelemetry   = useDashboardStore(s => s.setTelemetry);
  const addThreat      = useDashboardStore(s => s.addThreat);
  const addEvent       = useDashboardStore(s => s.addEvent);
  const setMission     = useDashboardStore(s => s.setMission);
  const setSimulation  = useDashboardStore(s => s.setSimulation);
  const setSystemStatus = useDashboardStore(s => s.setSystemStatus);
  const setBlockchain  = useDashboardStore(s => s.setBlockchain);

  // ── Restore session from localStorage ────────────────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (!savedToken) return;

    // Demo token — restore immediately without a server round-trip
    if (savedToken.startsWith('demo-token-')) {
      setUser({ uid: 'demo-user-1', email: 'operator@argus.space', role: 'operator' });
      setIsAuthenticated(true);
    }
    // Real JWT — could validate with /auth/me, skip for now to keep it simple
  }, []);

  // ── WebSocket handlers (stable refs, defined before connect) ─────────────
  const handleTelemetry = useCallback((data: TelemetryFrame) => {
    setTelemetry(data);
    setSimulation({ current_time: data.timestamp });
  }, [setTelemetry, setSimulation]);

  const handleThreat = useCallback((data: Threat) => {
    addThreat(data);
    // The server already sends a separate "event" for threats,
    // so we don't double-add here. Just store the threat.
  }, [addThreat]);

  const handleEvent = useCallback((data: MissionEvent) => {
    addEvent(data);
  }, [addEvent]);

  const handleMission = useCallback((data: any) => {
    setMission({
      id:         data.id,
      name:       data.name,
      status:     data.status,
      phase:      data.phase,
      start_time: data.start_time,
      duration:   data.duration,
    });
  }, [setMission]);

  const handleBlockchain = useCallback((data: any) => {
    setBlockchain({
      is_verified:       data.verified,
      block_hash:        data.block_hash || data.hash,
      block_number:      data.block_number,
      payload_hash:      data.payload_hash || data.payloadHash,
      storage_mode:      data.storage_mode,
      transaction_hash:  data.tx_hash || data.transaction_hash,
      verification_time: data.verification_time,
      integrity_score:   data.integrity_score,
    });
  }, [setBlockchain]);

  // ── Connect WebSocket once authenticated ──────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    let frameCount = 0;
    let lastFpsUpdate = Date.now();

    const connect = async () => {
      try {
        await wsService.connect((connected) => {
          setSystemStatus({ websocket_connected: connected });
          if (connected) {
            addEvent({
              id:        `conn-${Date.now()}`,
              timestamp: Date.now() / 1000,
              type:      'info',
              message:   'Connected to ARGUS telemetry stream',
            });
          }
        });

        // Register typed message handlers
        const offTelemetry  = wsService.on('telemetry',  handleTelemetry);
        const offThreat     = wsService.on('threat',     handleThreat);
        const offEvent      = wsService.on('event',      handleEvent);
        const offMission    = wsService.on('mission',    handleMission);
        const offBlockchain = wsService.on('blockchain', handleBlockchain);

        // Simple FPS counter (counts message-loop ticks)
        const fpsTimer = setInterval(() => {
          const now = Date.now();
          const fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
          setSystemStatus({ fps });
          frameCount = 0;
          lastFpsUpdate = now;
        }, 1000);

        const tickTimer = setInterval(() => { frameCount++; }, 100);

        cleanupRef.current = () => {
          offTelemetry();
          offThreat();
          offEvent();
          offMission();
          offBlockchain();
          clearInterval(fpsTimer);
          clearInterval(tickTimer);
          wsService.disconnect();
        };
      } catch (err) {
        console.error('[App] WebSocket connection failed:', err);
        addEvent({
          id:        `ws-err-${Date.now()}`,
          timestamp: Date.now() / 1000,
          type:      'warning',
          message:   'Telemetry stream unavailable — waiting for server',
        });
      }
    };

    connect();

    return () => {
      cleanupRef.current?.();
    };
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth callbacks ────────────────────────────────────────────────────────
  const handleAuthenticated = (authUser: User, authToken: string) => {
    localStorage.setItem('auth_token', authToken);
    setUser(authUser);
    setIsAuthenticated(true);
    addEvent({
      id:        `auth-${Date.now()}`,
      timestamp: Date.now() / 1000,
      type:      'info',
      message:   `${authUser.email} authenticated`,
    });
  };

  const handleLogout = () => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
    useDashboardStore.getState().reset();
  };

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return <Auth onAuthenticated={handleAuthenticated} />;
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-logo">
          <h1>ARGUS</h1>
        </div>
        <div className="header-info">
          <span className="header-user">{user?.email}</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Main layout */}
      <main className="dashboard-main">
        {/* Left sidebar */}
        <aside className="dashboard-sidebar">
          <SimulationControls />
          <TelemetryPanel />
        </aside>

        {/* Center — map + signal graphs */}
        <section className="dashboard-center">
          <MissionMap width="100%" height="calc(100% - 60px)" />
          <div className="center-bottom">
            <SignalGraphs />
          </div>
        </section>

        {/* Right sidebar — threats, logs, blockchain */}
        <aside className="dashboard-sidebar right">
          <ThreatPanel />
          <MissionLogs />
          <BlockchainPanel />
        </aside>
      </main>

      <StatusBar />
    </div>
  );
}

export default App;
