@echo off
REM Start ESP32 Enhanced Simulator
echo ============================================================
echo Starting ESP32 Enhanced Simulator
echo ============================================================
echo.

cd /d "%~dp0\simulator"
python esp32_enhanced_simulator.py

pause
