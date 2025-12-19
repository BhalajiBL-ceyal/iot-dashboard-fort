@echo off
REM Manual Step-by-Step Startup Script
REM This ensures proper startup order with verification

echo ============================================================
echo IoT Dashboard - Manual Startup Helper
echo ============================================================
echo.
echo This script will start services ONE AT A TIME with pauses
echo so you can verify each service before continuing.
echo.
echo ============================================================
pause

echo.
echo [1/5] Starting MQTT Broker...
echo ============================================================
cd /d "%~dp0"
start "MQTT Broker" cmd /k "python mqtt_broker.py"
echo.
echo Wait for the MQTT Broker window to show:
echo   "[MQTT Broker] Ready to accept connections..."
echo.
pause

echo.
echo [2/5] Starting Backend...
echo ============================================================
cd backend
start "IoT Backend" cmd /k "uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo.
echo IMPORTANT: Wait for the Backend window to show:
echo   "[MQTT] Connected to broker at localhost:1883"
echo   "[MQTT] Subscribed to: app/device/+/telemetry"
echo.
echo If you DON'T see these messages, the MQTT connection failed!
echo.
pause

echo.
echo [3/5] Starting MQTT Simulator (3 devices)...
echo ============================================================
cd ..\simulator
start "ESP32 MQTT Simulator" cmd /k "python esp32_mqtt_simulator.py"
echo.
echo Wait for the MQTT Simulator window to show:
echo   "[ESP32_SENSOR_01] Connected to MQTT broker"
echo   "[ESP32_SENSOR_02] Connected to MQTT broker"
echo   "[ESP32_SENSOR_03] Connected to MQTT broker"
echo.
echo THEN check the Backend window - it should show:
echo   "[MQTT] Received from ESP32_SENSOR_01: {...}"
echo.
pause

echo.
echo [4/5] Starting Enhanced Simulator...
echo ============================================================
start "ESP32 Enhanced Simulator" cmd /k "python esp32_enhanced_simulator.py"
echo.
echo Wait for telemetry messages to appear.
echo.
pause

echo.
echo [5/5] Starting Frontend...
echo ============================================================
cd ..\frontend
start "IoT Dashboard Frontend" cmd /k "npm start"
echo.
echo Wait for browser to open at http://localhost:3000
echo.
echo ============================================================
echo All services started!
echo ============================================================
echo.
echo You should now see 4 devices in the dashboard:
echo   - ESP32_SENSOR_01 (MQTT)
echo   - ESP32_SENSOR_02 (MQTT)
echo   - ESP32_SENSOR_03 (MQTT)
echo   - ESP32_DEV_BOARD (HTTP)
echo.
echo If you don't see all 4 devices:
echo   1. Refresh the dashboard (Ctrl+F5)
echo   2. Check the Backend window for "[MQTT] Received..." messages
echo   3. Check each simulator window for connection confirmations
echo.
pause
