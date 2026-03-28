import type { TelemetryFrame, Threat, Mission, MissionEvent, Countermeasure } from '../types';

// Server uses /api/v1 prefix
const API_BASE = 'http://localhost:8000/api/v1';

export const api = {
  // ── Telemetry ─────────────────────────────────────────────────────────────
  async getTelemetry(_missionId?: string): Promise<TelemetryFrame | null> {
    try {
      const res = await fetch(`${API_BASE}/telemetry/latest`);
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  },

  async getTelemetryHistory(_missionId: string, _hours: number = 1): Promise<TelemetryFrame[]> {
    return [];
  },

  // ── Threats ───────────────────────────────────────────────────────────────
  async getThreats(): Promise<Threat[]> { return []; },
  async getActiveThreats(): Promise<Threat[]> { return []; },
  async acknowledgeThreat(_threatId: string): Promise<void> {},

  // ── Mission ───────────────────────────────────────────────────────────────
  async getMission(_missionId: string): Promise<Mission | null> { return null; },
  async getCurrentMission(): Promise<Mission | null> { return null; },

  async startMission(scenarioId: string): Promise<Mission> {
    const res = await fetch(`${API_BASE}/mission/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
    if (!res.ok) throw new Error('Failed to start mission');
    return res.json();
  },

  async pauseMission(_missionId: string): Promise<void> {},
  async resumeMission(_missionId: string): Promise<void> {},
  async abortMission(_missionId: string): Promise<void> {},

  // ── Events ────────────────────────────────────────────────────────────────
  async getEvents(_missionId?: string, _limit: number = 100): Promise<MissionEvent[]> {
    return [];
  },

  // ── Defense ───────────────────────────────────────────────────────────────
  async getCountermeasures(): Promise<Countermeasure[]> { return []; },
  async activateCountermeasure(_id: string): Promise<Countermeasure> {
    throw new Error('Not implemented');
  },
  async deactivateCountermeasure(_id: string): Promise<void> {},

  // ── Simulation Control ────────────────────────────────────────────────────
  /**
   * Send a control command to the simulation process via the server.
   * The server forwards it to the simulation over /ws/sim.
   */
  async simulationControl(action: 'set_mode' | 'set_speed' | 'stop', opts?: {
    mode?: string;
    speed?: number;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/simulation/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, mode: opts?.mode, speed: opts?.speed }),
      });
      if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
      return res.json();
    } catch (e) {
      return { success: false, error: String(e) };
    }
  },

  async getSimulationStatus(): Promise<{
    connected: boolean;
    current_mode: string;
    uptime_seconds: number;
    last_frame_age_seconds: number | null;
  }> {
    try {
      const res = await fetch(`${API_BASE}/simulation/status`);
      if (!res.ok) return { connected: false, current_mode: 'NORMAL', uptime_seconds: 0, last_frame_age_seconds: null };
      return res.json();
    } catch {
      return { connected: false, current_mode: 'NORMAL', uptime_seconds: 0, last_frame_age_seconds: null };
    }
  },

  // ── Blockchain ────────────────────────────────────────────────────────────
  async verifyTelemetry(telemetryHash: string): Promise<{ verified: boolean; blockHash: string; txHash: string }> {
    const res = await fetch(`${API_BASE}/blockchain/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'telemetry', payload: { telemetry_hash: telemetryHash } }),
    });
    if (!res.ok) throw new Error('Failed to verify telemetry hash');
    const data = await res.json();
    return {
      verified: !!data.verified,
      blockHash: data.block_hash || '',
      txHash: data.tx_hash || '',
    };
  },
  async getLatestBlock(): Promise<{ hash: string; number: number; timestamp: number }> {
    const countRes = await fetch(`${API_BASE}/blockchain/logs/count`);
    if (!countRes.ok) throw new Error('Failed to fetch blockchain log count');
    const countData = await countRes.json();
    const logCount = Number(countData.logCount || 0);
    if (logCount <= 0) {
      return { hash: '', number: 0, timestamp: 0 };
    }
    const lastRes = await fetch(`${API_BASE}/blockchain/logs/${logCount - 1}`);
    if (!lastRes.ok) throw new Error('Failed to fetch latest blockchain log');
    const last = await lastRes.json();
    return {
      hash: last.hash || '',
      number: logCount - 1,
      timestamp: last.timestamp || 0,
    };
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  async login(email: string, password: string): Promise<{ token: string; user: { uid: string; email: string; role: string } }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Server LoginRequest uses "username" field; it also tries email lookup
      body: JSON.stringify({ username: email, password }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }
    const data = await res.json();
    return {
      token: data.access_token,
      user: { uid: data.user.id, email: data.user.email, role: data.user.role },
    };
  },

  async register(_email: string, _password: string, _displayName?: string): Promise<{ token: string; user: { uid: string; email: string; role: string } }> {
    throw new Error('Registration not implemented. Use demo credentials.');
  },

  async logout(): Promise<void> {
    // Demo mode — no server call needed
  },

  async validateToken(token: string): Promise<{ valid: boolean; user?: { uid: string; email: string; role: string } }> {
    // Demo tokens start with 'demo-token-'
    if (token.startsWith('demo-token-')) {
      return {
        valid: true,
        user: { uid: 'demo-user-1', email: 'operator@argus.space', role: 'operator' },
      };
    }
    // Try real server validation via /auth/me
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) return { valid: false };
      const user = await res.json();
      return { valid: true, user: { uid: user.id, email: user.email, role: user.role } };
    } catch {
      return { valid: false };
    }
  },
};

export type ApiClient = typeof api;
