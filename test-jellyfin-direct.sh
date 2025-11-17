#!/bin/bash

# Test directo con Jellyfin Demo Server
# No requiere backend - prueba directamente la API de Jellyfin

set -e

JELLYFIN_URL="https://demo.jellyfin.org/stable"
CLIENT_NAME="QbitStream-Test"
DEVICE_ID="test-$(date +%s)"
VERSION="1.0.0"

echo "=================================================="
echo "  Test Directo con Jellyfin Demo Server"
echo "=================================================="
echo ""
echo "Servidor: $JELLYFIN_URL"
echo ""

# 1. Verificar que el servidor responde
echo "1. Verificando servidor..."
INFO=$(curl -s "${JELLYFIN_URL}/System/Info/Public" 2>&1)

if echo "$INFO" | grep -q "ServerName"; then
    SERVER_NAME=$(echo "$INFO" | grep -o '"ServerName":"[^"]*' | cut -d'"' -f4)
    VERSION_NUM=$(echo "$INFO" | grep -o '"Version":"[^"]*' | cut -d'"' -f4)
    echo "   ✅ Servidor: $SERVER_NAME"
    echo "   ✅ Versión: $VERSION_NUM"
else
    echo "   ❌ Servidor no responde"
    echo "   Respuesta: $INFO"
    exit 1
fi
echo ""

# 2. Autenticar con usuario demo
echo "2. Autenticando con usuario 'demo'..."
AUTH_HEADER="MediaBrowser Client=\"${CLIENT_NAME}\", Device=\"Testing\", DeviceId=\"${DEVICE_ID}\", Version=\"${VERSION}\""

AUTH_RESPONSE=$(curl -s -X POST "${JELLYFIN_URL}/Users/AuthenticateByName" \
    -H "Content-Type: application/json" \
    -H "X-Emby-Authorization: ${AUTH_HEADER}" \
    -d '{"Username":"demo","Pw":""}' 2>&1)

if echo "$AUTH_RESPONSE" | grep -q "AccessToken"; then
    ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | grep -o '"AccessToken":"[^"]*' | cut -d'"' -f4)
    USER_ID=$(echo "$AUTH_RESPONSE" | grep -o '"Id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "   ✅ Autenticación exitosa"
    echo "   ✅ User ID: $USER_ID"
    echo "   ✅ Token: ${ACCESS_TOKEN:0:30}..."
else
    echo "   ❌ Autenticación falló"
    echo "   Respuesta: $AUTH_RESPONSE"
    exit 1
fi
echo ""

# 3. Obtener contenido más reciente
echo "3. Obteniendo contenido más reciente..."
LATEST=$(curl -s "${JELLYFIN_URL}/Users/${USER_ID}/Items/Latest?Limit=10" \
    -H "X-Emby-Token: ${ACCESS_TOKEN}" 2>&1)

if echo "$LATEST" | grep -q "Name"; then
    ITEM_COUNT=$(echo "$LATEST" | grep -o '"Name"' | wc -l)
    echo "   ✅ Encontrados $ITEM_COUNT items"

    # Mostrar primeros 3 títulos
    echo ""
    echo "   Primeros títulos encontrados:"
    echo "$LATEST" | grep -o '"Name":"[^"]*' | head -3 | while read -r line; do
        TITLE=$(echo "$line" | cut -d'"' -f4)
        echo "     - $TITLE"
    done
else
    echo "   ⚠️  No se encontró contenido (servidor demo puede estar vacío)"
fi
echo ""

# 4. Buscar contenido
echo "4. Buscando 'big'..."
SEARCH=$(curl -s "${JELLYFIN_URL}/Users/${USER_ID}/Items?searchTerm=big&Recursive=true&Limit=5" \
    -H "X-Emby-Token: ${ACCESS_TOKEN}" 2>&1)

if echo "$SEARCH" | grep -q "Items"; then
    RESULT_COUNT=$(echo "$SEARCH" | grep -o '"Type"' | wc -l)
    echo "   ✅ Encontrados $RESULT_COUNT resultados"

    # Mostrar títulos
    if [ $RESULT_COUNT -gt 0 ]; then
        echo ""
        echo "   Resultados de búsqueda:"
        echo "$SEARCH" | grep -o '"Name":"[^"]*' | head -5 | while read -r line; do
            TITLE=$(echo "$line" | cut -d'"' -f4)
            echo "     - $TITLE"
        done
    fi
else
    echo "   ⚠️  Búsqueda no devolvió resultados"
fi
echo ""

# 5. Obtener bibliotecas
echo "5. Obteniendo bibliotecas disponibles..."
LIBRARIES=$(curl -s "${JELLYFIN_URL}/Users/${USER_ID}/Items?Recursive=false" \
    -H "X-Emby-Token: ${ACCESS_TOKEN}" 2>&1)

if echo "$LIBRARIES" | grep -q "Items"; then
    LIB_COUNT=$(echo "$LIBRARIES" | grep -o '"CollectionType"' | wc -l)
    echo "   ✅ Encontradas $LIB_COUNT bibliotecas"

    if [ $LIB_COUNT -gt 0 ]; then
        echo ""
        echo "   Bibliotecas:"
        echo "$LIBRARIES" | grep -o '"Name":"[^"]*' | head -10 | while read -r line; do
            LIB_NAME=$(echo "$line" | cut -d'"' -f4)
            echo "     - $LIB_NAME"
        done
    fi
fi
echo ""

# Resumen
echo "=================================================="
echo "  RESUMEN"
echo "=================================================="
echo ""
echo "✅ Servidor Jellyfin funciona correctamente"
echo "✅ Autenticación exitosa"
echo "✅ API responde a peticiones"
echo ""
echo "🔑 Credenciales de prueba:"
echo "   User ID: $USER_ID"
echo "   Access Token: ${ACCESS_TOKEN:0:40}..."
echo ""
echo "📡 Puedes usar estos datos para probar tu backend:"
echo "   JELLYFIN_URL=$JELLYFIN_URL"
echo "   JELLYFIN_USER_ID=$USER_ID"
echo "   JELLYFIN_TOKEN=$ACCESS_TOKEN"
echo ""
echo "=================================================="
echo ""
echo "💡 Siguiente paso: Actualiza backend/.env con:"
echo ""
echo "JELLYFIN_SERVERS='[{\"id\":\"demo\",\"name\":\"Demo\",\"url\":\"${JELLYFIN_URL}\",\"cidrRanges\":[\"0.0.0.0/0\"],\"priority\":1}]'"
echo ""
echo "=================================================="
