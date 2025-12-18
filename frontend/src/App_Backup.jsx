import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Server, Wifi, WifiOff, LayoutGrid, Trash2, GripVertical, Gauge, BarChart3, Timer, Battery, MapPin, TrendingUp } from 'lucide-react';
import { ResponsiveGridLayout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
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
const NumericCard = ({ value, label, deviceId, unit, threshold }) => {
  const isWarning = threshold && value > threshold;
  const displayValue = value !== null && value !== undefined ? value.toFixed(2) : 'N/A';

  return (
    <div className="h-full bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200  ">
      <div className="p-4 border-b border-gray-100">
        <div className="text-sm font-semibold text-gray-700">{label}</div>
        <div className="text-xs text-gray-500">{deviceId}</div>
      </div>
      <div className="p-6 flex flex-col items-center justify-center">
        <div className={`text-5xl font-bold ${isWarning ? 'text-red-600' : 'text-blue-600'}`}>
          {displayValue}
        </div>
        {unit && <div className="text-sm text-gray-600 mt-2">{unit}</div>}
      </div>
    </div>
  );
};

const GaugeWidget = ({ value, label, deviceId, min = 0, max = 100, unit }) => {
  const percentage = value !== null ? ((value - min) / (max - min)) * 100 : 0;
  const clampedPercentage = Math.max(0, Math.min(100, percentage));

  const getColor = (pct) => {
    if (pct > 80) return '#dc2626';
    if (pct > 60) return '#f59e0b';
    return '#10b981';
  };

  const displayValue = value !== null && value !== undefined ? value.toFixed(1) : 'N/A';
  const color = getColor(clampedPercentage);

  return (
    <div className="h-full bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200  ">
      <div className="p-4 border-b border-gray-100">
        <div className="text-sm font-semibold text-gray-700">{label}</div>
        <div className="text-xs text-gray-500">{deviceId}</div>
      </div>
      <div className="p-6 flex flex-col justify-center">
        <div className="text-center mb-4">
          <span className="text-5xl font-bold text-gray-900">{displayValue}</span>
          {unit && <span className="text-sm text-gray-600 ml-2">{unit}</span>}
        </div>
        <div className="relative">
          <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-200">
            <div
              style={{ width: `${clampedPercentage}%`, backgroundColor: color }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-700"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const LineChartWidget = ({ history, label, deviceId }) => {
  const chartData = (history || []).slice(-20).map(item => ({
    time: item.timestamp ? new Date(item.timestamp * 1000).toLocaleTimeString() : '',
    value: item.value
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-full bg-white rounded-lg shadow-md border border-gray-200 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Waiting for data…</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-3 border-b text-sm font-semibold">{label}</div>
      <div className="p-2" style={{ height: 'calc(100% - 48px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart key={`${chartData.length}`} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const StatusIndicator = ({ status, deviceId }) => {
  const isOnline = status === 'online';

  return (
    <div className="h-full bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200  ">
      <div className="p-4 border-b border-gray-100">
        <div className="text-sm font-semibold text-gray-700">Device Status</div>
        <div className="text-xs text-gray-500">{deviceId}</div>
      </div>
      <div className="p-6 flex flex-col items-center justify-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isOnline ? 'bg-green-100' : 'bg-gray-100'}`}>
          <Activity size={32} className={isOnline ? 'text-green-600 animate-pulse' : 'text-gray-400'} />
        </div>
        <div className={`text-lg font-semibold mt-4 ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>
    </div>
  );
};

const ProgressBar = ({ value, label, deviceId, max = 100 }) => {
  const percentage = value !== null ? (value / max) * 100 : 0;
  const displayValue = value !== null ? value.toFixed(1) : 'N/A';

  return (
    <div className="h-full bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200  ">
      <div className="p-4 border-b border-gray-100">
        <div className="text-sm font-semibold text-gray-700">{label}</div>
        <div className="text-xs text-gray-500">{deviceId}</div>
      </div>
      <div className="p-6 flex flex-col justify-center">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-5xl font-bold text-gray-900">{displayValue}</span>
          <span className="text-sm font-semibold text-gray-600">{percentage.toFixed(0)}%</span>
        </div>
        <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
          <div
            style={{ width: `${percentage}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-700"
          />
        </div>
      </div>
    </div>
  );
};
const AlarmWidget = ({ value, label, deviceId, threshold }) => {
  const isAlarm = value >= threshold;

  return (
    <div className={`h-full   rounded-lg shadow-md p-6 ${isAlarm ? 'bg-red-600 text-white' : 'bg-green-500 text-white'
      }`}>
      <div className="text-sm">{deviceId}</div>
      <div className="text-xl font-bold">{label}</div>
      <div className="text-4xl font-extrabold mt-2">{value}</div>
      <div className="mt-2 text-sm">
        Threshold: {threshold}
      </div>
    </div>
  );
};
const BatteryWidget = ({ value, deviceId }) => {
  const percent = Math.min(100, Math.max(0, ((value - 3) / 1.2) * 100));

  return (
    <div className="h-full   bg-white rounded-lg shadow-md p-6">
      <div className="text-sm text-gray-500">{deviceId}</div>
      <div className="text-xl font-semibold">Battery</div>
      <div className="text-4xl font-bold mt-2">{percent.toFixed(0)}%</div>
      <div className="  bg-gray-200 h-3 rounded mt-3">
        <div
          className={`h-3 rounded ${percent > 50 ? 'bg-green-500' : 'bg-red-500'
            }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
const KPIWidget = ({ label, value, unit }) => (
  <div className="h-full   bg-indigo-600 text-white rounded-lg shadow-md p-6">
    <div className="text-sm opacity-80">{label}</div>
    <div className="text-5xl font-extrabold mt-4">
      {value}{unit}
    </div>
  </div>
);
const StatusWidget = ({ online, deviceId }) => (
  <div className={`h-full   rounded-lg shadow-md p-6 ${online ? 'bg-green-500' : 'bg-gray-500'
    } text-white`}>
    <div className="text-sm">{deviceId}</div>
    <div className="text-3xl font-bold mt-4">
      {online ? 'ONLINE' : 'OFFLINE'}
    </div>
  </div>
);
const MapWidget = ({ lat, lng }) => (
  <div className="h-full   bg-white rounded-lg shadow-md p-2">
    <iframe
      title="map"
      width="100%"
      height="100%"
      src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
    />
  </div>
);
const PredictionWidget = ({ value, label }) => (
  <div className="h-full   bg-purple-600 text-white rounded-lg shadow-md p-6">
    <div className="text-sm">Predicted {label}</div>
    <div className="text-5xl font-bold mt-4">
      {(value * 1.05).toFixed(1)}
    </div>
    <div className="text-sm mt-2">Next 10 min</div>
  </div>
);
const MultiMetricWidget = ({ metrics = [], deviceId, telemetryData }) => {
  return (
    <div className="h-full   bg-white rounded-lg shadow-md p-6">
      <div className="text-sm text-gray-500 mb-2">{deviceId}</div>

      {metrics.length === 0 ? (
        <div className="text-gray-400 text-sm">No metrics configured</div>
      ) : (
        metrics.map((m, i) => (
          <div key={i} className="flex justify-between text-xl mb-1">
            <span>{m.key}</span>
            <span className="font-bold">
              {telemetryData[deviceId]?.[m.key]?.value ?? '--'}
            </span>

          </div>
        ))
      )}
    </div>
  );
};
const MetricSelectorModal = ({ deviceId, telemetryData, onSave, onClose }) => {
  const keys = Object.keys(telemetryData[deviceId] || []);
  const [selected, setSelected] = React.useState([]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-96 p-6">
        <h3 className="text-lg font-semibold mb-4">Select Metrics</h3>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {keys.map(k => (
            <label key={k} className="flex items-center gap-2">
              <input
                type="checkbox"
                onChange={e =>
                  setSelected(prev =>
                    e.target.checked
                      ? [...prev, { key: k, threshold: null }]
                      : prev.filter(m => m.key !== k)
                  )
                }
              />
              {k}
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-3 py-1 border rounded">
            Cancel
          </button>
          <button
            onClick={() => onSave(selected)}
            className="px-4 py-1 bg-blue-600 text-white rounded"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};







// ==================== WIDGET RENDERER ====================
const WidgetRenderer = ({ widget, telemetryData, devices }) => {
  const deviceId = widget.bind
    ? widget.bind.split('.')[0]
    : widget.deviceId;

  const key = widget.bind
    ? widget.bind.split('.')[1]
    : null;
  const value = telemetryData[deviceId]?.[key]?.value;
  const history = telemetryData[deviceId]?.[key]?.history || [];
  const device = devices.find(d => (typeof d === 'string' ? d === deviceId : d.device_id === deviceId));

  switch (widget.type) {
    case 'numeric':
      return <NumericCard value={value} label={key} deviceId={deviceId} unit={widget.unit} threshold={widget.threshold} />;

    case 'gauge':
      return <GaugeWidget value={value} label={key} deviceId={deviceId} min={widget.min || 0} max={widget.max || 100} unit={widget.unit} />;

    case 'chart':
      return <LineChartWidget history={history} label={key} deviceId={deviceId} />;

    case 'status':
      return <StatusIndicator status={device?.status} deviceId={deviceId} />;

    case 'progress':
      return <ProgressBar value={value} label={key} deviceId={deviceId} max={widget.max || 100} />;

    case 'alarm':
      return <AlarmWidget value={value} label={key} deviceId={deviceId} threshold={widget.threshold} />;

    case 'battery':
      return <BatteryWidget value={value} deviceId={deviceId} />;

    case 'kpi':
      return <KPIWidget label={key} value={value} unit={widget.unit} />;

    case 'status_widget':
      return <StatusWidget online={device?.status === 'online'} deviceId={deviceId} />;

    case 'map':
      return (
        <MapWidget
          lat={telemetryData[deviceId]?.latitude?.value}
          lng={telemetryData[deviceId]?.longitude?.value}
        />
      );

    case 'prediction':
      return <PredictionWidget value={value} label={key} />;

    case 'multi_metric':
      return (
        <MultiMetricWidget
          metrics={widget.metrics}
          deviceId={deviceId}
          telemetryData={telemetryData}
        />
      );


    default:
      return null;
  }

};

// ==================== WIDGET LIBRARY ITEM ====================
const WidgetLibraryItem = ({ type, icon: Icon, label, onDragStart }) => {
  return (
    <div
      draggable={true}
      onDragStart={(e) => onDragStart(e, type)}
      className="flex items-center gap-3 p-3 bg-slate-700 rounded cursor-grab active:cursor-grabbing"
    >
      <Icon size={18} />
      <span>{label}</span>
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


  const API_BASE = 'http://localhost:8000';
  const WS_URL = 'ws://localhost:8000/ws/live';

  const { data: wsData, isConnected } = useWebSocket(WS_URL);

  // Fetch initial devices
  useEffect(() => {
    fetch(`${API_BASE}/api/devices`)
      .then(res => res.json())
      .then(data => setDevices(data.devices || []))
      .catch(err => console.error('Error fetching devices:', err));
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

  const handleDragStart = (e, widgetType) => {
    setDraggedWidgetType(widgetType);
    e.dataTransfer.setData('text/plain', widgetType);

    e.dataTransfer.effectAllowed = 'copy';
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


  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const addWidgetWithKey = (key) => {
    if (!selectedDevice || !pendingWidget) return;

    // Multi-metric widget opens metric selector instead of binding single key
    if (pendingWidget.type === 'multi_metric') {
      setPendingMultiMetricDevice(selectedDevice);
      setShowKeySelector(false);
      setShowMetricSelector(true);
      return;
    }


    const isChart = pendingWidget.type === 'chart';

    const newWidget = {
      id: `widget_${Date.now()}`,
      type: pendingWidget.type,
      bind: `${selectedDevice}.${key}`,

      x: pendingWidget.x,
      y: pendingWidget.y,
      w: pendingWidget.w,
      h: pendingWidget.h,

      minW: 4,
      maxW: 8,
      minH: 4,

      ...(pendingWidget.type === 'alarm' && { threshold: 50 }),
    };





    setWidgets(prev => [...prev, newWidget]);
    setShowKeySelector(false);
    setPendingWidget(null);
  };


  const removeWidget = (id) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const availableKeys = selectedDevice && devices.length > 0
    ? (typeof devices[0] === 'string' ? Object.keys(telemetryData[selectedDevice] || {}) : devices.find(d => d.device_id === selectedDevice)?.telemetry_keys || [])
    : [];
  const layout = widgets.map(w => ({
    i: w.id,
    x: w.x ?? 0,
    y: w.y ?? Infinity,
    w: w.w ?? 4,
    h: w.h ?? 4,
  }));
  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-72 bg-slate-800 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Server size={28} className="text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">IoT Dashboard</h1>
              <p className="text-xs text-slate-400">Real-time Monitoring</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-slate-700">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Select Device</div>

          {devices.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-4">No devices discovered</div>
          ) : (
            <div className="space-y-2">
              {devices.map(device => (
                <button
                  key={device.device_id}
                  onClick={() => setSelectedDevice(device.device_id)}
                  className={`  text-left p-3 rounded-lg transition-all ${selectedDevice === device.device_id ? 'bg-blue-600 shadow-lg' : 'bg-slate-700 hover:bg-slate-600'}`}
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
          <div className="text-xs text-slate-400 mb-3">{selectedDevice ? 'Drag & drop widgets to canvas' : 'Select a device first'}</div>

          <div className="space-y-2">
            <WidgetLibraryItem type="numeric" icon={Timer} label="Numeric Card" onDragStart={handleDragStart} />
            <WidgetLibraryItem type="gauge" icon={Gauge} label="Gauge" onDragStart={handleDragStart} />
            <WidgetLibraryItem type="chart" icon={BarChart3} label="Line Chart" onDragStart={handleDragStart} />
            <WidgetLibraryItem type="status" icon={Activity} label="Status Indicator" onDragStart={handleDragStart} />
            <WidgetLibraryItem type="progress" icon={Battery} label="Progress Bar" onDragStart={handleDragStart} />
            <WidgetLibraryItem type="alarm" icon={Wifi} label="Alarm Indicator" onDragStart={handleDragStart} />
            <WidgetLibraryItem type="battery" icon={Battery} label="Battery Widget" onDragStart={handleDragStart} />
            <WidgetLibraryItem type="kpi" icon={LayoutGrid} label="KPI Widget" onDragStart={handleDragStart} />
            <WidgetLibraryItem type="status_widget" icon={Server} label="Status Widget" onDragStart={handleDragStart} />
            <WidgetLibraryItem type="map" icon={MapPin} label="Map Widget" onDragStart={handleDragStart} />
            <WidgetLibraryItem type="prediction" icon={TrendingUp} label="Prediction Widget" onDragStart={handleDragStart} />
            <WidgetLibraryItem type="multi_metric" icon={BarChart3} label="Multi-Metric Widget" onDragStart={handleDragStart} />

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <LayoutGrid size={24} className="text-gray-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Dashboard Canvas</h2>
              {selectedDevice && <p className="text-xs text-gray-500">Building dashboard for: {selectedDevice}</p>}
            </div>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isConnected ? <><Wifi size={16} /><span>Connected</span></> : <><WifiOff size={16} /><span>Disconnected</span></>}
          </div>
        </div>

        {widgets.length === 0 ? (
          <div
            className="flex-1 overflow-auto p-6 flex items-center justify-center"

            style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          >

            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <GripVertical size={40} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">Drag & Drop Widgets</h3>
              <p className="text-gray-500 mb-4">
                1. Select a device from the left sidebar<br />
                2. Drag widgets from the library<br />
                3. Drop them here to build your dashboard
              </p>
              {!selectedDevice && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm">
                  ⚠️ Please select a device first
                </div>
              )}
            </div>
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={{
              lg: layout,
              md: layout,
              sm: layout,
              xs: layout,
              xxs: layout,
            }}
            breakpoints={{
              lg: 1200,
              md: 996,
              sm: 768,
              xs: 480,
              xxs: 0,
            }}
            cols={{
              lg: 8,
              md: 8,
              sm: 6,
              xs: 4,
              xxs: 2,
            }}
            rowHeight={50}
            isDraggable
            isResizable
            isDroppable
            droppingItem={{ i: '__dropping__', w: 4, h: 4 }}
            compactType={null}
            preventCollision={false}
            resizeHandles={['se', 'e', 's']}
            onDrop={onGridDrop}
            onLayoutChange={(newLayout) => {
              setWidgets(prev =>
                prev.map(w => {
                  const l = newLayout.find(n => n.i === w.id);
                  return l ? { ...w, x: l.x, y: l.y, w: l.w, h: l.h } : w;
                })
              );
            }}
          >


            {/* EMPTY STATE INSIDE GRID */}
            {widgets.length === 0 && (
              <div
                key="empty"
                data-grid={{ x: 0, y: 0, w: 8, h: 8, static: true }}
                className="flex items-center justify-center"
              >
                <div className="text-center text-gray-500">
                  <GripVertical size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Drag & Drop Widgets</h3>
                  <p className="text-sm">
                    Drag widgets from the left panel and drop them here
                  </p>
                </div>
              </div>
            )}

            {widgets.map(widget => (
              <div key={widget.id} className="relative group bg-transparent">
                <div className="drag-handle absolute top-2 left-2 z-10 cursor-move text-gray-400">
                  <GripVertical size={16} />
                </div>

                <WidgetRenderer
                  widget={widget}
                  telemetryData={telemetryData}
                  devices={devices}
                />

                <button
                  onClick={() => removeWidget(widget.id)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

          </ResponsiveGridLayout>
        )}
        {/* Key Selector Modal */}
        {showKeySelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-96 max-h-[80vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Select Telemetry Key</h3>
                <p className="text-sm text-gray-500 mt-1">Choose a data point for this widget</p>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {availableKeys.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No telemetry keys available for this device</div>
                ) : (
                  <div className="space-y-2">
                    {availableKeys.map(key => (
                      <button
                        key={key}
                        onClick={() => addWidgetWithKey(key)}
                        className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{key}</div>
                        {telemetryData[selectedDevice]?.[key] && (
                          <div className="text-sm text-gray-500 mt-1">
                            Current: {telemetryData[selectedDevice][key].value?.toFixed(2)}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowKeySelector(false);
                    setPendingWidget(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
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
            onClose={() => {
              setShowMetricSelector(false);
              setPendingWidget(null);
            }}
            onSave={(metrics) => {
              setWidgets(prev => [
                ...prev,
                {
                  id: `widget_${Date.now()}`,
                  type: 'multi_metric',
                  deviceId: pendingMultiMetricDevice,
                  metrics,
                  x: pendingWidget?.x ?? 0,
                  y: pendingWidget?.y ?? Infinity,
                  w: 4,
                  h: Math.max(4, metrics.length + 1),
                }
              ]);
              setShowMetricSelector(false);
              setPendingWidget(null);
            }}
          />
        )}
      </div>
    </div>
  );
}