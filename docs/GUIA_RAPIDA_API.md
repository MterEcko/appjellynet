# 🚀 Guía Rápida - API QbitStream

## 📚 Documentación Completa

La documentación completa de la API está en **[docs/API.md](./API.md)**

Esta es una **guía rápida** con los endpoints más usados.

---

## 🔐 1. Autenticación

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "contraseña123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "plan": "PREMIUM" },
    "accessToken": "eyJhbGciOiJI...",
    "refreshToken": "eyJhbGciOiJI..."
  }
}
```

**Guarda el accessToken** - lo necesitas para todas las demás peticiones.

---

## 👤 2. Gestión de Perfiles

### Listar Perfiles
```bash
curl -X GET http://localhost:3001/api/profiles \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"
```

### Crear Perfil
```bash
curl -X POST http://localhost:3001/api/profiles \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Perfil Familiar"
  }'
```

---

## 🌐 3. Detección de Servidor

### Detectar Mejor Servidor
```bash
curl -X GET http://localhost:3001/api/servers/detect \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "server": {
      "url": "http://10.10.0.112:8096",
      "name": "Red Interna",
      "serverId": "local",
      "latency": 15
    },
    "detectionMethod": "cidr_match",
    "clientIp": "10.10.0.50"
  }
}
```

**Usa este URL** para conectarte a Jellyfin.

---

## 📺 4. Publicidad

### Seleccionar Ad
```bash
curl -X POST http://localhost:3001/api/ads/select \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "PREROLL",
    "contentId": "movie-123"
  }'
```

### Trackear Visualización
```bash
curl -X POST http://localhost:3001/api/ads/track \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adId": "ad-uuid",
    "contentId": "movie-123",
    "completed": true,
    "skipped": false,
    "watchedSeconds": 30
  }'
```

---

## 👨‍💼 5. Panel de Administración

### Ver Estadísticas
```bash
curl -X GET http://localhost:3001/api/admin/stats \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

### Listar Planes
```bash
curl -X GET http://localhost:3001/api/admin/plans \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "plan": "BASIC",
        "profileLimit": 3,
        "price": 5.99,
        "features": ["3 perfiles", "Calidad HD"]
      },
      {
        "plan": "PREMIUM",
        "profileLimit": 5,
        "price": 9.99,
        "features": ["5 perfiles", "Calidad 4K", "Sin anuncios"]
      }
    ]
  }
}
```

### Cambiar Plan de Usuario
```bash
curl -X PUT http://localhost:3001/api/admin/users/USER_ID/plan \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "PREMIUM"
  }'
```

### Suspender Cuenta
```bash
curl -X POST http://localhost:3001/api/admin/accounts/ACCOUNT_ID/suspend \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Pago vencido"
  }'
```

---

## 🎬 Flujo Completo de Uso

### Para Frontend Web/Mobile:

```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { accessToken } = await loginResponse.json();

// 2. Obtener perfiles
const profilesResponse = await fetch('/api/profiles', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
const { profiles } = await profilesResponse.json();

// 3. Usuario selecciona perfil
const selectedProfile = profiles[0];

// 4. Detectar servidor
const serverResponse = await fetch('/api/servers/detect', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
const { server } = await serverResponse.json();
const jellyfinUrl = server.url;

// 5. Obtener ad pre-roll
const adResponse = await fetch('/api/ads/select', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ type: 'PREROLL', contentId: 'movie-123' })
});
const ad = await adResponse.json();

// 6. Reproducir ad
if (ad) {
  playVideo(ad.url);
  // Trackear después
  await fetch('/api/ads/track', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      adId: ad.id,
      completed: true,
      skipped: false,
      watchedSeconds: ad.duration
    })
  });
}

// 7. Conectar a Jellyfin y reproducir contenido
const jellyfinApiUrl = `${jellyfinUrl}/Items/...`;
// Usa Jellyfin SDK o API directa
```

---

## 🔑 Headers Importantes

### En Todas las Peticiones Autenticadas:
```
Authorization: Bearer <accessToken>
```

### Para Mobile Apps (opcional):
```
X-Profile-Id: <profileId>
```
El backend detecta automáticamente el perfil del token, pero puedes especificarlo.

---

## ⚠️ Códigos de Error Comunes

| Código | Error | Solución |
|--------|-------|----------|
| 401 | UNAUTHORIZED | Token inválido o expirado - usar refresh token |
| 403 | FORBIDDEN | Sin permisos (ej: no es admin) |
| 404 | NOT_FOUND | Recurso no existe |
| 400 | VALIDATION_ERROR | Datos de entrada inválidos |
| 400 | PROFILE_LIMIT_REACHED | Ya tienes el máximo de perfiles |

---

## 🧪 Testing con Postman/Insomnia

### Colección Básica:

1. **Crear Environment:**
   - `BASE_URL`: `http://localhost:3001/api`
   - `ACCESS_TOKEN`: (vacío inicialmente)

2. **Requests Esenciales:**

   **Login:**
   ```
   POST {{BASE_URL}}/auth/login
   Body: { "email": "...", "password": "..." }
   ```
   Luego guarda el `accessToken` en el environment.

   **Get Profiles:**
   ```
   GET {{BASE_URL}}/profiles
   Headers: Authorization: Bearer {{ACCESS_TOKEN}}
   ```

   **Detect Server:**
   ```
   GET {{BASE_URL}}/servers/detect
   Headers: Authorization: Bearer {{ACCESS_TOKEN}}
   ```

---

## 💡 Tips

### Refresh Token Automático:

Si el accessToken expira (401), usa el refresh token:

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "TU_REFRESH_TOKEN"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "NUEVO_ACCESS_TOKEN"
  }
}
```

### Para Mobile Apps:

El frontend ya tiene esto implementado en `frontend/src/services/api.js` con interceptors de Axios que refrescan automáticamente el token.

---

## 📱 URLs de Producción

### Backend API:
```
https://qbitstream.serviciosqbit.net/api
```

### Jellyfin Servers:
- **Red Interna**: `http://10.10.0.112:8096`
- **WISP**: `http://172.16.0.4:8096`
- **ISP**: `http://179.120.0.15:8096`
- **Público**: `https://qbitstream.serviciosqbit.net`

---

## 🔗 Enlaces Útiles

- [Documentación Completa de API](./API.md)
- [Guía de Server Detection](./SERVER-DETECTION.md)
- [Recomendaciones y Mejores Prácticas](./RECOMENDACIONES.md)

---

## 💬 Soporte

¿Dudas sobre la API? Revisa:
1. [docs/API.md](./API.md) - Documentación completa
2. [backend/src/routes/](../backend/src/routes/) - Código de las rutas
3. [backend/src/controllers/](../backend/src/controllers/) - Controladores

¡Todo el código es open-source y está documentado! 🎉
