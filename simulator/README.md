# 🔵 ESP32 Simulator - Complete Guide

## Overview

Simulate a real ESP32 microcontroller with accurate GPIO pins, sensors, and telemetry - **no hardware needed**!

Perfect for:
- Testing your dashboard without ESP32 hardware
- Developing IoT applications
- Demonstrating sensor data visualization
- Training and presentations

---

## 🚀 Quick Start

### 1. Install Dependencies

```powershell
cd simulator
pip install -r requirements.txt
```

### 2. Start the Backend

In a separate terminal:
```powershell
cd backend
python main.py
```

Wait for: `INFO: Uvicorn running on http://localhost:8000`

### 3. Run the Simulator

```powershell
cd simulator
python esp32_enhanced_simulator.py
```

You should see:
```
🔵 ESP32 SIMULATOR INITIALIZED
=====================================================
Device ID:     ESP32_DEV_BOARD
Backend URL:   http://localhost:8000/api/telemetry
Active Pins:   12
I2C Sensors:   2
Send Interval: 2s
```

### 4. View in Dashboard

1. Open dashboard: http://localhost:3001
2. Look for **"ESP32_DEV_BOARD"** in device list
3. Drag widgets and bind to sensor readings!

---

## 📊 Simulated Hardware

### ESP32 GPIO Pins (Realistic Mapping)

| Pin | GPIO | Sensor | Type | Range | Unit |
|-----|------|--------|------|-------|------|
| **D32** | GPIO32 | LM35 Temperature | Analog (ADC1_CH4) | 18-38 | °C |
| **D33** | GPIO33 | LDR Light Sensor | Analog (ADC1_CH5) | 0-1023 | lux |
| **D34** | GPIO34 | Soil Moisture | Analog (ADC1_CH6) | 0-100 | % |
| **D35** | GPIO35 | Battery Voltage | Analog (ADC1_CH7) | 3.0-4.2 | V |
| **VP** | GPIO36 | Sound Level | Analog (ADC1_CH0) | 0-100 | dB |
| **D23** | GPIO23 | DHT22 Temperature | Digital Sensor | 20-30 | °C |
| **D22** | GPIO22 | DHT22 Humidity | Digital Sensor | 40-80 | % |
| **D25** | GPIO25 | Motor Speed | PWM Output | 0-255 | PWM |
| **D26** | GPIO26 | LED Brightness | PWM Output | 0-100 | % |
| **D4** | GPIO4 | Button State | Digital Input | 0-1 | bool |
| **D15** | GPIO15 | Motion Detected | Digital Input | 0-1 | bool |

### I2C Sensors (on GPIO21/22)

| Sensor | Metric | Range | Unit |
|--------|--------|-------|------|
| BMP280 | Pressure | 950-1050 | hPa |
| BMP280 | Altitude | 0-500 | m |

### System Metrics

| Metric | Range | Unit |
|--------|-------|------|
| WiFi RSSI | -90 to -30 | dBm |
| Free Heap | 100000-250000 | bytes |
| Uptime | 0-∞ | seconds |

---

## 🎯 Usage Examples

### Example 1: Temperature Monitoring

1. **Drag Gauge Widget** to dashboard
2. **Select** "ESP32_DEV_BOARD"
3. **Bind to** "D32" (temperature sensor)
4. Watch temperature values update every 2 seconds!

### Example 2: Multi-Sensor Dashboard

Create widgets for:
- **D32** - Circular gauge (temperature)
- **D33** - Line chart (light over time)
- **D35** - Progress bar (battery %)
- **D22** - Numeric card (humidity)
- **wifi_rssi** - Status indicator

### Example 3: Multi-Stream Chart

1. Drag **Multi-Stream Chart**
2. Select **4 telemetry keys**:
   - D32 (Temperature)
   - D22 (Humidity)
   - D33 (Light)
   - D35 (Battery)
3. See all 4 sensors on one chart!

### Example 4: ESP32 Pin Mapping

1. Drag **ESP32 Pin Mapping** widget
2. See all active GPIO pins highlighted in blue
3. Real-time values for each pin
4. Perfect for verifying pin assignments!

---

## ⚙️ Configuration

### Change Device ID

Edit `esp32_enhanced_simulator.py`:
```python
DEVICE_ID = "ESP32_LAB_01"  # Your custom name
```

### Adjust Send Interval

```python
SEND_INTERVAL = 5  # Send every 5 seconds instead of 2
```

### Customize Sensors

Add/remove sensors in `ESP32_PINS`:
```python
"D27": {  # GPIO27 - Custom Sensor
    "type": "analog",
    "sensor": "Pressure Sensor",
    "min": 0,
    "max": 1000,
    "unit": "kPa",
    "pin": 27,
    "adc": "ADC2_CH7"
}
```

### Run Multiple Devices

Run multiple simulators with different device IDs:

**Terminal 1:**
```python
# Edit line 17 in esp32_enhanced_simulator.py
DEVICE_ID = "ESP32_ROOM_1"
python esp32_enhanced_simulator.py
```

**Terminal 2:**
```python
# Edit again
DEVICE_ID = "ESP32_ROOM_2"
python esp32_enhanced_simulator.py
```

Now you have 2 virtual ESP32s!

---

## 📡 Data Flow

```
ESP32 Simulator            Backend API              Dashboard
─────────────────         ────────────────         ──────────
                                                    
1. Generate sensor    →   2. Store in memory   →   3. Display in widgets
   data every 2s                                    
                                                    
2. POST to                3. Broadcast via         4. Real-time updates
   /api/telemetry            WebSocket
                                                    
   {                         WebSocket             Widgets show:
     "device_id":            Stream                - Temperature: 25.3°C
     "telemetry": {                                - Humidity: 65%
       "D32": 25.3,                                - Battery: 3.8V
       "D22": 65,                                  - Light: 450 lux
       ...                                         - Uptime: 120s
     }
   }
```

---

## 🔍 Troubleshooting

### Problem: "Connection failed"

**Solution:**
1. Make sure backend is running: `cd backend && python main.py`
2. Check backend is on http://localhost:8000
3. Verify no firewall blocking

### Problem: "Device not showing in dashboard"

**Solution:**
1. Refresh dashboard (Ctrl+R)
2. Check backend console for "POST /api/telemetry"
3. Verify device ID matches

### Problem: "Values not changing"

**Solution:**
- This is normal! Values change gradually (realistic drift)
- Wait 10-20 seconds to see variation
- Check console output for telemetry values

### Problem: "Too many connection failures"

**Solution:**
- Backend may be down - restart it
- Simulator will auto-retry after 10s
- Check backend logs for errors

---

## 🎨 Sensor Behaviors

### Analog Sensors (D32, D33, D34, D35, VP)
- **Smooth drift** with small noise
- **Periodic variation** (simulates environmental changes)
- Values change gradually (realistic)

### Digital Inputs (D4, D15)
- **Binary states** (0 or 1)
- 10% chance to toggle each update
- Simulates button presses/motion

### PWM Outputs (D25, D26)
- Gradual changes up/down
- Simulates motor speed/LED brightness control

### I2C Sensors (BMP280)
- Pressure: Varies with "altitude"
- Altitude: Inverse correlation with pressure

---

## 📊 Output Example

```
[23:45:12] ✓ TELEMETRY SENT
  📡 WiFi RSSI: -45 dBm
  🌡️  Temp (D32): 24.3°C
  💧 Humidity (D22): 62.5%
  💡 Light (D33): 487 lux
  🔋 Battery (D35): 3.85V
  ⏱️  Uptime: 145s
```

---

## 🚀 Advanced Features

### Realistic ESP32 Pins
- Uses actual ESP32 GPIO numbers
- Matches ADC channel assignments
- Input-only pins (34, 35, 36, 39)
- ADC1 (WiFi safe) vs ADC2

### Smart Value Generation
- Smooth transitions (no jumps)
- Periodic variation (day/night cycles)
- Sensor-specific behaviors
- Bounds checking

### Connection Management
- Auto-reconnect on failure
- Backoff strategy (waits after failures)
- Graceful shutdown (Ctrl+C)

---

## 🎯 Best Practices

1. **Start backend first** - Always start backend before simulator
2. **One device per terminal** - Run each simulator in separate terminal
3. **Realistic intervals** - Keep 2-5 seconds for realistic simulation
4. **Monitor console** - Check for connection issues
5. **Use Pin Mapping widget** - Verify which pins are active

---

## 📝 Comparison: Original vs Enhanced

| Feature | Original | Enhanced |
|---------|----------|----------|
| GPIO pins | Generic keys | **Real ESP32 pins** |
| Pin details | None | **GPIO numbers, ADC channels** |
| Sensor types | Generic | **Specific (DHT22, BMP280, etc.)** |
| Behaviors | Random | **Realistic drift + noise** |
| Pin states | N/A | **Digital/Analog/PWM** |
| System metrics | Basic | **WiFi RSSI, Heap, Uptime** |
| Output format | Simple | **Detailed, color-coded** |

---

## 🎉 You're Ready!

Your ESP32 simulator is now **production-ready**!

**Test it:**
```powershell
# Terminal 1: Backend
cd backend
python main.py

# Terminal 2: Simulator  
cd simulator
python esp32_enhanced_simulator.py

# Browser: Dashboard
http://localhost:3001
```

**Create amazing dashboards** with realistic ESP32 sensor data! 🚀
