import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { useDashboardStore } from './stores/dashboardStore';
import { wsService } from './services/websocket';
import type { User, TelemetryFrame, Threat, MissionEvent } from './types';
import Auth from './components/auth/Auth';
import StatusBar from './components/status/StatusBar';
import SimulationPage from './pages/SimulationPage';
import MonitoringPage from './pages/MonitoringPage';
import './App.css';

interface MissionMessage {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  phase: 'launch' | 'orbit_insertion' | 'normal_ops' | 'attack' | 'recovery' | 'deorbit';
  start_time: number;
  duration?: number;
}

interface BlockchainMessage {
  verified: boolean;
  block_hash?: string;
  hash?: string;
  block_number?: number;
  payload_hash?: string;
  payloadHash?: string;
  storage_mode?: 'onchain' | 'local';
  tx_hash?: string;
  transaction_hash?: string;
  verification_time: number;
  integrity_score: number;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const setTelemetry = useDashboardStore(s => s.setTelemetry);
  const addThreat = useDashboardStore(s => s.addThreat);
  const addEvent = useDashboardStore(s => s.addEvent);
  const setMission = useDashboardStore(s => s.setMission);
  const setSimulation = useDashboardStore(s => s.setSimulation);
  const setSystemStatus = useDashboardStore(s => s.setSystemStatus);
  const setBlockchain = useDashboardStore(s => s.setBlockchain);

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken?.startsWith('demo-token-')) {
      setUser({ uid: 'demo-user-1', email: 'operator@argus.space', role: 'operator' });
      setIsAuthenticated(true);
    }
  }, []);

  const handleTelemetry = useCallback((data: TelemetryFrame) => {
    setTelemetry(data);
    setSimulation({ current_time: data.timestamp });
  }, [setTelemetry, setSimulation]);
  const handleThreat = useCallback((data: Threat) => addThreat(data), [addThreat]);
  const handleEvent = useCallback((data: MissionEvent) => addEvent(data), [addEvent]);
  const handleMission = useCallback((data: MissionMessage) => {
    setMission({ id: data.id, name: data.name, status: data.status, phase: data.phase, start_time: data.start_time, duration: data.duration });
  }, [setMission]);
  const handleBlockchain = useCallback((data: BlockchainMessage) => {
    setBlockchain({
      is_verified: data.verified,
      block_hash: data.block_hash || data.hash,
      block_number: data.block_number,
      payload_hash: data.payload_hash || data.payloadHash,
      storage_mode: data.storage_mode,
      transaction_hash: data.tx_hash || data.transaction_hash,
      verification_time: data.verification_time,
      integrity_score: data.integrity_score,
    });
  }, [setBlockchain]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let frameCount = 0;
    let lastFpsUpdate = Date.now();

    const offTelemetry = wsService.on('telemetry', handleTelemetry);
    const offThreat = wsService.on('threat', handleThreat);
    const offEvent = wsService.on('event', handleEvent);
    const offMission = wsService.on('mission', handleMission);
    const offBlockchain = wsService.on('blockchain', handleBlockchain);
    const fpsTimer = setInterval(() => {
      const now = Date.now();
      setSystemStatus({ fps: Math.round((frameCount * 1000) / (now - lastFpsUpdate)) });
      frameCount = 0;
      lastFpsUpdate = now;
    }, 1000);
    const tickTimer = setInterval(() => { frameCount++; }, 100);

    cleanupRef.current = () => {
      offTelemetry(); offThreat(); offEvent(); offMission(); offBlockchain();
      clearInterval(fpsTimer); clearInterval(tickTimer); wsService.disconnect();
    };

    const connect = async () => {
      try {
        await wsService.connect((connected) => {
          setSystemStatus({ websocket_connected: connected });
          if (connected) addEvent({ id: `conn-${Date.now()}`, timestamp: Date.now() / 1000, type: 'info', message: 'Connected to ARGUS telemetry stream' });
        });
      } catch (err) {
        console.error('[App] WebSocket connection failed:', err);
        addEvent({ id: `ws-err-${Date.now()}`, timestamp: Date.now() / 1000, type: 'warning', message: 'Telemetry stream unavailable — waiting for server' });
      }
    };
    connect();
    return () => cleanupRef.current?.();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAuthenticated = (authUser: User, authToken: string) => {
    localStorage.setItem('auth_token', authToken);
    setUser(authUser);
    setIsAuthenticated(true);
    addEvent({ id: `auth-${Date.now()}`, timestamp: Date.now() / 1000, type: 'info', message: `${authUser.email} authenticated` });
  };

  const handleLogout = () => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
    useDashboardStore.getState().reset();
  };

  if (!isAuthenticated) return <Auth onAuthenticated={handleAuthenticated} />;

  return (
    <BrowserRouter>
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="header-logo"><h1>ARGUS</h1></div>
          <nav className="route-nav" aria-label="Dashboard views">
            <NavLink to="/monitoring" className={({ isActive }) => isActive ? 'route-link active' : 'route-link'}>Monitoring</NavLink>
            <NavLink to="/simulation" className={({ isActive }) => isActive ? 'route-link active' : 'route-link'}>Simulation</NavLink>
          </nav>
          <div className="header-info">
            <span className="header-user">{user?.email}</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Navigate to="/monitoring" replace />} />
          <Route path="/simulation" element={<SimulationPage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />
          <Route path="*" element={<Navigate to="/monitoring" replace />} />
        </Routes>
        <StatusBar />
      </div>
    </BrowserRouter>
  );
}

export default App;
