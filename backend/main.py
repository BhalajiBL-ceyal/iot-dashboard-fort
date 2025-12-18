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


# ==================== REST API ENDPOINTS ====================

@app.post("/api/telemetry")
async def receive_telemetry(payload: TelemetryPayload):
    """
    Receive telemetry from any IoT device.
    
    This is the main ingestion endpoint. It:
    1. Auto-registers new devices
    2. Auto-discovers new telemetry keys
    3. Stores latest values
    4. Broadcasts to all WebSocket clients
    """
    device_id = payload.device_id
    telemetry = payload.telemetry
    
    # Auto-register device if new
    storage.register_device(device_id)
    
    # Store telemetry
    storage.update_telemetry(device_id, telemetry)
    
    # Broadcast to all connected dashboards
    await ws_manager.broadcast({
        "type": "telemetry_update",
        "device_id": device_id,
        "telemetry": telemetry,
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