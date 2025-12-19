# IoT Dashboard - Real-time Monitoring Platform

> **Latest Update (2025-12-19):** Added MQTT protocol support and converted to Progressive Web App (PWA)!

A sensor-agnostic IoT dashboard platform with real-time telemetry monitoring, MQTT support, and installable PWA capabilities.

![Status](https://img.shields.io/badge/status-active-success)
![Version](https://img.shields.io/badge/version-2.0-blue)
![MQTT](https://img.shields.io/badge/MQTT-1883-orange)
![PWA](https://img.shields.io/badge/PWA-enabled-green)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 16+
- MQTT Broker (Mosquitto recommended)

### One-Command Start (Windows)
```bash
# 1. Setup MQTT broker
setup_mosquitto.bat

# 2. Start all services
start_all.bat
```

### Access Dashboard
```
http://localhost:3000
```

---

## ✨ Features

### Core Features
- ✅ **Real-time Telemetry**: Live data streaming via WebSocket
- ✅ **MQTT Protocol**: Industry-standard IoT communication
- ✅ **Device Auto-Discovery**: Automatically detects new devices
- ✅ **Drag & Drop Dashboard**: Customizable widget layout
- ✅ **Multi-Device Support**: Monitor multiple devices simultaneously
- ✅ **Rich Widgets**: Gauges, charts, value displays, controls

### NEW: MQTT Integration
- ✅ **MQTT Broker Listener**: Subscribes to `app/device/+/telemetry`
- ✅ **ESP32 MQTT Simulator**: Realistic MQTT-based device simulation
- ✅ **Automatic Forwarding**: MQTT → WebSocket pipeline
- ✅ **Pub/Sub Architecture**: Scalable and decoupled
- ✅ **QoS Support**: Reliable message delivery

### NEW: Progressive Web App (PWA)
- ✅ **Installable**: Add to Home Screen (mobile & desktop)
- ✅ **Offline Support**: Works without internet connection
- ✅ **Service Worker**: Smart caching strategy
- ✅ **App-like Experience**: Standalone display mode
- ✅ **Auto-Updates**: Seamless version updates
- ✅ **Cross-Platform**: iOS, Android, Windows, Mac, Linux

---

## 📁 Project Structure

```
fort/
├── backend/                  # FastAPI backend
│   ├── main.py              # Main app with MQTT integration
│   └── requirements.txt     # Python dependencies
│
├── frontend/                # React PWA frontend
│   ├── public/
│   │   ├── manifest.json    # PWA manifest
│   │   ├── service-worker.js
│   │   └── icon-*.svg       # App icons
│   ├── src/
│   │   ├── App.jsx          # Main dashboard
│   │   ├── serviceWorkerRegistration.js
│   │   └── ...
│   └── package.json
│
├── simulator/               # ESP32 simulators
│   ├── esp32_mqtt_simulator.py    # NEW: MQTT version
│   ├── esp32_simulator.py         # HTTP version
│   └── requirements.txt
│
└── Documentation/
    ├── MQTT_PWA_GUIDE.md         # Comprehensive guide
    ├── UPDATE_SUMMARY.md         # Latest changes
    ├── ARCHITECTURE.md           # System architecture
    ├── VERIFICATION_CHECKLIST.md # Setup checklist
    ├── start_all.bat             # Quick start script
    └── setup_mosquitto.bat       # MQTT setup helper
```

---

## 📚 Documentation

### Getting Started
- **[Quick Start Guide](MQTT_PWA_GUIDE.md)** - Complete setup instructions
- **[Update Summary](UPDATE_SUMMARY.md)** - What's new in v2.0
- **[Verification Checklist](VERIFICATION_CHECKLIST.md)** - Step-by-step validation

### Technical
- **[Architecture Diagram](ARCHITECTURE.md)** - System design and data flow
- **[API Documentation](backend/)** - Backend API reference
- **[Widget Development](frontend/)** - Custom widget creation

### Previous Guides
- **[Phase 1 Features](PHASE1_FEATURES_GUIDE.md)** - Initial dashboard features
- **[Advanced Charts](ADVANCED_CHARTS_COMPLETE.md)** - Chart widgets
- **[Device Control](DEVICE_CONTROL_WIDGET.md)** - Control functionality

---

## 🔧 Manual Setup

### 1. MQTT Broker
```bash
# Windows (via Chocolatey)
choco install mosquitto

# Or download: https://mosquitto.org/download/

# Start service
net start mosquitto
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. ESP32 Simulator (MQTT)
```bash
cd simulator
pip install -r requirements.txt
python esp32_mqtt_simulator.py
```

### 4. Frontend
```bash
cd frontend
npm install
npm start
```

---

## 🏗️ Architecture

### MQTT Data Flow
```
ESP32 Device → MQTT Broker → Backend Listener → WebSocket → Dashboard
```

### Technology Stack
- **Backend**: FastAPI, Paho MQTT, WebSockets, Uvicorn
- **Frontend**: React 18, Service Worker, React Grid Layout, Recharts
- **Infrastructure**: Mosquitto MQTT Broker, Node.js, Python 3.11+

### Network Ports
- **MQTT**: 1883
- **Backend**: 8000
- **Frontend**: 3000

See **[ARCHITECTURE.md](ARCHITECTURE.md)** for detailed diagrams.

---

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Click install icon (⊕) in address bar
2. Click "Install"
3. App opens in standalone window

### Mobile (Chrome/Safari)
1. Open menu (⋮ or Share)
2. Select "Add to Home Screen"
3. Confirm installation

### Features After Install
- ✅ Native app icon on home screen
- ✅ Standalone mode (no browser UI)
- ✅ Offline support
- ✅ Fast loading from cache
- ✅ Auto-updates on reload

---

## 🧪 Testing

### Test MQTT Connection
```bash
# Publish test message
mosquitto_pub -h localhost -p 1883 \
  -t "app/device/TEST/telemetry" \
  -m '{"telemetry": {"temperature": 25}, "timestamp": "2025-12-19T12:00:00"}'

# Subscribe to messages
mosquitto_sub -h localhost -p 1883 -t "app/device/+/telemetry"
```

### Test PWA
1. Open DevTools (F12)
2. Application tab → Manifest (verify)
3. Application tab → Service Workers (check status)
4. Network tab → Offline (test offline mode)

---

## 🛠️ Configuration

### Change MQTT Broker IP

**Backend** (`backend/main.py`):
```python
mqtt_manager = MQTTManager(
    broker_host="192.168.1.100",  # Your broker IP
    broker_port=1883
)
```

**Simulator** (`simulator/esp32_mqtt_simulator.py`):
```python
MQTT_BROKER = "192.168.1.100"  # Your broker IP
```

### Customize Telemetry Schema

Edit `simulator/esp32_mqtt_simulator.py`:
```python
TELEMETRY_SCHEMA = {
    "temperature": {"min": 20, "max": 35, "unit": "°C"},
    "humidity": {"min": 40, "max": 80, "unit": "%"},
    "your_sensor": {"min": 0, "max": 100, "unit": "units"}
}
```

### PWA Branding

Edit `frontend/public/manifest.json`:
```json
{
  "short_name": "Your App",
  "name": "Your Dashboard",
  "theme_color": "#1e293b"
}
```

---

## 🐛 Troubleshooting

### MQTT Issues

**Problem**: Connection refused
```bash
# Check Mosquitto service
sc query mosquitto

# Start service
net start mosquitto

# Check port
netstat -an | find "1883"
```

**Problem**: Backend not receiving messages
- Verify topic pattern matches
- Check broker IP configuration
- Test with `mosquitto_pub` command
- Check firewall rules

### PWA Issues

**Problem**: Install prompt doesn't appear
- Must use HTTPS or localhost
- Check manifest.json is valid
- Verify service worker registered
- Clear browser cache

**Problem**: Offline mode not working
- Check service worker is active
- Verify cache contains files
- Open DevTools → Application → Cache Storage

See **[VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)** for complete troubleshooting guide.

---

## 📈 What's Next

### Recommended Enhancements
- [ ] Add MQTT authentication (username/password)
- [ ] Enable MQTT over TLS/SSL
- [ ] Add push notifications
- [ ] Implement background sync
- [ ] Add offline data caching (IndexedDB)
- [ ] Deploy to cloud (AWS/GCP/Azure)
- [ ] Real ESP32 integration
- [ ] Add user authentication

### Real ESP32 Integration
1. Flash ESP32 with MQTT firmware
2. Configure WiFi credentials
3. Point to your MQTT broker IP
4. Use same topic structure: `app/device/{device_id}/telemetry`

---

## 🔒 Security Notes

### Current Setup (Development)
- ⚠️ MQTT: No authentication
- ⚠️ Backend: Open CORS
- ⚠️ Frontend: HTTP (localhost only)

### Production Recommendations
- 🔐 Enable MQTT authentication
- 🔐 Use MQTT over TLS (port 8883)
- 🔐 Add API authentication (JWT)
- 🔐 Restrict CORS origins
- 🔐 Deploy with HTTPS
- 🔐 Secure WebSocket connections

---

## 📊 System Requirements

### Minimum
- CPU: 2 cores
- RAM: 4GB
- Disk: 1GB
- Network: Local network access

### Recommended
- CPU: 4 cores
- RAM: 8GB
- Disk: 2GB
- Network: Stable internet for production

---

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Make changes
3. Test locally
4. Submit pull request

### Code Style
- Python: PEP 8
- JavaScript: ESLint
- React: Functional components, hooks

---

## 📄 License

See [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **MQTT**: Eclipse Paho MQTT
- **Frontend**: React, Recharts, Lucide Icons
- **Backend**: FastAPI, Uvicorn
- **MQTT Broker**: Eclipse Mosquitto

---

## 📞 Support

### Documentation
- 📖 [Complete Guide](MQTT_PWA_GUIDE.md)
- 🏗️ [Architecture](ARCHITECTURE.md)
- ✅ [Checklist](VERIFICATION_CHECKLIST.md)

### Resources
- [MQTT.org](https://mqtt.org/)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)

---

## 🎯 Version History

### v2.0 (2025-12-19) - MQTT & PWA Update
- ✨ Added MQTT protocol support
- ✨ Converted to Progressive Web App
- ✨ Created ESP32 MQTT simulator
- ✨ Added service worker for offline support
- ✨ Installable on all platforms
- 📚 Comprehensive documentation

### v1.0 - Initial Release
- ✅ Real-time dashboard
- ✅ HTTP telemetry endpoint
- ✅ WebSocket streaming
- ✅ Drag & drop widgets
- ✅ Multi-device support
- ✅ ESP32 HTTP simulator

---

**Made with ❤️ for IoT Dashboard Platform**

**Current Status:** ✅ Production Ready (with recommended security enhancements for public deployment)

---

### Quick Links
- 🚀 [Quick Start](#-quick-start)
- 📚 [Documentation](#-documentation)
- 🏗️ [Architecture](#️-architecture)
- 📱 [PWA Installation](#-pwa-installation)
- 🛠️ [Configuration](#️-configuration)
- 🐛 [Troubleshooting](#-troubleshooting)
