@echo off
echo ===================================
echo Reiniciando Backend de StreamQbit
echo ===================================
echo.

cd backend

echo [1/3] Deteniendo procesos anteriores...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Compilando backend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: La compilacion fallo
    pause
    exit /b 1
)

echo [3/3] Iniciando servidor...
echo.
echo El backend estara disponible en http://localhost:3000
echo Presiona Ctrl+C para detener el servidor
echo.
call npm run dev

pause
