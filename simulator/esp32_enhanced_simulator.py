"""
Enhanced ESP32 Simulator - Mimics Real ESP32 Hardware
=====================================================

This simulator accurately mimics a real ESP32 microcontroller with:
- Realistic GPIO pin mappings (matching ESP32 pinout)
- Common ESP32 sensors (DHT22, BMP280, etc.)
- WiFi connection simulation
- Pin state tracking
- Realistic sensor behaviors

Perfect for testing your IoT dashboard without physical hardware!
"""

import requests
import time
import random
import json
import math
from datetime import datetime
from typing import Dict, Any, List

# ==================== CONFIGURATION ====================

BACKEND_URL = "http://localhost:8000/api/telemetry"
DEVICE_ID = "ESP32_DEV_BOARD"  # Change this to simulate different devices
SEND_INTERVAL = 2  # seconds between telemetry transmissions

# ==================== ESP32 PIN CONFIGURATION ====================

# Simulate actual ESP32 GPIO pins with realistic sensors
ESP32_PINS = {
    # Analog Sensors (ADC capable pins)
    "D32": {  # GPIO32 - Temperature Sensor (Analog)
        "type": "analog",
        "sensor": "LM35 Temperature",
        "min": 18.0,
        "max": 38.0,
        "unit": "°C",
        "pin": 32,
        "adc": "ADC1_CH4"
    },
    "D33": {  # GPIO33 - Light Sensor (LDR)
        "type": "analog",
        "sensor": "LDR Light Sensor",
        "min": 0,
        "max": 1023,
        "unit": "lux",
        "pin": 33,
        "adc": "ADC1_CH5"
    },
    "D34": {  # GPIO34 - Soil Moisture (Input Only)
        "type": "analog",
        "sensor": "Soil Moisture",
        "min": 0,
        "max": 100,
        "unit": "%",
        "pin": 34,
        "adc": "ADC1_CH6"
    },
    "D35": {  # GPIO35 - Battery Monitor (Input Only)
        "type": "analog",
        "sensor": "Battery Voltage",
        "min": 3.0,
        "max": 4.2,
        "unit": "V",
        "pin": 35,
        "adc": "ADC1_CH7"
    },
    "VP": {  # GPIO36 - Analog Microphone
        "type": "analog",
        "sensor": "Sound Level",
        "min": 0,
        "max": 100,
        "unit": "dB",
        "pin": 36,
        "adc": "ADC1_CH0"
    },
    
    # Digital Sensors
    "D23": {  # GPIO23 - DHT22 Data Pin
        "type": "digital_sensor",
        "sensor": "DHT22 Temperature",
        "min": 20.0,
        "max": 30.0,
        "unit": "°C",
        "pin": 23
    },
    "D22": {  # GPIO22 - DHT22 Humidity
        "type": "digital_sensor",
        "sensor": "DHT22 Humidity",
        "min": 40.0,
        "max": 80.0,
        "unit": "%",
        "pin": 22
    },
    
    # Digital Output (Motor/LED control)
    "D25": {  # GPIO25 - Motor Speed (PWM)
        "type": "pwm",
        "sensor": "Motor Speed",
        "min": 0,
        "max": 255,
        "unit": "PWM",
        "pin": 25
    },
    "D26": {  # GPIO26 - LED Brightness
        "type": "pwm",
        "sensor": "LED Brightness",
        "min": 0,
        "max": 100,
        "unit": "%",
        "pin": 26
    },
    
    # Digital Input (Button/Switch)
    "D4": {  # GPIO4 - Button State
        "type": "digital_input",
        "sensor": "Button",
        "min": 0,
        "max": 1,
        "unit": "state",
        "pin": 4
    },
    "D15": {  # GPIO15 - Motion Sensor
        "type": "digital_input",
        "sensor": "Motion Detected",
        "min": 0,
        "max": 1,
        "unit": "bool",
        "pin": 15
    },
}

# Additional I2C Sensors (for pins 21/22)
I2C_SENSORS = {
    "BMP280_pressure": {
        "min": 950.0,
        "max": 1050.0,
        "unit": "hPa"
    },
    "BMP280_altitude": {
        "min": 0,
        "max": 500,
        "unit": "m"
    }
}

# System Metrics
SYSTEM_METRICS = {
    "wifi_rssi": {
        "min": -90,
        "max": -30,
        "unit": "dBm"
    },
    "free_heap": {
        "min": 100000,
        "max": 250000,
        "unit": "bytes"
    },
    "uptime": {
        "min": 0,
        "max": 999999,
        "unit": "seconds"
    }
}


class EnhancedESP32Simulator:
    """
    High-fidelity ESP32 simulator with realistic pin behaviors.
    
    Features:
    - Accurate ESP32 GPIO simulation
    - Realistic sensor value generation
    - Pin state tracking
    - WiFi connection simulation
    - Multiple sensor types
    """
    
    def __init__(self, device_id: str, backend_url: str):
        self.device_id = device_id
        self.backend_url = backend_url
        self.current_values = {}
        self.connection_failures = 0
        self.uptime = 0
        self.start_time = time.time()
        
        # Initialize all pin values at midpoints
        for pin_name, config in ESP32_PINS.items():
            mid = (config["min"] + config["max"]) / 2
            self.current_values[f"{pin_name}"] = mid
        
        # Initialize I2C sensor values
        for sensor_name, config in I2C_SENSORS.items():
            mid = (config["min"] + config["max"]) / 2
            self.current_values[sensor_name] = mid
        
        # Initialize system metrics
        for metric_name, config in SYSTEM_METRICS.items():
            if metric_name == "uptime":
                self.current_values[metric_name] = 0
            else:
                mid = (config["min"] + config["max"]) / 2
                self.current_values[metric_name] = mid
        
        print("=" * 70)
        print(f"🔵 ESP32 SIMULATOR INITIALIZED")
        print("=" * 70)
        print(f"Device ID:     {device_id}")
        print(f"Backend URL:   {backend_url}")
        print(f"Active Pins:   {len(ESP32_PINS)}")
        print(f"I2C Sensors:   {len(I2C_SENSORS)}")
        print(f"Send Interval: {SEND_INTERVAL}s")
        print("=" * 70)
        print("\n📊 Simulated Sensors:")
        for pin_name, config in ESP32_PINS.items():
            print(f"  • {pin_name} (GPIO{config['pin']}): {config['sensor']} ({config['unit']})")
        print("\n🌐 WiFi: Connected | 📡 Signal: Strong")
        print("-" * 70)
    
    def generate_realistic_value(self, current: float, min_val: float, max_val: float, 
                                 sensor_type: str = "analog") -> float:
        """
        Generate realistic sensor readings based on sensor type.
        
        Different sensors have different behaviors:
        - Analog sensors: Smooth drift with noise
        - Digital inputs: Binary states with occasional changes
        - PWM outputs: Gradual changes
        """
        
        if sensor_type == "digital_input":
            # Binary sensors change only occasionally (10% chance)
            if random.random() < 0.1:
                return 1.0 if current == 0 else 0.0
            return current
        
        elif sensor_type == "pwm":
            # PWM values change more deliberately
            drift = random.uniform(-5, 5)
            new_value = current + drift
        
        else:  # analog or digital_sensor
            # Smooth drift with small noise
            drift = random.uniform(-0.5, 0.5)
            noise = random.uniform(-0.2, 0.2)
            
            # Add periodic variation (simulates environmental changes)
            time_factor = math.sin(time.time() / 10) * 0.3
            
            new_value = current + drift + noise + time_factor
        
        # Clamp to bounds
        new_value = max(min_val, min(max_val, new_value))
        
        return new_value
    
    def generate_telemetry(self) -> Dict[str, Any]:
        """
        Generate complete telemetry payload with all sensor readings.
        """
        telemetry = {}
        
        # Update uptime
        self.uptime = int(time.time() - self.start_time)
        self.current_values["uptime"] = self.uptime
        
        # Simulate WiFi signal strength (varies slightly)
        self.current_values["wifi_rssi"] += random.uniform(-2, 2)
        self.current_values["wifi_rssi"] = max(-90, min(-30, self.current_values["wifi_rssi"]))
        
        # Generate pin readings
        for pin_name, config in ESP32_PINS.items():
            sensor_type = config["type"]
            new_value = self.generate_realistic_value(
                self.current_values[pin_name],
                config["min"],
                config["max"],
                sensor_type
            )
            
            self.current_values[pin_name] = new_value
            
            # Format based on sensor type
            if sensor_type == "digital_input":
                telemetry[pin_name] = int(new_value)
            else:
                telemetry[pin_name] = round(new_value, 2)
        
        # Generate I2C sensor readings
        for sensor_name, config in I2C_SENSORS.items():
            new_value = self.generate_realistic_value(
                self.current_values[sensor_name],
                config["min"],
                config["max"]
            )
            self.current_values[sensor_name] = new_value
            telemetry[sensor_name] = round(new_value, 2)
        
        # Add system metrics
        telemetry["wifi_rssi"] = int(self.current_values["wifi_rssi"])
        telemetry["free_heap"] = int(self.current_values["free_heap"])
        telemetry["uptime"] = self.uptime
        
        return telemetry
    
    def send_telemetry(self) -> bool:
        """
        Send telemetry to backend via HTTP POST.
        """
        telemetry = self.generate_telemetry()
        
        payload = {
            "device_id": self.device_id,
            "telemetry": telemetry,
            "timestamp": datetime.now().isoformat()  # ISO format string, not Unix timestamp
        }
        
        try:
            response = requests.post(
                self.backend_url,
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                self.connection_failures = 0
                
                # Pretty print telemetry
                timestamp = datetime.now().strftime('%H:%M:%S')
                print(f"\n[{timestamp}] ✓ TELEMETRY SENT")
                print(f"  📡 WiFi RSSI: {telemetry['wifi_rssi']} dBm")
                print(f"  🌡️  Temp (D32): {telemetry['D32']}°C")
                print(f"  💧 Humidity (D22): {telemetry['D22']}%")
                print(f"  💡 Light (D33): {telemetry['D33']} lux")
                print(f"  🔋 Battery (D35): {telemetry['D35']}V")
                print(f"  ⏱️  Uptime: {telemetry['uptime']}s")
                
                return True
            else:
                print(f"[ERROR] Backend returned status {response.status_code}")
                return False
                
        except requests.exceptions.ConnectionError:
            self.connection_failures += 1
            print(f"[ERROR] ❌ Connection failed (attempt {self.connection_failures})")
            print("        Make sure backend is running on http://localhost:8000")
            return False
        except Exception as e:
            print(f"[ERROR] Unexpected error: {e}")
            return False
    
    def run(self, interval: int = 2):
        """
        Main simulation loop - behaves like real ESP32 firmware.
        """
        print("\n🚀 STARTING ESP32 SIMULATION")
        print(f"📤 Sending telemetry every {interval} seconds")
        print("⏸️  Press Ctrl+C to stop\n")
        print("-" * 70)
        
        try:
            while True:
                success = self.send_telemetry()
                
                if not success and self.connection_failures > 5:
                    print("\n⚠️  Too many connection failures. Waiting 10s...")
                    time.sleep(10)
                    self.connection_failures = 0
                
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print("\n\n" + "=" * 70)
            print("🛑 SIMULATOR STOPPED BY USER")
            print(f"   Total uptime: {self.uptime} seconds")
            print("=" * 70)
        except Exception as e:
            print(f"\n💥 FATAL ERROR: {e}")


def main():
    """
    Entry point - creates and runs the ESP32 simulator.
    """
    simulator = EnhancedESP32Simulator(
        device_id=DEVICE_ID,
        backend_url=BACKEND_URL
    )
    
    simulator.run(interval=SEND_INTERVAL)


if __name__ == "__main__":
    main()
