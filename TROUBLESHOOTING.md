# 🔍 TROUBLESHOOTING: Only One Device Showing

## Current Situation
- ✅ ESP32_DEV_BOARD is visible (16 telemetry keys)
- ❌ ESP32_SENSOR_01/02/03 are NOT visible

This means:
- ✅ Backend is running
- ✅ Enhanced simulator (HTTP) is working
- ❌ MQTT connection is broken

---

## 🚨 STEP-BY-STEP FIX

### Step 1: Stop ALL Services
**Close all command windows** from previous runs:
- MQTT Broker
- IoT Backend  
- ESP32 MQTT Simulator
- ESP32 Enhanced Simulator
- IoT Dashboard Frontend

### Step 2: Test MQTT Connection

**Run this diagnostic:**
```bash
test_mqtt.bat
```

**What you should see:**
```
✅ SUCCESS: Connected to MQTT broker!
✅ Publish successful!
```

**If you see errors:**
- "Connection refused" → MQTT Broker is not running
- "Connection failed" → Port 1883 is blocked or broker crashed

### Step 3: Start Services in CORRECT Order

**DO NOT use start_all.bat yet!** 

Start manually in this exact order:

#### 3a. Start MQTT Broker FIRST
```bash
python mqtt_broker.py
```

**Wait for:**
```
[MQTT Broker] Started on 0.0.0.0:1883
[MQTT Broker] Ready to accept connections...
```

#### 3b. Start Backend SECOND
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Wait for:**
```
INFO:     Started server process [...]
[MQTT] ✓ Connected to broker at localhost:1883
[MQTT] ✓ Subscribed to: app/device/+/telemetry
```

**🚨 CRITICAL:** If you don't see the MQTT connection messages, the backend cannot receive MQTT data!

#### 3c. Start MQTT Simulator THIRD
```bash
cd simulator
python esp32_mqtt_simulator.py
```

**Wait for:**
```
[ESP32_SENSOR_01] ✓ Connected to MQTT broker
[ESP32_SENSOR_02] ✓ Connected to MQTT broker
[ESP32_SENSOR_03] ✓ Connected to MQTT broker
```

**Look at the Backend window now:**
You should see:
```
[MQTT] Received from ESP32_SENSOR_01: {"temperature": 27.5, ...}
[MQTT] Received from ESP32_SENSOR_02: {"temperature": 28.1, ...}
[MQTT] Received from ESP32_SENSOR_03: {"temperature": 26.8, ...}
```

#### 3d. Start Enhanced Simulator FOURTH
```bash
cd simulator
python esp32_enhanced_simulator.py
```

**Look for:**
```
✓ TELEMETRY SENT
```

#### 3e. Start Frontend LAST
```bash
cd frontend
npm start
```

### Step 4: Verify Dashboard

Open http://localhost:3000

**You should see 4 devices:**
- ESP32_SENSOR_01
- ESP32_SENSOR_02  
- ESP32_SENSOR_03
- ESP32_DEV_BOARD

---

## 🔧 Common Issues

### Issue 1: Backend shows NO MQTT connection messages

**Symptoms:**
```
INFO:     Started server process [...]
[No MQTT messages appear]
```

**Solution:**
1. Make sure MQTT Broker started BEFORE backend
2. Restart backend
3. Check backend/main.py line 301: should say `broker_host="localhost"`

### Issue 2: MQTT Simulator shows "Not connected to broker"

**Symptoms:**
```
[ESP32_SENSOR_01] Not connected to broker
[ESP32_SENSOR_01] Connection timeout
```

**Solution:**
1. Verify MQTT Broker is running
2. Run `test_mqtt.bat` to diagnose
3. Check Windows Firewall isn't blocking port 1883
4. Restart MQTT Broker

### Issue 3: MQTT Simulator connects but backend doesn't receive

**Symptoms:**
- MQTT Simulator: "✓ Connected"
- Backend: No "[MQTT] Received..." messages

**Solution:**
1. Check backend shows `[MQTT] ✓ Subscribed to: app/device/+/telemetry`
2. Restart backend
3. Check MQTT Broker window for "PUBLISH" messages

### Issue 4: Backend receives MQTT but devices don't appear in dashboard

**Symptoms:**
- Backend: "[MQTT] Received from ESP32_SENSOR_01..."
- Dashboard: Only shows ESP32_DEV_BOARD

**Solution:**
1. **Refresh the dashboard page** (Ctrl+F5)
2. **Check browser console** (F12) for WebSocket errors
3. Restart frontend

---

## 📋 Quick Checklist

Check each window for these EXACT messages:

### ✅ MQTT Broker Window
```
[MQTT Broker] Started on 0.0.0.0:1883
[MQTT Broker] Ready to accept connections...
[MQTT Broker] New connection from ('127.0.0.1', ...)
[MQTT Broker] Client ... connected
[MQTT Broker] Client ... subscribed to: app/device/+/telemetry
[MQTT Broker] PUBLISH from ...
              Topic: app/device/ESP32_SENSOR_01/telemetry
```

### ✅ Backend Window
```
INFO:     Started server process
[MQTT] Initializing MQTT Manager (broker: localhost:1883)
[MQTT] Background listener started
[MQTT] ✓ Connected to broker at localhost:1883
[MQTT] ✓ Subscribed to: app/device/+/telemetry
[MQTT] Received from ESP32_SENSOR_01: {...}
[MQTT] Received from ESP32_SENSOR_02: {...}
[MQTT] Received from ESP32_SENSOR_03: {...}
```

### ✅ MQTT Simulator Window
```
ESP32 MQTT Simulator - Multi-Device
MQTT Broker: localhost:1883
Devices: 3
[ESP32_SENSOR_01] ✓ Connected to MQTT broker
[ESP32_SENSOR_02] ✓ Connected to MQTT broker
[ESP32_SENSOR_03] ✓ Connected to MQTT broker
[HH:MM:SS] ✓ ESP32_SENSOR_01 published: {...}
```

### ✅ Enhanced Simulator Window
```
🔵 ESP32 SIMULATOR INITIALIZED
Device ID:     ESP32_DEV_BOARD
[HH:MM:SS] ✓ TELEMETRY SENT
```

### ✅ Dashboard
- Left sidebar shows 4 devices
- All have green dots (online)
- Clicking each shows different telemetry keys

---

## 🆘 Still Not Working?

If you've followed all steps and it's still not working:

1. **Take screenshots of:**
   - MQTT Broker window
   - Backend window  
   - MQTT Simulator window
   - Dashboard device list

2. **Check for error messages** in any window

3. **Share the output** so I can help diagnose

Remember: The key is the **order of startup**:
1. MQTT Broker FIRST
2. Backend SECOND (must see MQTT connection)
3. Simulators THIRD
4. Frontend LAST
