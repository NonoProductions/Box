@echo off
echo Starting Smart Box PWA Server...
echo.

REM Prüfe ob Python installiert ist
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python ist nicht installiert oder nicht im PATH!
    echo.
    echo Bitte installieren Sie Python von https://www.python.org/
    echo Oder verwenden Sie einen anderen Server (siehe README.md)
    pause
    exit /b 1
)

REM Starte Python Server
python server.py

pause

