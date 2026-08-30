import MetricCard from './MetricCard';

function MetricsGrid({
  cpuValue,
  gpuValue,
  cpuTemp,
  memValue,
  currentStatus,
  lastUpdated,
}) {
  return (
    <main className="metrics-grid">
      {/* Live CPU Card */}
      <MetricCard
        label="CPU Usage"
        badgeText={currentStatus === 'warning' ? '🔴 WARNING' : '🟢 OK'}
        badgeClass={currentStatus}
        value={cpuValue}
        unit="%"
        progressPercent={cpuValue || 0}
        progressColor={currentStatus === 'warning' ? '#f43f5e' : '#10b981'}
        progressGlow={currentStatus === 'warning' ? '#f43f5e' : '#10b981'}
        footerLabel={`Status: ${currentStatus.toUpperCase()}`}
        footerValue={lastUpdated ? `Updated: ${lastUpdated}` : 'Waiting...'}
      />

      {/* Live GPU Usage Card */}
      <MetricCard
        label="GPU Usage"
        badgeText={gpuValue !== null && gpuValue > 85 ? '🔴 HIGH GPU' : '🟢 OK'}
        badgeClass={gpuValue !== null && gpuValue > 85 ? 'warning' : 'ok'}
        value={gpuValue}
        unit="%"
        progressPercent={gpuValue || 0}
        progressColor={gpuValue !== null && gpuValue > 85 ? '#f43f5e' : '#a855f7'}
        progressGlow={gpuValue !== null && gpuValue > 85 ? '#f43f5e' : '#a855f7'}
        footerLabel="Graphics Processor"
        footerValue={gpuValue !== null ? `Intel UHD: ${gpuValue.toFixed(1)}%` : 'Reading GPU...'}
      />

      {/* Live CPU Temp Card */}
      <MetricCard
        label="CPU Temp"
        badgeText={cpuTemp !== null && cpuTemp > 75 ? '🔥 HIGH' : '🌡️ NORMAL'}
        badgeClass={cpuTemp !== null && cpuTemp > 75 ? 'warning' : 'ok'}
        value={cpuTemp}
        unit="°C"
        progressPercent={(cpuTemp || 0) / 100 * 100}
        progressColor={cpuTemp !== null && cpuTemp > 75 ? '#f43f5e' : '#f59e0b'}
        progressGlow={cpuTemp !== null && cpuTemp > 75 ? '#f43f5e' : '#f59e0b'}
        footerLabel="Core Temp"
        footerValue={cpuTemp !== null ? `${cpuTemp.toFixed(1)}°C` : 'Reading...'}
      />

      {/* Live RAM Usage Card */}
      <MetricCard
        label="RAM Usage"
        badgeText="🟢 OK"
        badgeClass="ok"
        value={memValue}
        unit="%"
        progressPercent={memValue || 0}
        progressColor="#38bdf8"
        progressGlow="#38bdf8"
        footerLabel="Memory"
        footerValue={memValue !== null ? `RAM: ${memValue.toFixed(1)}%` : 'Reading...'}
      />
    </main>
  );
}

export default MetricsGrid;
