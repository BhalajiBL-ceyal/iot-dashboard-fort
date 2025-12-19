@echo off
title ESP32 Simulator
color 0A

echo.
echo ========================================
echo  ESP32 SIMULATOR - QUICK START
echo ========================================
echo.

REM Check if backend is running
echo [1/3] Checking backend status...
timeout /t 1 /nobreak >nul
curl -s http://localhost:8000/api/devices >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Backend is not running!
    echo.
    echo Please start the backend first:
    echo   1. Open a new terminal
    echo   2. Run: cd backend
    echo   3. Run: python main.py
    echo.
    pause
    exit /b 1
)

echo [OK] Backend is running!
echo.

REM Check if requirements are installed
echo [2/3] Checking dependencies...
timeout /t 1 /nobreak >nul
python -c "import requests" >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [INSTALLING] Installing dependencies...
    pip install -r requirements.txt
    echo.
)

echo [OK] Dependencies ready!
echo.

REM Run the simulator
echo [3/3] Starting ESP32 Simulator...
echo.
echo ========================================
echo  SIMULATION ACTIVE
echo ========================================
echo.
echo Device: ESP32_DEV_BOARD
echo Backend: http://localhost:8000
echo Dashboard: http://localhost:3001
echo.
echo Press Ctrl+C to stop
echo ----------------------------------------
echo.

python esp32_enhanced_simulator.py

echo.
echo ========================================
echo  SIMULATOR STOPPED
echo ========================================
echo.
pause
