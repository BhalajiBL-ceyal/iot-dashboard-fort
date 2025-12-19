@echo off
echo ============================================================
echo EVENT LOOP FIX - Restart Services
echo ============================================================
echo.
echo Fixed: "There is no current event loop in thread" error
echo.
echo CLOSE ALL PREVIOUS WINDOWS FIRST!
echo.
pause

echo.
echo [1/5] Starting MQTT Broker...
cd /d "%~dp0"
start "MQTT Broker" cmd /k "python mqtt_broker.py"
timeout /t 5 >nul

echo.
echo [2/5] Starting FIXED Backend...
cd backend
start "IoT Backend" cmd /k "uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 6 >nul

echo.
echo [3/5] Starting MQTT Simulator...
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
echo ALL SERVICES STARTED WITH EVENT LOOP FIX!
echo ============================================================
echo.
echo CRITICAL: Check Backend window - you should NOW see:
echo   [MQTT] Received from ESP32_SENSOR_01: {...}
echo.
echo   NO MORE "Error processing message" errors!
echo.
echo Dashboard should show VALUES for all 4 devices:
echo   - ESP32_SENSOR_01 (with values!)
echo   - ESP32_SENSOR_02 (with values!)
echo   - ESP32_SENSOR_03 (with values!)
echo   - ESP32_DEV_BOARD (with values!)
echo.
pause
