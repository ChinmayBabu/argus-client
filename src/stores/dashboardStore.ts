import { create } from 'zustand';
import type {
  TelemetryFrame,
  TelemetryHistory,
  Threat,
  Mission,
  MissionEvent,
  SimulationState,
  Countermeasure,
  BlockchainVerification,
  SystemStatus,
  PanelState,
} from '../types';

interface DashboardState {
  // Telemetry
  telemetry: TelemetryFrame | null;
  telemetryHistory: TelemetryHistory;
  maxHistoryPoints: number;

  // Threats
  threats: Threat[];
  activeThreatCount: number;

  // Mission
  mission: Mission | null;
  events: MissionEvent[];

  // Simulation
  simulation: SimulationState;

  // Defense
  countermeasures: Countermeasure[];

  // Blockchain
  blockchain: BlockchainVerification | null;
  blockchainHistory: BlockchainVerification[];

  // System
  systemStatus: SystemStatus;

  // Panel visibility
  panels: PanelState;

  // Actions
  setTelemetry: (frame: TelemetryFrame) => void;
  addThreat: (threat: Threat) => void;
  removeThreat: (id: string) => void;
  updateThreat: (id: string, updates: Partial<Threat>) => void;
  setMission: (mission: Mission) => void;
  addEvent: (event: MissionEvent) => void;
  clearEvents: () => void;
  setSimulation: (state: Partial<SimulationState>) => void;
  setCountermeasures: (measures: Countermeasure[]) => void;
  updateCountermeasure: (id: string, updates: Partial<Countermeasure>) => void;
  setBlockchain: (verification: BlockchainVerification) => void;
  setSystemStatus: (status: Partial<SystemStatus>) => void;
  togglePanel: (panel: keyof PanelState) => void;
  reset: () => void;
}

const initialTelemetryHistory: TelemetryHistory = {
  timestamps: [],
  position_lat: [],
  position_lon: [],
  altitude: [],
  battery_level: [],
  signal_strength: [],
  temperature: [],
  gyro_x: [],
  gyro_y: [],
  gyro_z: [],
};

const defaultCountermeasures: Countermeasure[] = [
  { id: 'cm1', name: 'GPS Signal Authentication', description: 'Verify GPS signal integrity using cryptographic signatures', status: 'active', effectiveness: 0.95, cooldown_remaining: 0 },
  { id: 'cm2', name: 'Multi-Sensor Fusion', description: 'Cross-validate readings across multiple sensor types', status: 'active', effectiveness: 0.88, cooldown_remaining: 0 },
  { id: 'cm3', name: 'Anomaly Isolation', description: 'Isolate and quarantine anomalous sensor data', status: 'inactive', effectiveness: 0.0, cooldown_remaining: 0 },
  { id: 'cm4', name: 'Orbital Prediction Check', description: 'Compare actual vs predicted orbital parameters', status: 'active', effectiveness: 0.92, cooldown_remaining: 0 },
];

export const useDashboardStore = create<DashboardState>((set) => ({
  // Initial state
  telemetry: null,
  telemetryHistory: initialTelemetryHistory,
  maxHistoryPoints: 100,

  threats: [],
  activeThreatCount: 0,

  mission: null,
  events: [],

  simulation: {
    is_running: false,
    speed_multiplier: 1,
    current_time: 0,
    scenario_name: 'Default Scenario',
  },

  countermeasures: defaultCountermeasures,

  blockchain: null,
  blockchainHistory: [],

  systemStatus: {
    websocket_connected: false,
    server_url: 'wss://argus-server-970096522851.asia-south1.run.app/',
    last_heartbeat: Date.now(),
    fps: 0,
  },

  panels: {
    telemetry: true,
    signals: true,
    threats: true,
    defense: true,
    logs: true,
    blockchain: true,
  },

  // Actions
  setTelemetry: (frame: TelemetryFrame) => {
    set((state) => {
      const history = state.telemetryHistory;
      const newTimestamps = [...history.timestamps, frame.timestamp];

      // Trim if exceeds max points
      if (newTimestamps.length > state.maxHistoryPoints) {
        newTimestamps.shift();
      }

      return {
        telemetry: frame,
        telemetryHistory: {
          timestamps: newTimestamps,
          position_lat: history.position_lat.length < state.maxHistoryPoints
            ? [...history.position_lat, frame.position_lat]
            : [...history.position_lat.slice(1), frame.position_lat],
          position_lon: history.position_lon.length < state.maxHistoryPoints
            ? [...history.position_lon, frame.position_lon]
            : [...history.position_lon.slice(1), frame.position_lon],
          altitude: history.altitude.length < state.maxHistoryPoints
            ? [...history.altitude, frame.altitude]
            : [...history.altitude.slice(1), frame.altitude],
          battery_level: history.battery_level.length < state.maxHistoryPoints
            ? [...history.battery_level, frame.battery_level]
            : [...history.battery_level.slice(1), frame.battery_level],
          signal_strength: history.signal_strength.length < state.maxHistoryPoints
            ? [...history.signal_strength, frame.signal_strength]
            : [...history.signal_strength.slice(1), frame.signal_strength],
          temperature: history.temperature.length < state.maxHistoryPoints
            ? [...history.temperature, frame.temperature]
            : [...history.temperature.slice(1), frame.temperature],
          gyro_x: history.gyro_x.length < state.maxHistoryPoints
            ? [...history.gyro_x, frame.gyro_x]
            : [...history.gyro_x.slice(1), frame.gyro_x],
          gyro_y: history.gyro_y.length < state.maxHistoryPoints
            ? [...history.gyro_y, frame.gyro_y]
            : [...history.gyro_y.slice(1), frame.gyro_y],
          gyro_z: history.gyro_z.length < state.maxHistoryPoints
            ? [...history.gyro_z, frame.gyro_z]
            : [...history.gyro_z.slice(1), frame.gyro_z],
        },
      };
    });
  },

  addThreat: (threat: Threat) => {
    set((state) => ({
      threats: [threat, ...state.threats],
      activeThreatCount: state.threats.filter(t => t.is_active).length + (threat.is_active ? 1 : 0),
    }));
  },

  removeThreat: (id: string) => {
    set((state) => ({
      threats: state.threats.filter(t => t.id !== id),
      activeThreatCount: state.threats.filter(t => t.id !== id && t.is_active).length,
    }));
  },

  updateThreat: (id: string, updates: Partial<Threat>) => {
    set((state) => ({
      threats: state.threats.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  },

  setMission: (mission: Mission) => {
    set({ mission });
  },

  addEvent: (event: MissionEvent) => {
    set((state) => ({
      events: [event, ...state.events].slice(0, 500),
    }));
  },

  clearEvents: () => {
    set({ events: [] });
  },

  setSimulation: (state: Partial<SimulationState>) => {
    set((s) => ({
      simulation: { ...s.simulation, ...state },
    }));
  },

  setCountermeasures: (measures: Countermeasure[]) => {
    set({ countermeasures: measures });
  },

  updateCountermeasure: (id: string, updates: Partial<Countermeasure>) => {
    set((state) => ({
      countermeasures: state.countermeasures.map(cm =>
        cm.id === id ? { ...cm, ...updates } : cm
      ),
    }));
  },

  setBlockchain: (verification: BlockchainVerification) => {
    set((state) => {
      const incomingId = getChainEntryId(verification);
      const deduped = state.blockchainHistory.filter((entry) => getChainEntryId(entry) !== incomingId);
      return {
        blockchain: verification,
        blockchainHistory: [verification, ...deduped].slice(0, 3),
      };
    });
  },

  setSystemStatus: (status: Partial<SystemStatus>) => {
    set((state) => ({
      systemStatus: { ...state.systemStatus, ...status },
    }));
  },

  togglePanel: (panel: keyof PanelState) => {
    set((state) => ({
      panels: {
        ...state.panels,
        [panel]: !state.panels[panel],
      },
    }));
  },

  reset: () => {
    set({
      telemetry: null,
      telemetryHistory: initialTelemetryHistory,
      threats: [],
      activeThreatCount: 0,
      mission: null,
      events: [],
      blockchain: null,
      blockchainHistory: [],
    });
  },
}));

function getChainEntryId(entry: BlockchainVerification): string {
  if (typeof entry.block_number === 'number') return `n:${entry.block_number}`;
  if (entry.block_hash) return `h:${entry.block_hash}`;
  if (entry.transaction_hash) return `t:${entry.transaction_hash}`;
  return `v:${entry.verification_time}`;
}
