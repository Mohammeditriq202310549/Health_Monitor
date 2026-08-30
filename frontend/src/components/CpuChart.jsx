function CpuChart({ chartHistory }) {
  const svgWidth = 600;
  const svgHeight = 140;
  
  const pointsString = chartHistory
    .map((val, idx) => {
      const x = chartHistory.length > 1 ? (idx / (chartHistory.length - 1)) * svgWidth : svgWidth / 2;
      const y = svgHeight - (val / 100) * svgHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section className="chart-card">
      <div className="chart-header">
        <span className="card-label">Live CPU Usage History (Last 20 Readings)</span>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Red dashed line = threshold</span>
      </div>
      <svg className="chart-svg" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <line
          x1="0"
          y1={svgHeight - 0.8 * svgHeight}
          x2={svgWidth}
          y2={svgHeight - 0.8 * svgHeight}
          stroke="#f43f5e"
          strokeDasharray="4 4"
          strokeWidth="1.5"
        />
        {chartHistory.length > 1 && (
          <polyline
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            points={pointsString}
          />
        )}
      </svg>
    </section>
  );
}

export default CpuChart;
