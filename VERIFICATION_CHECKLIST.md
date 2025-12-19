# IoT Dashboard - Setup & Verification Checklist

Use this checklist to ensure everything is properly configured and working.

## 📋 Pre-Installation Checklist

### Prerequisites
- [ ] Windows 10/11 or compatible OS
- [ ] Python 3.11+ installed
- [ ] Node.js 16+ installed  
- [ ] npm installed
- [ ] Git installed (optional)
- [ ] Admin rights (for Mosquitto service)

### Tools Verification
```bash
# Check Python
python --version          # Should show 3.11 or higher

# Check Node.js
node --version           # Should show 16.0 or higher

# Check npm
npm --version            # Should show 8.0 or higher
```

---

## 🔧 Installation Checklist

### 1. MQTT Broker Setup
- [ ] Downloaded Mosquitto from https://mosquitto.org/download/
- [ ] Installed Mosquitto with "Service" option
- [ ] OR: Running Mosquitto via Docker
- [ ] Mosquitto service is running
- [ ] Port 1883 is accessible
- [ ] Firewall allows port 1883

**Verify:**
```bash
# Check service
sc query mosquitto

# Check port
netstat -an | find "1883"
```

### 2. Backend Setup
- [ ] Navigated to `backend/` directory
- [ ] Installed Python dependencies
- [ ] paho-mqtt installed successfully
- [ ] No installation errors

**Commands:**
```bash
cd backend
pip install -r requirements.txt
```

**Verify:**
```bash
pip list | grep paho-mqtt    # Should show paho-mqtt==1.6.1
```

### 3. Simulator Setup
- [ ] Navigated to `simulator/` directory
- [ ] Installed Python dependencies
- [ ] paho-mqtt installed successfully

**Commands:**
```bash
cd simulator
pip install -r requirements.txt
```

### 4. Frontend Setup
- [ ] Navigated to `frontend/` directory
- [ ] Installed npm dependencies
- [ ] No installation errors
- [ ] node_modules created

**Commands:**
```bash
cd frontend
npm install
```

**Verify:**
```bash
npm list react           # Should show react@18.x.x
```

---

## 🚀 Running Services Checklist

### Terminal 1: MQTT Broker
- [ ] Mosquitto service started
- [ ] Listening on port 1883
- [ ] No error messages

**Command:**
```bash
net start mosquitto
```

**Expected Output:**
```
The Mosquitto Broker service is starting.
The Mosquitto Broker service was started successfully.
```

### Terminal 2: Backend
- [ ] Backend started successfully
- [ ] MQTT Manager initialized
- [ ] Connected to MQTT broker
- [ ] Subscribed to topic
- [ ] WebSocket endpoint available
- [ ] No error messages

**Command:**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
[MQTT] Initializing MQTT Manager (broker: localhost:1883)
[MQTT] Background listener started
[MQTT] ✓ Connected to broker at localhost:1883
[MQTT] ✓ Subscribed to: app/device/+/telemetry
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Verify:**
- [ ] Open http://localhost:8000 in browser
- [ ] Should show: `{"status": "online", "service": "IoT Platform Backend", ...}`

### Terminal 3: ESP32 Simulator
- [ ] Simulator started
- [ ] All devices connected to MQTT broker
- [ ] Publishing telemetry
- [ ] No connection errors

**Command:**
```bash
cd simulator
python esp32_mqtt_simulator.py
```

**Expected Output:**
```
============================================================
ESP32 MQTT Simulator - Multi-Device
============================================================
[ESP32_SIM_01] ✓ Connected to MQTT broker
[ESP32_SIM_02] ✓ Connected to MQTT broker
[ESP32_SIM_03] ✓ Connected to MQTT broker
[12:21:20] ✓ ESP32_SIM_01 published: {"temperature": 25.5, ...}
```

**Verify in Backend Terminal:**
```
[MQTT] Received from ESP32_SIM_01: {"temperature": 25.5, ...}
[MQTT] Received from ESP32_SIM_02: {"temperature": 24.8, ...}
```

### Terminal 4: Frontend
- [ ] React development server started
- [ ] Compiled successfully
- [ ] Listening on port 3000
- [ ] No compilation errors

**Command:**
```bash
cd frontend
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view iot-dashboard in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

---

## 📱 PWA Verification Checklist

### Browser Testing
- [ ] Opened http://localhost:3000
- [ ] Dashboard loads correctly
- [ ] No console errors
- [ ] Service worker registered

**Check Console (F12):**
```
[PWA] Service Worker registered successfully
[SW] Installing service worker...
[SW] Activating service worker...
[SW] Caching app shell
```

### Manifest Verification
- [ ] Open DevTools (F12)
- [ ] Go to Application tab
- [ ] Click "Manifest" in left sidebar
- [ ] Verify manifest loads
- [ ] Icons show correctly
- [ ] No errors in manifest parsing

**Checklist:**
- [ ] Name: "IoT Dashboard Platform - Real-time Monitoring"
- [ ] Short name: "IoT Dashboard"
- [ ] Theme color: #1e293b
- [ ] Background color: #0f172a
- [ ] Display: standalone
- [ ] Icons: 2 icons (192x192, 512x512)

### Service Worker Verification
- [ ] Open DevTools → Application tab
- [ ] Click "Service Workers"
- [ ] See service worker registered
- [ ] Status: "activated and is running"
- [ ] No errors

**Actions:**
- [ ] Click "Update" → Service worker updates
- [ ] Check "Offline" → Reload → App still works
- [ ] Uncheck "Offline" → App reconnects

### Caching Verification
- [ ] DevTools → Application → Cache Storage
- [ ] See cache: "iot-dashboard-v1"
- [ ] Cache contains files:
  - [ ] /index.html
  - [ ] /manifest.json
  - [ ] /static/css/main.css (or similar)
  - [ ] /static/js/main.js (or similar)

### Install Prompt Verification

#### Desktop (Chrome/Edge):
- [ ] Install icon (⊕) appears in address bar
- [ ] Click install icon
- [ ] Dialog shows app info and icons
- [ ] Click "Install"
- [ ] App opens in new window
- [ ] Window has no address bar
- [ ] Window has custom icon/title

#### Mobile (Chrome):
- [ ] Open menu (⋮)
- [ ] See "Install app" or "Add to Home Screen"
- [ ] Click install option
- [ ] Banner shows app info
- [ ] Click "Install" or "Add"
- [ ] Icon appears on home screen
- [ ] Tap icon → App opens in standalone mode

---

## 🔍 Data Flow Verification

### 1. MQTT Publishing
- [ ] Simulator publishes to MQTT broker
- [ ] Backend receives MQTT messages
- [ ] Backend logs show device data

**Check Backend Logs:**
```
[MQTT] Received from ESP32_SIM_01: {"temperature": 25.5, "humidity": 60.2, ...}
```

### 2. WebSocket Broadcasting
- [ ] Backend broadcasts to WebSocket clients
- [ ] Dashboard receives WebSocket messages
- [ ] Console shows telemetry updates

**Check Browser Console:**
```
WS message: {"type": "telemetry_update", "device_id": "ESP32_SIM_01", ...}
```

### 3. UI Updates
- [ ] Dashboard shows devices
- [ ] Device count updates
- [ ] Telemetry values update in real-time
- [ ] Charts update with new data
- [ ] No lag or delay

**Visual Checks:**
- [ ] Device cards show correct IDs
- [ ] Values change every 0.5 seconds
- [ ] Value widgets update smoothly
- [ ] Line charts plot new points
- [ ] Gauge widgets animate

---

## 🧪 Testing Checklist

### Manual MQTT Test
- [ ] Open a new terminal
- [ ] Publish test message
- [ ] Backend receives message
- [ ] Dashboard shows update

**Command:**
```bash
mosquitto_pub -h localhost -p 1883 \
  -t "app/device/TEST_DEVICE/telemetry" \
  -m '{"telemetry": {"temperature": 99.9}, "timestamp": "2025-12-19T12:00:00"}'
```

**Expected:**
- [ ] Backend logs: `[MQTT] Received from TEST_DEVICE: {"temperature": 99.9}`
- [ ] Dashboard shows TEST_DEVICE
- [ ] TEST_DEVICE shows temperature: 99.9

### Offline Mode Test
- [ ] Open DevTools → Network tab
- [ ] Select "Offline" throttling
- [ ] Reload page
- [ ] App loads from cache
- [ ] Static UI works
- [ ] Message shows: "No network connection" (for API calls)

### Multi-Device Test
- [ ] Dashboard shows all 3 devices
- [ ] Each device has unique ID
- [ ] Each device updates independently
- [ ] Can distinguish between devices

### Reconnection Test
- [ ] Stop simulator (Ctrl+C)
- [ ] Wait 30 seconds
- [ ] Devices marked offline in backend
- [ ] Restart simulator
- [ ] Devices reconnect
- [ ] Updates resume

---

## ⚠️ Common Issues Checklist

### Issue: Backend can't connect to MQTT
**Checklist:**
- [ ] Mosquitto service running?
- [ ] Port 1883 listening?
- [ ] Firewall blocking port?
- [ ] Correct broker IP in config?

**Fix:**
```bash
net start mosquitto
netstat -an | find "1883"
```

### Issue: Simulator can't connect
**Checklist:**
- [ ] Backend is running?
- [ ] MQTT broker is running?
- [ ] Correct broker IP in simulator config?
- [ ] Network connectivity?

**Fix:**
- Edit `simulator/esp32_mqtt_simulator.py`
- Check `MQTT_BROKER` variable
- Try "localhost" instead of IP

### Issue: Frontend not updating
**Checklist:**
- [ ] Backend running?
- [ ] WebSocket connected?
- [ ] Check browser console for errors
- [ ] Simulator publishing data?

**Debug:**
- Open DevTools → Network tab → WS filter
- Should see WebSocket connection
- Messages flowing in real-time

### Issue: PWA won't install
**Checklist:**
- [ ] Using HTTPS or localhost?
- [ ] Service worker registered?
- [ ] Manifest.json valid?
- [ ] Icons accessible?
- [ ] Not already installed?

**Fix:**
- Check DevTools → Application → Manifest
- Look for errors
- Clear browser cache
- Try incognito mode

### Issue: Service worker fails
**Checklist:**
- [ ] service-worker.js in /public?
- [ ] HTTPS or localhost?
- [ ] No syntax errors in SW?
- [ ] Browser supports service workers?

**Fix:**
- Open DevTools → Console
- Look for SW registration errors
- Clear browser cache
- Hard reload (Ctrl+Shift+R)

---

## ✅ Final Verification

### All Systems Green:
- [ ] ✅ MQTT broker running
- [ ] ✅ Backend connected to MQTT
- [ ] ✅ Simulator publishing telemetry
- [ ] ✅ Backend receiving MQTT messages
- [ ] ✅ WebSocket broadcasting
- [ ] ✅ Frontend displaying data
- [ ] ✅ Real-time updates working
- [ ] ✅ Service worker registered
- [ ] ✅ PWA installable
- [ ] ✅ Offline mode works
- [ ] ✅ No console errors
- [ ] ✅ No backend errors

### Performance Check:
- [ ] Page loads in < 3 seconds
- [ ] Updates happen in < 1 second
- [ ] No lag in UI
- [ ] Smooth animations
- [ ] Low CPU usage

### User Experience:
- [ ] Dashboard is responsive
- [ ] Can drag/resize widgets
- [ ] Can add/remove widgets
- [ ] Charts update smoothly
- [ ] Install prompt is clear

---

## 📝 Notes

### Broker IP Configuration
```
Default: localhost
If running on different machine: Update both:
  - backend/main.py (broker_host)
  - simulator/esp32_mqtt_simulator.py (MQTT_BROKER)
```

### Port Reference
```
MQTT:     1883
Backend:  8000
Frontend: 3000
```

### Support Resources
- [ ] Read: MQTT_PWA_GUIDE.md
- [ ] Read: UPDATE_SUMMARY.md
- [ ] Read: ARCHITECTURE.md
- [ ] Check: Backend logs
- [ ] Check: Browser console

---

## 🎉 Success Criteria

✅ **You're ready to go if:**
1. All 4 terminals are running without errors
2. Dashboard shows 3 devices with live telemetry
3. Service worker is registered
4. PWA can be installed
5. Offline mode works

🎊 **Congratulations! Your IoT Dashboard with MQTT & PWA is fully operational!**

---

**Date Completed:** _______________  
**Verified By:** _______________  
**Notes:** _______________
