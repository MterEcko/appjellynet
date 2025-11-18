@echo off
REM Script ALTERNATIVO para ejecutar backend sin compilar (modo desarrollo)
REM Usa tsx para ejecutar TypeScript directamente sin necesidad de compilar
REM Útil cuando Prisma no está disponible y no se puede compilar

echo ========================================
echo StreamQbit Backend - Modo Desarrollo
echo (Sin compilar - usando tsx)
echo ========================================
echo.

REM Paso 1: Verificar Node.js
echo [1/5] Verificando Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no esta instalado
    pause
    exit /b 1
)
node --version
echo OK
echo.

REM Paso 2: Instalar dependencias
echo [2/5] Verificando dependencias...
if not exist node_modules (
    echo Instalando dependencias...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR al instalar dependencias
        pause
        exit /b 1
    )
) else (
    echo OK - Dependencias ya instaladas
)
echo.

REM Paso 3: Verificar .env
echo [3/5] Verificando archivo .env...
if not exist .env (
    echo ERROR: No existe archivo .env
    echo Copia .env.example a .env y configuralo
    pause
    exit /b 1
)
echo OK
echo.

REM Paso 4: Intentar generar Prisma (sin detener si falla)
echo [4/5] Intentando generar cliente de Prisma...
set PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
call npx prisma generate >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo OK - Cliente de Prisma generado
) else (
    echo.
    echo ============================================
    echo ADVERTENCIA: Prisma no pudo generarse
    echo ============================================
    echo.
    echo Los servidores de Prisma pueden estar caidos.
    echo El backend NO funcionara correctamente sin Prisma.
    echo.
    echo Este script intentara ejecutar de todas formas,
    echo pero probablemente falle al conectar a la base de datos.
    echo.
    echo Soluciones:
    echo 1. Espera 2-4 horas e intenta: npx prisma generate
    echo 2. Verifica tu conexion a internet
    echo 3. Intenta con una VPN
    echo.
    pause
)
echo.

REM Paso 5: Ejecutar con tsx (modo desarrollo)
echo [5/5] Iniciando servidor en modo desarrollo...
echo.
echo ============================================
echo IMPORTANTE:
echo - Ejecutando con tsx (sin compilar)
echo - Los cambios se aplicaran automaticamente
echo - Presiona Ctrl+C para detener
echo ============================================
echo.
echo Si ves errores de Prisma, es porque el cliente no esta generado.
echo Espera a que los servidores vuelvan y ejecuta: npx prisma generate
echo.
pause
echo.

REM Ejecutar directamente con tsx (npm run dev)
call npm run dev

pause
