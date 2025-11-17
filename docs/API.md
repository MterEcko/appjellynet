# QbitStream API Documentation

API RESTful completa para la plataforma QbitStream.

**Base URL:** `https://qbitstream.serviciosqbit.net/api`

---

## 📋 Tabla de Contenidos

- [Autenticación](#autenticación)
- [Detección de Servidores](#detección-de-servidores)
- [Cuentas](#cuentas)
- [Perfiles](#perfiles)
- [Publicidad](#publicidad)
- [Panel de Administración](#panel-de-administración)
- [Códigos de Error](#códigos-de-error)

---

## 🔐 Autenticación

### POST `/auth/login`

Iniciar sesión con email y contraseña.

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@ejemplo.com",
      "plan": "BASIC",
      "accountType": "MONTHLY",
      "status": "ACTIVE"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST `/auth/refresh`

Refrescar access token usando refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST `/auth/change-password`

Cambiar contraseña (requiere autenticación).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "currentPassword": "contraseñaActual",
  "newPassword": "nuevaContraseña"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 🌐 Detección de Servidores

### GET `/servers/detect`

Detecta automáticamente el mejor servidor Jellyfin según la red del cliente.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "server": {
      "id": "uuid",
      "serverId": "local",
      "name": "Red Interna",
      "url": "http://10.10.0.112:8096",
      "latency": 15,
      "isHealthy": true
    },
    "detectionMethod": "cidr_match",
    "clientIp": "10.10.0.50"
  }
}
```

### GET `/servers`

Lista todos los servidores disponibles.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "servers": [
      {
        "id": "uuid",
        "serverId": "local",
        "name": "Red Interna",
        "url": "http://10.10.0.112:8096",
        "networkCidr": "10.10.0.0/24",
        "priority": 1,
        "latency": 15,
        "isHealthy": true
      }
    ]
  }
}
```

### GET `/servers/:serverId/health`

Verificar salud de un servidor específico.

**Response:**
```json
{
  "success": true,
  "data": {
    "isHealthy": true,
    "latency": 23,
    "systemInfo": {
      "ServerName": "QbitStream",
      "Version": "10.8.13"
    }
  }
}
```

---

## 👤 Cuentas

### GET `/account/me`

Obtener información de la cuenta actual.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@ejemplo.com",
      "plan": "PREMIUM",
      "accountType": "MONTHLY",
      "status": "ACTIVE",
      "createdAt": "2025-01-15T10:30:00Z",
      "profiles": [
        {
          "id": "uuid",
          "name": "Principal",
          "avatar": "/avatars/default.png",
          "isPrimary": true,
          "jellyfinUserId": "jellyfin-uuid"
        }
      ]
    }
  }
}
```

### PUT `/account/me`

Actualizar información de la cuenta.

**Request:**
```json
{
  "email": "nuevoemail@ejemplo.com"
}
```

### PUT `/account/password`

Actualizar contraseña de la cuenta y sincronizar con Jellyfin.

**Request:**
```json
{
  "currentPassword": "actual",
  "newPassword": "nueva"
}
```

---

## 👥 Perfiles

### GET `/profiles`

Listar todos los perfiles de la cuenta.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profiles": [
      {
        "id": "uuid",
        "name": "Principal",
        "avatar": "/avatars/default.png",
        "isPrimary": true,
        "jellyfinUserId": "jellyfin-uuid"
      }
    ]
  }
}
```

### POST `/profiles`

Crear un nuevo perfil.

**Request:**
```json
{
  "name": "Niños",
  "avatar": "/avatars/kids.png"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid",
      "name": "Niños",
      "avatar": "/avatars/kids.png",
      "isPrimary": false,
      "jellyfinUserId": "jellyfin-uuid"
    }
  }
}
```

### PUT `/profiles/:id`

Actualizar un perfil.

**Request:**
```json
{
  "name": "Familia",
  "avatar": "/avatars/family.png"
}
```

### DELETE `/profiles/:id`

Eliminar un perfil (no se puede eliminar el perfil principal).

---

## 📺 Publicidad

### POST `/ads/select`

Seleccionar un anuncio para reproducir.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "type": "PREROLL",
  "contentId": "movie-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Anuncio Coca Cola",
    "type": "PREROLL",
    "duration": 30,
    "url": "/uploads/ads/video.mp4",
    "skipAfter": 5
  }
}
```

### POST `/ads/track`

Registrar visualización de anuncio.

**Request:**
```json
{
  "adId": "uuid",
  "contentId": "movie-123",
  "completed": true,
  "skipped": false,
  "watchedSeconds": 30
}
```

### POST `/ads/midroll-positions`

Calcular posiciones de mid-rolls para un contenido.

**Request:**
```json
{
  "contentDurationSeconds": 7200,
  "midrollCount": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "positions": [1800, 3600, 5400]
  }
}
```

### GET `/ads` (Admin)

Listar todos los anuncios.

**Query Parameters:**
- `type`: PREROLL | MIDROLL | PAUSEROLL
- `isActive`: true | false
- `page`: número de página (default: 1)
- `limit`: resultados por página (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "ads": [...],
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

### POST `/ads` (Admin)

Crear un nuevo anuncio.

**Content-Type:** `multipart/form-data`

**Fields:**
- `title`: string
- `type`: PREROLL | MIDROLL | PAUSEROLL
- `duration`: number (segundos)
- `video`: file (archivo de video)
- `skipAfter`: number (opcional, segundos)
- `weight`: number (opcional, default: 1)
- `startDate`: ISO datetime (opcional)
- `endDate`: ISO datetime (opcional)

### PUT `/ads/:id` (Admin)

Actualizar un anuncio.

### DELETE `/ads/:id` (Admin)

Eliminar un anuncio.

### GET `/ads/stats` (Admin)

Estadísticas generales de publicidad.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAds": 25,
    "activeAds": 18,
    "totalViews": 15420,
    "totalCompletions": 12336,
    "totalSkips": 3084,
    "completionRate": 80.0,
    "adsByType": [
      { "type": "PREROLL", "count": 10 },
      { "type": "MIDROLL", "count": 8 },
      { "type": "PAUSEROLL", "count": 7 }
    ]
  }
}
```

### GET `/ads/:id/analytics` (Admin)

Analíticas de un anuncio específico.

---

## 🛠️ Panel de Administración

### GET `/admin/dashboard`

Estadísticas del dashboard.

**Headers:**
```
Authorization: Bearer <access_token>
X-Admin-Role: required
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAccounts": 1250,
    "activeAccounts": 1100,
    "suspendedAccounts": 50,
    "demoAccounts": 100,
    "totalProfiles": 4500,
    "totalServers": 5,
    "healthyServers": 5,
    "totalAds": 25,
    "totalAdViews": 15420
  }
}
```

### GET `/admin/accounts`

Listar todas las cuentas.

**Query Parameters:**
- `page`: número de página
- `limit`: resultados por página
- `status`: ACTIVE | SUSPENDED | CANCELLED
- `accountType`: WISP | DEMO | MONTHLY | WEEKLY
- `search`: búsqueda por email

**Response:**
```json
{
  "success": true,
  "data": {
    "accounts": [...],
    "total": 1250,
    "page": 1,
    "limit": 20
  }
}
```

### POST `/admin/accounts`

Crear una nueva cuenta.

**Request:**
```json
{
  "email": "nuevo@ejemplo.com",
  "password": "contraseña123",
  "plan": "PREMIUM",
  "accountType": "MONTHLY",
  "wispCustomerId": "WISP-12345"
}
```

### GET `/admin/accounts/:id`

Obtener detalles de una cuenta.

### PUT `/admin/accounts/:id/suspend`

Suspender una cuenta.

**Request:**
```json
{
  "reason": "Pago vencido"
}
```

### PUT `/admin/accounts/:id/reactivate`

Reactivar una cuenta suspendida.

### DELETE `/admin/accounts/:id`

Eliminar una cuenta permanentemente.

### GET `/admin/audit-logs`

Ver logs de auditoría.

**Query Parameters:**
- `page`: número de página
- `limit`: resultados por página
- `action`: tipo de acción
- `performedBy`: ID del administrador

---

## ⚠️ Códigos de Error

### Errores de Autenticación

- `401 UNAUTHORIZED`: Token inválido o expirado
- `403 FORBIDDEN`: Sin permisos suficientes
- `400 INVALID_CREDENTIALS`: Credenciales incorrectas

### Errores de Validación

- `400 VALIDATION_ERROR`: Datos de entrada inválidos
- `400 PROFILE_LIMIT_REACHED`: Límite de perfiles alcanzado
- `400 PRIMARY_PROFILE_DELETE`: No se puede eliminar perfil principal

### Errores de Recursos

- `404 NOT_FOUND`: Recurso no encontrado
- `404 USER_NOT_FOUND`: Usuario no encontrado
- `404 PROFILE_NOT_FOUND`: Perfil no encontrado
- `404 AD_NOT_FOUND`: Anuncio no encontrado
- `404 SERVER_NOT_FOUND`: Servidor no encontrado

### Errores del Servidor

- `500 INTERNAL_SERVER_ERROR`: Error interno del servidor
- `503 SERVICE_UNAVAILABLE`: Servicio temporalmente no disponible

### Formato de Respuesta de Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "statusCode": 400
  }
}
```

---

## 🔄 Rate Limiting

- **Login:** 5 intentos por minuto por IP
- **API General:** 100 requests por minuto por token
- **Subida de archivos:** 10 requests por hora

---

## 📊 Paginación

Todas las respuestas paginadas siguen este formato:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 1250,
    "page": 1,
    "limit": 20,
    "totalPages": 63
  }
}
```

---

## 🧪 Entornos

### Development
```
https://dev.qbitstream.serviciosqbit.net/api
```

### Production
```
https://qbitstream.serviciosqbit.net/api
```

---

## 📝 Notas

1. **Tokens JWT**: Los access tokens expiran en 15 minutos, refresh tokens en 7 días.
2. **Sincronización Jellyfin**: Los cambios de contraseña se sincronizan automáticamente con todos los perfiles de Jellyfin.
3. **Detección de Servidor**: La detección se basa en CIDR matching y latencia. Siempre hay un servidor de respaldo (público).
4. **Límites de Perfiles**:
   - BASIC: 3 perfiles
   - PREMIUM: 5 perfiles
   - FAMILY: 8 perfiles
5. **Almacenamiento de Archivos**: Los videos de anuncios se almacenan en `/uploads/ads/` con límite de 100 MB por archivo.

---

## 🔗 Enlaces Relacionados

- [Documentación de Detección de Servidores](./SERVER-DETECTION.md)
- [Guía de Instalación](../INSTALL.md)
- [README Principal](../README.md)

---

**Versión API:** 1.0.0
**Última actualización:** 2025-01-17
