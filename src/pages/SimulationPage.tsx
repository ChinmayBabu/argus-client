import MissionMap from '../components/map/MissionMap';
import TelemetryPanel from '../components/telemetry/TelemetryPanel';
import SignalGraphs from '../components/signals/SignalGraphs';
import SimulationControls from '../components/controls/SimulationControls';
import MissionLogs from '../components/logs/MissionLogs';

export default function SimulationPage() {
  return (
    <main className="dashboard-main route-main simulation-route">
      <aside className="dashboard-sidebar">
        <SimulationControls />
        <TelemetryPanel />
      </aside>
      <section className="dashboard-center">
        <MissionMap width="100%" height="100%" />
        <div className="center-bottom"><SignalGraphs /></div>
      </section>
      <aside className="dashboard-sidebar right"><MissionLogs /></aside>
    </main>
  );
}
