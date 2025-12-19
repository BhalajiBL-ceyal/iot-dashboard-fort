"""
IoT Platform Backend - FastAPI Application

This is the core backend that:
1. Receives telemetry from any device (sensor-agnostic)
2. Auto-discovers devices and telemetry keys
3. Streams live data via WebSocket
4. Exposes REST APIs for dashboard metadata

Architecture: Event-driven, stateless (except in-memory demo storage)
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio
import json
import paho.mqtt.client as mqtt
import threading

# Import state inference engine
try:
    from state_inference import inference_engine, MachineState
    STATE_INFERENCE_ENABLED = True
    print("[INFO] State inference engine loaded successfully")
except ImportError as e:
    STATE_INFERENCE_ENABLED = False
    print(f"[WARNING] State inference module not found: {e}")

# ==================== DATA MODELS ====================

class TelemetryPayload(BaseModel):
    """
    Generic telemetry payload from any IoT device.
    
    Why generic: We don't know what sensors the device has.
    The 'telemetry' dict can contain ANY key-value pairs.
    """
    device_id: str
    telemetry: Dict[str, Any]  # Arbitrary key-value pairs
    timestamp: Optional[str] = None


class Device(BaseModel):
    """Device metadata discovered at runtime."""
    device_id: str
    first_seen: str
    last_seen: str
    telemetry_keys: List[str]
    status: str  # "online" or "offline"


# ==================== IN-MEMORY STORAGE ====================
# Production: Replace with Redis or PostgreSQL

class InMemoryStorage:
    """
    Simple in-memory storage for demo purposes.
    
    Why: Fast, simple, sufficient for demo. Loses data on restart.
    Production: Use Redis for real-time data + PostgreSQL for persistence.
    """
    
    def __init__(self):
        # device_id -> Device metadata
        self.devices: Dict[str, Dict[str, Any]] = {}
        
        # device_id -> key -> {value, timestamp}
        self.telemetry: Dict[str, Dict[str, Any]] = {}
        
        # device_id -> key -> List[{timestamp, value}] (last 100 points)
        self.history: Dict[str, Dict[str, List[Dict]]] = {}
    
    def register_device(self, device_id: str):
        """Auto-register device on first telemetry."""
        if device_id not in self.devices:
            now = datetime.utcnow().isoformat()
            self.devices[device_id] = {
                "device_id": device_id,
                "first_seen": now,
                "last_seen": now,
                "telemetry_keys": [],
                "status": "online"
            }
            self.telemetry[device_id] = {}
            self.history[device_id] = {}
    
    def update_telemetry(self, device_id: str, telemetry: Dict[str, Any]):
        """
        Store latest telemetry and update device metadata.
        
        Why: Dashboard needs latest values + historical data for charts.
        We auto-discover new telemetry keys as they appear.
        """
        now = datetime.utcnow().isoformat()
        
        # Update device last seen
        self.devices[device_id]["last_seen"] = now
        self.devices[device_id]["status"] = "online"
        
        # Store telemetry
        for key, value in telemetry.items():
            # Update latest value
            self.telemetry[device_id][key] = {
                "value": value,
                "timestamp": now
            }
            
            # Add to history (keep last 100 points)
            if key not in self.history[device_id]:
                self.history[device_id][key] = []
            
            self.history[device_id][key].append({
                "timestamp": now,
                "value": value
            })
            
            # Limit history size
            if len(self.history[device_id][key]) > 100:
                self.history[device_id][key].pop(0)
            
            # Auto-discover new keys
            if key not in self.devices[device_id]["telemetry_keys"]:
                self.devices[device_id]["telemetry_keys"].append(key)
    
    def get_devices(self) -> List[Dict]:
        """Return all registered devices."""
        return list(self.devices.values())
    
    def get_device(self, device_id: str) -> Optional[Dict]:
        """Get specific device metadata."""
        return self.devices.get(device_id)
    
    def get_latest_telemetry(self, device_id: str) -> Dict[str, Any]:
        """Get latest values for all telemetry keys."""
        return self.telemetry.get(device_id, {})
    
    def get_history(self, device_id: str, key: str) -> List[Dict]:
        """Get historical data for a specific telemetry key."""
        return self.history.get(device_id, {}).get(key, [])


# ==================== WEBSOCKET MANAGER ====================

class ConnectionManager:
    """
    Manages WebSocket connections for real-time data streaming.
    
    Why: Dashboard needs instant updates without polling.
    WebSocket allows server to push data to all connected clients.
    """
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WS] Client connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        print(f"[WS] Client disconnected. Total: {len(self.active_connections)}")
    
    async def broadcast(self, message: dict):
        """Send message to all connected clients."""
        if not self.active_connections:
            return
        
        message_json = json.dumps(message)
        
        # Send to all clients concurrently
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message_json)
            except:
                dead_connections.append(connection)
        
        # Remove dead connections
        for conn in dead_connections:
            self.disconnect(conn)


# ==================== MQTT MANAGER ====================

class MQTTManager:
    """
    Manages MQTT broker subscription for ESP32 telemetry.
    
    Why: ESP32 devices publish telemetry to MQTT broker.
    This manager subscribes to the broker and forwards data to WebSocket pipeline.
    """
    
    def __init__(self, broker_host: str = "localhost", broker_port: int = 1883):
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.client = mqtt.Client(client_id="iot_dashboard_backend")
        self.storage = None
        self.ws_manager = None
        self.loop = None  # Store the main event loop
        
        # MQTT Callbacks
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        
        print(f"[MQTT] Initializing MQTT Manager (broker: {broker_host}:{broker_port})")
    
    def set_dependencies(self, storage, ws_manager, loop=None):
        """Inject dependencies for storage, WebSocket manager, and event loop."""
        self.storage = storage
        self.ws_manager = ws_manager
        self.loop = loop  # Store the main asyncio event loop
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback when connected to MQTT broker."""
        if rc == 0:
            print(f"[MQTT] ✓ Connected to broker at {self.broker_host}:{self.broker_port}")
            # Subscribe to telemetry topic with wildcard for device ID
            client.subscribe("app/device/+/telemetry")
            print("[MQTT] ✓ Subscribed to: app/device/+/telemetry")
        else:
            print(f"[MQTT] ✗ Connection failed with code {rc}")
    
    def _on_message(self, client, userdata, msg):
        """
        Callback when MQTT message received.
        
        Format: app/device/{device_id}/telemetry
        Payload: JSON with telemetry data
        """
        try:
            # Extract device_id from topic: app/device/ESP32_SIM_01/telemetry
            topic_parts = msg.topic.split("/")
            if len(topic_parts) != 4:
                print(f"[MQTT] Invalid topic format: {msg.topic}")
                return
            
            device_id = topic_parts[2]
            
            # Parse JSON payload
            payload = json.loads(msg.payload.decode())
            
            # Expect format: {"telemetry": {...}, "timestamp": "..."}
            telemetry = payload.get("telemetry", {})
            timestamp = payload.get("timestamp", datetime.utcnow().isoformat())
            
            print(f"[MQTT] Received from {device_id}: {json.dumps(telemetry)}")
            
            # Forward to existing HTTP pipeline
            if self.storage and self.ws_manager and self.loop:
                # Auto-register device
                self.storage.register_device(device_id)
                
                # Store telemetry
                self.storage.update_telemetry(device_id, telemetry)
                
                # Broadcast to WebSocket clients using the main event loop
                asyncio.run_coroutine_threadsafe(
                    self.ws_manager.broadcast({
                        "type": "telemetry_update",
                        "device_id": device_id,
                        "telemetry": telemetry,
                        "timestamp": timestamp
                    }),
                    self.loop
                )
            
        except json.JSONDecodeError:
            print(f"[MQTT] Invalid JSON payload: {msg.payload}")
        except Exception as e:
            print(f"[MQTT] Error processing message: {e}")
    
    def start(self):
        """Start MQTT client in background thread."""
        def run_mqtt():
            try:
                self.client.connect(self.broker_host, self.broker_port, 60)
                self.client.loop_forever()
            except Exception as e:
                print(f"[MQTT] Connection error: {e}")
                print(f"[MQTT] Make sure MQTT broker is running on {self.broker_host}:{self.broker_port}")
        
        mqtt_thread = threading.Thread(target=run_mqtt, daemon=True)
        mqtt_thread.start()
        print("[MQTT] Background listener started")


# ==================== APPLICATION SETUP ====================

app = FastAPI(title="IoT Platform Backend", version="1.0.0")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production: Restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize storage and WebSocket manager
storage = InMemoryStorage()
ws_manager = ConnectionManager()

# Initialize and start MQTT manager
mqtt_manager = MQTTManager(broker_host="localhost", broker_port=1883)


# Note: We'll set the event loop during startup
async def set_mqtt_loop():
    """Set the main event loop for MQTT manager."""
    loop = asyncio.get_running_loop()
    mqtt_manager.set_dependencies(storage, ws_manager, loop)


# ==================== REST API ENDPOINTS ====================

@app.post("/api/telemetry")
async def receive_telemetry(payload: TelemetryPayload):
    """
    Receive telemetry from any IoT device and infer machine state.
    
    This is the main ingestion endpoint. It:
    1. Auto-registers new devices
    2. Auto-discovers new telemetry keys
    3. Infers machine state (RUNNING/IDLE/FAULT)
    4. Stores latest values
    5. Broadcasts to all WebSocket clients
    """
    device_id = payload.device_id
    telemetry = payload.telemetry
    
    # Auto-register device if new
    storage.register_device(device_id)
    
    # Store telemetry
    storage.update_telemetry(device_id, telemetry)
    
    # NEW: Infer machine state
    telemetry_with_state = telemetry.copy()
    if STATE_INFERENCE_ENABLED:
        try:
            state_info = inference_engine.update_telemetry(device_id, telemetry)
            
            # Add state to telemetry for broadcast
            telemetry_with_state["_machine_state"] = state_info["state"]
            telemetry_with_state["_state_confidence"] = state_info["confidence"]
            telemetry_with_state["_state_reasons"] = state_info["reasons"]
            
            print(f"[STATE] {device_id}: {state_info['state']} ({state_info['confidence']}%)")
        except Exception as e:
            print(f"[ERROR] State inference failed for {device_id}: {e}")
    
    # Broadcast to all connected dashboards
    await ws_manager.broadcast({
        "type": "telemetry_update",
        "device_id": device_id,
        "telemetry": telemetry_with_state,
        "timestamp": payload.timestamp or datetime.utcnow().isoformat()
    })
    
    return {"status": "success", "device_id": device_id}


@app.get("/api/devices")
async def get_devices():
    """
    Get list of all discovered devices.
    
    Why: Dashboard needs to know what devices exist to display them.
    """
    devices = storage.get_devices()
    return {"devices": devices}


@app.get("/api/devices/{device_id}/state")
async def get_device_state(device_id: str):
    """Get inferred machine state for a specific device."""
    if not STATE_INFERENCE_ENABLED:
        raise HTTPException(status_code=501, detail="State inference not enabled")
    
    state_info = inference_engine.get_device_state(device_id)
    
    if not state_info:
        raise HTTPException(status_code=404, detail="Device not found or no state data")
    
    return state_info


@app.get("/api/states")
async def get_all_states():
    """Get machine states for all devices."""
    if not STATE_INFERENCE_ENABLED:
        return {}
    
    return inference_engine.get_all_states()



@app.get("/api/devices/{device_id}")
async def get_device(device_id: str):
    """Get metadata for a specific device."""
    device = storage.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@app.get("/api/devices/{device_id}/telemetry")
async def get_device_telemetry(device_id: str):
    """Get latest telemetry values for a device."""
    device = storage.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    telemetry = storage.get_latest_telemetry(device_id)
    return {"device_id": device_id, "telemetry": telemetry}


@app.get("/api/devices/{device_id}/keys")
async def get_device_keys(device_id: str):
    """
    Get list of telemetry keys for a device.
    
    Why: Dashboard needs to know what data is available to bind widgets.
    """
    device = storage.get_device(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {"device_id": device_id, "keys": device["telemetry_keys"]}


@app.get("/api/devices/{device_id}/history/{key}")
async def get_telemetry_history(device_id: str, key: str):
    """Get historical data for a specific telemetry key (for charts)."""
    history = storage.get_history(device_id, key)
    return {"device_id": device_id, "key": key, "history": history}


# ==================== WEBSOCKET ENDPOINT ====================

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time data streaming.
    
    Why: Enables instant dashboard updates without polling.
    Dashboard connects once and receives all telemetry updates.
    """
    await ws_manager.connect(websocket)
    
    try:
        # Send initial state
        devices = storage.get_devices()
        await websocket.send_text(json.dumps({
            "type": "initial_state",
            "devices": devices
        }))
        
        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_text()
            # Echo back for ping/pong if needed
            
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "IoT Platform Backend",
        "version": "1.0.0",
        "devices": len(storage.devices)
    }


# ==================== BACKGROUND TASKS ====================

@app.on_event("startup")
async def startup_event():
    """Run background tasks on startup."""
    # Set the event loop for MQTT manager first
    await set_mqtt_loop()
    
    # Start MQTT listener
    mqtt_manager.start()
    
    # Start device status checker
    asyncio.create_task(check_device_status())


async def check_device_status():
    """
    Background task to mark devices offline if no recent telemetry.
    
    Why: Dashboard needs to know if devices are still sending data.
    If no data received for 30 seconds, mark as offline.
    """
    while True:
        await asyncio.sleep(10)  # Check every 10 seconds
        
        now = datetime.utcnow()
        
        for device_id, device in storage.devices.items():
            last_seen = datetime.fromisoformat(device["last_seen"])
            seconds_since = (now - last_seen).total_seconds()
            
            # Mark offline if no data for 30 seconds
            if seconds_since > 30 and device["status"] == "online":
                device["status"] = "offline"
                
                # Broadcast status change
                await ws_manager.broadcast({
                    "type": "device_status",
                    "device_id": device_id,
                    "status": "offline"
                })