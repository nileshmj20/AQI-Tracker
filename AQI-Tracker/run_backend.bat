@echo off
setlocal
cd /d "%~dp0"
cls
echo AQI Tracker is starting...
echo.
python main.py
pause
