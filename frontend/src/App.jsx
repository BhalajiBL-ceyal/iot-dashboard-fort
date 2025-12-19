import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { Activity, Server, Wifi, WifiOff, LayoutGrid, Trash2, GripVertical, Gauge, BarChart3, Timer, Battery, MapPin, TrendingUp, ZoomIn, ZoomOut, Lock, Unlock, Moon, Sun, Save, Upload, Settings, Copy, Undo, Redo, Edit3, Cpu, CircuitBoard } from 'lucide-react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { AdvancedLineChart, BarChartWidget, ScatterPlotWidget, MultiStreamChart } from './AdvancedCharts';
import { PinMappingWidget, PinReferenceWidget } from './ESP32PinWidget';
import MachineStateIndicator from './components/MachineStateIndicator';

// ==================== WEBSOCKET HOOK ====================
const useWebSocket = (url) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    const connect = () => {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setIsConnected(true);
        console.log('[WS] Connected');
      };

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        setData(message);
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        console.log('[WS] Disconnected, reconnecting...');
        setTimeout(connect, 3000);
      };

      ws.current.onerror = (error) => {
        console.error('[WS] Error:', error);
      };
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);

  return { data, isConnected };
};

// ==================== WIDGET COMPONENTS ====================
const NumericCard = ({ value, label, deviceId, unit, threshold, customTitle, isDarkMode }) => {
  const isWarning = threshold && value > threshold;
  const displayValue = value !== null && value !== undefined ? value.toFixed(2) : 'N/A';

  return (
    <div className={`h-full w-full rounded-lg shadow-md hover:shadow-lg transition-shadow border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className={`p-4 border-b text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          {customTitle || label}
        </div>
        <div className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{deviceId}</div>
      </div>
      <div className="p-6 flex flex-col items-center justify-center h-[calc(100%-80px)]">
        <div className={`text-8xl lg:text-9xl font-bold text-center ${isWarning ? 'text-red-600' : isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          {displayValue}
        </div>
        {unit && <div className={`text-2xl mt-4 text-center font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{unit}</div>}
      </div>
    </div>
  );
};


const GaugeWidget = ({ value, label, deviceId, min = 0, max = 100, unit, customTitle, isDarkMode }) => {
  const percentage = value !== null ? ((value - min) / (max - min)) * 100 : 0;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  const getColor = (pct) => {
    if (pct > 80) return '#dc2626'; // Red
    if (pct > 60) return '#f59e0b'; // Orange
    return '#10b981'; // Green
  };

  const displayValue = value !== null && value !== undefined ? value.toFixed(1) : 'N/A';
  const color = getColor(clampedPercentage);

  // SVG Circle properties
  const size = 200;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <div className={`h-full w-full rounded-lg shadow-md hover:shadow-lg transition-shadow border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className={`p-4 border-b text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          {customTitle || label}
        </div>
        <div className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{deviceId}</div>
      </div>
      <div className="p-6 flex flex-col items-center justify-center h-[calc(100%-80px)]">
        {/* Circular Gauge */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isDarkMode ? '#374151' : '#e5e7eb'}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Center Value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-5xl font-bold`} style={{ color }}>
              {displayValue}
            </div>
            {unit && <div className={`text-lg font-semibold mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{unit}</div>}
            <div className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {clampedPercentage.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Min/Max Labels */}
        <div className={`flex justify-between w-full mt-4 px-4 text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <span>Min: {min}</span>
          <span>Max: {max}</span>
        </div>
      </div>
    </div>
  );
};


const LineChartWidget = ({ history, label, deviceId, customTitle, isDarkMode }) => {
  const chartData = (history || []).slice(-20).map((item, index) => {
    // Handle timestamp - could be seconds or milliseconds
    let timeStr = '';
    if (item.timestamp) {
      const ts = item.timestamp > 1e12 ? item.timestamp : item.timestamp * 1000; // Convert seconds to ms if needed
      try {
        const date = new Date(ts);
        if (!isNaN(date.getTime())) {
          timeStr = date.toLocaleTimeString();
        } else {
          timeStr = `T-${20 - index}`;
        }
      } catch (e) {
        timeStr = `T-${20 - index}`;
      }
    } else {
      timeStr = `T-${20 - index}`;
    }

    return {
      time: timeStr,
      value: item.value
    };
  });

  if (chartData.length === 0) {
    return (
      <div className={`h-full w-full rounded-lg shadow-md border flex items-center justify-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>Waiting for data…</div>
      </div>
    );
  }

  return (
    <div className={`h-full w-full rounded-lg shadow-md border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className={`p-2 border-b text-xs font-semibold truncate ${isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-100 text-gray-700'}`}>
        {customTitle || label}
      </div>
      <div className="p-2" style={{ height: 'calc(100% - 40px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart key={`${chartData.length}`} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} />
            <YAxis tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} />
            <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb' }} />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const StatusIndicator = ({ status, deviceId, customTitle, isDarkMode }) => {
  const isOnline = status === 'online';

  return (
    <div className={`h-full w-full rounded-lg shadow-md hover:shadow-lg transition-shadow border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className={`text-xl font-bold text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          {customTitle || 'Device Status'}
        </div>
        <div className={`text-base text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{deviceId}</div>
      </div>
      <div className="p-6 flex flex-col items-center justify-center h-[calc(100%-70px)]">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isOnline ? 'bg-green-100' : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <Activity size={40} className={isOnline ? 'text-green-600 animate-pulse' : isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
        </div>
        <div className={`text-2xl font-bold mt-5 ${isOnline ? 'text-green-600' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>
    </div>
  );
};

const ProgressBar = ({ value, label, deviceId, max = 100, customTitle, isDarkMode }) => {
  const percentage = value !== null ? (value / max) * 100 : 0;
  const displayValue = value !== null ? value.toFixed(1) : 'N/A';

  return (
    <div className={`h-full w-full rounded-lg shadow-md hover:shadow-lg transition-shadow border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className={`p-4 border-b text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className={`text-base font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          {customTitle || label}
        </div>
        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{deviceId}</div>
      </div>
      <div className="p-6 flex flex-col justify-center h-[calc(100%-80px)]">
        <div className="flex items-baseline justify-center gap-3 mb-3">
          <span className={`text-7xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{displayValue}</span>
          <span className={`text-2xl font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{percentage.toFixed(0)}%</span>
        </div>
        <div className={`overflow-hidden h-3 text-xs flex rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <div
            style={{ width: `${percentage}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-700"
          />
        </div>
      </div>
    </div>
  );
};

// ==================== DEVICE CONTROL WIDGET ====================
const DeviceControlWidget = ({ deviceId, customTitle, isDarkMode }) => {
  const [isEnabled, setIsEnabled] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);

  const toggleDevice = async () => {
    const newState = !isEnabled;
    setIsSending(true);

    try {
      // Send control command to backend
      const response = await fetch('http://localhost:8000/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          command: 'set_power',
          value: newState ? 'on' : 'off'
        })
      });

      if (response.ok) {
        setIsEnabled(newState);
      } else {
        alert('Failed to control device');
      }
    } catch (error) {
      console.error('Control error:', error);
      alert('Could not reach backend');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`h-full w-full rounded-lg shadow-md hover:shadow-lg transition-shadow border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className={`p-4 border-b text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          {customTitle || 'Device Control'}
        </div>
        <div className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{deviceId}</div>
      </div>

      <div className="p-6 flex flex-col items-center justify-center h-[calc(100%-80px)]">
        {/* Status Display */}
        <div className={`text-6xl font-bold mb-6 ${isEnabled ? 'text-green-500' : 'text-red-500'}`}>
          {isEnabled ? 'ON' : 'OFF'}
        </div>

        {/* Toggle Switch */}
        <button
          onClick={toggleDevice}
          disabled={isSending}
          className={`relative inline-flex h-16 w-32 items-center rounded-full transition-colors focus:outline-none focus:ring-4 ${isEnabled
            ? 'bg-green-500 focus:ring-green-300'
            : isDarkMode ? 'bg-gray-600 focus:ring-gray-500' : 'bg-gray-300 focus:ring-gray-200'
            } ${isSending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-12 w-12 transform rounded-full bg-white shadow-lg transition-transform ${isEnabled ? 'translate-x-16' : 'translate-x-2'
              }`}
          />
        </button>

        {/* State Label */}
        <div className={`mt-6 text-xl font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {isSending ? 'Sending...' : isEnabled ? 'Device Running' : 'Device Stopped'}
        </div>

        {/* Instructions */}
        <div className={`mt-4 text-sm text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Click to {isEnabled ? 'stop' : 'start'} the device
        </div>
      </div>
    </div>
  );
};

// Additional widgets simplified for brevity
const AlarmWidget = ({ value, label, deviceId, threshold, customTitle }) => {
  const isAlarm = value >= threshold;
  return (
    <div className={`h-full w-full rounded-lg shadow-md p-4 ${isAlarm ? 'bg-red-600' : 'bg-green-500'} text-white`}>
      <div className="text-xs truncate">{deviceId}</div>
      <div className="text-sm font-bold truncate">{customTitle || label}</div>
      <div className="text-3xl font-extrabold mt-2">{value}</div>
      <div className="mt-2 text-xs">Threshold: {threshold}</div>
    </div>
  );
};

const BatteryWidget = ({ value, deviceId, customTitle, isDarkMode }) => {
  const percent = Math.min(100, Math.max(0, ((value - 3) / 1.2) * 100));
  return (
    <div className={`h-full w-full rounded-lg shadow-md p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{deviceId}</div>
      <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{customTitle || 'Battery'}</div>
      <div className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{percent.toFixed(0)}%</div>
      <div className={`h-2 rounded mt-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
        <div className={`h-2 rounded ${percent > 50 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

// Simplified other widgets
const KPIWidget = ({ label, value, unit }) => (
  <div className="h-full w-full bg-indigo-600 text-white rounded-lg shadow-md p-4">
    <div className="text-xs opacity-80 truncate">{label}</div>
    <div className="text-3xl font-extrabold mt-4">{value}{unit}</div>
  </div>
);

const StatusWidget = ({ online, deviceId }) => (
  <div className={`h-full w-full rounded-lg shadow-md p-4 ${online ? 'bg-green-500' : 'bg-gray-500'} text-white`}>
    <div className="text-xs truncate">{deviceId}</div>
    <div className="text-2xl font-bold mt-4">{online ? 'ONLINE' : 'OFFLINE'}</div>
  </div>
);

const MapWidget = ({ lat, lng }) => (
  <div className="h-full w-full bg-white rounded-lg shadow-md p-1">
    <iframe title="map" width="100%" height="100%" src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`} className="rounded" />
  </div>
);

const PredictionWidget = ({ value, label }) => (
  <div className="h-full w-full bg-purple-600 text-white rounded-lg shadow-md p-4">
    <div className="text-xs truncate">Predicted {label}</div>
    <div className="text-3xl font-bold mt-4">{(value * 1.05).toFixed(1)}</div>
    <div className="text-xs mt-2">Next 10 min</div>
  </div>
);

const MultiMetricWidget = ({ metrics = [], deviceId, telemetryData, isDarkMode }) => {
  return (
    <div className={`h-full w-full rounded-lg shadow-md p-4 overflow-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`text-xs mb-2 truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{deviceId}</div>
      {metrics.length === 0 ? (
        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>No metrics configured</div>
      ) : (
        metrics.map((m, i) => (
          <div key={i} className="flex justify-between text-sm mb-1">
            <span className={`truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{m.key}</span>
            <span className={`font-bold ml-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {telemetryData[deviceId]?.[m.key]?.value ?? '--'}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

const MetricSelectorModal = ({ deviceId, telemetryData, onSave, onClose, isDarkMode }) => {
  const keys = Object.keys(telemetryData[deviceId] || []);
  const [selected, setSelected] = React.useState([]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className={`rounded-xl w-96 p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Select Metrics</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {keys.map(k => (
            <label key={k} className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <input type="checkbox" onChange={e => setSelected(prev => e.target.checked ? [...prev, { key: k, threshold: null }] : prev.filter(m => m.key !== k))} />
              {k}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className={`px-3 py-1 border rounded ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}>Cancel</button>
          <button onClick={() => onSave(selected)} className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Add</button>
        </div>
      </div>
    </div>
  );
};

// ==================== WIDGET SETTINGS MODAL ====================
const WidgetSettingsModal = ({ widget, onSave, onClose, isDarkMode }) => {
  const [title, setTitle] = useState(widget.customTitle || '');
  const [threshold, setThreshold] = useState(widget.threshold || '');
  const [unit, setUnit] = useState(widget.unit || '');
  const [min, setMin] = useState(widget.min || 0);
  const [max, setMax] = useState(widget.max || 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className={`rounded-xl w-96 p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
          <Settings size={20} className="inline mr-2" />
          Widget Settings
        </h3>

        <div className="space-y-4">
          <div>
            <label className={`text-sm font-medium block mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Custom Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Widget title..."
              className={`w-full px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
            />
          </div>

          {widget.type === 'gauge' && (
            <>
              <div>
                <label className={`text-sm font-medium block mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Min Value</label>
                <input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} className={`w-full px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`} />
              </div>
              <div>
                <label className={`text-sm font-medium block mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Max Value</label>
                <input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} className={`w-full px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`} />
              </div>
            </>
          )}

          {(widget.type === 'numeric' || widget.type === 'alarm') && (
            <div>
              <label className={`text-sm font-medium block mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Threshold</label>
              <input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className={`w-full px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`} />
            </div>
          )}

          <div>
            <label className={`text-sm font-medium block mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Unit</label>
            <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g., °C, %, kW" className={`w-full px-3 py-2 border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`} />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className={`px-4 py-2 border rounded ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}>Cancel</button>
          <button onClick={() => onSave({ customTitle: title, threshold, unit, min, max })} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
};

// ==================== WIDGET RENDERER ====================
const WidgetRenderer = ({ widget, telemetryData, devices, machineStates, isDarkMode }) => {
  const deviceId = widget.bind ? widget.bind.split('.')[0] : widget.deviceId;
  const key = widget.bind ? widget.bind.split('.')[1] : null;
  const value = telemetryData[deviceId]?.[key]?.value;
  const history = telemetryData[deviceId]?.[key]?.history || [];
  const device = devices.find(d => (typeof d === 'string' ? d === deviceId : d.device_id === deviceId));

  const commonProps = {
    customTitle: widget.customTitle,
    isDarkMode,
    unit: widget.unit,
    threshold: widget.threshold,
    min: widget.min,
    max: widget.max
  };

  switch (widget.type) {
    case 'numeric':
      return <NumericCard value={value} label={key} deviceId={deviceId} {...commonProps} />;
    case 'gauge':
      return <GaugeWidget value={value} label={key} deviceId={deviceId} {...commonProps} />;
    case 'chart':
      return <LineChartWidget history={history} label={key} deviceId={deviceId} {...commonProps} />;
    case 'chart_step':
      return <AdvancedLineChart history={history} label={key} deviceId={deviceId} chartType="step" {...commonProps} />;
    case 'chart_smooth':
      return <AdvancedLineChart history={history} label={key} deviceId={deviceId} chartType="smooth" {...commonProps} />;
    case 'chart_linear':
      return <AdvancedLineChart history={history} label={key} deviceId={deviceId} chartType="linear" {...commonProps} />;
    case 'chart_bar':
      return <BarChartWidget history={history} label={key} deviceId={deviceId} {...commonProps} />;
    case 'chart_scatter':
      return <ScatterPlotWidget history={history} label={key} deviceId={deviceId} {...commonProps} />;
    case 'chart_multistream':
      return <MultiStreamChart streams={widget.streams || []} deviceId={deviceId} telemetryData={telemetryData} {...commonProps} />;
    case 'status':
      return <StatusIndicator status={device?.status} deviceId={deviceId} {...commonProps} />;
    case 'progress':
      return <ProgressBar value={value} label={key} deviceId={deviceId} {...commonProps} />;
    case 'alarm':
      return <AlarmWidget value={value} label={key} deviceId={deviceId} {...commonProps} />;
    case 'battery':
      return <BatteryWidget value={value} deviceId={deviceId} {...commonProps} />;
    case 'kpi':
      return <KPIWidget label={key} value={value} unit={widget.unit} />;
    case 'status_widget':
      return <StatusWidget online={device?.status === 'online'} deviceId={deviceId} />;
    case 'map':
      return <MapWidget lat={telemetryData[deviceId]?.latitude?.value} lng={telemetryData[deviceId]?.longitude?.value} />;
    case 'prediction':
      return <PredictionWidget value={value} label={key} />;
    case 'multi_metric':
      return <MultiMetricWidget metrics={widget.metrics} deviceId={deviceId} telemetryData={telemetryData} isDarkMode={isDarkMode} />;
    case 'pin_mapping':
      return <PinMappingWidget deviceId={deviceId} telemetryData={telemetryData} {...commonProps} />;
    case 'pin_reference':
      return <PinReferenceWidget isDarkMode={isDarkMode} />;
    case 'machine_state':
      const machineState = machineStates?.[deviceId];
      return (
        <MachineStateIndicator
          state={machineState?.state || 'UNKNOWN'}
          confidence={machineState?.confidence}
          reasons={machineState?.reasons}
          isDarkMode={isDarkMode}
        />
      );
    default:
      return null;
  }
};

// ==================== WIDGET LIBRARY ITEM ====================
const WidgetLibraryItem = ({ type, icon: Icon, label, onDragStart, isEditMode }) => {
  return (
    <div
      draggable={isEditMode}
      onDragStart={(e) => onDragStart(e, type)}
      className={`flex items-center gap-3 p-3 bg-slate-700 rounded ${isEditMode ? 'cursor-grab active:cursor-grabbing hover:bg-slate-600' : 'cursor-not-allowed opacity-50'} transition-colors`}
    >
      <Icon size={18} />
      <span className="text-sm">{label}</span>
    </div>
  );
};

// ==================== MAIN APP ====================
export default function IoTDashboard() {
  const [devices, setDevices] = useState([]);
  const [telemetryData, setTelemetryData] = useState({});
  const [widgets, setWidgets] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [draggedWidgetType, setDraggedWidgetType] = useState(null);
  const [showKeySelector, setShowKeySelector] = useState(false);
  const [pendingWidget, setPendingWidget] = useState(null);
  const [showMetricSelector, setShowMetricSelector] = useState(false);
  const [pendingMultiMetricDevice, setPendingMultiMetricDevice] = useState(null);
  const [machineStates, setMachineStates] = useState({}); // Track machine states
  const [zoom, setZoom] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = useRef(null);

  // NEW FEATURES STATE
  const [isEditMode, setIsEditMode] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [showWidgetSettings, setShowWidgetSettings] = useState(null);

  // MOBILE RESPONSIVENESS
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // MULTI-DASHBOARD STATE
  const [dashboards, setDashboards] = useState([
    { id: 'default', name: 'Main Dashboard', widgets: [], createdAt: Date.now() }
  ]);
  const [currentDashboardId, setCurrentDashboardId] = useState('default');
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [dashboardName, setDashboardName] = useState('');

  const protocolHTTP = window.location.protocol;
  const host = window.location.hostname;

  const API_BASE = `${protocolHTTP}//${host}:8000`;
  const WS_URL = `${protocolHTTP === 'https:' ? 'wss' : 'ws'}://${host}:8000/ws/live`;


  const { data: wsData, isConnected } = useWebSocket(WS_URL);

  // Fetch initial devices
  useEffect(() => {
    fetch(`${API_BASE}/api/devices`)
      .then(res => res.json())
      .then(data => setDevices(data.devices || []))
      .catch(err => console.error('Error fetching devices:', err));

    // Load saved dashboard
    const saved = localStorage.getItem('iot_dashboard_layout');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWidgets(parsed.widgets || []);
        setIsDarkMode(parsed.isDarkMode || false);
      } catch (e) {
        console.error('Failed to load dashboard:', e);
      }
    }

    // Detect mobile screen size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false); // Auto-close sidebar on mobile
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (!wsData) return;

    if (wsData.type === 'initial_state') {
      setDevices(wsData.devices || []);
    } else if (wsData.type === 'telemetry_update') {
      const { device_id, telemetry, timestamp } = wsData;

      setTelemetryData(prev => {
        const newData = { ...prev };
        if (!newData[device_id]) newData[device_id] = {};

        Object.entries(telemetry).forEach(([key, value]) => {
          // Skip internal state fields from being stored as regular telemetry
          if (key.startsWith('_')) return;

          if (!newData[device_id][key]) {
            newData[device_id][key] = { value, history: [] };
          }
          newData[device_id][key].value = value;
          newData[device_id][key].history.push({ timestamp, value });

          if (newData[device_id][key].history.length > 100) {
            newData[device_id][key].history.shift();
          }
        });

        return newData;
      });

      // Extract machine state if present
      if (telemetry._machine_state) {
        setMachineStates(prev => ({
          ...prev,
          [device_id]: {
            state: telemetry._machine_state,
            confidence: telemetry._state_confidence,
            reasons: telemetry._state_reasons
          }
        }));
      }

      setDevices(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(d => d.device_id === device_id);
        if (idx >= 0) {
          updated[idx].last_seen = timestamp;
          updated[idx].status = 'online';
        }
        return updated;
      });
    } else if (wsData.type === 'device_status') {
      setDevices(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(d => d.device_id === wsData.device_id);
        if (idx >= 0) {
          updated[idx].status = wsData.status;
        }
        return updated;
      });
    }
  }, [wsData]);

  // Measure container width dynamically
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Add to history for undo/redo
  const addToHistory = (newWidgets) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newWidgets);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleDragStart = (e, widgetType) => {
    if (!isEditMode) return;
    setDraggedWidgetType(widgetType);
    e.dataTransfer.setData('text/plain', widgetType);
    e.dataTransfer.effectAllowed = 'copy';

    // Auto-hide sidebar when dragging starts (both mobile and desktop)
    setIsDragging(true);
    setTimeout(() => setSidebarOpen(false), 100);
  };

  const handleDragEnd = () => {
    // Re-show sidebar when dragging ends
    setIsDragging(false);
    // On mobile, keep sidebar closed; on desktop, reopen it
    if (!isMobile) {
      setTimeout(() => setSidebarOpen(true), 300);
    }
  };

  const onGridDrop = (layout, item, e) => {
    if (!draggedWidgetType || !selectedDevice) {
      alert('Please select a device first!');
      return;
    }

    setPendingWidget({
      type: draggedWidgetType,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    });

    setShowKeySelector(true);
  };

  const addWidgetWithKey = (key) => {
    if (!selectedDevice || !pendingWidget) return;

    if (pendingWidget.type === 'multi_metric') {
      setPendingMultiMetricDevice(selectedDevice);
      setShowKeySelector(false);
      setShowMetricSelector(true);
      return;
    }

    const newWidget = {
      id: `widget_${Date.now()}`,
      type: pendingWidget.type,
      bind: `${selectedDevice}.${key}`,
      x: pendingWidget.x,
      y: pendingWidget.y,
      w: pendingWidget.w,
      h: pendingWidget.h,
      minW: 2,
      minH: 2,
      ...(pendingWidget.type === 'alarm' && { threshold: 50 }),
    };

    const newWidgets = [...widgets, newWidget];
    setWidgets(newWidgets);
    addToHistory(newWidgets);
    setShowKeySelector(false);
    setPendingWidget(null);
  };

  const removeWidget = (id) => {
    const newWidgets = widgets.filter(w => w.id !== id);
    setWidgets(newWidgets);
    addToHistory(newWidgets);
  };

  const duplicateWidget = (widget) => {
    const newWidget = {
      ...widget,
      id: `widget_${Date.now()}`,
      x: widget.x + 1,
      y: widget.y + 1,
    };
    const newWidgets = [...widgets, newWidget];
    setWidgets(newWidgets);
    addToHistory(newWidgets);
  };

  const updateWidgetSettings = (widgetId, settings) => {
    const newWidgets = widgets.map(w => w.id === widgetId ? { ...w, ...settings } : w);
    setWidgets(newWidgets);
    addToHistory(newWidgets);
    setShowWidgetSettings(null);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setWidgets(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setWidgets(history[historyIndex + 1]);
    }
  };

  const saveDashboard = () => {
    const updatedDashboards = dashboards.map(d =>
      d.id === currentDashboardId ? { ...d, widgets } : d
    );

    const data = {
      dashboards: updatedDashboards,
      currentDashboardId,
      isDarkMode,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('iot_dashboard_layout', JSON.stringify(data));
    alert('All dashboards saved successfully!');
  };

  const loadDashboard = () => {
    const saved = localStorage.getItem('iot_dashboard_layout');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // Check if new multi-dashboard format
        if (parsed.dashboards) {
          setDashboards(parsed.dashboards);
          setCurrentDashboardId(parsed.currentDashboardId || parsed.dashboards[0].id);
          const current = parsed.dashboards.find(d => d.id === (parsed.currentDashboardId || parsed.dashboards[0].id));
          setWidgets(current?.widgets || []);
          addToHistory(current?.widgets || []);
        } else {
          // Old format - migrate to multi-dashboard
          const defaultDashboard = {
            id: 'default',
            name: 'Main Dashboard',
            widgets: parsed.widgets || [],
            createdAt: Date.now()
          };
          setDashboards([defaultDashboard]);
          setCurrentDashboardId('default');
          setWidgets(parsed.widgets || []);
          addToHistory(parsed.widgets || []);
        }

        setIsDarkMode(parsed.isDarkMode || false);
        alert('Dashboard loaded successfully!');
      } catch (e) {
        alert('Failed to load dashboard');
      }
    } else {
      alert('No saved dashboard found');
    }
  };

  // MULTI-DASHBOARD MANAGEMENT FUNCTIONS
  const createDashboard = (name) => {
    const newDashboard = {
      id: `dashboard_${Date.now()}`,
      name: name || `Dashboard ${dashboards.length + 1}`,
      widgets: [],
      createdAt: Date.now()
    };
    const updated = [...dashboards, newDashboard];
    setDashboards(updated);
    setCurrentDashboardId(newDashboard.id);
    setWidgets([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setShowDashboardModal(false);
    setDashboardName('');
  };

  const switchDashboard = (dashboardId) => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (dashboard) {
      setCurrentDashboardId(dashboardId);
      setWidgets(dashboard.widgets);
      setHistory([dashboard.widgets]);
      setHistoryIndex(0);
    }
  };

  const renameDashboard = (dashboardId, newName) => {
    const updated = dashboards.map(d =>
      d.id === dashboardId ? { ...d, name: newName } : d
    );
    setDashboards(updated);
  };

  const deleteDashboard = (dashboardId) => {
    if (dashboards.length === 1) {
      alert('Cannot delete the last dashboard');
      return;
    }

    if (!window.confirm('Delete this dashboard?')) return;

    const updated = dashboards.filter(d => d.id !== dashboardId);
    setDashboards(updated);

    if (currentDashboardId === dashboardId) {
      switchDashboard(updated[0].id);
    }
  };

  // Auto-save current dashboard when widgets change
  React.useEffect(() => {
    const updated = dashboards.map(d =>
      d.id === currentDashboardId ? { ...d, widgets } : d
    );
    setDashboards(updated);
  }, [widgets]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoom(1.0);

  const availableKeys = selectedDevice && devices.length > 0
    ? (typeof devices[0] === 'string' ? Object.keys(telemetryData[selectedDevice] || {}) : devices.find(d => d.device_id === selectedDevice)?.telemetry_keys || [])
    : [];

  // Adjust layout for mobile (single column)
  const layout = widgets.map(w => {
    if (isMobile) {
      return {
        i: w.id,
        x: 0, // Single column on mobile
        y: w.y ?? Infinity,
        w: 12, // Full width on mobile
        h: Math.max(w.h ?? 4, 3), // Minimum height for mobile
        minW: 12,
        minH: 3,
      };
    }
    return {
      i: w.id,
      x: w.x ?? 0,
      y: w.y ?? Infinity,
      w: w.w ?? 4,
      h: w.h ?? 4,
      minW: w.minW ?? 2,
      minH: w.minH ?? 2,
    };
  });

  return (
    <div className={`h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`fixed top-4 left-4 z-50 p-3 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
          style={{ display: sidebarOpen ? 'none' : 'block' }}
        >
          <LayoutGrid size={24} className={isDarkMode ? 'text-gray-200' : 'text-gray-800'} />
        </button>
      )}

      {/* Sidebar with auto-hide during drag */}
      {isDragging && (
        <div className={`fixed ${isMobile ? 'top-20' : 'top-1/2'} left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg animate-pulse`}>
          {isMobile ? 'Drop below ↓' : 'Drop widget on canvas →'}
        </div>
      )}

      {/* Sidebar */}
      <div className={`${isMobile ? 'fixed inset-y-0 left-0 z-40 transform transition-transform duration-300' : 'relative'} ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'} ${isMobile ? 'w-full sm:w-80' : 'w-72'} flex flex-col shadow-xl overflow-hidden ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-slate-800 text-white'}`}>
        {/* Sidebar Header */}
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-slate-700'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server size={28} className="text-blue-400" />
              <div>
                <h1 className="text-xl font-bold">IoT Dashboard</h1>
                <p className="text-xs text-slate-400">Real-time Monitoring</p>
              </div>
            </div>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded hover:bg-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-slate-700'}`}>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Select Device</div>
          {devices.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">No devices discovered</div>
          ) : (
            <div className="space-y-2">
              {devices.map(device => (
                <button
                  key={device.device_id}
                  onClick={() => {
                    if (isEditMode) {
                      setSelectedDevice(device.device_id);
                      if (isMobile) setSidebarOpen(false); // Auto-close on mobile after selection
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-all ${selectedDevice === device.device_id ? 'bg-blue-600 shadow-lg' : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-slate-700 hover:bg-slate-600'} ${!isEditMode && 'opacity-50 cursor-not-allowed'}`}
                  disabled={!isEditMode}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                        <span className="text-sm font-medium truncate">{device.device_id}</span>
                      </div>
                      <div className="text-xs text-slate-400">{device.telemetry_keys?.length || 0} telemetry keys</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 w-full overflow-y-auto p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Widget Library</div>
          <div className="text-xs text-slate-400 mb-3">
            {isEditMode ? (selectedDevice ? 'Drag & drop widgets to canvas' : 'Select a device first') : 'Enable Edit Mode to add widgets'}
          </div>
          <div className="space-y-2" onDragEnd={handleDragEnd}>
            <WidgetLibraryItem type="numeric" icon={Timer} label="Numeric Card" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="gauge" icon={Gauge} label="Gauge" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="chart" icon={BarChart3} label="Line Chart" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="chart_step" icon={BarChart3} label="Step Line Chart" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="chart_smooth" icon={BarChart3} label="Smooth Line Chart" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="chart_bar" icon={BarChart3} label="Bar Chart" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="chart_scatter" icon={BarChart3} label="Scatter Plot" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="chart_multistream" icon={BarChart3} label="Multi-Stream Chart" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="status" icon={Activity} label="Status Indicator" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="progress" icon={Battery} label="Progress Bar" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="alarm" icon={Wifi} label="Alarm Indicator" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="battery" icon={Battery} label="Battery Widget" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="kpi" icon={LayoutGrid} label="KPI Widget" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="status_widget" icon={Server} label="Status Widget" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="map" icon={MapPin} label="Map Widget" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="prediction" icon={TrendingUp} label="Prediction Widget" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="multi_metric" icon={BarChart3} label="Multi-Metric Widget" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="pin_mapping" icon={Cpu} label="ESP32 Pin Mapping" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="pin_reference" icon={CircuitBoard} label="ESP32 Pin Reference" onDragStart={handleDragStart} isEditMode={isEditMode} />
            <WidgetLibraryItem type="machine_state" icon={Activity} label="Machine State" onDragStart={handleDragStart} isEditMode={isEditMode} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile-Responsive Toolbar */}
        <div className={`border-b shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Top Row - Title and Menu */}
          <div className={`px-4 py-3 flex items-center justify-between ${isMobile ? 'border-b' : ''} ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {!isMobile && <LayoutGrid size={24} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />}
              <div className="min-w-0 flex-1">
                <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} truncate`}>Dashboard Canvas</h2>
                {selectedDevice && !isMobile && <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>Building dashboard for: {selectedDevice}</p>}
              </div>
            </div>

            {/* Edit/View Mode Toggle - Always visible */}
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors flex-shrink-0 ${isEditMode ? 'bg-blue-600 text-white' : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              title={isEditMode ? 'Switch to View Mode' : 'Switch to Edit Mode'}
            >
              {isEditMode ? <Unlock size={16} /> : <Lock size={16} />}
              {!isMobile && <span className="text-sm">{isEditMode ? 'Edit' : 'View'}</span>}
            </button>
          </div>

          {/* Bottom Row - Controls (Scrollable on mobile) */}
          <div className={`px-4 py-2 overflow-x-auto ${isMobile ? 'pb-3' : ''}`}>
            <div className="flex items-center gap-2 min-w-max">
              {/* Undo/Redo */}
              {isEditMode && (
                <>
                  <button onClick={handleUndo} disabled={historyIndex === 0} className={`p-2 rounded ${historyIndex === 0 ? 'opacity-30 cursor-not-allowed' : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} title="Undo">
                    <Undo size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </button>
                  <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className={`p-2 rounded ${historyIndex === history.length - 1 ? 'opacity-30 cursor-not-allowed' : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} title="Redo">
                    <Redo size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </button>
                </>
              )}

              {/* Save/Load */}
              <button onClick={saveDashboard} className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} title="Save Dashboard">
                <Save size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              </button>
              <button onClick={loadDashboard} className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} title="Load Dashboard">
                <Upload size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              </button>

              {/* Dark Mode Toggle - Now visible on mobile */}
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
                {isDarkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-600" />}
              </button>

              <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>

              {/* Dashboard Selector - Compact on mobile */}
              <select
                value={currentDashboardId}
                onChange={(e) => switchDashboard(e.target.value)}
                className={`${isMobile ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} rounded-lg font-medium border ${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                title="Switch Dashboard"
              >
                {dashboards.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <button
                onClick={() => setShowDashboardModal(true)}
                className={`p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                title="New Dashboard"
              >
                <LayoutGrid size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              </button>

              {dashboards.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      const newName = prompt('Rename dashboard:', dashboards.find(d => d.id === currentDashboardId)?.name);
                      if (newName) renameDashboard(currentDashboardId, newName);
                    }}
                    className={`p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                    title="Rename Dashboard"
                  >
                    <Edit3 size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </button>

                  <button
                    onClick={() => deleteDashboard(currentDashboardId)}
                    className="p-2 rounded transition-colors hover:bg-red-600 hover:text-white"
                    title="Delete Dashboard"
                  >
                    <Trash2 size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </button>
                </>
              )}

              <div className={`w-px h-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>

              {/* Zoom Controls - Show on desktop only */}
              {!isMobile && (
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <button onClick={handleZoomOut} className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`} title="Zoom Out">
                    <ZoomOut size={18} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'} />
                  </button>
                  <span className={`text-sm font-medium min-w-[60px] text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {(zoom * 100).toFixed(0)}%
                  </span>
                  <button onClick={handleZoomIn} className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`} title="Zoom In">
                    <ZoomIn size={18} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'} />
                  </button>
                  <button onClick={handleZoomReset} className={`ml-2 px-2 py-1 text-xs rounded transition-colors ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} title="Reset Zoom">
                    Reset
                  </button>
                </div>
              )}

              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {isConnected ? <><Wifi size={16} /><span>Connected</span></> : <><WifiOff size={16} /><span>Disconnected</span></>}
              </div>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          className={`flex-1 overflow-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
          style={{
            backgroundImage: `radial-gradient(circle, ${isDarkMode ? '#374151' : '#e5e7eb'} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
            // Custom scrollbar for better visibility on mobile
            scrollbarWidth: 'thin',
            scrollbarColor: `${isDarkMode ? '#3b82f6 #1f2937' : '#3b82f6 #e5e7eb'}`,
            WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          }}
          onDragOver={(e) => {
            if (!isEditMode) return;
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => {
            if (!isEditMode) return;
            e.preventDefault();
            e.stopPropagation();

            // Pin reference widget doesn't need device selection
            if (draggedWidgetType === 'pin_reference') {
              const rect = e.currentTarget.getBoundingClientRect();
              const cellWidth = containerWidth / 12;
              const x = Math.floor((e.clientX - rect.left) / cellWidth / zoom);
              const y = Math.floor((e.clientY - rect.top) / 60 / zoom);

              const newWidget = {
                id: `widget_${Date.now()}`,
                type: 'pin_reference',
                x: Math.max(0, Math.min(x, 8)),
                y: Math.max(0, y),
                w: 4,
                h: 6,
                minW: 3,
                minH: 4,
              };

              const newWidgets = [...widgets, newWidget];
              setWidgets(newWidgets);
              addToHistory(newWidgets);
              return;
            }

            // Pin mapping widget needs device but not key
            if (draggedWidgetType === 'pin_mapping') {
              if (!selectedDevice) {
                alert('Please select a device first!');
                return;
              }

              const rect = e.currentTarget.getBoundingClientRect();
              const cellWidth = containerWidth / 12;
              const x = Math.floor((e.clientX - rect.left) / cellWidth / zoom);
              const y = Math.floor((e.clientY - rect.top) / 60 / zoom);

              const newWidget = {
                id: `widget_${Date.now()}`,
                type: 'pin_mapping',
                deviceId: selectedDevice,
                x: Math.max(0, Math.min(x, 8)),
                y: Math.max(0, y),
                w: 6,
                h: 8,
                minW: 4,
                minH: 6,
              };

              const newWidgets = [...widgets, newWidget];
              setWidgets(newWidgets);
              addToHistory(newWidgets);
              return;
            }

            if (!draggedWidgetType || !selectedDevice) {
              alert('Please select a device first!');
              return;
            }

            const rect = e.currentTarget.getBoundingClientRect();
            const cellWidth = containerWidth / 12;
            const x = Math.floor((e.clientX - rect.left) / cellWidth / zoom);
            const y = Math.floor((e.clientY - rect.top) / 60 / zoom);

            setPendingWidget({
              type: draggedWidgetType,
              x: Math.max(0, Math.min(x, 8)),
              y: Math.max(0, y),
              w: 4,
              h: 3,
            });

            setShowKeySelector(true);
          }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              minWidth: `${100 / zoom}%`,
              minHeight: `${100 / zoom}%`,
            }}
          >
            <GridLayout
              className="layout"
              layout={layout}
              cols={isMobile ? 12 : 12}
              rowHeight={isMobile ? 50 : 60}
              width={containerWidth}
              autoSize={true}
              isDraggable={!isMobile && isEditMode}
              isResizable={isEditMode}
              isDroppable={isEditMode}
              droppingItem={{ i: '__dropping__', w: isMobile ? 12 : 4, h: 3, x: 0, y: 0 }}
              compactType={isMobile ? 'vertical' : null}
              preventCollision={false}
              resizeHandles={isMobile ? ['s'] : ['se', 'e', 's', 'sw']}
              onDrop={onGridDrop}
              onLayoutChange={(newLayout) => {
                if (!isEditMode) return;
                setWidgets(prev =>
                  prev.map(w => {
                    const l = newLayout.find(n => n.i === w.id);
                    return l ? { ...w, x: l.x, y: l.y, w: l.w, h: l.h } : w;
                  })
                );
              }}
              draggableHandle=".drag-handle"
              style={{ minHeight: '600px' }}
            >
              {widgets.length === 0 ? (
                <div key="empty" data-grid={{ x: 0, y: 0, w: 12, h: 8, static: true }} className="flex items-center justify-center">
                  <div className={`text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    <GripVertical size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h3 className="text-xl font-semibold mb-2">Drag & Drop Widgets</h3>
                    <p className="text-sm">Drag widgets from the left panel and drop them here</p>
                  </div>
                </div>
              ) : null}

              {widgets.map(widget => (
                <div key={widget.id} className="relative group bg-transparent">
                  {isEditMode && (
                    <>
                      {!isMobile && (
                        <div className="drag-handle absolute top-2 left-2 z-10 cursor-move text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical size={16} />
                        </div>
                      )}
                      <div className={`absolute top-2 right-2 z-10 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity flex gap-1 ${isDarkMode ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-sm rounded-lg ${isMobile ? 'p-1.5' : 'p-1'} shadow-lg`}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowWidgetSettings(widget); }}
                          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setShowWidgetSettings(widget); }}
                          className={`bg-blue-600 text-white ${isMobile ? 'p-2.5' : 'p-1.5'} rounded hover:bg-blue-700 transition-colors active:bg-blue-800`}
                          title="Settings"
                        >
                          <Settings size={isMobile ? 18 : 14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); duplicateWidget(widget); }}
                          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); duplicateWidget(widget); }}
                          className={`bg-green-600 text-white ${isMobile ? 'p-2.5' : 'p-1.5'} rounded hover:bg-green-700 transition-colors active:bg-green-800`}
                          title="Duplicate"
                        >
                          <Copy size={isMobile ? 18 : 14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeWidget(widget.id); }}
                          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); removeWidget(widget.id); }}
                          className={`bg-red-600 text-white ${isMobile ? 'p-2.5' : 'p-1.5'} rounded hover:bg-red-700 transition-colors active:bg-red-800`}
                          title="Delete"
                        >
                          <Trash2 size={isMobile ? 18 : 14} />
                        </button>
                      </div>

                      {/* Mobile Resize Handle Indicator */}
                      {isMobile && (
                        <div className={`absolute bottom-0 left-0 right-0 h-10 flex items-center justify-center ${isDarkMode ? 'bg-blue-600/20 border-t-2 border-blue-500' : 'bg-blue-500/20 border-t-2 border-blue-500'} cursor-ns-resize`}>
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-12 h-1.5 rounded-full bg-blue-500"></div>
                            <div className="w-12 h-1.5 rounded-full bg-blue-500"></div>
                            <div className={`text-xs font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Drag to resize</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <WidgetRenderer widget={widget} telemetryData={telemetryData} devices={devices} machineStates={machineStates} isDarkMode={isDarkMode} />
                </div>
              ))}
            </GridLayout>
          </div>
        </div>

        {/* Key Selector Modal */}
        {showKeySelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-xl shadow-2xl w-96 max-h-[80vh] flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Select Telemetry Key</h3>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose a data point for this widget</p>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {availableKeys.length === 0 ? (
                  <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No telemetry keys available for this device</div>
                ) : (
                  <div className="space-y-2">
                    {availableKeys.map(key => (
                      <button
                        key={key}
                        onClick={() => addWidgetWithKey(key)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${isDarkMode ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-700' : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'}`}
                      >
                        <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{key}</div>
                        {telemetryData[selectedDevice]?.[key] && (
                          <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Current: {telemetryData[selectedDevice][key].value?.toFixed(2)}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={`px-6 py-4 border-t flex justify-end gap-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button onClick={() => { setShowKeySelector(false); setPendingWidget(null); }} className={`px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Metric Selector Modal */}
        {showMetricSelector && pendingMultiMetricDevice && (
          <MetricSelectorModal
            deviceId={pendingMultiMetricDevice}
            telemetryData={telemetryData}
            isDarkMode={isDarkMode}
            onClose={() => {
              setShowMetricSelector(false);
              setPendingWidget(null);
            }}
            onSave={(metrics) => {
              const newWidget = {
                id: `widget_${Date.now()}`,
                type: 'multi_metric',
                deviceId: pendingMultiMetricDevice,
                metrics,
                x: pendingWidget?.x ?? 0,
                y: pendingWidget?.y ?? Infinity,
                w: 4,
                h: Math.max(3, metrics.length + 1),
                minW: 2,
                minH: 2,
              };
              const newWidgets = [...widgets, newWidget];
              setWidgets(newWidgets);
              addToHistory(newWidgets);
              setShowMetricSelector(false);
              setPendingWidget(null);
            }}
          />
        )}

        {/* Widget Settings Modal */}
        {showWidgetSettings && (
          <WidgetSettingsModal
            widget={showWidgetSettings}
            isDarkMode={isDarkMode}
            onSave={(settings) => updateWidgetSettings(showWidgetSettings.id, settings)}
            onClose={() => setShowWidgetSettings(null)}
          />
        )}

        {/* Dashboard Creation Modal */}
        {showDashboardModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`rounded-xl p-6 w-96 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                <LayoutGrid size={20} className="inline mr-2" />
                Create New Dashboard
              </h3>
              <input
                type="text"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="Dashboard name..."
                className={`w-full px-3 py-2 border rounded mb-4 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
                onKeyPress={(e) => e.key === 'Enter' && createDashboard(dashboardName)}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => createDashboard(dashboardName)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                >
                  Create
                </button>
                <button
                  onClick={() => { setShowDashboardModal(false); setDashboardName(''); }}
                  className={`flex-1 px-4 py-2 rounded font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
