@echo off
REM Mosquitto MQTT Broker Setup Helper

echo ============================================================
echo Mosquitto MQTT Broker Setup
echo ============================================================
echo.

REM Check if Mosquitto is already installed
where mosquitto >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Mosquitto is already installed
    echo.
    goto :check_service
) else (
    echo ✗ Mosquitto not found in PATH
    echo.
)

:install_options
echo Installation Options:
echo.
echo [1] Download installer from official website (Recommended)
echo [2] Install via Chocolatey (if you have it)
echo [3] Use Docker instead
echo [4] Skip and configure manually
echo.
set /p choice="Select option (1-4): "

if "%choice%"=="1" goto :download
if "%choice%"=="2" goto :chocolatey
if "%choice%"=="3" goto :docker
if "%choice%"=="4" goto :skip
goto :install_options

:download
echo.
echo Opening Mosquitto download page...
start https://mosquitto.org/download/
echo.
echo Please:
echo 1. Download the Windows installer
echo 2. Run the installer
echo 3. Choose "Service" installation
echo 4. Come back here and press any key
echo.
pause
goto :check_service

:chocolatey
echo.
echo Installing Mosquitto via Chocolatey...
choco install mosquitto -y
if %errorlevel% equ 0 (
    echo ✓ Installation successful
    goto :check_service
) else (
    echo ✗ Installation failed
    echo Please install Chocolatey first or use option 1
    pause
    goto :install_options
)

:docker
echo.
echo Docker installation:
echo.
echo Run this command in a separate terminal:
echo   docker run -d -p 1883:1883 --name mosquitto eclipse-mosquitto
echo.
echo This will:
echo   - Download Mosquitto Docker image
echo   - Start broker on port 1883
echo   - Run in background
echo.
pause
goto :end

:skip
echo.
echo Manual configuration required
echo Please install Mosquitto manually from: https://mosquitto.org/download/
echo.
pause
goto :end

:check_service
echo.
echo Checking Mosquitto service status...
sc query mosquitto >nul 2>&1
if %errorlevel% equ 0 (
    sc query mosquitto | find "RUNNING" >nul
    if %errorlevel% equ 0 (
        echo ✓ Mosquitto service is RUNNING
        goto :test_connection
    ) else (
        echo ✗ Mosquitto service is installed but not running
        echo.
        echo Starting service...
        net start mosquitto
        if %errorlevel% equ 0 (
            echo ✓ Service started successfully
            goto :test_connection
        ) else (
            echo ✗ Failed to start service (may need admin rights)
            echo Please run as Administrator or start service manually
            pause
            goto :end
        )
    )
) else (
    echo ✗ Mosquitto service not found
    echo.
    echo If you just installed, you may need to:
    echo 1. Restart this terminal
    echo 2. Check installation completed successfully
    echo 3. Ensure "Service" option was selected during install
    echo.
    pause
    goto :end
)

:test_connection
echo.
echo Testing MQTT broker...
echo.

REM Create a test config file
echo listener 1883 > test_mosquitto.conf
echo allow_anonymous true >> test_mosquitto.conf

echo Testing connection to localhost:1883...
timeout /t 2 >nul

REM Check if port is listening
netstat -an | find "1883" | find "LISTENING" >nul
if %errorlevel% equ 0 (
    echo ✓ MQTT broker listening on port 1883
    echo.
    echo ============================================================
    echo SUCCESS! Mosquitto is ready
    echo ============================================================
    echo.
    echo You can now run the IoT Dashboard:
    echo   - Run: start_all.bat
    echo   - Or start backend: cd backend ^&^& uvicorn main:app --reload
    echo.
) else (
    echo ✗ Port 1883 not listening
    echo.
    echo Please check:
    echo 1. Mosquitto service is running
    echo 2. Firewall allows port 1883
    echo 3. No other application using port 1883
    echo.
)

del test_mosquitto.conf 2>nul

:end
echo.
pause
