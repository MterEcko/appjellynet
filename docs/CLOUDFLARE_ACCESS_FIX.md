# 🔓 Resolver Bloqueo de Cloudflare Access/Tunnel

## 🚨 Problema Detectado

Tu dominio `qbitstream.serviciosqbit.net` está usando **Cloudflare Tunnel (Envoy)** y devuelve **HTTP 403 (Access denied)** para todas las peticiones externas.

Esto indica que probablemente tienes políticas de acceso activas en Cloudflare Zero Trust.

---

## 🔍 Verificación

### Paso 1: Verifica si tienes Cloudflare Tunnel
```bash
# Desde tu servidor
cloudflared tunnel list
```

Si ves tu túnel listado, entonces estás usando Cloudflare Tunnel.

### Paso 2: Verifica políticas de acceso en Cloudflare

1. Ve a tu dashboard de Cloudflare: https://dash.cloudflare.com
2. Selecciona tu dominio `serviciosqbit.net`
3. Ve a **Zero Trust** (o **Access**)
4. Busca **Applications** o **Access Policies**

---

## ✅ Soluciones

### Solución 1: Deshabilitar Cloudflare Access (Más Simple)

Si no necesitas autenticación adicional:

1. Ve a **Zero Trust > Access > Applications**
2. Encuentra la aplicación para `qbitstream.serviciosqbit.net`
3. **Elimínala** o **Desactívala**

### Solución 2: Permitir Acceso Público a la API

Si quieres mantener Access pero permitir la API:

1. Ve a **Zero Trust > Access > Applications**
2. Edita la aplicación de `qbitstream`
3. En **Application Configuration**, agrega:
   - Path: `/api/*`
   - Policy: **Bypass** (permite acceso sin autenticación)

4. O crea una nueva política:
   - Name: `Public API Access`
   - Include: `Everyone`
   - Path: `/api/*`

### Solución 3: Permitir Tráfico desde tu País

1. Ve a **Zero Trust > Access > Applications**
2. Edita la aplicación
3. Agrega una regla de tipo **Country**:
   - Include: `Mexico` (o tu país)
   - Action: `Allow`

### Solución 4: Permitir IPs Específicas

Si solo quieres permitir ciertas IPs:

1. Ve a **Zero Trust > Access > Applications**
2. Edita la aplicación
3. Agrega una regla:
   - Include: `IP ranges`
   - IP: `TU_IP_PUBLICA` (puedes obtenerla en https://ifconfig.me)
   - Action: `Allow`

### Solución 5: Configurar Tunnel sin Access

Si solo necesitas el túnel pero no Access:

**Archivo de configuración del tunnel (`config.yml`):**

```yaml
tunnel: TU_TUNNEL_ID
credentials-file: /path/to/credentials.json

ingress:
  # Frontend
  - hostname: qbitstream.serviciosqbit.net
    service: http://localhost:5173

  # Backend API (sin autenticación)
  - hostname: qbitstream.serviciosqbit.net
    path: /api/*
    service: http://localhost:3001
    originRequest:
      noTLSVerify: true

  # Jellyfin (con autenticación propia de Jellyfin)
  - hostname: qbitstream.serviciosqbit.net
    path: /jellyfin/*
    service: http://localhost:8096

  - service: http_status:404
```

Reinicia el tunnel:
```bash
sudo systemctl restart cloudflared
# o
cloudflared tunnel run TU_TUNNEL_NAME
```

---

## 🧪 Validación Local (desde tu servidor)

Como workaround inmediato, ejecuta el script de validación **desde tu servidor**:

```bash
# 1. Copia el script al servidor
scp validation-script.sh usuario@tu-servidor:/tmp/

# 2. Conéctate al servidor
ssh usuario@tu-servidor

# 3. Ejecuta el script
chmod +x /tmp/validation-script.sh
/tmp/validation-script.sh
```

O prueba manualmente:

```bash
# Desde tu servidor
curl http://localhost:3001/api/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"POLUX","password":"Supermetroid1."}'

# Listar perfiles (usa el token del paso anterior)
curl http://localhost:3001/api/profiles \
  -H "Authorization: Bearer TU_TOKEN"
```

---

## 🌐 Acceso al Frontend

### En Navegador (desde cualquier lugar)

1. Abre `https://qbitstream.serviciosqbit.net`
2. Si aparece una página de login de Cloudflare, necesitas:
   - Deshabilitar Access (Solución 1)
   - O agregar tu email a la whitelist

3. Si ves "Access denied":
   - Revisa las soluciones arriba

---

## 📋 Checklist de Configuración

- [ ] Cloudflare Tunnel está corriendo
- [ ] No hay políticas de Access bloqueando `/api/*`
- [ ] Frontend está construido y servido correctamente
- [ ] Backend está corriendo en puerto 3001
- [ ] Base de datos PostgreSQL está accesible
- [ ] Variables de entorno están configuradas
- [ ] PM2 tiene el servicio corriendo

---

## 🔧 Configuración Recomendada

### Para Desarrollo/Testing
- **Sin Cloudflare Access** - permite todo el tráfico
- O con Access **Bypass** para `/api/*`

### Para Producción
- **Cloudflare Access** solo para panel admin (`/admin/*`)
- **API pública** (`/api/*`) sin Access (protegida por JWT)
- **Frontend público** (`/`) sin Access
- **Rate Limiting** en Cloudflare para proteger contra ataques

---

## 🚀 Próximos Pasos

Una vez resuelto el bloqueo:

1. Ejecuta `validation-script.sh` desde tu servidor
2. Valida que el frontend cargue en navegador
3. Intenta hacer login con POLUX / Supermetroid1.
4. Verifica que los perfiles se listen correctamente
5. Prueba la detección de servidor
6. Si todo funciona, intenta acceder desde fuera de tu red

---

## 💡 Nota

El mensaje "Access denied" con servidor `envoy` es característico de **Cloudflare Tunnel con Access**. No es un problema de tu código, sino de la configuración de Cloudflare.

Tu aplicación probablemente funciona perfectamente en `localhost:3001`, solo necesitas ajustar las políticas de acceso de Cloudflare.

---

## 📞 Verificación Rápida

Desde tu servidor:

```bash
# ¿Está corriendo el backend?
pm2 status

# ¿Responde localmente?
curl http://localhost:3001/api/health

# Si ambos funcionan, el problema es 100% Cloudflare Access
```

---

¿Necesitas ayuda con alguna de estas soluciones? ¡Avísame! 🚀
