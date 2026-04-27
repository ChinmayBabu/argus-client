import { useState } from 'react';
import { useDashboardStore } from '../../stores/dashboardStore';
import type { MissionEvent } from '../../types';
import './MissionLogs.css';

const EVENT_ICONS: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  error: '❌',
  threat: '🚨',
  defense: '🛡️',
};

const EVENT_COLORS: Record<string, string> = {
  info: '#60a5fa',
  warning: '#fbbf24',
  error: '#ef4444',
  threat: '#f43f5e',
  defense: '#4ade80',
};

export default function MissionLogs() {
  const events = useDashboardStore((state) => state.events);
  const clearEvents = useDashboardStore((state) => state.clearEvents);

  const [filter, setFilter] = useState<string>('all');

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(e => e.type === filter);

  const counts = {
    all: events.length,
    info: events.filter(e => e.type === 'info').length,
    warning: events.filter(e => e.type === 'warning').length,
    error: events.filter(e => e.type === 'error').length,
    threat: events.filter(e => e.type === 'threat').length,
    defense: events.filter(e => e.type === 'defense').length,
  };

  return (
    <div className="mission-logs">
      <div className="logs-header">
        <div className="logs-title">Mission Logs</div>
        <button className="clear-btn" onClick={clearEvents}>Clear</button>
      </div>

      <div className="logs-filters">
        {(['all', 'info', 'warning', 'error', 'threat', 'defense'] as const).map((type) => (
          <button
            key={type}
            className={`filter-btn ${filter === type ? 'active' : ''}`}
            onClick={() => setFilter(type)}
          >
            {type.toUpperCase()}
            <span className="filter-count">{counts[type]}</span>
          </button>
        ))}
      </div>

      <div className="logs-list">
        {filteredEvents.length === 0 ? (
          <div className="logs-empty">
            <div className="logs-empty-icon">📋</div>
            <div className="logs-empty-text">No events logged</div>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <LogEntry key={event.id} event={event} />
          ))
        )}
      </div>
    </div>
  );
}

function LogEntry({ event }: { event: MissionEvent }) {
  const icon = EVENT_ICONS[event.type] || 'ℹ️';
  const color = EVENT_COLORS[event.type] || '#60a5fa';

  return (
    <div className="log-entry" style={{ borderLeftColor: color }}>
      <div className="log-icon" style={{ color }}>{icon}</div>
      <div className="log-content">
        <div className="log-header">
          <span className="log-type" style={{ color }}>{event.type.toUpperCase()}</span>
          <span className="log-time">{formatTime(event.timestamp)}</span>
        </div>
        <div className="log-message">{event.message}</div>
        {event.details && (
          <div className="log-details">{event.details}</div>
        )}
      </div>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}
