import React from 'react';
import { Activity, AlertTriangle, Pause, HelpCircle } from 'lucide-react';

const MachineStateIndicator = ({ state, confidence, reasons, isDarkMode }) => {
    const getStateConfig = (state) => {
        switch (state) {
            case 'RUNNING':
                return {
                    color: 'green',
                    bgColor: isDarkMode ? 'bg-green-900/30' : 'bg-green-100',
                    borderColor: 'border-green-500',
                    textColor: 'text-green-600',
                    darkTextColor: 'text-green-400',
                    icon: Activity,
                    label: 'Running',
                    pulse: true
                };
            case 'IDLE':
                return {
                    color: 'yellow',
                    bgColor: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100',
                    borderColor: 'border-yellow-500',
                    textColor: 'text-yellow-600',
                    darkTextColor: 'text-yellow-400',
                    icon: Pause,
                    label: 'Idle',
                    pulse: false
                };
            case 'FAULT':
                return {
                    color: 'red',
                    bgColor: isDarkMode ? 'bg-red-900/30' : 'bg-red-100',
                    borderColor: 'border-red-500',
                    textColor: 'text-red-600',
                    darkTextColor: 'text-red-400',
                    icon: AlertTriangle,
                    label: 'Fault',
                    pulse: true
                };
            default:
                return {
                    color: 'gray',
                    bgColor: isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100',
                    borderColor: 'border-gray-400',
                    textColor: 'text-gray-500',
                    darkTextColor: 'text-gray-400',
                    icon: HelpCircle,
                    label: 'Unknown',
                    pulse: false
                };
        }
    };

    const config = getStateConfig(state);
    const Icon = config.icon;

    return (
        <div className={`h-full ${config.bgColor} border-2 ${config.borderColor} rounded-lg p-4 flex flex-col justify-center ${config.pulse ? 'animate-pulse' : ''}`}>
            <div className="flex items-center gap-3 mb-3">
                <Icon className={isDarkMode ? config.darkTextColor : config.textColor} size={32} />
                <div className="flex-1">
                    <div className={`text-2xl font-bold ${isDarkMode ? config.darkTextColor : config.textColor}`}>
                        {config.label}
                    </div>
                    {confidence !== undefined && (
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Confidence: {confidence}%
                        </div>
                    )}
                </div>
            </div>

            {reasons && reasons.length > 0 && (
                <div className={`mt-2 p-3 rounded ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/50'}`}>
                    <div className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Analysis:
                    </div>
                    <ul className={`text-xs space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {reasons.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>•</span>
                                <span>{reason}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MachineStateIndicator;
