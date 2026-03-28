import { useDashboardStore } from '../../stores/dashboardStore';
import './DefensePanel.css';

export default function DefensePanel() {
  const countermeasures = useDashboardStore((state) => state.countermeasures);
  const updateCountermeasure = useDashboardStore((state) => state.updateCountermeasure);

  const handleToggle = (cm: typeof countermeasures[0]) => {
    if (cm.status === 'inactive' || cm.status === 'cooldown') {
      updateCountermeasure(cm.id, { status: 'active', effectiveness: 0.85 });
    } else {
      updateCountermeasure(cm.id, { status: 'inactive', effectiveness: 0 });
    }
  };

  const activeCount = countermeasures.filter(cm => cm.status === 'active' || cm.status === 'engaged').length;

  return (
    <div className="defense-panel">
      <div className="defense-header">
        <span>Defense Systems</span>
        <span className="defense-status">{activeCount}/{countermeasures.length} Active</span>
      </div>
      <div className="defense-list">
        {countermeasures.map((cm) => (
          <CountermeasureCard
            key={cm.id}
            countermeasure={cm}
            onToggle={() => handleToggle(cm)}
          />
        ))}
      </div>
    </div>
  );
}

function CountermeasureCard({
  countermeasure,
  onToggle,
}: {
  countermeasure: {
    id: string;
    name: string;
    description: string;
    status: string;
    effectiveness: number;
    cooldown_remaining: number;
  };
  onToggle: () => void;
}) {
  const isActive = countermeasure.status === 'active' || countermeasure.status === 'engaged';
  const isCooldown = countermeasure.status === 'cooldown';

  return (
    <div className={`countermeasure-card ${isActive ? 'active' : ''} ${isCooldown ? 'cooldown' : ''}`}>
      <div className="cm-header">
        <div className="cm-info">
          <div className="cm-name">{countermeasure.name}</div>
          <div className="cm-description">{countermeasure.description}</div>
        </div>
        <button
          className={`cm-toggle ${isActive ? 'active' : ''}`}
          onClick={onToggle}
          disabled={isCooldown}
        >
          {isActive ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className="cm-footer">
        <div className="cm-status">
          <span className={`status-dot ${countermeasure.status}`} />
          <span className="status-text">{countermeasure.status.toUpperCase()}</span>
        </div>
        {isActive && (
          <div className="cm-effectiveness">
            <span className="eff-label">Effectiveness:</span>
            <div className="eff-bar">
              <div
                className="eff-fill"
                style={{ width: `${countermeasure.effectiveness * 100}%` }}
              />
            </div>
            <span className="eff-value">{(countermeasure.effectiveness * 100).toFixed(0)}%</span>
          </div>
        )}
        {isCooldown && (
          <div className="cm-cooldown">
            Cooldown: {countermeasure.cooldown_remaining.toFixed(0)}s
          </div>
        )}
      </div>
    </div>
  );
}
