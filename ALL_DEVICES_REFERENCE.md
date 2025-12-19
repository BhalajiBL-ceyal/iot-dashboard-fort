# Quick Reference: All ESP32 Devices

## 🎯 What You'll See After Running start_all.bat

```
IoT Dashboard
├── ESP32_SENSOR_01 (MQTT)    ← 5 sensors
├── ESP32_SENSOR_02 (MQTT)    ← 5 sensors  
├── ESP32_SENSOR_03 (MQTT)    ← 5 sensors
└── ESP32_DEV_BOARD (HTTP)    ← 15+ sensors
```

## 📊 Device Details

### MQTT Devices (ESP32_SENSOR_01/02/03)
**Protocol:** MQTT → Broker → Backend → WebSocket → Dashboard
**Telemetry Keys:**
- `temperature` (20-35°C)
- `humidity` (40-80%)
- `battery` (3.0-4.2V)
- `distance` (10-200cm)
- `light` (0-1000 lux)

**Source File:** `simulator/esp32_mqtt_simulator.py`
**Topic:** `app/device/{device_id}/telemetry`

### HTTP Device (ESP32_DEV_BOARD)
**Protocol:** HTTP POST → Backend → WebSocket → Dashboard
**Telemetry Keys:**
- `D32` - Temperature Sensor
- `D33` - Light Sensor (LDR)
- `D34` - Soil Moisture
- `D35` - Battery Voltage
- `VP` - Sound Level
- `D23` - DHT22 Temperature
- `D22` - DHT22 Humidity
- `D25` - Motor Speed (PWM)
- `D26` - LED Brightness (PWM)
- `D4` - Button State
- `D15` - Motion Sensor
- `BMP280_pressure`
- `BMP280_altitude`
- `wifi_rssi`
- `free_heap`
- `uptime`

**Source File:** `simulator/esp32_enhanced_simulator.py`
**Endpoint:** `POST http://localhost:8000/api/telemetry`

## 🚀 Quick Start

1. **Close any running services**
2. **Run:** `start_all.bat`
3. **Wait 15 seconds** for all services to initialize
4. **Open:** http://localhost:3000
5. **Verify:** All 4 devices appear in the left sidebar

## ✅ Success Checklist

- [ ] MQTT Broker window shows "Started on 0.0.0.0:1883"
- [ ] Backend window shows "✓ Connected to broker"
- [ ] MQTT Simulator shows 3 devices connected
- [ ] Enhanced Simulator shows telemetry being sent
- [ ] Dashboard shows 4 devices in sidebar
- [ ] All devices show green dot (online status)

## 🔧 Configuration Files

- **MQTT Broker:** `mqtt_broker.py` (port 1883)
- **Backend:** `backend/main.py` (port 8000)
- **MQTT Sim:** `simulator/esp32_mqtt_simulator.py`
- **Enhanced Sim:** `simulator/esp32_enhanced_simulator.py`
- **Frontend:** `frontend/` (port 3000)

## 📝 Key Changes Made

✅ Fixed MQTT simulator to connect to `localhost` instead of local IP
✅ Renamed devices to ESP32_SENSOR_01/02/03 for consistency
✅ Updated start_all.bat to run both simulators
✅ Reduced send interval from 0.5s to 2s for cleaner logs
