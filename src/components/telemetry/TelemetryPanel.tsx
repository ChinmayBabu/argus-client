import { useDashboardStore } from '../../stores/dashboardStore';
import './TelemetryPanel.css';

const CHANNEL_GROUPS = [
  {
    title: 'Position',
    channels: [
      { key: 'position_lat', label: 'Latitude', unit: '°' },
      { key: 'position_lon', label: 'Longitude', unit: '°' },
      { key: 'altitude', label: 'Altitude', unit: 'm' },
    ],
  },
  {
    title: 'Velocity',
    channels: [
      { key: 'velocity_x', label: 'Velocity X', unit: 'km/s' },
      { key: 'velocity_y', label: 'Velocity Y', unit: 'km/s' },
      { key: 'velocity_z', label: 'Velocity Z', unit: 'km/s' },
    ],
  },
  {
    title: 'Acceleration',
    channels: [
      { key: 'acceleration_x', label: 'Accel X', unit: 'm/s²' },
      { key: 'acceleration_y', label: 'Accel Y', unit: 'm/s²' },
      { key: 'acceleration_z', label: 'Accel Z', unit: 'm/s²' },
    ],
  },
  {
    title: 'Environment',
    channels: [
      { key: 'temperature', label: 'Temperature', unit: '°C' },
      { key: 'pressure', label: 'Pressure', unit: 'Pa' },
      { key: 'humidity', label: 'Humidity', unit: '%' },
    ],
  },
  {
    title: 'System',
    channels: [
      { key: 'battery_level', label: 'Battery', unit: '%' },
      { key: 'signal_strength', label: 'Signal', unit: 'dBm' },
    ],
  },
  {
    title: 'Gyroscope',
    channels: [
      { key: 'gyro_x', label: 'Gyro X', unit: 'rad/s' },
      { key: 'gyro_y', label: 'Gyro Y', unit: 'rad/s' },
      { key: 'gyro_z', label: 'Gyro Z', unit: 'rad/s' },
    ],
  },
  {
    title: 'Magnetometer',
    channels: [
      { key: 'magnetometer_x', label: 'Mag X', unit: 'µT' },
      { key: 'magnetometer_y', label: 'Mag Y', unit: 'µT' },
      { key: 'magnetometer_z', label: 'Mag Z', unit: 'µT' },
    ],
  },
  {
    title: 'Altitude',
    channels: [
      { key: 'attitude_roll', label: 'Roll', unit: '°' },
      { key: 'attitude_pitch', label: 'Pitch', unit: '°' },
      { key: 'attitude_yaw', label: 'Yaw', unit: '°' },
      { key: 'angular_velocity', label: 'ω', unit: 'rad/s' },
    ],
  },
];

export default function TelemetryPanel() {
  const telemetry = useDashboardStore((state) => state.telemetry);

  if (!telemetry) {
    return (
      <div className="telemetry-panel">
        <div className="telemetry-header">Telemetry</div>
        <div className="telemetry-no-data">Waiting for telemetry...</div>
      </div>
    );
  }

  return (
    <div className="telemetry-panel">
      <div className="telemetry-header">
        <span>Telemetry</span>
        <span className="telemetry-timestamp">
          {telemetry.timestamp ? new Date(telemetry.timestamp * 1000).toLocaleTimeString() : '--:--:--'}
        </span>
      </div>
      <div className="telemetry-grid">
        {CHANNEL_GROUPS.map((group) => (
          <div key={group.title} className="telemetry-group">
            <div className="telemetry-group-title">{group.title}</div>
            <div className="telemetry-channels">
              {group.channels.map((channel) => {
                const value = telemetry[channel.key as keyof typeof telemetry] as number;
                const displayValue = typeof value === 'number'
                  ? formatValue(value, channel.key)
                  : '--';

                return (
                  <div key={channel.key} className="telemetry-channel">
                    <span className="telemetry-label">{channel.label}</span>
                    <span className="telemetry-value">
                      {displayValue}
                      <span className="telemetry-unit">{channel.unit}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatValue(value: number, key: string): string {
  if (key.includes('lat') || key.includes('lon')) {
    return value.toFixed(6);
  }
  if (key.includes('velocity')) {
    return value.toFixed(4);
  }
  if (key.includes('altitude')) {
    return (value / 1000).toFixed(2); // Show in km
  }
  if (key.includes('battery')) {
    return value.toFixed(1);
  }
  if (key.includes('signal')) {
    return value.toFixed(1);
  }
  if (key.includes('temperature')) {
    return value.toFixed(1);
  }
  if (key.includes('gyro') || key.includes('magnetometer')) {
    return value.toFixed(4);
  }
  if (key.includes('attitude') || key.includes('angular')) {
    return value.toFixed(2);
  }
  if (key.includes('acceleration')) {
    return value.toFixed(3);
  }
  if (key.includes('pressure')) {
    return value.toFixed(0);
  }
  return value.toFixed(2);
}
