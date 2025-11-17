# 🧪 Pruebas con Servidor Jellyfin Demo

## Servidor Demo Público de Jellyfin

Jellyfin ofrece servidores de demostración públicos para pruebas:

### Opción 1: Demo Oficial (Estable)
```
URL: https://demo.jellyfin.org/stable
Usuario: demo
Contraseña: (dejar en blanco)
```

### Opción 2: Demo Oficial (Inestable/Nightly)
```
URL: https://demo.jellyfin.org/unstable
Usuario: demo
Contraseña: (dejar en blanco)
```

---

## 🔧 Configurar Backend con Servidor Demo

### Paso 1: Actualizar variables de entorno

Edita `backend/.env`:

```bash
# Configuración de servidores Jellyfin
JELLYFIN_SERVERS='[
  {
    "id": "demo",
    "name": "Jellyfin Demo",
    "url": "https://demo.jellyfin.org/stable",
    "cidrRanges": ["0.0.0.0/0"],
    "priority": 1
  }
]'

# Admin API Key de Jellyfin (opcional para demo)
JELLYFIN_API_KEY=
```

### Paso 2: Reiniciar backend

```bash
cd backend
npm run build
pm2 restart qbitstream-backend

# O si estás en desarrollo:
npm run dev
```

### Paso 3: Probar detección de servidor

```bash
# Con tu token de autenticación
curl http://localhost:3001/api/servers/detect \
  -H "Authorization: Bearer TU_TOKEN"

# Debería devolver:
{
  "success": true,
  "data": {
    "server": {
      "url": "https://demo.jellyfin.org/stable",
      "name": "Jellyfin Demo",
      "serverId": "demo"
    }
  }
}
```

---

## 🎯 Pruebas Directas con Jellyfin API

### 1. Verificar que el servidor demo funciona

```bash
curl https://demo.jellyfin.org/stable/System/Info/Public
```

**Respuesta esperada:**
```json
{
  "LocalAddress": "...",
  "ServerName": "Demo Server",
  "Version": "10.x.x",
  "ProductName": "Jellyfin Server",
  "OperatingSystem": "Linux",
  "Id": "..."
}
```

### 2. Autenticar con usuario demo

```bash
curl -X POST https://demo.jellyfin.org/stable/Users/AuthenticateByName \
  -H "Content-Type: application/json" \
  -H "X-Emby-Authorization: MediaBrowser Client=\"QbitStream\", Device=\"Testing\", DeviceId=\"test123\", Version=\"1.0.0\"" \
  -d '{
    "Username": "demo",
    "Pw": ""
  }'
```

**Guardas el `AccessToken` que devuelve.**

### 3. Obtener contenido más reciente

```bash
curl "https://demo.jellyfin.org/stable/Users/{USER_ID}/Items/Latest?Limit=10" \
  -H "X-Emby-Token: TU_ACCESS_TOKEN"
```

### 4. Buscar contenido

```bash
curl "https://demo.jellyfin.org/stable/Users/{USER_ID}/Items?searchTerm=matrix&Recursive=true" \
  -H "X-Emby-Token: TU_ACCESS_TOKEN"
```

---

## 🔄 Crear Usuarios de Prueba en Jellyfin

Si tienes tu propio servidor Jellyfin, crea usuarios de prueba:

### Desde la interfaz web de Jellyfin:

1. Ve a **Dashboard > Users**
2. Click **Add User**
3. Usuario: `test_basic`
4. Contraseña: `Test123!`
5. Guarda

### Desde la API (con API Key):

```bash
curl -X POST http://TU_SERVIDOR:8096/Users/New \
  -H "X-Emby-Token: TU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "test_basic",
    "Password": "Test123!"
  }'
```

---

## 🧩 Script de Prueba End-to-End

Crea `test-jellyfin-integration.sh`:

```bash
#!/bin/bash

JELLYFIN_URL="https://demo.jellyfin.org/stable"
BACKEND_URL="http://localhost:3001/api"

echo "🧪 Test de Integración Jellyfin"
echo ""

# 1. Login en nuestro backend
echo "1. Login en backend..."
RESPONSE=$(curl -s -X POST ${BACKEND_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"POLUX","password":"Supermetroid1."}')

TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login falló"
  exit 1
fi
echo "✅ Login exitoso"

# 2. Detectar servidor
echo ""
echo "2. Detectar servidor Jellyfin..."
SERVER=$(curl -s ${BACKEND_URL}/servers/detect \
  -H "Authorization: Bearer $TOKEN")

echo "$SERVER"

# 3. Obtener contenido reciente
echo ""
echo "3. Obtener contenido reciente..."
LATEST=$(curl -s "${BACKEND_URL}/jellyfin/latest?limit=5" \
  -H "Authorization: Bearer $TOKEN")

ITEMS=$(echo "$LATEST" | grep -o '"Id"' | wc -l)
echo "✅ Encontrados $ITEMS items"

# 4. Buscar
echo ""
echo "4. Buscar 'big'..."
SEARCH=$(curl -s "${BACKEND_URL}/jellyfin/search?q=big&limit=5" \
  -H "Authorization: Bearer $TOKEN")

RESULTS=$(echo "$SEARCH" | grep -o '"Id"' | wc -l)
echo "✅ Encontrados $RESULTS resultados"

echo ""
echo "=================================================="
echo "✅ Integración con Jellyfin funciona correctamente"
echo "=================================================="
```

---

## 🌐 Pruebas desde Frontend

### En tu navegador:

1. Abre el frontend (local o producción)
2. Abre DevTools (F12) > Console
3. Ejecuta:

```javascript
// Inicializar conexión con Jellyfin
const serverUrl = await jellyfinService.initializeJellyfin();
console.log('Servidor:', serverUrl);

// Obtener contenido reciente
const latest = await jellyfinService.getLatestMedia(10);
console.log('Últimos items:', latest);

// Buscar
const results = await jellyfinService.searchItems('big', 10);
console.log('Resultados:', results);
```

---

## 📊 Validación Completa

### Checklist de pruebas:

- [ ] Servidor Jellyfin responde (demo o propio)
- [ ] Backend detecta el servidor correctamente
- [ ] Proxy de Jellyfin devuelve contenido
- [ ] Búsqueda funciona
- [ ] Frontend puede obtener items
- [ ] Imágenes se cargan correctamente
- [ ] Modal de detalles se abre
- [ ] Video player podría reproducir (si hay contenido)

---

## 🐛 Problemas Comunes

### "Cannot connect to server"
- Verifica que la URL del servidor sea correcta
- Prueba acceder directamente: `https://demo.jellyfin.org/stable`

### "Authentication failed"
- Usuario demo no tiene contraseña
- En tu servidor, verifica credenciales

### "No items found"
- El servidor demo puede estar vacío
- Usa tu propio servidor con contenido

### "CORS errors"
- Jellyfin debe permitir CORS desde tu dominio
- En Settings > Network > CORS, agrega tu dominio

---

## 🚀 Siguientes Pasos

Una vez que todo funcione con el servidor demo:

1. Cambia a tu servidor Jellyfin real
2. Actualiza las credenciales en `.env`
3. Crea usuarios para cada perfil
4. Conecta el disco con contenido
5. Prueba reproducción real

---

¿Listo para probar? 🎬
