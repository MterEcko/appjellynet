@echo off
REM StreamQbit Backend Setup Script for Windows
REM Este script automatiza la configuración inicial del backend

echo ======================================
echo StreamQbit Backend Setup
echo ======================================
echo.

REM Step 1: Check Node.js
echo [1/7] Verificando Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js no esta instalado
    pause
    exit /b 1
)
node --version
echo OK: Node.js encontrado
echo.

REM Step 2: Check .env file
echo [2/7] Verificando archivo .env...
if not exist .env (
    echo Copiando .env.example a .env...
    copy .env.example .env
    echo IMPORTANTE: Edita el archivo .env con tus configuraciones
) else (
    echo OK: Archivo .env encontrado
)
echo.

REM Step 3: Install dependencies
echo [3/7] Instalando dependencias...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error al instalar dependencias
    pause
    exit /b 1
)
echo OK: Dependencias instaladas
echo.

REM Step 4: Copy Prisma schema if needed
echo [4/7] Verificando Prisma schema...
if not exist prisma mkdir prisma
if exist src\prisma\schema.prisma (
    if not exist prisma\schema.prisma (
        echo Copiando schema.prisma a la ubicacion correcta...
        copy src\prisma\schema.prisma prisma\schema.prisma
    )
)
echo OK: Prisma schema verificado
echo.

REM Step 5: Generate Prisma Client
echo [5/7] Generando cliente de Prisma...
set PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo Error al generar cliente de Prisma
    echo Esto puede deberse a problemas temporales con los servidores de Prisma
    echo Intenta ejecutar manualmente: npx prisma generate
    echo.
    echo Continuando con el resto de la configuracion...
) else (
    echo OK: Cliente de Prisma generado
)
echo.

REM Step 6: Compile TypeScript
echo [6/7] Compilando TypeScript...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Advertencia: Hubo errores al compilar, pero el codigo puede funcionar parcialmente
) else (
    echo OK: TypeScript compilado
)
echo.

REM Step 7: Database setup (optional)
echo [7/7] Configuracion de base de datos (opcional)
set /p MIGRATE="Quieres ejecutar las migraciones de Prisma ahora? (s/n): "
if /i "%MIGRATE%"=="s" (
    call npx prisma migrate dev --name init
    if %ERRORLEVEL% NEQ 0 (
        echo Error al aplicar migraciones
        echo Asegurate de que PostgreSQL este corriendo y el DATABASE_URL en .env sea correcto
    ) else (
        echo OK: Migraciones aplicadas
    )
) else (
    echo Saltando migraciones. Ejecuta 'npm run prisma:migrate' cuando estes listo
)
echo.

echo ======================================
echo Setup completado!
echo ======================================
echo.
echo Proximos pasos:
echo 1. Edita el archivo .env con tus configuraciones
echo 2. Asegurate de que PostgreSQL este corriendo
echo 3. Ejecuta 'npm run prisma:migrate' para crear las tablas
echo 4. Ejecuta 'npm start' para iniciar el servidor
echo    O 'npm run dev' para modo desarrollo
echo.
pause
