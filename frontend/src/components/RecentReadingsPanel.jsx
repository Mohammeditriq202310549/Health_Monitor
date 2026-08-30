function RecentReadingsPanel({ recentReadings }) {
  return (
    <div className="panel-card">
      <div className="panel-title">
        <span>📋 Recent 10 Readings (Database History)</span>
        <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>GET /api/readings/recent</span>
      </div>
      <div className="readings-list">
        {recentReadings.length === 0 ? (
          <div className="empty-state">Loading history...</div>
        ) : (
          recentReadings.map((item, idx) => (
            <div
              key={item.id || idx}
              className={`reading-item ${item.status === 'warning' ? 'warning-item' : ''}`}
            >
              <div className="item-left">
                <span className="item-id">#{item.id}</span>
                <span className="item-value">{item.value.toFixed(1)}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  className={`colored-badge ${item.status === 'warning' ? 'warning' : 'ok'}`}
                  style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}
                >
                  {item.status}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {typeof item.created_at === 'string' && item.created_at.includes('T')
                    ? new Date(item.created_at).toLocaleTimeString()
                    : item.created_at}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RecentReadingsPanel;
