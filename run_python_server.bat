@echo off
echo Starting Python Admin Dashboard Server...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed or not in PATH
    echo Please install Python 3.7 or higher
    echo You can download it from: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Python is installed
echo.

REM Install requirements if needed
if exist requirements.txt (
    echo Installing requirements...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo Failed to install requirements
        pause
        exit /b 1
    )
    echo Requirements installed successfully
    echo.
)

REM Start the Flask server
echo Starting Flask server...
python app.py

pause
