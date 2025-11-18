@echo off
REM Script para descargar los últimos cambios del repositorio
REM Ejecuta este archivo para obtener todos los scripts .bat

echo ========================================
echo Descargando ultimos cambios
echo ========================================
echo.

REM Ir al directorio backend
cd /d "%~dp0"

echo Verificando git...
git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Git no esta instalado
    echo Descarga Git desde: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo.
echo Descargando cambios de la rama actual...
git pull

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo DESCARGA EXITOSA!
    echo ========================================
    echo.
    echo Archivos descargados:
    dir /b *.bat *.md
    echo.
    echo Ahora puedes ejecutar:
    echo   build-and-start.bat  - Para configurar todo
    echo   COMPILAR_AHORA.bat   - Para solo compilar
    echo   start-dev.bat        - Modo desarrollo
    echo.
) else (
    echo.
    echo ERROR al descargar cambios
    echo Verifica tu conexion a internet
    echo.
)

pause
