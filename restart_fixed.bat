@echo off
echo ============================================================
echo QUICK RESTART - Fixed MQTT Broker
echo ============================================================
echo.
echo This will restart all services with the FIXED MQTT broker.
echo.
echo IMPORTANT: Close ALL previous command windows first!
echo   - MQTT Broker
echo   - IoT Backend
echo   - ESP32 MQTT Simulator
echo   - ESP32 Enhanced Simulator  
echo   - IoT Dashboard Frontend
echo.
pause

echo.
echo [1/5] Starting FIXED MQTT Broker...
cd /d "%~dp0"
start "MQTT Broker" cmd /k "python mqtt_broker.py"
echo Waiting for broker to start...
timeout /t 5 >nul

echo.
echo [2/5] Starting Backend...
cd backend
start "IoT Backend" cmd /k "uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo Waiting for backend to connect to MQTT...
timeout /t 6 >nul

echo.
echo [3/5] Starting MQTT Simulator (3 devices)...
cd ..\simulator
start "ESP32 MQTT Simulator" cmd /k "python esp32_mqtt_simulator.py"
timeout /t 3 >nul

echo.
echo [4/5] Starting Enhanced Simulator...
start "ESP32 Enhanced Simulator" cmd /k "python esp32_enhanced_simulator.py"
timeout /t 2 >nul

echo.
echo [5/5] Starting Frontend...
cd ..\frontend
start "IoT Dashboard Frontend" cmd /k "npm start"

echo.
echo ============================================================
echo All services started with FIXED MQTT broker!
echo ============================================================
echo.
echo CRITICAL: Check the Backend window for:
echo   [MQTT] ✓ Connected to broker at localhost:1883
echo   [MQTT] ✓ Subscribed to: app/device/+/telemetry
echo   [MQTT] Received from ESP32_SENSOR_01: {...}  ← THIS IS KEY!
echo.
echo If you see "[MQTT] Connection error", the fix didn't work.
echo If you see "[MQTT] Received", IT WORKED!
echo.
echo Expected devices in dashboard (http://localhost:3000):
echo   - ESP32_SENSOR_01
echo   - ESP32_SENSOR_02
echo   - ESP32_SENSOR_03
echo   - ESP32_DEV_BOARD
echo.
pause
