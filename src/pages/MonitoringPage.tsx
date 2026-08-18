import MissionMap from '../components/map/MissionMap';
import TelemetryPanel from '../components/telemetry/TelemetryPanel';
import ThreatPanel from '../components/threats/ThreatPanel';
import MissionLogs from '../components/logs/MissionLogs';
import DefensePanel from '../components/defense/DefensePanel';
import BlockchainPanel from '../components/blockchain/BlockchainPanel';

export default function MonitoringPage() {
  return (
    <main className="dashboard-main route-main monitoring-route">
      <aside className="dashboard-sidebar">
        <TelemetryPanel />
        <DefensePanel />
      </aside>
      <section className="dashboard-center"><MissionMap width="100%" height="100%" /></section>
      <aside className="dashboard-sidebar right">
        <ThreatPanel />
        <MissionLogs />
        <BlockchainPanel />
      </aside>
    </main>
  );
}
