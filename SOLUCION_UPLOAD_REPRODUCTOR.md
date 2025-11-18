# Solución a Problemas de Upload y Reproductor

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
