// ESP32 Pin Mapping Widget Component
import React from 'react';

// ESP32 Pin Configuration Database
const ESP32_PIN_MAP = {
    // Analog Capable Pins (ADC1)
    'VP': { gpio: 36, adc: 'ADC1_CH0', type: 'Input Only', note: 'Sensor VP' },
    'VN': { gpio: 39, adc: 'ADC1_CH3', type: 'Input Only', note: 'Sensor VN' },
    'D34': { gpio: 34, adc: 'ADC1_CH6', type: 'Input Only' },
    'D35': { gpio: 35, adc: 'ADC1_CH7', type: 'Input Only' },
    'D32': { gpio: 32, adc: 'ADC1_CH4', type: 'ADC/DAC/Touch' },
    'D33': { gpio: 33, adc: 'ADC1_CH5', type: 'ADC/DAC/Touch' },
    'D25': { gpio: 25, adc: 'ADC2_CH8', type: 'ADC/DAC' },
    'D26': { gpio: 26, adc: 'ADC2_CH9', type: 'ADC/DAC' },
    'D27': { gpio: 27, adc: 'ADC2_CH7', type: 'Touch' },
    'D14': { gpio: 14, adc: 'ADC2_CH6', type: 'Touch' },
    'D12': { gpio: 12, adc: 'ADC2_CH5', type: 'Touch', note: 'Boot Fail if Pulled High' },
    'D13': { gpio: 13, adc: 'ADC2_CH4', type: 'Touch' },

    // Digital Only Pins
    'D23': { gpio: 23, type: 'SPI/Digital', note: 'VSPI MOSI' },
    'D22': { gpio: 22, type: 'I2C/Digital', note: 'SCL' },
    'D21': { gpio: 21, type: 'I2C/Digital', note: 'SDA' },
    'D19': { gpio: 19, type: 'SPI/Digital', note: 'VSPI MISO' },
    'D18': { gpio: 18, type: 'SPI/Digital', note: 'VSPI SCK' },
    'D5': { gpio: 5, type: 'SPI/Digital', note: 'VSPI SS' },
    'D17': { gpio: 17, type: 'UART2/Digital', note: 'UART2 TX' },
    'D16': { gpio: 16, type: 'UART2/Digital', note: 'UART2 RX' },
    'D4': { gpio: 4, adc: 'ADC2_CH0', type: 'Touch' },
    'D0': { gpio: 0, adc: 'ADC2_CH1', type: 'Touch', note: 'Boot Button' },
    'D2': { gpio: 2, adc: 'ADC2_CH2', type: 'Touch', note: 'On-board LED' },
    'D15': { gpio: 15, adc: 'ADC2_CH3', type: 'Touch' },

    // Special Pins
    'TX': { gpio: 1, type: 'UART0', note: 'Serial TX - Avoid if using Serial' },
    'RX': { gpio: 3, type: 'UART0', note: 'Serial RX - Avoid if using Serial' },
};

export const PinMappingWidget = ({ deviceId, telemetryData, customTitle, isDarkMode }) => {
    // Get all telemetry keys for the device
    const deviceData = telemetryData[deviceId] || {};
    const telemetryKeys = Object.keys(deviceData);

    // Try to map telemetry keys to pins
    const mappedPins = {};
    telemetryKeys.forEach(key => {
        // Look for pin references in key names
        const upperKey = key.toUpperCase();
        Object.keys(ESP32_PIN_MAP).forEach(pinName => {
            if (upperKey.includes(pinName) || upperKey.includes(`GPIO${ESP32_PIN_MAP[pinName].gpio}`)) {
                mappedPins[pinName] = {
                    ...ESP32_PIN_MAP[pinName],
                    telemetryKey: key,
                    value: deviceData[key]?.value,
                    active: true
                };
            }
        });
    });

    // Get pin categories
    const inputOnlyPins = Object.entries(ESP32_PIN_MAP).filter(([_, pin]) => pin.type === 'Input Only');
    const adcPins = Object.entries(ESP32_PIN_MAP).filter(([_, pin]) => pin.adc && pin.type !== 'Input Only');
    const digitalPins = Object.entries(ESP32_PIN_MAP).filter(([_, pin]) => !pin.adc || pin.type.includes('Digital'));

    const PinRow = ({ pinName, pinInfo, mapped }) => {
        const isActive = mapped && mapped.active;

        return (
            <div className={`flex items-center gap-2 p-2 rounded text-xs ${isActive ? (isDarkMode ? 'bg-blue-900/30 border border-blue-500' : 'bg-blue-50 border border-blue-300') : (isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50')}`}>
                <div className={`font-mono font-bold min-w-[50px] ${isActive ? 'text-blue-500' : (isDarkMode ? 'text-gray-300' : 'text-gray-700')}`}>
                    {pinName}
                </div>
                <div className={`font-mono text-xs min-w-[45px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    GPIO{pinInfo.gpio}
                </div>
                <div className={`flex-1 truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {pinInfo.adc && <span className={`mr-2 px-1 rounded ${isDarkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'}`}>{pinInfo.adc}</span>}
                    {pinInfo.type}
                </div>
                {isActive && (
                    <div className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {mapped.value !== null && mapped.value !== undefined ? mapped.value.toFixed(2) : '--'}
                    </div>
                )}
                {pinInfo.note && (
                    <div className={`text-xs italic ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {pinInfo.note}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`h-full w-full rounded-lg shadow-md border overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`p-3 border-b text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className={`text-sm font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {customTitle || 'ESP32 Pin Mapping'}
                </div>
                <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {deviceId} • {Object.keys(mappedPins).length} active pins
                </div>
            </div>

            <div className="p-3 overflow-auto" style={{ height: 'calc(100% - 70px)' }}>
                {/* Active Pins Section */}
                {Object.keys(mappedPins).length > 0 && (
                    <div className="mb-4">
                        <div className={`text-xs font-semibold uppercase mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            🔵 Active Pins ({Object.keys(mappedPins).length})
                        </div>
                        <div className="space-y-1">
                            {Object.entries(mappedPins).map(([pinName, pinData]) => (
                                <PinRow key={pinName} pinName={pinName} pinInfo={pinData} mapped={pinData} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Input Only Pins */}
                <div className="mb-4">
                    <div className={`text-xs font-semibold uppercase mb-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        ⚠️ Input Only Pins (No Pull-up/down)
                    </div>
                    <div className="space-y-1">
                        {inputOnlyPins.map(([pinName, pinInfo]) => (
                            <PinRow key={pinName} pinName={pinName} pinInfo={pinInfo} mapped={mappedPins[pinName]} />
                        ))}
                    </div>
                </div>

                {/* ADC Pins */}
                <div className="mb-4">
                    <div className={`text-xs font-semibold uppercase mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                        📊 ADC/Analog Pins
                    </div>
                    <div className="space-y-1">
                        {adcPins.map(([pinName, pinInfo]) => (
                            <PinRow key={pinName} pinName={pinName} pinInfo={pinInfo} mapped={mappedPins[pinName]} />
                        ))}
                    </div>
                </div>

                {/* Digital Pins */}
                <div className="mb-4">
                    <div className={`text-xs font-semibold uppercase mb-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                        ⚡ Digital/Communication Pins
                    </div>
                    <div className="space-y-1">
                        {digitalPins.map(([pinName, pinInfo]) => (
                            <PinRow key={pinName} pinName={pinName} pinInfo={pinInfo} mapped={mappedPins[pinName]} />
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className={`mt-4 p-2 rounded text-xs ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                    <div className={`font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Legend:</div>
                    <div className={`space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div>• <span className="text-blue-500">Blue highlight</span> = Pin currently in use</div>
                        <div>• ADC pins can read analog (0-4095 for 12-bit)</div>
                        <div>• Input Only pins have no internal pull resistors</div>
                        <div>• Touch pins support capacitive touch sensing</div>
                        <div>• Avoid using Serial pins (TX/RX) if debugging</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Compact Pin Reference Widget  
export const PinReferenceWidget = ({ isDarkMode }) => {
    return (
        <div className={`h-full w-full rounded-lg shadow-md border overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className={`p-3 border-b text-center ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
                <div className={`text-sm font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    ESP32 Quick Reference
                </div>
            </div>

            <div className="p-3 overflow-auto space-y-3" style={{ height: 'calc(100% - 60px)' }}>
                {/* GPIO Diagram */}
                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                    <div className={`text-xs font-bold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Safe GPIO Pins</div>
                    <div className={`font-mono text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        GPIO: 4, 5, 12-19, 21-23, 25-27, 32-33
                    </div>
                </div>

                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700/50' : 'bg-yellow-50'}`}>
                    <div className={`text-xs font-bold mb-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>⚠️ Input Only</div>
                    <div className={`font-mono text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        GPIO: 34, 35, 36 (VP), 39 (VN)
                    </div>
                </div>

                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700/50' : 'bg-green-50'}`}>
                    <div className={`text-xs font-bold mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>📊 ADC Pins</div>
                    <div className={`font-mono text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        ADC1: 32-39 (WiFi safe)<br />
                        ADC2: 0, 2, 4, 12-15, 25-27
                    </div>
                    <div className={`text-xs italic mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                        Note: ADC2 unavailable when WiFi is on
                    </div>
                </div>

                <div className={`p-3 rounded ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
                    <div className={`text-xs font-bold mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>🚫 Avoid These</div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        • GPIO 0: Boot button<br />
                        • GPIO 1, 3: Serial TX/RX<br />
                        • GPIO 6-11: Flash memory<br />
                        • GPIO 12: Boot fail if HIGH
                    </div>
                </div>

                <div className={`p-3 rounded ${isDarkMode ? 'bg-gray-700/50' : 'bg-purple-50'}`}>
                    <div className={`text-xs font-bold mb-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>⚡ Touch Pins</div>
                    <div className={`font-mono text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        T0-T9: GPIO 4, 0, 2, 15, 13, 12, 14, 27, 33, 32
                    </div>
                </div>
            </div>
        </div>
    );
};
