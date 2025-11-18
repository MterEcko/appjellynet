@echo off
REM Script completo para compilar y arrancar StreamQbit Backend
REM Creado para solucionar el error "Cannot find module dist/server.js"

echo ========================================
echo StreamQbit Backend - Compilar y Arrancar
echo ========================================
echo.

REM Paso 1: Verificar Node.js
echo [Paso 1/6] Verificando Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no esta instalado
    echo Descarga Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo OK
echo.

REM Paso 2: Instalar dependencias
echo [Paso 2/6] Instalando dependencias de npm...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR al instalar dependencias
    pause
    exit /b 1
)
echo OK
echo.

REM Paso 3: Generar Cliente de Prisma
echo [Paso 3/6] Generando cliente de Prisma...
echo NOTA: Si esto falla, los servidores de Prisma pueden estar caidos temporalmente
echo Espera unas horas y vuelve a intentar
echo.

REM Intentar generar Prisma
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ============================================
    echo ADVERTENCIA: Error al generar cliente de Prisma
    echo ============================================
    echo.
    echo Esto probablemente se debe a que los servidores de Prisma estan caidos.
    echo El codigo NO funcionara sin el cliente de Prisma.
    echo.
    echo Soluciones:
    echo 1. Espera unas horas e intenta nuevamente
    echo 2. Ejecuta manualmente: npx prisma generate
    echo 3. Si persiste, contacta soporte
    echo.
    set /p CONTINUE="Deseas continuar de todas formas? (s/n): "
    if /i not "%CONTINUE%"=="s" (
        echo Proceso cancelado
        pause
        exit /b 1
    )
) else (
    echo OK - Cliente de Prisma generado
)
echo.

REM Paso 4: Compilar TypeScript
echo [Paso 4/6] Compilando TypeScript...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ADVERTENCIA: Hubo errores al compilar TypeScript
    echo Esto puede deberse a que Prisma no genero los tipos
    echo.
    set /p CONTINUE="Deseas continuar de todas formas? (s/n): "
    if /i not "%CONTINUE%"=="s" (
        echo Proceso cancelado
        pause
        exit /b 1
    )
) else (
    echo OK - TypeScript compilado
)
echo.

REM Paso 5: Verificar archivo compilado
echo [Paso 5/6] Verificando que exista dist\server.js...
if not exist dist\server.js (
    echo ERROR: El archivo dist\server.js NO fue creado
    echo La compilacion fallo. Verifica los errores arriba.
    pause
    exit /b 1
)
echo OK - dist\server.js existe
echo.

REM Paso 6: Verificar Base de Datos
echo [Paso 6/6] Verificando configuracion de base de datos...
echo.
echo IMPORTANTE: Asegurate de que:
echo 1. PostgreSQL este corriendo en el puerto 5433
echo 2. La base de datos 'streamqbit' exista
echo.
echo Para crear la base de datos, ejecuta en PostgreSQL:
echo   CREATE DATABASE streamqbit;
echo.
echo Luego ejecuta las migraciones:
echo   npm run prisma:migrate
echo.
set /p DB_READY="La base de datos esta lista? (s/n): "
if /i not "%DB_READY%"=="s" (
    echo.
    echo Por favor configura la base de datos primero
    echo Pasos:
    echo 1. Abre pgAdmin o psql
    echo 2. Ejecuta: CREATE DATABASE streamqbit;
    echo 3. Vuelve a ejecutar este script
    pause
    exit /b 0
)
echo.

REM Intentar ejecutar migraciones (opcional)
set /p RUN_MIGRATIONS="Deseas ejecutar las migraciones de Prisma ahora? (s/n): "
if /i "%RUN_MIGRATIONS%"=="s" (
    echo Ejecutando migraciones...
    call npx prisma migrate dev --name init
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR al ejecutar migraciones
        echo Verifica que:
        echo 1. PostgreSQL este corriendo
        echo 2. Las credenciales en .env sean correctas
        echo 3. La base de datos 'streamqbit' exista
        pause
        exit /b 1
    )
)
echo.

echo ========================================
echo Todo listo! Iniciando servidor...
echo ========================================
echo.
echo Si ves el mensaje "Server running on port 3000", todo funciono correctamente
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
pause
echo.

REM Iniciar el servidor
call npm start

pause
