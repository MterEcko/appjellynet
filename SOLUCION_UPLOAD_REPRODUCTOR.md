# Solución a Problemas de Upload, Reproductor y Gestión de Cuenta

## Problema 1: Error 404 en Upload de Videos/Imágenes

### Causa
El endpoint `/api/upload/ad-video` requiere autenticación de administrador pero puede haber un problema con cómo se está manejando el multipart/form-data.

### Pasos para verificar:

1. **Asegúrate de que el backend esté corriendo:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Verifica que los directorios existan:**
   ```bash
   ls -la public/uploads/ads/videos
   ls -la public/uploads/ads/thumbnails
   ```
   Si no existen, el controlador los creará automáticamente.

3. **Prueba el endpoint manualmente:**
   Abre la consola del navegador (F12) cuando intentes subir un archivo y revisa:
   - La pestaña "Network" para ver la respuesta exacta del servidor
   - El código de estado (404, 401, 403, 500, etc.)
   - El mensaje de error específico

4. **Verifica que estés autenticado como admin:**
   - Ve a `/admin` en el navegador
   - Si no puedes acceder, tu usuario no es admin
   - Necesitas actualizar la base de datos:
     ```sql
     UPDATE users SET "isAdmin" = true WHERE email = 'tu-email@ejemplo.com';
     ```

### Si el error persiste:

Revisa el log del backend para ver el error específico. El error 404 puede significar:
- La ruta no está registrada correctamente
- El middleware de autenticación está rechazando la petición
- Hay un problema con multer procesando el archivo

## Problema 2: Botones del Reproductor No Aparecen

### Cambios realizados:

1. **Removí atributos HTML que interfieren con Video.js:**
   - Quitado `controls` del elemento `<video>`
   - Quitado `preload` del elemento `<video>`
   - Video.js maneja estos atributos internamente

2. **Cambiado CSS de `scoped` a global:**
   - Los estilos con `scoped` no se aplicaban a los elementos de Video.js
   - Ahora los estilos se aplican correctamente

3. **Mejorado CSS de controles:**
   - Forzar visibilidad con `!important`
   - Agregar fade-out al hacer hover fuera
   - Asegurar que los controles estén siempre visibles al pausar

### Para verificar:

1. **Recarga el navegador con Ctrl+Shift+R** (recarga forzada sin caché)
2. **Abre un video**
3. **Los controles deberían:**
   - Aparecer siempre al inicio
   - Desaparecer después de 1 segundo sin mover el mouse (al reproducir)
   - Aparecer al mover el mouse
   - Estar siempre visibles al pausar

## Siguiente Paso

Prueba primero el reproductor (ya está arreglado en el código).

Para el upload, por favor:
1. Abre la consola del navegador (F12)
2. Intenta subir un archivo
3. Ve a la pestaña "Network"
4. Busca la petición `/api/upload/ad-video`
5. Haz clic en ella y mira:
   - Status code
   - Response
   - Request headers (debe incluir Authorization: Bearer ...)

Compárteme esa información y podré darte la solución exacta.

## Nueva Funcionalidad: Gestión de Cuenta Completa

### Implementación Completada

Se ha implementado un sistema completo de gestión de cuenta con notificaciones por email. Esta funcionalidad permite a los usuarios gestionar su cuenta de forma segura.

### Características Implementadas:

#### 1. Cambio de Email
- **Endpoint**: `POST /api/account/change-email`
- **Requiere**: `newEmail` y `currentPassword`
- **Seguridad**: Verifica la contraseña actual antes de permitir el cambio
- **Notificaciones**: Envía emails tanto al email antiguo como al nuevo
- **Frontend**: Disponible en `/account/settings`

#### 2. Cambio de Contraseña
- **Endpoint**: `POST /api/account/change-password`
- **Requiere**: `currentPassword` y `newPassword`
- **Seguridad**:
  - Verifica la contraseña actual
  - Requiere mínimo 6 caracteres
  - Sincroniza la nueva contraseña con todos los perfiles de Jellyfin
- **Notificaciones**: Envía email de confirmación
- **Frontend**: Disponible en `/account/settings`

#### 3. Preferencias de Notificación
- **Endpoints**:
  - `GET /api/account/notification-preferences` - Obtener preferencias
  - `POST /api/account/notification-preferences` - Actualizar preferencias
- **Opciones**:
  - `newContent`: Notificar sobre nuevo contenido
  - `accountUpdates`: Notificar sobre cambios en la cuenta (suspensión, reactivación, etc.)
  - `marketing`: Notificar sobre promociones y ofertas
- **Frontend**: Disponible en `/account/settings`

#### 4. Sistema de Emails Automáticos
El sistema ahora envía emails automáticamente en los siguientes eventos:
- ✅ Cambio de email (envía a ambos emails)
- ✅ Cambio de contraseña
- ✅ Suspensión de cuenta (con razón de suspensión)
- ✅ Reactivación de cuenta

### Base de Datos

Se agregaron los siguientes campos al modelo `User`:
```prisma
notifyNewContent     Boolean  @default(true)
notifyAccountUpdates Boolean  @default(true)
notifyMarketing      Boolean  @default(false)
```

### Configuración de Email

Para que los emails funcionen, debes configurar las siguientes variables de entorno en `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-aplicación
EMAIL_FROM="StreamQbit <noreply@streamqbit.com>"
```

**Nota**: Si no configuras SMTP, el sistema funcionará pero no enviará emails. Los logs mostrarán un warning indicando que los emails no se enviaron.

### Cómo Usar

1. **Actualizar Base de Datos**:
   ```bash
   cd backend
   npx prisma db push
   ```

2. **Reiniciar Backend**:
   - Windows: Ejecutar `REINICIAR_BACKEND.bat`
   - Linux/Mac:
     ```bash
     cd backend
     npm run build
     npm run dev
     ```

3. **Acceder a Configuración de Cuenta**:
   - Inicia sesión en el frontend
   - Ve a `/account/settings` en tu navegador
   - Verás tres secciones:
     - Información de la Cuenta
     - Cambiar Email
     - Cambiar Contraseña
     - Notificaciones por Email

### Seguridad

- ✅ Todos los endpoints requieren autenticación (token JWT)
- ✅ Cambios de email y contraseña requieren verificación de contraseña actual
- ✅ Las contraseñas se almacenan hasheadas con bcrypt
- ✅ Las contraseñas se sincronizan automáticamente con Jellyfin
- ✅ Los emails contienen información clara sobre el cambio realizado

### Próximos Pasos Sugeridos

1. **Personalizar Templates de Email**: Los emails actuales son básicos. Puedes crear templates HTML más atractivos en `backend/src/services/email.service.ts`

2. **Agregar Verificación de Email**: Implementar verificación por código cuando se cambia el email

3. **Agregar 2FA (Two-Factor Authentication)**: Para mayor seguridad

4. **Dashboard de Actividad**: Mostrar historial de cambios en la cuenta
