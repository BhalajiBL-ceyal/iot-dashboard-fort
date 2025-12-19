@echo off
REM Quick Start Script for IoT Dashboard with MQTT + Enhanced Simulators (Event Loop Fixed)

echo ============================================================
echo IoT Dashboard - MQTT + PWA Edition
echo ============================================================
echo.

echo [1/5] Starting Python MQTT Broker...
cd /d "%~dp0"
start "MQTT Broker" cmd /k "python mqtt_broker.py"
echo Waiting for MQTT Broker to initialize...
timeout /t 5 >nul

echo.
echo [2/5] Starting Backend (FastAPI + MQTT Listener)...
cd backend
start "IoT Backend" cmd /k "uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo Waiting for Backend to connect to MQTT...
timeout /t 5 >nul

echo.
echo [3/5] Starting ESP32 MQTT Simulator...
cd ..\simulator
start "ESP32 MQTT Simulator" cmd /k "python esp32_mqtt_simulator.py"
timeout /t 2 >nul

echo.
echo [4/5] Starting ESP32 Enhanced Simulator...
start "ESP32 Enhanced Simulator" cmd /k "python esp32_enhanced_simulator.py"
timeout /t 2 >nul

echo.
echo [5/5] Starting Frontend (React PWA)...
cd ..\frontend
start "IoT Dashboard Frontend" cmd /k "npm start"

echo.
echo ============================================================
echo All components started!
echo ============================================================
echo.
echo Services:
echo   - MQTT Broker: localhost:1883 (Python-based)
echo   - Backend API: http://localhost:8000
echo   - Frontend PWA: http://localhost:3000
echo.
echo Simulators Running:
echo   - ESP32_SENSOR_01 (MQTT - 4 sensors)
echo   - ESP32_DEV_BOARD (Enhanced HTTP - 15+ sensors)
echo.
echo Check the opened windows for logs and status.
echo.
echo NOTE: Using Python MQTT broker for development.
echo For production, install Mosquitto: https://mosquitto.org/download/
echo.
pause
