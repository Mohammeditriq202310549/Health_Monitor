function Header({ connectionStatus }) {
  return (
    <header className="header">
      <div className="header-title">
        <span className="title-icon">⚡</span>
        <h1>Health Monitor</h1>
      </div>

      <div className="header-badges">
        <div className={`status-badge ${connectionStatus}`}>
          <span className={`status-dot ${connectionStatus === 'connected' ? 'pulse' : ''}`}></span>
          <span>{connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
