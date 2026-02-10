@echo off
echo Starting Admin Dashboard...
echo.

REM Check if Maven is installed
mvn --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Maven is not installed or not in PATH
    echo Please install Maven and add it to your PATH
    pause
    exit /b 1
)

REM Check if Java is installed
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo Java is not installed or not in PATH
    echo Please install Java 17 or higher
    pause
    exit /b 1
)

echo Maven and Java are installed
echo.

REM Clean and compile
echo Cleaning and compiling...
mvn clean compile
if %errorlevel% neq 0 (
    echo Compilation failed
    pause
    exit /b 1
)

echo Compilation successful
echo.

REM Run the application
echo Starting Spring Boot application...
mvn spring-boot:run

pause
