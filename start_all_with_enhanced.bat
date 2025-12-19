@echo off
REM Quick Start Script for IoT Dashboard with BOTH Simulators

echo ============================================================
echo IoT Dashboard - MQTT + Enhanced Simulator Edition
echo ============================================================
echo.

echo [1/5] Starting Python MQTT Broker...
cd /d "%~dp0"
start "MQTT Broker" cmd /k "python mqtt_broker.py"
timeout /t 3 >nul

echo.
echo [2/5] Starting Backend (FastAPI + MQTT Listener)...
cd backend
start "IoT Backend" cmd /k "uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 >nul

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
echo   - ESP32_SENSOR_01 (MQTT)
echo   - ESP32_DEV_BOARD (Enhanced/HTTP)
echo.
echo Check the opened windows for logs and status.
echo.
pause
