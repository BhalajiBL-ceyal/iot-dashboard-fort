import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Server, Wifi, WifiOff, LayoutGrid, Trash2, GripVertical, Gauge, BarChart3, Timer, Battery, MapPin, TrendingUp, ZoomIn, ZoomOut, Lock, Unlock, Moon, Sun, Save, Upload, Settings, Copy, Undo, Redo, Edit3 } from 'lucide-react';
import GridLayout from 'react-grid-layout';
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
const NumericCard = ({ value, label, deviceId, unit, threshold, customTitle, isDarkMode }) => {
    const isWarning = threshold && value > threshold;
    const displayValue = value !== null && value !== undefined ? value.toFixed(2) : 'N/A';

    return (
        <div className={`h-full w-full rounded-lg shadow-md hover:shadow-lg transition-shadow border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className={`text-xs font-semibold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {customTitle || label}
                </div>
                <div className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{deviceId}</div>
            </div>
            <div className="p-4 flex flex-col items-center justify-center h-[calc(100%-60px)]">
                <div className={`text-3xl lg:text-4xl font-bold ${isWarning ? 'text-red-600' : isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {displayValue}
                </div>
                {unit && <div className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{unit}</div>}
            </div>
        </div>
    );
};

const GaugeWidget = ({ value, label, deviceId, min = 0, max = 100, unit, customTitle, isDarkMode }) => {
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
        <div className={`h-full w-full rounded-lg shadow-md hover:shadow-lg transition-shadow border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className={`text-xs font-semibold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {customTitle || label}
                </div>
                <div className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{deviceId}</div>
            </div>
            <div className="p-4 flex flex-col justify-center h-[calc(100%-60px)]">
                <div className="text-center mb-3">
                    <span className={`text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{displayValue}</span>
                    {unit && <span className={`text-xs ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{unit}</span>}
                </div>
                <div className="relative">
                    <div className={`overflow-hidden h-2 text-xs flex rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                            style={{ width: `${clampedPercentage}%`, backgroundColor: color }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-700"
                        />
                    </div>
                    <div className={`flex justify-between text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span>{min}</span>
                        <span>{max}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LineChartWidget = ({ history, label, deviceId, customTitle, isDarkMode }) => {
    const chartData = (history || []).slice(-20).map(item => ({
        time: item.timestamp ? new Date(item.timestamp * 1000).toLocaleTimeString() : '',
        value: item.value
    }));

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
                <div className={`text-xs font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {customTitle || 'Device Status'}
                </div>
                <div className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{deviceId}</div>
            </div>
            <div className="p-4 flex flex-col items-center justify-center h-[calc(100%-60px)]">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isOnline ? 'bg-green-100' : isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <Activity size={24} className={isOnline ? 'text-green-600 animate-pulse' : isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                </div>
                <div className={`text-sm font-semibold mt-3 ${isOnline ? 'text-green-600' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
            <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className={`text-xs font-semibold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {customTitle || label}
                </div>
                <div className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{deviceId}</div>
            </div>
            <div className="p-4 flex flex-col justify-center h-[calc(100%-60px)]">
                <div className="flex items-baseline justify-between mb-2">
                    <span className={`text-3xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{displayValue}</span>
                    <span className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{percentage.toFixed(0)}%</span>
                </div>
                <div className={`overflow-hidden h-2 text-xs flex rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div
                        style={{ width: `${percentage}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-700"
                    />
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
const WidgetRenderer = ({ widget, telemetryData, devices, isDarkMode }) => {
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
    const [zoom, setZoom] = useState(1.0);
    const [containerWidth, setContainerWidth] = useState(1200);
    const containerRef = useRef(null);

    // NEW FEATURES STATE
    const [isEditMode, setIsEditMode] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [history, setHistory] = useState([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [showWidgetSettings, setShowWidgetSettings] = useState(null);

    const API_BASE = 'http://localhost:8000';
    const WS_URL = 'ws://localhost:8000/ws/live';

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
        const data = {
            widgets,
            isDarkMode,
            savedAt: new Date().toISOString(),
        };
        localStorage.setItem('iot_dashboard_layout', JSON.stringify(data));
        alert('Dashboard saved successfully!');
    };

    const loadDashboard = () => {
        const saved = localStorage.getItem('iot_dashboard_layout');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setWidgets(parsed.widgets || []);
                setIsDarkMode(parsed.isDarkMode || false);
                addToHistory(parsed.widgets || []);
                alert('Dashboard loaded successfully!');
            } catch (e) {
                alert('Failed to load dashboard');
            }
        } else {
            alert('No saved dashboard found');
        }
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2.0));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleZoomReset = () => setZoom(1.0);

    const availableKeys = selectedDevice && devices.length > 0
        ? (typeof devices[0] === 'string' ? Object.keys(telemetryData[selectedDevice] || {}) : devices.find(d => d.device_id === selectedDevice)?.telemetry_keys || [])
        : [];

    const layout = widgets.map(w => ({
        i: w.id,
        x: w.x ?? 0,
        y: w.y ?? Infinity,
        w: w.w ?? 4,
        h: w.h ?? 4,
        minW: w.minW ?? 2,
        minH: w.minH ?? 2,
    }));

    return (
        <div className={`h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Sidebar */}
            <div className={`w-72 flex flex-col shadow-xl overflow-hidden ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-slate-800 text-white'}`}>
                <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-slate-700'}`}>
                    <div className="flex items-center gap-3">
                        <Server size={28} className="text-blue-400" />
                        <div>
                            <h1 className="text-xl font-bold">IoT Dashboard</h1>
                            <p className="text-xs text-slate-400">Real-time Monitoring</p>
                        </div>
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
                                    onClick={() => isEditMode && setSelectedDevice(device.device_id)}
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
                    <div className="space-y-2">
                        <WidgetLibraryItem type="numeric" icon={Timer} label="Numeric Card" onDragStart={handleDragStart} isEditMode={isEditMode} />
                        <WidgetLibraryItem type="gauge" icon={Gauge} label="Gauge" onDragStart={handleDragStart} isEditMode={isEditMode} />
                        <WidgetLibraryItem type="chart" icon={BarChart3} label="Line Chart" onDragStart={handleDragStart} isEditMode={isEditMode} />
                        <WidgetLibraryItem type="status" icon={Activity} label="Status Indicator" onDragStart={handleDragStart} isEditMode={isEditMode} />
                        <WidgetLibraryItem type="progress" icon={Battery} label="Progress Bar" onDragStart={handleDragStart} isEditMode={isEditMode} />
                        <WidgetLibraryItem type="alarm" icon={Wifi} label="Alarm Indicator" onDragStart={handleDragStart} isEditMode={isEditMode} />
                        <WidgetLibraryItem type="battery" icon={Battery} label="Battery Widget" onDragStart={handleDragStart} isEditMode={isEditMode} />
                        <WidgetLibraryItem type="kpi" icon={LayoutGrid} label="KPI Widget" onDragStart={handleDragStart} isEditMode={isEditMode} />
                        <WidgetLibraryItem type="status_widget" icon={Server} label="Status Widget" onDragStart={handleDragStart} isEditMode={isEditMode} />
                        <WidgetLibraryItem type="map" icon={MapPin} label="Map Widget" onDragStart={handleDragStart} isEditMode={isEditMode} />
                        <WidgetLibraryItem type="prediction" icon={TrendingUp} label="Prediction Widget" onDragStart={handleDragStart} isEditMode={isEditMode} />
                        <WidgetLibraryItem type="multi_metric" icon={BarChart3} label="Multi-Metric Widget" onDragStart={handleDragStart} isEditMode={isEditMode} />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className={`border-b px-6 py-4 flex items-center justify-between shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center gap-4">
                        <LayoutGrid size={24} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                        <div>
                            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Dashboard Canvas</h2>
                            {selectedDevice && <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Building dashboard for: {selectedDevice}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Edit/View Mode Toggle */}
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${isEditMode ? 'bg-blue-600 text-white' : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            title={isEditMode ? 'Switch to View Mode' : 'Switch to Edit Mode'}
                        >
                            {isEditMode ? <Unlock size={16} /> : <Lock size={16} />}
                            <span className="text-sm">{isEditMode ? 'Edit' : 'View'}</span>
                        </button>

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

                        {/* Dark Mode Toggle */}
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
                            {isDarkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-600" />}
                        </button>

                        {/* Zoom Controls */}
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

                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isConnected ? <><Wifi size={16} /><span>Connected</span></> : <><WifiOff size={16} /><span>Disconnected</span></>}
                        </div>
                    </div>
                </div>

                <div
                    ref={containerRef}
                    className={`flex-1 overflow-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
                    style={{ backgroundImage: `radial-gradient(circle, ${isDarkMode ? '#374151' : '#e5e7eb'} 1px, transparent 1px)`, backgroundSize: '20px 20px' }}
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
                            cols={12}
                            rowHeight={60}
                            width={containerWidth}
                            autoSize={true}
                            isDraggable={isEditMode}
                            isResizable={isEditMode}
                            isDroppable={isEditMode}
                            droppingItem={{ i: '__dropping__', w: 4, h: 3, x: 0, y: 0 }}
                            compactType={null}
                            preventCollision={false}
                            resizeHandles={['se', 'e', 's', 'sw']}
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
                                            <div className="drag-handle absolute top-2 left-2 z-10 cursor-move text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <GripVertical size={16} />
                                            </div>
                                            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button onClick={() => setShowWidgetSettings(widget)} className="bg-blue-600 text-white p-1.5 rounded" title="Settings">
                                                    <Settings size={14} />
                                                </button>
                                                <button onClick={() => duplicateWidget(widget)} className="bg-green-600 text-white p-1.5 rounded" title="Duplicate">
                                                    <Copy size={14} />
                                                </button>
                                                <button onClick={() => removeWidget(widget.id)} className="bg-red-600 text-white p-1.5 rounded" title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    <WidgetRenderer widget={widget} telemetryData={telemetryData} devices={devices} isDarkMode={isDarkMode} />
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
            </div>
        </div>
    );
}
