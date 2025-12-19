"""
CEYEL-Style Machine State Inference Engine
Analyzes telemetry data to infer machine states: RUNNING, IDLE, FAULT
"""
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from enum import Enum
import statistics

class MachineState(str, Enum):
    RUNNING = "RUNNING"
    IDLE = "IDLE"
    FAULT = "FAULT"
    UNKNOWN = "UNKNOWN"

class StateInferenceEngine:
    def __init__(self):
        self.device_states = {}  # {device_id: {state, confidence, timestamp, reason}}
        self.telemetry_buffer = {}  # {device_id: {key: [values]}}
        self.buffer_size = 10  # Number of samples to analyze
        
        # Configurable thresholds
        self.thresholds = {
            "temperature_max": 80.0,  # Above this = potential fault
            "temperature_min": 0.0,   # Below this = potential fault
            "vibration_max": 50.0,    # High vibration = running
            "vibration_idle": 5.0,    # Low vibration = idle
            "current_running": 1.0,   # Current draw when running
            "current_idle": 0.1,      # Current draw when idle
            "variance_threshold": 5.0,  # Data variance threshold
        }
    
    def update_telemetry(self, device_id: str, telemetry: Dict[str, float]):
        """Update telemetry buffer and infer state"""
        if device_id not in self.telemetry_buffer:
            self.telemetry_buffer[device_id] = {}
        
        # Add telemetry to buffer
        for key, value in telemetry.items():
            if key not in self.telemetry_buffer[device_id]:
                self.telemetry_buffer[device_id][key] = []
            
            buffer = self.telemetry_buffer[device_id][key]
            buffer.append(value)
            
            # Keep only last N samples
            if len(buffer) > self.buffer_size:
                buffer.pop(0)
        
        # Infer state from current telemetry
        state_info = self.infer_state(device_id, telemetry)
        self.device_states[device_id] = state_info
        
        return state_info
    
    def infer_state(self, device_id: str, current_telemetry: Dict[str, float]) -> Dict:
        """Infer machine state from telemetry data"""
        reasons = []
        confidence = 0.0
        state = MachineState.UNKNOWN
        
        # Get historical data
        history = self.telemetry_buffer.get(device_id, {})
        
        # Rule 1: Check for fault conditions (highest priority)
        fault_score, fault_reasons = self._check_fault_conditions(current_telemetry, history)
        if fault_score > 0.7:
            state = MachineState.FAULT
            confidence = fault_score
            reasons = fault_reasons
        else:
            # Rule 2: Check for running vs idle
            activity_score, activity_reasons = self._check_activity_level(current_telemetry, history)
            
            if activity_score > 0.6:
                state = MachineState.RUNNING
                confidence = activity_score
                reasons = activity_reasons
            elif activity_score < 0.3:
                state = MachineState.IDLE
                confidence = 1.0 - activity_score
                reasons = activity_reasons
            else:
                # Uncertain state
                state = MachineState.UNKNOWN
                confidence = 0.5
                reasons = ["Insufficient data for confident state inference"]
        
        return {
            "state": state.value,
            "confidence": round(confidence * 100, 1),
            "timestamp": datetime.now().isoformat(),
            "reasons": reasons,
            "metrics": self._calculate_metrics(current_telemetry, history)
        }
    
    def _check_fault_conditions(self, telemetry: Dict, history: Dict) -> tuple:
        """Check for fault indicators"""
        reasons = []
        fault_score = 0.0
        
        # Temperature out of range
        if "temperature" in telemetry:
            temp = telemetry["temperature"]
            if temp > self.thresholds["temperature_max"]:
                reasons.append(f"Temperature critical: {temp:.1f}°C")
                fault_score += 0.4
            elif temp < self.thresholds["temperature_min"]:
                reasons.append(f"Temperature too low: {temp:.1f}°C")
                fault_score += 0.3
        
        # Abnormal vibration
        if "vibration" in telemetry and "vibration" in history:
            vibration = telemetry["vibration"]
            if len(history["vibration"]) > 3:
                avg_vib = statistics.mean(history["vibration"])
                if vibration > avg_vib * 2:
                    reasons.append(f"Abnormal vibration: {vibration:.1f}")
                    fault_score += 0.4
        
        # Sudden current spike or drop
        if "current" in telemetry and "current" in history:
            current = telemetry["current"]
            if len(history["current"]) > 3:
                avg_current = statistics.mean(history["current"])
                if abs(current - avg_current) > avg_current * 1.5:
                    reasons.append(f"Abnormal current: {current:.2f}A")
                    fault_score += 0.3
        
        # Battery critically low
        if "battery" in telemetry:
            battery = telemetry["battery"]
            if battery < 10:
                reasons.append(f"Battery critical: {battery:.0f}%")
                fault_score += 0.2
        
        # WiFi signal lost
        if "rssi" in telemetry:
            rssi = telemetry["rssi"]
            if rssi < -90:
                reasons.append(f"Weak signal: {rssi} dBm")
                fault_score += 0.1
        
        return min(fault_score, 1.0), reasons
    
    def _check_activity_level(self, telemetry: Dict, history: Dict) -> tuple:
        """Determine if machine is running or idle"""
        reasons = []
        activity_score = 0.0
        max_score = 0.0
        
        # Check current draw
        if "current" in telemetry:
            current = telemetry["current"]
            if current > self.thresholds["current_running"]:
                reasons.append(f"High current draw: {current:.2f}A")
                activity_score += 0.4
                max_score += 0.4
            elif current < self.thresholds["current_idle"]:
                reasons.append(f"Low current draw: {current:.2f}A")
                max_score += 0.4
            else:
                max_score += 0.4
        
        # Check vibration
        if "vibration" in telemetry:
            vibration = telemetry["vibration"]
            if vibration > self.thresholds["vibration_max"]:
                reasons.append(f"High vibration: {vibration:.1f}")
                activity_score += 0.3
                max_score += 0.3
            elif vibration < self.thresholds["vibration_idle"]:
                reasons.append(f"Low vibration: {vibration:.1f}")
                max_score += 0.3
            else:
                activity_score += 0.15
                max_score += 0.3
        
        # Check data variance (running machines have more variance)
        if "sensor_data" in history or "distance" in history:
            key = "sensor_data" if "sensor_data" in history else "distance"
            if len(history[key]) > 3:
                variance = statistics.variance(history[key])
                if variance > self.thresholds["variance_threshold"]:
                    reasons.append(f"High data variance: {variance:.1f}")
                    activity_score += 0.3
                    max_score += 0.3
                else:
                    max_score += 0.3
        
        # Normalize score
        if max_score > 0:
            activity_score = activity_score / max_score
        
        if not reasons:
            reasons = ["Nominal operation"]
        
        return activity_score, reasons
    
    def _calculate_metrics(self, telemetry: Dict, history: Dict) -> Dict:
        """Calculate statistical metrics"""
        metrics = {}
        
        for key in ["temperature", "vibration", "current", "battery"]:
            if key in history and len(history[key]) > 1:
                values = history[key]
                metrics[key] = {
                    "current": telemetry.get(key, 0),
                    "avg": round(statistics.mean(values), 2),
                    "min": round(min(values), 2),
                    "max": round(max(values), 2),
                    "trend": "up" if values[-1] > values[0] else "down" if values[-1] < values[0] else "stable"
                }
        
        return metrics
    
    def get_device_state(self, device_id: str) -> Optional[Dict]:
        """Get current state for a device"""
        return self.device_states.get(device_id)
    
    def get_all_states(self) -> Dict:
        """Get states for all devices"""
        return self.device_states

# Global inference engine instance
inference_engine = StateInferenceEngine()
