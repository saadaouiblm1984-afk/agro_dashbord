@echo off
echo Starting Standalone Python Admin Dashboard Server...
echo.

REM Try different Python commands
echo Checking for Python installation...

REM Try python first
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Found Python: 
    python --version
    echo.
    echo Starting server...
    python standalone_server.py
    goto :end
)

REM Try python3
python3 --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Found Python3:
    python3 --version
    echo.
    echo Starting server...
    python3 standalone_server.py
    goto :end
)

REM Try py
py --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Found Python Launcher:
    py --version
    echo.
    echo Starting server...
    py standalone_server.py
    goto :end
)

echo Python is not installed or not in PATH
echo.
echo Please install Python from: https://www.python.org/downloads/
echo Make sure to check "Add Python to PATH" during installation
echo.
echo Alternative: You can use the PowerShell server (simple_server.ps1)
echo.

:end
pause
