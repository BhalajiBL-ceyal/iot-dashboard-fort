"""
ESP32 MQTT Simulator - IoT Device with MQTT Protocol

This simulates an ESP32 microcontroller sending telemetry over MQTT.
It publishes to topic: app/device/{device_id}/telemetry

Key Features:
- Sends generic JSON telemetry via MQTT
- Configurable device ID and telemetry schema
- Automatic reconnection on failure
- Realistic sensor value generation with drift and noise
- Uses laptop's local IP for MQTT broker connection
"""

import paho.mqtt.client as mqtt
import time
import random
import json
from datetime import datetime
from typing import Dict, Any

# ==================== CONFIGURATION ====================
# Change these to simulate different devices and sensors

MQTT_BROKER = "localhost"  # Connect to local MQTT broker
MQTT_PORT = 1883
DEVICE_IDS = [
    "ESP32_SENSOR_01",  # MQTT Sensor Device 1
    "ESP32_SENSOR_02",  # MQTT Sensor Device 2
    "ESP32_SENSOR_03"   # MQTT Sensor Device 3
]

SEND_INTERVAL = 2  # seconds (changed from 0.5 to reduce spam)

# Define your telemetry schema here - completely arbitrary!
# This simulates a multi-sensor IoT device
TELEMETRY_SCHEMA = {
    "temperature": {"min": 20, "max": 35, "unit": "°C"},
    "humidity": {"min": 40, "max": 80, "unit": "%"},
    "battery": {"min": 3.0, "max": 4.2, "unit": "V"},
    "distance": {"min": 10, "max": 200, "unit": "cm"},
    "light": {"min": 0, "max": 1000, "unit": "lux"},
}


class ESP32MQTTSimulator:
    """
    Software-based ESP32 simulator that sends telemetry over MQTT.
    
    Design: This class maintains state for realistic sensor simulation
    including drift, noise, and value persistence between readings.
    """
    
    def __init__(self, device_id: str, broker: str, port: int = 1883):
        self.device_id = device_id
        self.broker = broker
        self.port = port
        self.current_values = {}
        self.connection_failures = 0
        self.connected = False
        
        # MQTT topic for this device
        self.topic = f"app/device/{device_id}/telemetry"
        
        # Initialize MQTT client
        self.client = mqtt.Client(client_id=f"{device_id}_client")
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        
        # Initialize starting values at midpoint of ranges
        for key, config in TELEMETRY_SCHEMA.items():
            mid = (config["min"] + config["max"]) / 2
            self.current_values[key] = mid
        
        print(f"[INIT] ESP32 MQTT Simulator: {device_id}")
        print(f"[INIT] MQTT Broker: {broker}:{port}")
        print(f"[INIT] Publishing to: {self.topic}")
        print(f"[INIT] Telemetry keys: {list(TELEMETRY_SCHEMA.keys())}")
        print("-" * 60)
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback when connected to MQTT broker."""
        if rc == 0:
            self.connected = True
            self.connection_failures = 0
            print(f"[{self.device_id}] ✓ Connected to MQTT broker")
        else:
            self.connected = False
            print(f"[{self.device_id}] ✗ Connection failed with code {rc}")
    
    def _on_disconnect(self, client, userdata, rc):
        """Callback when disconnected from MQTT broker."""
        self.connected = False
        print(f"[{self.device_id}] Disconnected from MQTT broker")
    
    def connect(self):
        """Connect to MQTT broker."""
        try:
            self.client.connect(self.broker, self.port, 60)
            self.client.loop_start()  # Start background network loop
            
            # Wait for connection
            timeout = 5
            start = time.time()
            while not self.connected and (time.time() - start) < timeout:
                time.sleep(0.1)
            
            if not self.connected:
                print(f"[{self.device_id}] Connection timeout")
                return False
            
            return True
            
        except Exception as e:
            print(f"[{self.device_id}] Connection error: {e}")
            return False
    
    def generate_telemetry(self) -> Dict[str, float]:
        """
        Generate realistic sensor readings with drift and noise.
        
        Why: Real sensors don't jump randomly - they drift gradually
        with small noise, providing more realistic simulation.
        """
        telemetry = {}
        
        for key, config in TELEMETRY_SCHEMA.items():
            # Current value with drift (gradual change)
            drift = random.uniform(-0.5, 0.5)
            noise = random.uniform(-0.1, 0.1)
            
            new_value = self.current_values[key] + drift + noise
            
            # Clamp to realistic bounds
            new_value = max(config["min"], min(config["max"], new_value))
            
            # Store for next iteration (maintaining continuity)
            self.current_values[key] = new_value
            
            # Round to 2 decimal places for cleaner display
            telemetry[key] = round(new_value, 2)
        
        return telemetry
    
    def send_telemetry(self) -> bool:
        """
        Send telemetry payload to MQTT broker.
        
        Returns: True if successful, False otherwise
        """
        if not self.connected:
            print(f"[{self.device_id}] Not connected to broker")
            return False
        
        telemetry = self.generate_telemetry()
        
        payload = {
            "telemetry": telemetry,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        try:
            # Publish to MQTT topic
            result = self.client.publish(
                self.topic,
                json.dumps(payload),
                qos=1  # At least once delivery
            )
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] ✓ {self.device_id} published: {json.dumps(telemetry)}")
                return True
            else:
                print(f"[{self.device_id}] Publish failed with code {result.rc}")
                return False
                
        except Exception as e:
            print(f"[{self.device_id}] Error: {e}")
            return False
    
    def run(self, interval: float = 2):
        """
        Main loop - continuously send telemetry at specified interval.
        
        Why: This mimics how real ESP32 firmware operates in an infinite loop,
        reading sensors and transmitting data periodically.
        """
        # Connect to broker first
        if not self.connect():
            print(f"[{self.device_id}] Failed to connect. Exiting.")
            return
        
        print(f"[{self.device_id}] Sending telemetry every {interval} seconds")
        print(f"[{self.device_id}] Press Ctrl+C to stop\n")
        
        try:
            while True:
                self.send_telemetry()
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print(f"\n[{self.device_id}] Stopped by user")
        except Exception as e:
            print(f"\n[{self.device_id}] Crashed: {e}")
        finally:
            self.client.loop_stop()
            self.client.disconnect()


import threading

def start_device(device_id, broker, port):
    simulator = ESP32MQTTSimulator(
        device_id=device_id,
        broker=broker,
        port=port
    )
    simulator.run(interval=SEND_INTERVAL)

def main():
    print(f"\n{'='*60}")
    print(f"ESP32 MQTT Simulator - Multi-Device")
    print(f"{'='*60}")
    print(f"MQTT Broker: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"Devices: {len(DEVICE_IDS)}")
    print(f"Send Interval: {SEND_INTERVAL}s")
    print(f"{'='*60}\n")
    
    threads = []

    for device_id in DEVICE_IDS:
        t = threading.Thread(target=start_device, args=(device_id, MQTT_BROKER, MQTT_PORT))
        t.daemon = True
        t.start()
        threads.append(t)
        time.sleep(0.5)  # Stagger startup

    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[STOP] All simulators stopped")

if __name__ == "__main__":
    main()
