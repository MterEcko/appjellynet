# 🔍 Guía de Validación en Producción

Esta guía te ayuda a verificar que todos los componentes de QbitStream funcionan correctamente en producción.

---

## ✅ Checklist de Validación

### 1. Backend API

#### Health Check
```bash
curl https://TU_DOMINIO/api/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-17T..."
}
```

#### Verificar CORS y Headers
```bash
curl -I https://TU_DOMINIO/api/health
```

Debe incluir headers CORS:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

---

### 2. Autenticación

#### Registro de Usuario (si está habilitado)
```bash
curl -X POST https://TU_DOMINIO/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prueba@test.com",
    "password": "Test123456!",
    "name": "Usuario Prueba"
  }'
```

#### Login
```bash
curl -X POST https://TU_DOMINIO/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prueba@test.com",
    "password": "Test123456!"
  }'
```

**Guarda el accessToken** que recibes para las siguientes pruebas.

---

### 3. Gestión de Perfiles

#### Listar Perfiles
```bash
curl https://TU_DOMINIO/api/profiles \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Usuario Prueba",
      "jellyfinUserId": "...",
      "isPrimary": true
    }
  ]
}
```

#### Crear Perfil Adicional
```bash
curl -X POST https://TU_DOMINIO/api/profiles \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Perfil Familiar"
  }'
```

---

### 4. Detección de Servidor

#### Detectar Mejor Servidor
```bash
curl https://TU_DOMINIO/api/servers/detect \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"
```

**Respuesta esperada:**
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

---

### 5. Jellyfin Proxy

#### Obtener Contenido Más Reciente
```bash
curl "https://TU_DOMINIO/api/jellyfin/latest?limit=10" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"
```

**Nota:** Esto requerirá que el servidor Jellyfin esté accesible y tenga contenido.

#### Continuar Viendo
```bash
curl https://TU_DOMINIO/api/jellyfin/resume \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"
```

#### Buscar Contenido
```bash
curl "https://TU_DOMINIO/api/jellyfin/search?q=matrix&limit=10" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"
```

---

### 6. Panel de Administración

#### Ver Estadísticas (requiere usuario admin)
```bash
curl https://TU_DOMINIO/api/admin/stats \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

#### Listar Planes
```bash
curl https://TU_DOMINIO/api/admin/plans \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

---

### 7. Frontend Web

#### Verificar que Carga
1. Abre en navegador: `https://TU_DOMINIO`
2. Deberías ver la página de login/registro
3. Verifica que los assets cargan (CSS, JS, imágenes)

#### Verificar Consola del Navegador
Abre DevTools (F12) y verifica:
- No hay errores 404
- No hay errores CORS
- Las peticiones a `/api/*` funcionan

#### Flujo Completo
1. **Login** - Ingresa credenciales
2. **Selector de Perfiles** - Debería mostrarse si tienes múltiples perfiles
3. **Browse (Inicio)** - Verifica que carga la interfaz Netflix-style
4. **Búsqueda** - Prueba buscar contenido
5. **Detalles** - Click en un ítem para ver el modal de detalles

---

### 8. Configuración Remota (Mobile)

#### Verificar Config JSON
```bash
curl https://TU_USUARIO.github.io/qbitstream-config/config.json
```

**Respuesta esperada:**
```json
{
  "backendApiUrl": "https://TU_DOMINIO/api",
  "appVersion": "1.0.0",
  "minimumVersion": "1.0.0"
}
```

---

## 🐛 Troubleshooting

### Backend no responde
1. Verifica que el servicio está corriendo:
   ```bash
   pm2 status
   pm2 logs qbitstream-backend
   ```

2. Verifica conexión a base de datos:
   ```bash
   psql -h localhost -U postgres -d qbitstream
   ```

3. Revisa logs de Nginx:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

### CORS Errors
Verifica `backend/.env`:
```
CORS_ORIGIN=https://TU_DOMINIO,http://localhost:5173
```

Y reinicia el backend:
```bash
pm2 restart qbitstream-backend
```

### Jellyfin no accesible
1. Verifica que Jellyfin está corriendo:
   ```bash
   curl http://localhost:8096/System/Info/Public
   ```

2. Verifica la configuración de servidores en `backend/.env`:
   ```
   JELLYFIN_SERVERS='[{"name":"Red Interna","url":"http://10.10.0.112:8096",...}]'
   ```

### Frontend 404
1. Verifica build del frontend:
   ```bash
   cd frontend
   npm run build
   ls -la dist/
   ```

2. Verifica configuración de Nginx para SPA:
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

---

## 📊 Métricas a Verificar

### Performance
- Tiempo de respuesta API: < 200ms
- Tiempo de carga frontend: < 3s
- Tiempo de detección de servidor: < 1s

### Funcionalidad
- ✅ Login/Registro funciona
- ✅ Creación de perfiles respeta límites del plan
- ✅ Detección de servidor selecciona el correcto
- ✅ Jellyfin proxy devuelve contenido
- ✅ Frontend carga sin errores

### Seguridad
- ✅ HTTPS configurado correctamente
- ✅ Tokens JWT expiran correctamente
- ✅ Refresh tokens funcionan
- ✅ Endpoints admin protegidos

---

## 🎯 Validación sin Contenido de Video

Incluso sin el disco de videos conectado, puedes validar:

1. **Backend API** - Todos los endpoints responden
2. **Autenticación** - Login, tokens, refresh
3. **Base de Datos** - Usuarios, perfiles, cuentas se crean correctamente
4. **Detección de Servidor** - El sistema identifica el servidor correcto según IP
5. **Plan Management** - Límites de perfiles funcionan
6. **Frontend** - La UI carga y se comunica con el backend

**Lo que NO funcionará sin videos:**
- Reproducción de contenido
- Thumbnails de películas/series
- Búsqueda de contenido real
- "Continuar viendo"

Pero puedes **simular contenido** creando ítems de prueba en Jellyfin manualmente.

---

## 📝 Reporte de Validación

### Template

```markdown
## Validación QbitStream - [FECHA]

### ✅ Backend API
- Health check: OK / FAIL
- Login: OK / FAIL
- Profiles: OK / FAIL
- Server detection: OK / FAIL

### ✅ Frontend
- Carga: OK / FAIL
- Login UI: OK / FAIL
- Browse UI: OK / FAIL
- Search: OK / FAIL

### ✅ Jellyfin
- Servidor accesible: OK / FAIL
- Proxy funciona: OK / FAIL

### 🐛 Problemas Encontrados
1. [Descripción del problema]
2. [Descripción del problema]

### 📋 Próximos Pasos
1. [Acción a tomar]
2. [Acción a tomar]
```

---

## 🚀 Cuando Todo Funcione

Una vez validado todo:

1. **Conecta el disco de videos** y verifica reproducción
2. **Configura ads** en el panel admin
3. **Crea usuarios de prueba** con diferentes planes
4. **Prueba desde diferentes redes** (LAN, WISP, Internet)
5. **Compila las apps móviles** y prueba en dispositivos reales
6. **Configura backup** de la base de datos
7. **Monitorea logs** con PM2 o herramienta de tu elección

---

¡Listo! 🎉 Con esta guía puedes validar toda la plataforma paso a paso.
