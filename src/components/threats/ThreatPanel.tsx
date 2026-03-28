import { useDashboardStore } from '../../stores/dashboardStore';
import type { Threat } from '../../types';
import './ThreatPanel.css';

const SEVERITY_COLORS = {
  low: { bg: 'rgba(74, 222, 128, 0.15)', border: 'rgba(74, 222, 128, 0.4)', text: '#4ade80' },
  medium: { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.4)', text: '#fbbf24' },
  high: { bg: 'rgba(251, 113, 133, 0.15)', border: 'rgba(251, 113, 133, 0.4)', text: '#fb7185' },
  critical: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.5)', text: '#ef4444' },
};

const THREAT_ICONS: Record<string, string> = {
  gps_spoofing: '🛰️',
  signal_tampering: '📡',
  sensor_compromise: '🔧',
  trajectory_manipulation: '🎯',
  multi_sensor_corruption: '⚡',
  jamming: '🔇',
  battery_degradation: '🔋',
  sensor_drift: '📊',
  sensor_stuck: '🔒',
  sensor_dead: '💀',
  communication_loss: '📶',
  thermal_anomaly: '🌡️',
  mechanical_wear: '⚙️',
};

export default function ThreatPanel() {
  const threats = useDashboardStore((state) => state.threats);
  const activeThreats = threats.filter(t => t.is_active);

  if (threats.length === 0) {
    return (
      <div className="threat-panel">
        <div className="threat-header">
          <span>Threat Detection</span>
          <span className="threat-count">No threats detected</span>
        </div>
        <div className="threat-empty">
          <div className="threat-empty-icon">🛡️</div>
          <div className="threat-empty-text">All systems nominal</div>
        </div>
      </div>
    );
  }

  return (
    <div className="threat-panel">
      <div className="threat-header">
        <span>Threat Detection</span>
        <span className={`threat-count ${activeThreats.length > 0 ? 'active' : ''}`}>
          {activeThreats.length} Active
        </span>
      </div>
      <div className="threat-list">
        {threats.map((threat) => (
          <ThreatCard key={threat.id} threat={threat} />
        ))}
      </div>
    </div>
  );
}

function ThreatCard({ threat }: { threat: Threat }) {
  const colors = SEVERITY_COLORS[threat.severity];
  const icon = THREAT_ICONS[threat.type] || '⚠️';
  const summary = buildShortSummary(threat);
  const confidenceScores = getConfidenceScores(threat);

  return (
    <div
      className={`threat-card ${threat.is_active ? 'active' : 'resolved'}`}
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      <div className="threat-card-header">
        <div className="threat-card-icon">{icon}</div>
        <div className="threat-card-info">
          <div className="threat-card-title">{formatThreatType(threat.type)}</div>
          <div className="threat-card-time">
            {new Date(threat.detected_at * 1000).toLocaleTimeString()}
          </div>
        </div>
        <div
          className="threat-severity-badge"
          style={{ background: colors.text, color: '#0a0a1a' }}
        >
          {threat.severity.toUpperCase()}
        </div>
      </div>
      <div className="threat-card-body">
        <p className="threat-description">{summary}</p>
        {confidenceScores.length > 0 && (
          <div className="confidence-breakdown">
            {confidenceScores.map((score) => (
              <span key={score.label} className="confidence-chip">
                {score.label}: {score.value}
              </span>
            ))}
          </div>
        )}
        {threat.affected_sensors.length > 0 && (
          <div className="threat-sensors">
            <span className="threat-sensors-label">Affected:</span>
            <div className="threat-sensors-list">
              {threat.affected_sensors.map((sensor) => (
                <span key={sensor} className="threat-sensor-tag">{sensor}</span>
              ))}
            </div>
          </div>
        )}
        <div className="threat-card-footer">
          <div className="threat-confidence">
            Confidence: {(threat.confidence * 100).toFixed(0)}%
          </div>
          {!threat.is_active && (
            <span className="threat-resolved-badge">Resolved</span>
          )}
        </div>
      </div>
    </div>
  );
}

function formatThreatType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildShortSummary(threat: Threat): string {
  const raw = (threat.explanation || threat.description || '').replace(/\s+/g, ' ').trim();
  if (!raw) return 'Threat detected. Confidence signals indicate abnormal telemetry behavior.';

  const sentenceParts = raw
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentenceParts.length >= 2) {
    return sentenceParts.slice(0, 2).join(' ');
  }

  return raw.length > 220 ? `${raw.slice(0, 217)}...` : raw;
}

function toPct(val: number | undefined): string | null {
  if (typeof val !== 'number' || Number.isNaN(val)) return null;
  const clipped = Math.max(0, Math.min(1, val));
  return `${Math.round(clipped * 100)}%`;
}

function getConfidenceScores(threat: Threat): Array<{ label: string; value: string }> {
  const scores: Array<{ label: string; value: string }> = [];
  const overall = toPct(threat.confidence);
  if (overall) scores.push({ label: 'Overall', value: overall });

  const ruleBased = toPct(threat.rule_based_confidence);
  if (ruleBased) scores.push({ label: 'Rule', value: ruleBased });

  const ml = toPct(threat.ml_confidence);
  if (ml) scores.push({ label: 'ML', value: ml });

  const explain = toPct(threat.confidence_explanation);
  if (explain) scores.push({ label: 'Explain', value: explain });

  return scores.slice(0, 4);
}
