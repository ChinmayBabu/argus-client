import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useDashboardStore } from '../../stores/dashboardStore';
import './SignalGraphs.css';

interface ChartDataPoint {
  time: string;
  timestamp: number;
  altitude: number;
  battery: number;
  signal: number;
  temperature: number;
}

export default function SignalGraphs() {
  const telemetryHistory = useDashboardStore((state) => state.telemetryHistory);

  const chartData: ChartDataPoint[] = telemetryHistory.timestamps.map((t, i) => ({
    time: formatTime(t),
    timestamp: t,
    altitude: (telemetryHistory.altitude[i] || 0) / 1000, // km
    battery: telemetryHistory.battery_level[i] || 0,
    signal: telemetryHistory.signal_strength[i] || -100,
    temperature: telemetryHistory.temperature[i] || 0,
  }));

  const chartColors = {
    altitude: '#4ade80',
    battery: '#fbbf24',
    signal: '#60a5fa',
    temperature: '#f87171',
    grid: 'rgba(100, 150, 255, 0.15)',
    text: '#88a',
  };

  return (
    <div className="signal-graphs">
      <div className="signal-header">Signal Analysis</div>
      <div className="graphs-container">
        <div className="graph-row">
          <div className="graph">
            <div className="graph-title">Altitude & Temperature</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData}>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: chartColors.text, fontSize: 10 }}
                  tickFormatter={(t, i) => i % 5 === 0 ? t : ''}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: chartColors.altitude, fontSize: 10 }}
                  label={{ value: 'km', angle: -90, fill: chartColors.altitude, fontSize: 10 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: chartColors.temperature, fontSize: 10 }}
                  label={{ value: '°C', angle: 90, fill: chartColors.temperature, fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10, 10, 30, 0.95)',
                    border: '1px solid rgba(100, 150, 255, 0.3)',
                    borderRadius: '4px',
                    color: '#e0e8ff',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="altitude"
                  stroke={chartColors.altitude}
                  strokeWidth={2}
                  dot={false}
                  name="Altitude"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="temperature"
                  stroke={chartColors.temperature}
                  strokeWidth={2}
                  dot={false}
                  name="Temp"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="graph">
            <div className="graph-title">Battery Level</div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={chartData}>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: chartColors.text, fontSize: 10 }}
                  tickFormatter={(t, i) => i % 5 === 0 ? t : ''}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: chartColors.battery, fontSize: 10 }}
                  label={{ value: '%', angle: -90, fill: chartColors.battery, fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10, 10, 30, 0.95)',
                    border: '1px solid rgba(100, 150, 255, 0.3)',
                    borderRadius: '4px',
                    color: '#e0e8ff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="battery"
                  stroke={chartColors.battery}
                  strokeWidth={2}
                  dot={false}
                  name="Battery"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="graph-row">
          <div className="graph full-width">
            <div className="graph-title">Signal Strength</div>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={chartData}>
                <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fill: chartColors.text, fontSize: 10 }}
                  tickFormatter={(t, i) => i % 5 === 0 ? t : ''}
                />
                <YAxis
                  domain={[-120, -20]}
                  tick={{ fill: chartColors.signal, fontSize: 10 }}
                  label={{ value: 'dBm', angle: -90, fill: chartColors.signal, fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10, 10, 30, 0.95)',
                    border: '1px solid rgba(100, 150, 255, 0.3)',
                    borderRadius: '4px',
                    color: '#e0e8ff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="signal"
                  stroke={chartColors.signal}
                  strokeWidth={2}
                  dot={false}
                  name="Signal"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
