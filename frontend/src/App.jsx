import { useState, useEffect } from 'react';
import Header from './components/Header';
import MetricsGrid from './components/MetricsGrid';
import CpuChart from './components/CpuChart';
import WarningsPanel from './components/WarningsPanel';
import RecentReadingsPanel from './components/RecentReadingsPanel';
import './App.css';

function App() {
  const [cpuValue, setCpuValue] = useState(null);
  const [memValue, setMemValue] = useState(null);
  const [cpuTemp, setCpuTemp] = useState(null);
  const [gpuValue, setGpuValue] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('ok'); // Strictly set from backend database payload
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Recent readings fetched from Python API (GET /api/readings/recent)
  const [recentReadings, setRecentReadings] = useState([]);
  
  // Warnings list fetched from Python API (GET /api/readings/warnings)
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

  return (
    <div className="dashboard-container">
      <Header connectionStatus={connectionStatus} />

      <MetricsGrid
        cpuValue={cpuValue}
        gpuValue={gpuValue}
        cpuTemp={cpuTemp}
        memValue={memValue}
        currentStatus={currentStatus}
        lastUpdated={lastUpdated}
      />

      <CpuChart chartHistory={chartHistory} />

      <section className="panels-grid">
        <WarningsPanel
          warningsList={warningsList}
          handleResolveWarning={handleResolveWarning}
        />

        <RecentReadingsPanel recentReadings={recentReadings} />
      </section>
    </div>
  );
}

export default App;
