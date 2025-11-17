#!/bin/bash

# Test Rápido Local
# Ejecuta esto DESDE TU SERVIDOR para probar que todo funcione

echo "🔍 Test Rápido QbitStream - $(date)"
echo ""

# 1. Backend corriendo?
echo "1. ¿Backend está corriendo?"
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "   ✓ Backend responde en localhost:3001"
else
    echo "   ✗ Backend NO responde"
    echo "   Verifica: pm2 status"
    exit 1
fi

# 2. Login funciona?
echo ""
echo "2. ¿Login funciona?"
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"POLUX","password":"Supermetroid1."}')

if echo "$RESPONSE" | grep -q "accessToken"; then
    echo "   ✓ Login exitoso"
    TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo "   Token: ${TOKEN:0:30}..."
else
    echo "   ✗ Login falló"
    echo "   Respuesta: $RESPONSE"
    exit 1
fi

# 3. Perfiles
echo ""
echo "3. ¿Perfiles se listan?"
PROFILES=$(curl -s http://localhost:3001/api/profiles \
    -H "Authorization: Bearer $TOKEN")

if echo "$PROFILES" | grep -q "success"; then
    echo "   ✓ Perfiles obtenidos"
    echo "   Respuesta: ${PROFILES:0:100}..."
else
    echo "   ✗ Error al obtener perfiles"
    echo "   Respuesta: $PROFILES"
fi

# 4. Detectar servidor
echo ""
echo "4. ¿Detección de servidor funciona?"
SERVER=$(curl -s http://localhost:3001/api/servers/detect \
    -H "Authorization: Bearer $TOKEN")

if echo "$SERVER" | grep -q "server"; then
    echo "   ✓ Servidor detectado"
    echo "   Respuesta: ${SERVER:0:150}..."
else
    echo "   ✗ Error en detección"
    echo "   Respuesta: $SERVER"
fi

echo ""
echo "=================================================="
echo "✅ Si todo funcionó, el problema es Cloudflare"
echo ""
echo "Revisa: docs/CLOUDFLARE_ACCESS_FIX.md"
echo "=================================================="
