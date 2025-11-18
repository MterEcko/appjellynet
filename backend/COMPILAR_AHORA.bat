@echo off
REM Script RAPIDO - Ahora que Prisma funciona, compilemos
REM Usa este script AHORA que ya generaste Prisma exitosamente

echo ========================================
echo Compilando Backend - Ahora que Prisma funciona!
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Compilando TypeScript...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR al compilar. Verifica los errores arriba.
    echo.
    pause
    exit /b 1
)
echo OK - Compilado exitosamente!
echo.

echo [2/3] Verificando dist\server.js...
if not exist dist\server.js (
    echo ERROR: dist\server.js no existe
    pause
    exit /b 1
)
echo OK - Archivo dist\server.js existe!
echo.

echo [3/3] Listo para iniciar!
echo.
echo ========================================
echo COMPILACION EXITOSA!
echo ========================================
echo.
echo Ahora puedes ejecutar:
echo   npm start
echo.
echo O ejecuta las migraciones primero:
echo   npx prisma migrate dev --name init
echo   npm start
echo.
pause
