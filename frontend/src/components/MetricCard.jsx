function MetricCard({
  label,
  badgeText,
  badgeClass,
  value,
  unit,
  progressPercent,
  progressColor,
  progressGlow,
  footerLabel,
  footerValue,
}) {
  return (
    <div className="metric-card">
      <div className="card-header">
        <span className="card-label">{label}</span>
        <span className={`colored-badge ${badgeClass}`}>{badgeText}</span>
      </div>

      <div className="value-display">
        <span className="value-number">
          {value !== null && value !== undefined ? value.toFixed(1) : '--'}
        </span>
        <span className="value-unit">{unit}</span>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${Math.min(progressPercent || 0, 100)}%`,
            backgroundColor: progressColor,
            boxShadow: `0 0 0.75rem ${progressGlow}`,
          }}
        ></div>
      </div>

      <div className="footer-info">
        <span>{footerLabel}</span>
        <span>{footerValue}</span>
      </div>
    </div>
  );
}

export default MetricCard;
