@echo off
echo ============================================================
echo MQTT Connection Diagnostic Tool
echo ============================================================
echo.
echo This will test if the MQTT broker is accessible.
echo.
echo IMPORTANT: Make sure the MQTT Broker is running first!
echo   (You should have a window titled "MQTT Broker")
echo.
pause

cd /d "%~dp0\simulator"
python test_mqtt_connection.py
