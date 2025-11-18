@echo off
REM Script SIMPLE - Solo verifica e intenta arrancar
REM Para cuando ya tienes todo configurado

echo ========================================
echo StreamQbit Backend - Inicio Rapido
echo ========================================
echo.

REM Ir al directorio backend
cd /d "%~dp0"

REM Verificar que existan dependencias
if not exist node_modules (
    echo ERROR: Faltan dependencias
    echo Ejecuta primero: npm install
    pause
    exit /b 1
)

REM Verificar .env
if not exist .env (
    echo ERROR: Falta archivo .env
    echo Copia .env.example a .env
    pause
    exit /b 1
)

echo Verificando Prisma...
call npx prisma generate >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ============================================
    echo ERROR: Prisma no esta configurado
    echo ============================================
    echo.
    echo Los servidores de Prisma estan caidos o no has generado el cliente.
    echo.
    echo Opciones:
    echo 1. Espera e intenta: npx prisma generate
    echo 2. Usa modo desarrollo: start-dev.bat
    echo.
    pause
    exit /b 1
)

echo Compilando TypeScript...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: No se pudo compilar TypeScript
    echo Usa modo desarrollo: start-dev.bat
    pause
    exit /b 1
)

echo.
echo Iniciando servidor...
call npm start

pause
