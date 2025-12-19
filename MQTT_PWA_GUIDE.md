# IoT Dashboard - MQTT & PWA Update

This document covers the major updates: MQTT integration and PWA conversion.

## 🚀 What's New

### 1. MQTT Protocol Integration
- **Backend**: FastAPI now includes an MQTT broker listener
- **ESP32 Simulator**: New MQTT-based simulator for realistic device emulation
- **Topic Structure**: `app/device/{device_id}/telemetry`
- **Port**: 1883 (standard MQTT)

### 2. Progressive Web App (PWA)
- **Installable**: Add to Home Screen on mobile and desktop
- **Offline Support**: Service worker with caching strategy
- **App-like Experience**: Standalone display mode
- **Update Notifications**: Automatic version checking

---

## 📋 Prerequisites

### For MQTT Functionality

You need an MQTT broker running. We recommend **Mosquitto**:

#### Windows Installation:
```bash
# Download and install from: https://mosquitto.org/download/
# Or use Chocolatey:
choco install mosquitto

# Start the broker:
net start mosquitto
```

#### Alternative: Use Docker
```bash
docker run -d -p 1883:1883 --name mosquitto eclipse-mosquitto
```

---

## 🔧 Setup Instructions

### Backend Setup

1. **Install Dependencies**
```bash
cd backend
pip install -r requirements.txt
```

2. **Start Backend** (will auto-start MQTT listener)
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
[MQTT] Initializing MQTT Manager (broker: localhost:1883)
[MQTT] Background listener started
[MQTT] ✓ Connected to broker at localhost:1883
[MQTT] ✓ Subscribed to: app/device/+/telemetry
```

### ESP32 MQTT Simulator Setup

1. **Install Dependencies**
```bash
cd simulator
pip install -r requirements.txt
```

2. **Configure Your IP** (optional)

The simulator auto-detects your laptop's local IP. If you need to override:

Edit `esp32_mqtt_simulator.py`:
```python
MQTT_BROKER = "192.168.1.100"  # Your laptop's IP
```

3. **Run Simulator**
```bash
python esp32_mqtt_simulator.py
```

**Expected Output:**
```
============================================================
ESP32 MQTT Simulator - Multi-Device
============================================================
MQTT Broker: 192.168.x.x:1883
Devices: 3
Send Interval: 0.5s
============================================================

[ESP32_SIM_01] ✓ Connected to MQTT broker
[ESP32_SIM_02] ✓ Connected to MQTT broker
[ESP32_SIM_03] ✓ Connected to MQTT broker
```

### Frontend PWA Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Run Development Server**
```bash
npm start
```

3. **Access Dashboard**
```
http://localhost:3000
```

---

## 📱 PWA Features

### Install the App

#### Desktop (Chrome/Edge):
1. Click the **install icon** (⊕) in the address bar
2. Click "Install"
3. App opens in standalone window

#### Mobile (Chrome/Safari):
1. Open menu (⋮ or Share button)
2. Select "Add to Home Screen"
3. Confirm installation

### Offline Support

The PWA works offline by caching:
- Application shell (HTML, CSS, JS)
- Static assets
- Previous data (API responses cached)

**Network Strategy:**
- Static files: Cache-first
- API calls: Network-first (with offline fallback)
- WebSocket: Always live (requires connection)

### Update Mechanism

When a new version is deployed:
1. Service worker detects update
2. Prompt shows: "New version available! Reload to update?"
3. User clicks OK → App reloads with new version

---

## 🔌 MQTT Architecture

### Data Flow

```
ESP32 Device (MQTT Client)
    ↓
    | Publish to: app/device/ESP32_SIM_01/telemetry
    | Payload: {"telemetry": {...}, "timestamp": "..."}
    ↓
MQTT Broker (Mosquitto @ localhost:1883)
    ↓
Backend (MQTT Subscriber)
    ↓
    | 1. Parse topic → extract device_id
    | 2. Register/update device
    | 3. Store telemetry
    ↓
WebSocket Pipeline
    ↓
Dashboard (Real-time Updates)
```

### Topic Structure

- **Pattern**: `app/device/+/telemetry`
- **Wildcard**: `+` matches any device ID
- **Example Topics**:
  - `app/device/ESP32_SIM_01/telemetry`
  - `app/device/ESP32_SIM_02/telemetry`
  - `app/device/SENSOR_NODE_A/telemetry`

### Message Format

```json
{
  "telemetry": {
    "temperature": 25.5,
    "humidity": 60.2,
    "battery": 3.8,
    "distance": 120,
    "light": 450
  },
  "timestamp": "2025-12-19T12:21:20.123456"
}
```

---

## 🧪 Testing

### Test MQTT Connection

Use `mosquitto_pub` to manually publish test data:

```bash
# Publish sample telemetry
mosquitto_pub -h localhost -p 1883 \
  -t "app/device/TEST_DEVICE/telemetry" \
  -m '{"telemetry": {"temperature": 23.5}, "timestamp": "2025-12-19T12:00:00"}'
```

**Backend should log:**
```
[MQTT] Received from TEST_DEVICE: {"temperature": 23.5}
```

### Test PWA Installation

1. Open DevTools → Application tab
2. Check "Manifest" section
3. Verify icons, theme color, display mode
4. Click "Update on reload" under Service Workers
5. Reload page → Service worker should activate

### Test Offline Mode

1. Open DevTools → Network tab
2. Select "Offline" from throttling dropdown
3. Reload page
4. App should still load from cache

---

## 📊 Monitoring

### Backend Logs

MQTT activity is logged with prefix `[MQTT]`:
```
[MQTT] ✓ Connected to broker
[MQTT] ✓ Subscribed to: app/device/+/telemetry
[MQTT] Received from ESP32_SIM_01: {"temperature": 25.5, ...}
```

WebSocket activity with prefix `[WS]`:
```
[WS] Client connected. Total: 1
[WS] Client disconnected. Total: 0
```

### PWA Logs

Service worker activity logged with prefix `[PWA]` or `[SW]`:
```javascript
// In browser console:
[PWA] Service Worker registered successfully
[SW] Caching app shell
[SW] Serving from cache: /static/js/main.js
```

---

## 🛠️ Configuration

### Backend MQTT Settings

Edit `backend/main.py`:
```python
# Change broker host/port
mqtt_manager = MQTTManager(
    broker_host="192.168.1.100",  # Your MQTT broker IP
    broker_port=1883
)
```

### Simulator Settings

Edit `simulator/esp32_mqtt_simulator.py`:
```python
# Change broker
MQTT_BROKER = "192.168.1.100"
MQTT_PORT = 1883

# Change devices
DEVICE_IDS = [
    "MY_DEVICE_01",
    "MY_DEVICE_02"
]

# Change send interval
SEND_INTERVAL = 2.0  # seconds

# Customize telemetry
TELEMETRY_SCHEMA = {
    "temperature": {"min": 20, "max": 35, "unit": "°C"},
    "custom_sensor": {"min": 0, "max": 100, "unit": "units"}
}
```

### PWA Settings

Edit `frontend/public/manifest.json`:
```json
{
  "short_name": "Your App",
  "name": "Your IoT Dashboard",
  "theme_color": "#1e293b",
  "background_color": "#0f172a"
}
```

---

## 🔒 Security Considerations

### MQTT Security (Production)

For production deployment, secure your MQTT broker:

1. **Enable Authentication**
```bash
# In mosquitto.conf:
allow_anonymous false
password_file /etc/mosquitto/passwd
```

2. **Use TLS/SSL**
```bash
# In mosquitto.conf:
listener 8883
cafile /path/to/ca.crt
certfile /path/to/server.crt
keyfile /path/to/server.key
```

3. **Update Backend**
```python
mqtt_manager = MQTTManager(
    broker_host="your-broker.com",
    broker_port=8883
)
mqtt_manager.client.tls_set(ca_certs="/path/to/ca.crt")
mqtt_manager.client.username_pw_set("username", "password")
```

### PWA Security

- **HTTPS Required**: PWA only works over HTTPS (except localhost)
- **Service Worker Scope**: Limited to same-origin requests
- **Secure Storage**: Use IndexedDB for sensitive cached data

---

## 🐛 Troubleshooting

### MQTT Issues

**Problem**: "Connection refused" error
```
Solution:
1. Check if Mosquitto is running:
   - Windows: Services → Mosquitto Broker
   - Docker: docker ps | grep mosquitto
2. Check firewall rules (port 1883)
3. Verify broker IP in simulator config
```

**Problem**: "No messages received in backend"
```
Solution:
1. Check topic pattern matches
2. Verify QoS level (should be 1)
3. Check backend logs for connection status
4. Test with mosquitto_pub command
```

### PWA Issues

**Problem**: "Service worker registration failed"
```
Solution:
1. Check browser console for errors
2. Ensure running on localhost or HTTPS
3. Verify service-worker.js is in /public
4. Clear browser cache and re-register
```

**Problem**: "Install prompt doesn't appear"
```
Solution:
1. PWA must meet criteria:
   - HTTPS (or localhost)
   - Valid manifest.json
   - Service worker registered
   - Not already installed
2. Check DevTools → Application → Manifest
```

---

## 📈 Next Steps

### Recommended Enhancements

1. **MQTT Authentication**
   - Add username/password to broker
   - Update simulator with credentials

2. **PWA Features**
   - Add push notifications
   - Implement background sync
   - Cache telemetry data in IndexedDB

3. **Dashboard Features**
   - MQTT connection status indicator
   - Install button in UI
   - Offline indicator

4. **Real ESP32 Integration**
   - Flash ESP32 with MQTT firmware
   - Configure WiFi credentials
   - Point to your broker IP

---

## 📚 Resources

### MQTT
- [Mosquitto Documentation](https://mosquitto.org/documentation/)
- [MQTT.org Protocol Spec](https://mqtt.org/)
- [Paho MQTT Python](https://www.eclipse.org/paho/index.php?page=clients/python/index.php)

### PWA
- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google PWA Guide](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

### ESP32
- [ESP32 MQTT Examples](https://github.com/espressif/esp-idf/tree/master/examples/protocols/mqtt)
- [Arduino MQTT Library](https://pubsubclient.knolleary.net/)

---

## ✅ Verification Checklist

- [ ] MQTT broker running on port 1883
- [ ] Backend started and connected to MQTT broker
- [ ] ESP32 simulator running and publishing data
- [ ] Backend receiving MQTT messages
- [ ] WebSocket broadcasting to dashboard
- [ ] Dashboard showing live telemetry
- [ ] PWA manifest.json accessible
- [ ] Service worker registered successfully
- [ ] Install prompt available
- [ ] App installable on mobile/desktop
- [ ] Offline mode working

---

## 📝 Files Created/Modified

### Backend
- ✏️ `backend/requirements.txt` - Added paho-mqtt
- ✏️ `backend/main.py` - Added MQTTManager class and integration

### Simulator
- ✨ `simulator/esp32_mqtt_simulator.py` - New MQTT simulator
- ✏️ `simulator/requirements.txt` - Added paho-mqtt

### Frontend
- ✨ `frontend/public/manifest.json` - PWA manifest
- ✨ `frontend/public/service-worker.js` - Service worker
- ✨ `frontend/public/icon-192.svg` - App icon
- ✨ `frontend/public/icon-512.svg` - App icon
- ✨ `frontend/src/serviceWorkerRegistration.js` - SW registration utilities
- ✏️ `frontend/public/index.html` - Added PWA meta tags
- ✏️ `frontend/src/index.js` - Register service worker

---

Made with ❤️ for IoT Dashboard Platform
