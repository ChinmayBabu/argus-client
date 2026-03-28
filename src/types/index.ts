// Core telemetry types matching the 25-channel simulator output
export interface TelemetryFrame {
  // Position channels (0-4)
  position_lat: number;
  position_lon: number;
  velocity_x: number;
  velocity_y: number;
  velocity_z: number;

  // Environment channels (5-11)
  altitude: number;
  acceleration_x: number;
  acceleration_y: number;
  acceleration_z: number;
  temperature: number;
  pressure: number;
  humidity: number;

  // System channels (12-13)
  battery_level: number;
  signal_strength: number;

  // Sensor channels (14-19)
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
  magnetometer_x: number;
  magnetometer_y: number;
  magnetometer_z: number;

  // Attitude channels (20-23)
  attitude_roll: number;
  attitude_pitch: number;
  attitude_yaw: number;
  angular_velocity: number;

  // Timestamp (24)
  timestamp: number;
}

export interface TelemetryHistory {
  timestamps: number[];
  position_lat: number[];
  position_lon: number[];
  altitude: number[];
  battery_level: number[];
  signal_strength: number[];
  temperature: number[];
  gyro_x: number[];
  gyro_y: number[];
  gyro_z: number[];
}

// Threat detection types
export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ThreatType = 'gps_spoofing' | 'signal_tampering' | 'sensor_compromise'
  | 'trajectory_manipulation' | 'multi_sensor_corruption' | 'jamming'
  | 'battery_degradation' | 'sensor_drift' | 'sensor_stuck' | 'sensor_dead'
  | 'communication_loss' | 'thermal_anomaly' | 'mechanical_wear';

export interface Threat {
  id: string;
  type: ThreatType;
  severity: ThreatSeverity;
  confidence: number;
  affected_sensors: string[];
  detected_at: number;
  description: string;
  explanation?: string;
  ml_confidence?: number;
  rule_based_confidence?: number;
  confidence_explanation?: number;
  risk_score?: number;
  is_active: boolean;
}

// Mission types
export type MissionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';
export type MissionPhase = 'launch' | 'orbit_insertion' | 'normal_ops' | 'attack' | 'recovery' | 'deorbit';

export interface Mission {
  id: string;
  name: string;
  status: MissionStatus;
  phase: MissionPhase;
  start_time: number;
  duration?: number;
  scenario_id?: string;
}

export interface MissionEvent {
  id: string;
  timestamp: number;
  type: 'info' | 'warning' | 'error' | 'threat' | 'defense';
  message: string;
  details?: string;
  mission_id?: string;
}

// Simulation control types
export interface SimulationState {
  is_running: boolean;
  speed_multiplier: number;
  current_time: number;
  scenario_name: string;
}

export interface SimulationConfig {
  scenario_id: string;
  speed: number;
  enable_failures: boolean;
  enable_attacks: boolean;
}

// Defense/Countermeasure types
export type DefenseStatus = 'inactive' | 'active' | 'engaged' | 'cooldown';

export interface Countermeasure {
  id: string;
  name: string;
  description: string;
  status: DefenseStatus;
  effectiveness: number;
  cooldown_remaining: number;
}

// Blockchain verification types
export interface BlockchainVerification {
  is_verified: boolean;
  block_hash?: string;
  block_number?: number;
  payload_hash?: string;
  storage_mode?: 'onchain' | 'local';
  transaction_hash?: string;
  verification_time: number;
  integrity_score: number;
}

// Authentication types
export interface User {
  uid: string;
  email: string;
  display_name?: string;
  role: 'operator' | 'analyst' | 'admin';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  is_authenticated: boolean;
  is_loading: boolean;
}

// System status types
export interface SystemStatus {
  websocket_connected: boolean;
  server_url: string;
  last_heartbeat: number;
  fps: number;
  memory_usage?: number;
}

// Dashboard layout types
export interface PanelState {
  telemetry: boolean;
  signals: boolean;
  threats: boolean;
  defense: boolean;
  logs: boolean;
  blockchain: boolean;
}
