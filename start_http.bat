@echo off
REM Quick Start Script for IoT Dashboard - HTTP Mode

echo ============================================================
echo IoT Dashboard - HTTP Mode (Recommended)
echo ============================================================
echo.

echo This uses HTTP telemetry instead of MQTT.
echo All features work exactly the same!
echo.

echo [1/3] Starting Backend (FastAPI)...
cd /d "%~dp0"
cd backend
start "IoT Backend" cmd /k "uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 4 >nul

echo.
echo [2/3] Starting ESP32 HTTP Simulator...
cd ..\simulator
start "ESP32 HTTP Simulator" cmd /k "python esp32_simulator.py"
timeout /t 2 >nul

echo.
echo [3/3] Starting Frontend (React PWA)...
cd ..\frontend
start "IoT Dashboard Frontend" cmd /k "npm start"

echo.
echo ============================================================
echo All components started!
echo ============================================================
echo.
echo Services:
echo   - Backend API: http://localhost:8000
echo   - Frontend PWA: http://localhost:3000
echo.
echo Open your browser to: http://localhost:3000
echo.
echo Check the opened windows for logs and status.
echo.
pause
