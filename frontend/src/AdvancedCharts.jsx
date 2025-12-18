// Advanced Chart Components for IoT Dashboard
import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';

// Helper function to format timestamps safely
const formatTimestamp = (timestamp, fallbackIndex, totalPoints = 20) => {
    if (!timestamp) return `T-${totalPoints - fallbackIndex}`;

    try {
        // Handle both seconds and milliseconds
        const ts = timestamp > 1e12 ? timestamp : timestamp * 1000;
        const date = new Date(ts);

        if (isNaN(date.getTime())) {
            return `T-${totalPoints - fallbackIndex}`;
        }

        return date.toLocaleTimeString();
    } catch (e) {
        return `T-${totalPoints - fallbackIndex}`;
    }
};

// ==================== ADVANCED LINE CHART (Step/Smooth options + Zoom/Pan) ====================
export const AdvancedLineChart = ({ history, label, deviceId, customTitle, isDarkMode, chartType = 'line' }) => {
    const [dataPoints, setDataPoints] = useState(50);
    const [startIndex, setStartIndex] = useState(0);

    const fullData = (history || []).map((item, index) => ({
        time: formatTimestamp(item.timestamp, index, history.length),
        fullTime: formatTimestamp(item.timestamp, index, history.length),
        value: item.value
    }));

    const chartData = fullData.slice(startIndex, startIndex + dataPoints);

    if (fullData.length === 0) {
        return (
            <div className={`h-full w-full rounded-lg shadow-md border flex items-center justify-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Waiting for data…</div>
            </div>
        );
    }

    const lineType = chartType === 'step' ? 'step' : chartType === 'smooth' ? 'monotone' : 'linear';

    const handlePanLeft = () => setStartIndex(Math.max(0, startIndex - 10));
    const handlePanRight = () => setStartIndex(Math.min(fullData.length - dataPoints, startIndex + 10));
    const handleZoomIn = () => setDataPoints(Math.max(10, dataPoints - 10));
    const handleZoomOut = () => setDataPoints(Math.min(100, dataPoints + 10));

    return (
        <div className={`h-full w-full rounded-lg shadow-md border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`p-3 border-b flex justify-between items-center ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {customTitle || label} ({chartType === 'step' ? 'Step' : chartType === 'smooth' ? 'Smooth' : 'Line'})
                </div>
                <div className="flex gap-1">
                    <button onClick={handlePanLeft} disabled={startIndex === 0} className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 disabled:opacity-30' : 'bg-gray-200 hover:bg-gray-300 disabled:opacity-30'}`}>◄</button>
                    <button onClick={handlePanRight} disabled={startIndex >= fullData.length - dataPoints} className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 disabled:opacity-30' : 'bg-gray-200 hover:bg-gray-300 disabled:opacity-30'}`}>►</button>
                    <button onClick={handleZoomOut} className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>+</button>
                    <button onClick={handleZoomIn} className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>-</button>
                    <span className={`text-xs px-2 py-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{dataPoints}pts</span>
                </div>
            </div>
            <div className="p-2" style={{ height: 'calc(100% - 60px)' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} angle={-45} textAnchor="end" height={70} />
                        <YAxis tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} />
                        <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb', fontSize: 12 }} />
                        <Line type={lineType} dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                        <Brush dataKey="time" height={30} stroke="#3b82f6" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// ==================== BAR CHART ====================
export const BarChartWidget = ({ history, label, deviceId, customTitle, isDarkMode }) => {
    const chartData = (history || []).slice(-20).map((item, index) => ({
        time: formatTimestamp(item.timestamp, index, 20),
        value: item.value
    }));

    if (chartData.length === 0) {
        return (
            <div className={`h-full w-full rounded-lg shadow-md border flex items-center justify-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Waiting for data…</div>
            </div>
        );
    }

    return (
        <div className={`h-full w-full rounded-lg shadow-md border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`p-3 border-b text-sm font-semibold text-center ${isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-100 text-gray-700'}`}>
                {customTitle || label} (Bar Chart)
            </div>
            <div className="p-2" style={{ height: 'calc(100% - 60px)' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} angle={-45} textAnchor="end" height={70} />
                        <YAxis tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} />
                        <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb' }} />
                        <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// ==================== SCATTER PLOT ====================
export const ScatterPlotWidget = ({ history, label, deviceId, customTitle, isDarkMode }) => {
    const chartData = (history || []).slice(-50).map((item, index) => ({
        time: index,
        value: item.value,
        timestamp: formatTimestamp(item.timestamp, index, 50)
    }));

    if (chartData.length === 0) {
        return (
            <div className={`h-full w-full rounded-lg shadow-md border flex items-center justify-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Waiting for data…</div>
            </div>
        );
    }

    return (
        <div className={`h-full w-full rounded-lg shadow-md border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`p-3 border-b text-sm font-semibold text-center ${isDarkMode ? 'border-gray-700 text-gray-200' : 'border-gray-100 text-gray-700'}`}>
                {customTitle || label} (Scatter Plot)
            </div>
            <div className="p-2" style={{ height: 'calc(100% - 60px)' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis type="number" dataKey="time" name="Sample" tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} label={{ value: 'Sample Index', position: 'insideBottom', offset: -5 }} />
                        <YAxis type="number" dataKey="value" name="Value" tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb' }} />
                        <Scatter name={label} data={chartData} fill="#3b82f6" />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// ==================== MULTI-STREAM CHART (Up to 4 pins) ====================
export const MultiStreamChart = ({ streams = [], deviceId, customTitle, telemetryData, isDarkMode }) => {
    const [zoomLevel, setZoomLevel] = useState(50);
    const [startIndex, setStartIndex] = useState(0);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    // Get maximum history length across all streams
    const maxLength = Math.max(...streams.map(s => telemetryData[deviceId]?.[s.key]?.history?.length || 0));

    // Build combined dataset
    const fullData = [];
    for (let i = 0; i < maxLength; i++) {
        const dataPoint = {
            index: i,
            time: null
        };
        streams.forEach((stream) => {
            const history = telemetryData[deviceId]?.[stream.key]?.history || [];
            if (history[i]) {
                dataPoint[stream.key] = history[i].value;
                if (!dataPoint.time) {
                    dataPoint.time = formatTimestamp(history[i].timestamp, i, maxLength);
                }
            }
        });
        fullData.push(dataPoint);
    }

    const chartData = fullData.slice(startIndex, startIndex + zoomLevel);

    if (streams.length === 0) {
        return (
            <div className={`h-full w-full rounded-lg shadow-md border flex items-center justify-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No streams configured</div>
            </div>
        );
    }

    if (fullData.length === 0) {
        return (
            <div className={`h-full w-full rounded-lg shadow-md border flex items-center justify-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Waiting for data…</div>
            </div>
        );
    }

    const handlePanLeft = () => setStartIndex(Math.max(0, startIndex - 10));
    const handlePanRight = () => setStartIndex(Math.min(fullData.length - zoomLevel, startIndex + 10));
    const handleZoomIn = () => setZoomLevel(Math.max(10, zoomLevel - 10));
    const handleZoomOut = () => setZoomLevel(Math.min(100, zoomLevel + 10));

    return (
        <div className={`h-full w-full rounded-lg shadow-md border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`p-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex justify-between items-center mb-2">
                    <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {customTitle || 'Multi-Stream Chart'} ({streams.length} streams)
                    </div>
                    <div className="flex gap-1">
                        <button onClick={handlePanLeft} disabled={startIndex === 0} className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 disabled:opacity-30' : 'bg-gray-200 hover:bg-gray-300 disabled:opacity-30'}`}>◄</button>
                        <button onClick={handlePanRight} disabled={startIndex >= fullData.length - zoomLevel} className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 disabled:opacity-30' : 'bg-gray-200 hover:bg-gray-300 disabled:opacity-30'}`}>►</button>
                        <button onClick={handleZoomOut} className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>+</button>
                        <button onClick={handleZoomIn} className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>-</button>
                        <span className={`text-xs px-2 py-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{zoomLevel}pts</span>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {streams.slice(0, 4).map((stream, idx) => (
                        <div key={stream.key} className="flex items-center gap-1 text-xs">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx] }} />
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{stream.key}</span>
                        </div>
                    ))}
                    {streams.length > 4 && (
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>+{streams.length - 4} more</span>
                    )}
                </div>
            </div>
            <div className="p-2" style={{ height: 'calc(100% - 110px)' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} angle={-45} textAnchor="end" height={70} />
                        <YAxis tick={{ fontSize: 11, fill: isDarkMode ? '#9ca3af' : '#6b7280' }} />
                        <Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#fff', border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb' }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {streams.slice(0, 4).map((stream, idx) => (
                            <Line key={stream.key} type="monotone" dataKey={stream.key} stroke={colors[idx]} strokeWidth={2} dot={false} isAnimationActive={false} />
                        ))}
                        <Brush dataKey="time" height={20} stroke="#3b82f6" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
