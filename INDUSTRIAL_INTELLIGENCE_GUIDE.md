# 🏭 CEYEL-Style Industrial Intelligence Platform - Implementation Guide

## Overview

This guide adds two major enterprise features to your IoT dashboard:
1. **Machine State Inference** (RUNNING/IDLE/FAULT detection)
2. **Device Discovery & Onboarding** (Wi-Fi-based ESP32 provisioning)

---

## ✅ PART 1: Machine State Inference

### What It Does
- Analyzes telemetry patterns in real-time
- Infers machine states: **RUNNING**, **IDLE**, **FAULT**
- Shows confidence level and reasoning
- Updates live in dashboard

### Files Created
✅ `backend/state_inference.py` - Inference engine (DONE)

### Files to Modify

#### 1. `backend/main.py`

**Add import at top:**
```python
# Add after other imports (around line 20)
try:
    from state_inference import inference_engine, MachineState
    STATE_INFERENCE_ENABLED = True
except ImportError:
    STATE_INFERENCE_ENABLED = False
    print("[WARNING] State inference module not found")
```

**Modify telemetry endpoint (around line 312):**
```python
@app.post("/api/telemetry")
async def receive_telemetry(payload: TelemetryPayload):
    """Receive telemetry and infer machine state"""
    device_id = payload.device_id
    telemetry = payload.telemetry
   
    # Store telemetry (existing code)
    storage.add_telemetry(device_id, telemetry)
    
    # NEW: Infer machine state
    if STATE_INFERENCE_ENABLED:
        state_info = inference_engine.update_telemetry(device_id, telemetry)
        
        # Add state to telemetry for broadcast
        telemetry_with_state = {
            **telemetry,
            "_machine_state": state_info["state"],
            "_state_confidence": state_info["confidence"],
            "_state_reasons": state_info["reasons"],
        }
    else:
        telemetry_with_state = telemetry
    
    # Broadcast to WebSocket clients
    await manager.broadcast({
        "type": "telemetry",
        "device_id": device_id,
        "data": telemetry_with_state,
        "timestamp": datetime.now().isoformat()
    })
    
    return {"status": "ok", "device_id": device_id}
```

**Add new API endpoint (add after line 350):**
```python
@app.get("/api/devices/{device_id}/state")
async def get_device_state(device_id: str):
    """Get inferred machine state for a device"""
    if not STATE_INFERENCE_ENABLED:
        raise HTTPException(status_code=501, detail="State inference not enabled")
    
    state_info = inference_engine.get_device_state(device_id)
    
    if not state_info:
        raise HTTPException(status_code=404, detail="Device not found or no state data")
    
    return state_info

@app.get("/api/states")
async def get_all_states():
    """Get machine states for all devices"""
    if not STATE_INFERENCE_ENABLED:
        return {}
    
    return inference_engine.get_all_states()
```

#### 2. Create `frontend/src/components/MachineStateIndicator.jsx`

```jsx
import React from 'react';
import { Activity, AlertTriangle, Pause, HelpCircle } from 'lucide-react';

const MachineStateIndicator = ({ state, confidence, reasons, isDarkMode }) => {
  const getStateConfig = (state) => {
    switch(state) {
      case 'RUNNING':
        return {
          color: 'green',
          bgColor: isDarkMode ? 'bg-green-900/30' : 'bg-green-100',
          borderColor: 'border-green-500',
          textColor: 'text-green-600',
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
          icon: AlertTriangle,
          label: 'Fault',
          pulse: true
        };
      default:
        return {
          color: 'gray',
          bgColor: isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
          borderColor: 'border-gray-400',
          textColor: 'text-gray-500',
          icon: HelpCircle,
          label: 'Unknown',
          pulse: false
        };
    }
  };

  const config = getStateConfig(state);
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} border-2 ${config.borderColor} rounded-lg p-3 ${config.pulse ? 'animate-pulse' : ''}`}>
      <div className="flex items-center gap-2">
        <Icon className={config.textColor} size={20} />
        <div className="flex-1">
          <div className={`font-bold ${config.textColor}`}>{config.label}</div>
          {confidence && (
            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Confidence: {confidence}%
            </div>
          )}
        </div>
      </div>
      {reasons && reasons.length > 0 && (
        <div className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="font-semibold mb-1">Analysis:</div>
          <ul className="list-disc list-inside">
            {reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MachineStateIndicator;
```

#### 3. Modify `frontend/src/App.jsx`

**Add import:**
```javascript
import MachineStateIndicator from './components/MachineStateIndicator';
```

**Add state tracking in component:**
```javascript
const [machineStates, setMachineStates] = useState({});
```

**Update WebSocket handler to capture machine state:**
```javascript
// In handleWebSocketMessage function
if (data.type === 'telemetry') {
  const { device_id, data: telemetryData } = data;
  
  // Extract machine state if present
  if (telemetryData._machine_state) {
    setMachineStates(prev => ({
      ...prev,
      [device_id]: {
        state: telemetryData._machine_state,
        confidence: telemetryData._state_confidence,
        reasons: telemetryData._state_reasons
      }
    }));
  }
  
  // Rest of existing telemetry handling...
}
```

**Add Machine State widget to sidebar (in Widget Library section):**
```jsx
<WidgetLibraryItem 
  type="machine_state" 
  icon={Activity} 
  label="Machine State" 
  onDragStart={handleDragStart} 
  isEditMode={isEditMode} 
/>
```

**Add to WidgetRenderer switch statement:**
```javascript
case 'machine_state':
  const machineState = machineStates[deviceId];
  return (
    <MachineStateIndicator 
      state={machineState?.state || 'UNKNOWN'}
      confidence={machineState?.confidence}
      reasons={machineState?.reasons}
      isDarkMode={isDarkMode}
    />
  );
```

---

## ✅ PART 2: Device Discovery & Onboarding

### What It Does
- Scans for ESP32 devices in provisioning mode
- Shows list of discovered devices
- Allows user to onboard new devices
- Securely adds them to device list

### Files to Create

#### 1. `backend/device_discovery.py`

```python
"""
ESP32 Device Discovery Service
Uses mDNS/Bonjour to find ESP32 devices in provisioning mode
"""
import asyncio
from zeroconf import ServiceBrowser, Zeroconf, ServiceListener
from typing import List, Dict
import socket

class ESP32DiscoveryListener(ServiceListener):
    def __init__(self):
        self.discovered_devices = []
    
    def add_service(self, zeroconf, service_type, name):
        info = zeroconf.get_service_info(service_type, name)
        if info:
            device_info = {
                "name": name,
                "address": socket.inet_ntoa(info.addresses[0]),
                "port": info.port,
                "properties": {k.decode(): v.decode() for k, v in info.properties.items()}
            }
            self.discovered_devices.append(device_info)
            print(f"[Discovery] Found device: {device_info}")
    
    def remove_service(self, zeroconf, service_type, name):
        self.discovered_devices = [d for d in self.discovered_devices if d['name'] != name]
    
    def update_service(self, zeroconf, service_type, name):
        pass

class DeviceDiscoveryService:
    def __init__(self):
        self.zeroconf = None
        self.browser = None
        self.listener = None
    
    def start_discovery(self, timeout=10):
        """Start discovering ESP32 devices"""
        self.zeroconf = Zeroconf()
        self.listener = ESP32DiscoveryListener()
        self.browser = ServiceBrowser(self.zeroconf, "_esp32._tcp.local.", self.listener)
        
        # Wait for discovery
        import time
        time.sleep(timeout)
        
        return self.listener.discovered_devices
    
    def stop_discovery(self):
        """Stop discovery service"""
        if self.zeroconf:
            self.zeroconf.close()

discovery_service = DeviceDiscoveryService()
```

#### 2. `backend/main.py` - Add Discovery Endpoints

```python
from device_discovery import discovery_service

@app.get("/api/devices/discover")
async def discover_devices():
    """Scan for ESP32 devices in provisioning mode"""
    try:
        devices = discovery_service.start_discovery(timeout=5)
        return {
            "status": "ok",
            "devices": devices,
            "count": len(devices)
        }
    finally:
        discovery_service.stop_discovery()

@app.post("/api/devices/onboard")
async def onboard_device(device_info: dict):
    """Onboard a discovered device"""
    device_id = device_info.get("device_id")
    if not device_id:
        raise HTTPException(status_code=400, detail="device_id required")
    
    # Add to storage
    storage.devices[device_id] = {
        "device_id": device_id,
        "status": "online",
        "telemetry_keys": [],
        "last_seen": datetime.now().isoformat(),
        "onboarded_at": datetime.now().isoformat()
    }
    
    # Broadcast device added
    await manager.broadcast({
        "type": "device_added",
        "device": storage.devices[device_id]
    })
    
    return {"status": "ok", "device_id": device_id}
```

#### 3. `frontend/src/components/DeviceDiscoveryModal.jsx`

```jsx
import React, { useState } from 'react';
import { Search, Wifi, Plus, X, Loader } from 'lucide-react';

const DeviceDiscoveryModal = ({ onClose, onDeviceAdded, isDarkMode }) => {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  
  const startScan = async () => {
    setScanning(true);
    try {
      const response = await fetch('http://localhost:8000/api/devices/discover');
      const data = await response.json();
      setDevices(data.devices || []);
    } catch (error) {
      console.error('Discovery failed:', error);
      alert('Failed to discover devices');
    } finally {
      setScanning(false);
    }
  };
  
  const onboardDevice = async (device) => {
    try {
      const response = await fetch('http://localhost:8000/api/devices/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: device.name,
          address: device.address
        })
      });
      
      if (response.ok) {
        alert(`Device ${device.name} onboarded successfully!`);
        onDeviceAdded(device.name);
        onClose();
      }
    } catch (error) {
      console.error('Onboarding failed:', error);
      alert('Failed to onboard device');
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl w-full max-w-lg`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Wifi className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} size={24} />
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              Discover Devices
            </h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <X size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Scan your network for ESP32 devices in provisioning mode
          </p>
          
          <button
            onClick={startScan}
            disabled={scanning}
            className={`w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${scanning ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            {scanning ? <Loader className="animate-spin" size={20} /> : <Search size={20} />}
            {scanning ? 'Scanning...' : 'Start Scan'}
          </button>
          
          {/* Discovered Devices */}
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {devices.length === 0 && !scanning && (
              <div className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                No devices found. Click "Start Scan" to search.
              </div>
            )}
            
            {devices.map((device, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'} flex items-center justify-between`}
              >
                <div>
                  <div className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {device.name}
                  </div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {device.address}:{device.port}
                  </div>
                </div>
                <button
                  onClick={() => onboardDevice(device)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDiscoveryModal;
```

#### 4. Add to `frontend/src/App.jsx`

```javascript
// Import
import DeviceDiscoveryModal from './components/DeviceDiscoveryModal';

// Add state
const [showDeviceDiscovery, setShowDeviceDiscovery] = useState(false);

// Add button in device section of sidebar
<button
  onClick={() => setShowDeviceDiscovery(true)}
  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2"
>
  <Plus size={16} />
  <span>Discover Devices</span>
</button>

// Add modal before closing div
{showDeviceDiscovery && (
  <DeviceDiscoveryModal
    onClose={() => setShowDeviceDiscovery(false)}
    onDeviceAdded={(deviceId) => {
      // Refresh devices list or add to local state
      console.log('Device added:', deviceId);
    }}
    isDarkMode={isDarkMode}
  />
)}
```

---

## 📦  Dependencies to Install

```bash
# Backend
cd backend
pip install zeroconf

# Already have: paho-mqtt, fastapi, etc.
```

---

## 🚀 Testing Guide

### Test Machine State Inference

1. **Start all services:**
   ```bash
   start_all.bat
   ```

2. **Observe states in real-time:**
   - Open dashboard
   - Add "Machine State" widget
   - Watch it change as telemetry varies:
     - Low current → IDLE
     - High current + vibration → RUNNING
     - Temperature spike → FAULT

3. **Simulate states:**
   - Modify ESP32 simulator to send different values
   - Watch state changes in real-time

### Test Device Discovery

1. **Click "Discover Devices" in sidebar**
2. **Click "Start Scan"**
3. **Discovered ESP32 devices appear**
4. **Click "Add" to onboard**
5. **Device appears in device list**

---

## 📊 State Inference Rules

### RUNNING Detection
- Current > 1.0A
- Vibration > 50
- High data variance

### IDLE Detection
- Current < 0.1A
- Vibration < 5
- Low data variance

### FAULT Detection (Priority)
- Temperature > 80°C or < 0°C
- Abnormal vibration (2x average)
- Current spike (1.5x average)
- Battery < 10%
- Weak WiFi (< -90 dBm)

---

## 🎨 Visual Enhancements

Machine State Widget shows:
- **Green pulsing** = RUNNING
- **Yellow static** = IDLE
- **Red pulsing** = FAULT
- **Gray** = UNKNOWN

Each includes:
- State label
- Confidence percentage
- Reasoning (why this state was inferred)
- Auto-updates every 2 seconds

---

## 🔒 Security Notes

Device onboarding should include:
- Authentication token exchange
- TLS/SSL for communication
- Device whitelisting
- Secure credential storage

---

## Next Steps

1. ✅ Copy `state_inference.py` to `backend/` (DONE)
2. Modify `backend/main.py` as shown above
3. Create `MachineStateIndicator.jsx` component
4. Update `App.jsx` to use machine states
5. Test with existing ESP32 simulators
6. (Optional) Add device discovery for enterprise deployment

Your dashboard will now intelligently infer machine states and show them in real-time! 🏭✨
