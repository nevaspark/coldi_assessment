@echo off
setlocal

set PORT=5001

echo Checking for processes on port %PORT%...

:: Find PID using netstat and tasklist
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT% ^| findstr LISTENING') do (
    set PID=%%a
)

if defined PID (
    echo Killing process on port %PORT% with PID %PID%...
    taskkill /PID %PID% /F >nul 2>&1
) else (
    echo No process running on port %PORT%.
)

echo.
echo Starting backend...
node --watch src/index.js
