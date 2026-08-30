import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [cpuValue, setCpuValue] = useState(null);
  const [memValue, setMemValue] = useState(null);
  const [cpuTemp, setCpuTemp] = useState(null);
  const [gpuValue, setGpuValue] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('ok'); // Strictly set from backend database payload
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Step 10: Recent readings fetched from Python API (GET /api/readings/recent)
  const [recentReadings, setRecentReadings] = useState([]);
  
  // Step 11: Warnings list fetched from Python API (GET /api/readings/warnings)
  const [warningsList, setWarningsList] = useState([]);

  // Chart history
  const [chartHistory, setChartHistory] = useState([]);

  // Load recent readings and warnings from Python backend APIs on page load
  useEffect(() => {
    // 1. Fetch recent readings
    fetch('http://localhost:8000/api/readings/recent')
      .then((res) => res.json())
      .then((data) => {
        setRecentReadings(data);
        const initialChart = data.slice().reverse().map((item) => item.value);
        setChartHistory(initialChart);
      })
      .catch((err) => console.error('Error fetching recent readings:', err));

    // 2. Fetch warnings list directly from Python backend query
    fetch('http://localhost:8000/api/readings/warnings')
      .then((res) => res.json())
      .then((data) => {
        setWarningsList(data);
      })
      .catch((err) => console.error('Error fetching warning readings:', err));
  }, []);

  // Connect to Python WebSocket stream
  useEffect(() => {
    let ws;
    let reconnectTimer;

    const connect = () => {
      setConnectionStatus('connecting');
      ws = new WebSocket('ws://localhost:8000/ws/metrics');

      ws.onopen = () => {
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          // Parse JSON payload computed by Python backend
          const parsed = JSON.parse(event.data);
          const val = parseFloat(parsed.value);
          const memVal = parsed.memory_value !== undefined ? parseFloat(parsed.memory_value) : null;
          const tempVal = parsed.cpu_temp !== undefined && parsed.cpu_temp !== null ? parseFloat(parsed.cpu_temp) : null;
          const gpuVal = parsed.gpu_usage !== undefined && parsed.gpu_usage !== null ? parseFloat(parsed.gpu_usage) : null;
          const backendStatus = parsed.status; // Computed by Python evaluate_alert_status()
          const readingId = parsed.id || Date.now();

          setCpuValue(val);
          setCurrentStatus(backendStatus);
          if (memVal !== null) setMemValue(memVal);
          if (tempVal !== null) setCpuTemp(tempVal);
          if (gpuVal !== null) setGpuValue(gpuVal);
          
          const timeStr = new Date().toLocaleTimeString();
          setLastUpdated(timeStr);

          const newReading = {
            id: readingId,
            value: val,
            status: backendStatus, // Python database field
            created_at: timeStr,
          };

          // Append to recent readings
          setRecentReadings((prev) => [newReading, ...prev.slice(0, 9)]);

          // If Python backend marked status as 'warning', prepend to warnings list
          if (parsed.is_warning || backendStatus === 'warning') {
            setWarningsList((prev) => [newReading, ...prev]);
          }

          // Update chart
          setChartHistory((prev) => [...prev.slice(-19), val]);
        } catch (err) {
          console.error('Error parsing backend message:', err);
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  // Handle resolving a warning item
  const handleResolveWarning = (idToResolve) => {
    setWarningsList((prev) => prev.filter((item) => item.id !== idToResolve));
  };

  // Chart plotting helper
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
    <div className="dashboard-container">
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

      {/* Metrics Grid - 2 Rows x 2 Columns */}
      <main className="metrics-grid">
        {/* Row 1, Col 1: Live CPU Card */}
        <div className="metric-card">
          <div className="card-header">
            <span className="card-label">CPU Usage</span>
            <span className={`colored-badge ${currentStatus}`}>
              {currentStatus === 'warning' ? '🔴 WARNING' : '🟢 OK'}
            </span>
          </div>

          <div className="value-display">
            <span className="value-number">
              {cpuValue !== null ? cpuValue.toFixed(1) : '--'}
            </span>
            <span className="value-unit">%</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(cpuValue || 0, 100)}%`,
                backgroundColor: currentStatus === 'warning' ? '#f43f5e' : '#10b981',
                boxShadow: `0 0 0.75rem ${currentStatus === 'warning' ? '#f43f5e' : '#10b981'}`,
              }}
            ></div>
          </div>

          <div className="footer-info">
            <span>Status: {currentStatus.toUpperCase()}</span>
            <span>{lastUpdated ? `Updated: ${lastUpdated}` : 'Waiting...'}</span>
          </div>
        </div>

        {/* Row 1, Col 2: Live GPU Usage Card */}
        <div className="metric-card">
          <div className="card-header">
            <span className="card-label">GPU Usage</span>
            <span className={`colored-badge ${gpuValue !== null && gpuValue > 85 ? 'warning' : 'ok'}`}>
              {gpuValue !== null && gpuValue > 85 ? '🔴 HIGH GPU' : '🟢 OK'}
            </span>
          </div>

          <div className="value-display">
            <span className="value-number">
              {gpuValue !== null ? gpuValue.toFixed(1) : '--'}
            </span>
            <span className="value-unit">%</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(gpuValue || 0, 100)}%`,
                backgroundColor: gpuValue !== null && gpuValue > 85 ? '#f43f5e' : '#a855f7',
                boxShadow: `0 0 0.75rem ${gpuValue !== null && gpuValue > 85 ? '#f43f5e' : '#a855f7'}`,
              }}
            ></div>
          </div>

          <div className="footer-info">
            <span>Graphics Processor</span>
            <span>{gpuValue !== null ? `Intel UHD: ${gpuValue.toFixed(1)}%` : 'Reading GPU...'}</span>
          </div>
        </div>

        {/* Row 2, Col 1: Live CPU Temperature Card */}
        <div className="metric-card">
          <div className="card-header">
            <span className="card-label">CPU Temp</span>
            <span className={`colored-badge ${cpuTemp !== null && cpuTemp > 75 ? 'warning' : 'ok'}`}>
              {cpuTemp !== null && cpuTemp > 75 ? '🔥 HIGH' : '🌡️ NORMAL'}
            </span>
          </div>

          <div className="value-display">
            <span className="value-number">
              {cpuTemp !== null ? cpuTemp.toFixed(1) : '--'}
            </span>
            <span className="value-unit">°C</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min((cpuTemp || 0) / 100 * 100, 100)}%`,
                backgroundColor: cpuTemp !== null && cpuTemp > 75 ? '#f43f5e' : '#f59e0b',
                boxShadow: `0 0 0.75rem ${cpuTemp !== null && cpuTemp > 75 ? '#f43f5e' : '#f59e0b'}`,
              }}
            ></div>
          </div>

          <div className="footer-info">
            <span>Core Temp</span>
            <span>{cpuTemp !== null ? `${cpuTemp.toFixed(1)}°C` : 'Reading...'}</span>
          </div>
        </div>

        {/* Row 2, Col 2: Live RAM Usage Card */}
        <div className="metric-card">
          <div className="card-header">
            <span className="card-label">RAM Usage</span>
            <span className="colored-badge ok">
              🟢 OK
            </span>
          </div>

          <div className="value-display">
            <span className="value-number">
              {memValue !== null ? memValue.toFixed(1) : '--'}
            </span>
            <span className="value-unit">%</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(memValue || 0, 100)}%`,
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 0.75rem #38bdf8',
              }}
            ></div>
          </div>

          <div className="footer-info">
            <span>Memory</span>
            <span>{memValue !== null ? `RAM: ${memValue.toFixed(1)}%` : 'Reading...'}</span>
          </div>
        </div>
      </main>

      {/* SVG Line Chart */}
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

      {/* Panels Grid for Warnings & Recent Readings */}
      <section className="panels-grid">
        {/* Live Warnings List */}
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

        {/* Recent 10 Readings List */}
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
      </section>
    </div>
  );
}

export default App;
