# ESP32 Enhanced Simulator - Quick Guide

## Problem
You cannot see the ESP32 Enhanced Simulator in the dashboard because:
1. The enhanced simulator is not currently running
2. The `start_all.bat` only starts the MQTT simulator, not the enhanced one

## Solutions

### Solution 1: Run Enhanced Simulator Only (Quick Test)
```bash
# Run this batch file
start_enhanced_simulator.bat
```

This will start ONLY the enhanced simulator which sends HTTP telemetry for device `ESP32_DEV_BOARD`.

### Solution 2: Run Both Simulators (Recommended)
```bash
# Run this batch file instead of start_all.bat
start_all_with_enhanced.bat
```

This starts:
- MQTT Broker
- Backend
- **ESP32 MQTT Simulator** (device: ESP32_SENSOR_01)
- **ESP32 Enhanced Simulator** (device: ESP32_DEV_BOARD)
- Frontend

### Solution 3: Manual Start
If you already have other services running:

1. Open a new Command Prompt
2. Navigate to the simulator directory:
   ```
   cd "c:\Users\lovel\Desktop\aravind project\fort\simulator"
   ```
3. Run the enhanced simulator:
   ```
   python esp32_enhanced_simulator.py
   ```

## Verification

After starting the enhanced simulator, you should see:

1. **In the simulator terminal:**
   - Device ID: ESP32_DEV_BOARD
   - Backend URL: http://localhost:8000/api/telemetry
   - Active Pins: 11 pins listed
   - Telemetry being sent every 2 seconds

2. **In the dashboard:**
   - A new device appears: `ESP32_DEV_BOARD`
   - Click on it to select it
   - You'll see telemetry keys like:
     - D32 (Temperature)
     - D33 (Light Sensor)
     - D34 (Soil Moisture)
     - D35 (Battery Voltage)
     - D23 (DHT22 Temperature)
     - D22 (DHT22 Humidity)
     - wifi_rssi
     - free_heap
     - uptime
     - etc.

3. **Add widgets:**
   - Enable Edit Mode (if not already)
   - Select `ESP32_DEV_BOARD` device
   - Drag widgets from the library (Numeric Card, Gauge, Chart, etc.)
   - Choose the telemetry key you want to visualize

## Differences Between Simulators

### ESP32 MQTT Simulator (`esp32_mqtt_simulator.py`)
- **Protocol:** MQTT
- **Device ID:** ESP32_SENSOR_01
- **Data:** temperature, humidity, pressure, altitude
- **Purpose:** Test MQTT integration

### ESP32 Enhanced Simulator (`esp32_enhanced_simulator.py`)
- **Protocol:** HTTP POST
- **Device ID:** ESP32_DEV_BOARD
- **Data:** 11+ sensors including:
  - Analog sensors (D32-D35, VP)
  - Digital sensors (D23, D22)
  - PWM outputs (D25, D26)
  - Digital inputs (D4, D15)
  - I2C sensors (BMP280)
  - System metrics (WiFi, heap, uptime)
- **Purpose:** Accurate ESP32 hardware simulation

## Troubleshooting

### "No devices discovered"
- Make sure the backend is running (`http://localhost:8000`)
- Check the simulator terminal for connection errors
- Verify the simulator shows "✓ TELEMETRY SENT" messages

### "Connection failed"
- The backend might not be running
- Start the backend:
  ```
  cd backend
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
  ```

### Device appears but no data
- Refresh the dashboard page
- Check WebSocket connection status (top right corner)
- Look for errors in the browser console (F12)

## Next Steps

Once you see `ESP32_DEV_BOARD` in the dashboard:
1. Select it from the device list
2. Use the **ESP32 Pin Mapping** widget to see a visual representation
3. Use the **ESP32 Pin Reference** widget to see the pinout guide
4. Add Gauges and Charts for individual sensors
