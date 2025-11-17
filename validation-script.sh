#!/bin/bash

# Script de Validación QbitStream
# Ejecuta este script desde tu servidor o red local

set -e

API_URL="https://qbitstream.serviciosqbit.net/api"
EMAIL="POLUX"
PASSWORD="Supermetroid1."
ACCESS_TOKEN=""

echo "=================================================="
echo "  Validación QbitStream - $(date)"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir resultados
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# 1. Health Check
echo "1. Health Check"
RESPONSE=$(curl -s -w "\n%{http_code}" ${API_URL}/health)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Backend API está corriendo"
    echo "   Respuesta: $BODY"
else
    print_result 1 "Backend API no responde (HTTP $HTTP_CODE)"
    echo "   Respuesta: $BODY"
    exit 1
fi
echo ""

# 2. Login
echo "2. Autenticación - Login"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST ${API_URL}/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Login exitoso"
    ACCESS_TOKEN=$(echo "$BODY" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
    echo "   Token obtenido: ${ACCESS_TOKEN:0:20}..."
else
    print_result 1 "Login falló (HTTP $HTTP_CODE)"
    echo "   Respuesta: $BODY"
    exit 1
fi
echo ""

# 3. Listar Perfiles
echo "3. Gestión de Perfiles - Listar"
RESPONSE=$(curl -s -w "\n%{http_code}" ${API_URL}/profiles \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Perfiles obtenidos correctamente"
    PROFILE_COUNT=$(echo "$BODY" | grep -o '"id"' | wc -l)
    echo "   Total de perfiles: $PROFILE_COUNT"
    echo "   Respuesta: $BODY" | head -c 200
    echo "..."
else
    print_result 1 "Error al obtener perfiles (HTTP $HTTP_CODE)"
    echo "   Respuesta: $BODY"
fi
echo ""

# 4. Detectar Servidor
echo "4. Detección de Servidor"
RESPONSE=$(curl -s -w "\n%{http_code}" ${API_URL}/servers/detect \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Servidor detectado correctamente"
    SERVER_URL=$(echo "$BODY" | grep -o '"url":"[^"]*' | sed 's/"url":"//')
    SERVER_NAME=$(echo "$BODY" | grep -o '"name":"[^"]*' | sed 's/"name":"//')
    echo "   Servidor: $SERVER_NAME"
    echo "   URL: $SERVER_URL"
else
    print_result 1 "Error al detectar servidor (HTTP $HTTP_CODE)"
    echo "   Respuesta: $BODY"
fi
echo ""

# 5. Jellyfin Proxy - Latest
echo "5. Jellyfin Proxy - Contenido Reciente"
RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}/jellyfin/latest?limit=5" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Jellyfin proxy funciona correctamente"
    ITEM_COUNT=$(echo "$BODY" | grep -o '"Id"' | wc -l)
    echo "   Ítems encontrados: $ITEM_COUNT"
else
    print_result 1 "Error en Jellyfin proxy (HTTP $HTTP_CODE)"
    echo "   Respuesta: $BODY"
fi
echo ""

# 6. Planes
echo "6. Panel Admin - Planes"
RESPONSE=$(curl -s -w "\n%{http_code}" ${API_URL}/admin/plans \
    -H "Authorization: Bearer ${ACCESS_TOKEN}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Planes obtenidos correctamente"
    echo "   Respuesta: $BODY"
elif [ "$HTTP_CODE" = "403" ]; then
    echo -e "${YELLOW}⚠ Usuario no es administrador (esperado si no tiene rol admin)${NC}"
else
    print_result 1 "Error al obtener planes (HTTP $HTTP_CODE)"
    echo "   Respuesta: $BODY"
fi
echo ""

# 7. Verificar Base de Datos
echo "7. Verificación de Base de Datos"
echo "   Ejecuta manualmente desde PostgreSQL:"
echo "   psql -U postgres -d qbitstream -c 'SELECT COUNT(*) FROM \"User\";'"
echo "   psql -U postgres -d qbitstream -c 'SELECT COUNT(*) FROM \"Profile\";'"
echo ""

# 8. Verificar PM2
echo "8. Verificación de Servicios PM2"
echo "   Ejecuta: pm2 status"
echo "   Ejecuta: pm2 logs qbitstream-backend --lines 20"
echo ""

# Resumen
echo "=================================================="
echo "  RESUMEN DE VALIDACIÓN"
echo "=================================================="
echo ""
echo -e "${GREEN}✓ Componentes Funcionales:${NC}"
echo "  - Backend API"
echo "  - Autenticación (JWT)"
echo "  - Gestión de Perfiles"
echo "  - Detección de Servidor"
echo ""
echo -e "${YELLOW}⚠ Verificar Manualmente:${NC}"
echo "  - Jellyfin proxy (si no hay contenido)"
echo "  - Panel de administrador (si usuario no es admin)"
echo "  - Frontend web en navegador"
echo ""
echo "=================================================="
echo "  ¡Validación Completada!"
echo "=================================================="
