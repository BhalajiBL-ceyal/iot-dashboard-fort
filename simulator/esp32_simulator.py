"""
ESP32 Simulator - Sensor-Agnostic IoT Device Simulator

This simulates an ESP32 microcontroller sending telemetry over Wi-Fi.
It behaves exactly like real firmware but runs as a Python script.

Key Features:
- Sends generic JSON telemetry (any key-value pairs)
- Configurable device ID and telemetry schema
- Automatic reconnection on failure
- Realistic sensor value generation with drift and noise
"""

import requests
import time
import random
import json
from datetime import datetime
from typing import Dict, Any

# ==================== CONFIGURATION ====================
# Change these to simulate different devices and sensors

BACKEND_URL = "http://localhost:8000/api/telemetry"
DEVICE_IDS = [
    "ESP32_SIM_01",
    "ESP32_SIM_02",
    "ESP32_SIM_03"
]

SEND_INTERVAL = 2  # seconds

# Define your telemetry schema here - completely arbitrary!
# This simulates a multi-sensor IoT device
TELEMETRY_SCHEMA = {
    "temperature": {"min": 20, "max": 35, "unit": "°C"},
    "humidity": {"min": 40, "max": 80, "unit": "%"},
    "battery": {"min": 3.0, "max": 4.2, "unit": "V"},
    "distance": {"min": 10, "max": 200, "unit": "cm"},
    "light": {"min": 0, "max": 1000, "unit": "lux"},
}


class ESP32Simulator:
    """
    Software-based ESP32 simulator that sends telemetry over HTTP.
    
    Design: This class maintains state for realistic sensor simulation
    including drift, noise, and value persistence between readings.
    """
    
    def __init__(self, device_id: str, backend_url: str):
        self.device_id = device_id
        self.backend_url = backend_url
        self.current_values = {}
        self.connection_failures = 0
        
        # Initialize starting values at midpoint of ranges
        for key, config in TELEMETRY_SCHEMA.items():
            mid = (config["min"] + config["max"]) / 2
            self.current_values[key] = mid
        
        print(f"[INIT] ESP32 Simulator: {device_id}")
        print(f"[INIT] Backend URL: {backend_url}")
        print(f"[INIT] Telemetry keys: {list(TELEMETRY_SCHEMA.keys())}")
        print("-" * 60)
    
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
        Send telemetry payload to backend via HTTP POST.
        
        Returns: True if successful, False otherwise
        """
        telemetry = self.generate_telemetry()
        
        payload = {
            "device_id": self.device_id,
            "telemetry": telemetry,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        try:
            response = requests.post(
                self.backend_url,
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                self.connection_failures = 0
                print(f"[{datetime.now().strftime('%H:%M:%S')}] ✓ Sent: {json.dumps(telemetry)}")
                return True
            else:
                print(f"[ERROR] Backend returned status {response.status_code}")
                return False
                
        except requests.exceptions.ConnectionError:
            self.connection_failures += 1
            print(f"[ERROR] Connection failed (attempt {self.connection_failures})")
            return False
        except Exception as e:
            print(f"[ERROR] Unexpected error: {e}")
            return False
    
    def run(self, interval: int = 2):
        """
        Main loop - continuously send telemetry at specified interval.
        
        Why: This mimics how real ESP32 firmware operates in an infinite loop,
        reading sensors and transmitting data periodically.
        """
        print(f"[START] Sending telemetry every {interval} seconds")
        print("[INFO] Press Ctrl+C to stop\n")
        
        try:
            while True:
                self.send_telemetry()
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print("\n[STOP] Simulator stopped by user")
        except Exception as e:
            print(f"\n[FATAL] Simulator crashed: {e}")


import threading

def start_device(device_id):
    simulator = ESP32Simulator(
        device_id=device_id,
        backend_url=BACKEND_URL
    )
    simulator.run(interval=SEND_INTERVAL)

def main():
    threads = []

    for device_id in DEVICE_IDS:
        t = threading.Thread(target=start_device, args=(device_id,))
        t.daemon = True
        t.start()
        threads.append(t)

    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[STOP] All simulators stopped")

if __name__ == "__main__":
    main()
