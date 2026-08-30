function WarningsPanel({ warningsList, handleResolveWarning }) {
  return (
    <div className="panel-card">
      <div className="panel-title">
        <span>🚨 Live Warnings ({warningsList.length})</span>
        <span style={{ fontSize: '0.75rem', color: '#f43f5e' }}>Python Query</span>
      </div>
      <div className="readings-list">
        {warningsList.length === 0 ? (
          <div className="empty-state">No warnings recorded. All systems normal.</div>
        ) : (
          warningsList.map((item, idx) => (
            <div key={item.id || idx} className="reading-item warning-item">
              <div className="item-left">
                <span className="item-id">#{item.id}</span>
                <span className="item-value">{item.value.toFixed(1)}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {typeof item.created_at === 'string' && item.created_at.includes('T')
                    ? new Date(item.created_at).toLocaleTimeString()
                    : item.created_at}
                </span>
                <button
                  className="resolve-btn"
                  onClick={() => handleResolveWarning(item.id)}
                >
                  Resolve
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default WarningsPanel;
