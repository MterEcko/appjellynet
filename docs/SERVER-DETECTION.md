# Detección Automática de Servidor Jellyfin

## 🎯 Objetivo

Seleccionar automáticamente el servidor Jellyfin óptimo para cada cliente basándose en su ubicación de red, minimizando latencia y maximizando velocidad de streaming.

## 🏗️ Arquitectura

### Servidores Configurados

1. **Red Interna** (`10.10.0.112:8096`)
   - Para dispositivos en la red local del servidor
   - Máxima velocidad, mínima latencia
   - HTTP sin cifrado (no necesario en LAN)

2. **Red WISP - Clientes** (`172.16.0.4:8096`)
   - Para clientes de tu servicio WISP
   - Conexión directa sin salir a internet
   - HTTP por red privada

3. **Red ISP** (`179.120.0.15:8096`)
   - Para conexiones desde la red del ISP
   - Dentro de la misma red del proveedor

4. **IP Pública ISP con Puerto Custom** (`189.168.20.1:8081`)
   - Para acceso desde IPs estáticas del proveedor
   - Puede usar puerto personalizado (ej: 8081)
   - Requiere port forwarding configurado

5. **Dominio Público HTTPS** (`https://qbitstream.serviciosqbit.net`)
   - Fallback universal
   - HTTPS seguro vía Cloudflare Tunnel
   - Funciona desde cualquier ubicación

## 🔍 Algoritmo de Detección

### Paso 1: Obtener IP Real del Cliente

```javascript
// Detecta IP real incluso detrás de Cloudflare Tunnel
const clientIp = getClientIp(req);
// Verifica headers: cf-connecting-ip, x-real-ip, x-forwarded-for
```

### Paso 2: Matching por CIDR

```javascript
// Compara IP con rangos de red configurados
if (isIpInCidr('10.10.0.50', '10.10.0.0/24')) {
  // Cliente está en red interna
  candidates = [serverLocal];
}
```

### Paso 3: Ping y Latencia

```javascript
// Hace ping a servidores candidatos
const results = await pingMultipleServers([
  'http://10.10.0.112:8096',
  'http://172.16.0.4:8096'
]);

// Selecciona el de menor latencia
const best = selectLowestLatency(results);
```

### Paso 4: Health Check

```javascript
// Verifica que el servidor está funcionando
const isHealthy = await jellyfinApi.ping();
```

### Paso 5: Fallback

```javascript
// Si todo falla, usar dominio público
if (!serverFound || !isHealthy) {
  return publicServer; // https://qbitstream.serviciosqbit.net
}
```

## 📱 Compatibilidad con Apps Nativas

### Android

```javascript
// Deep link para abrir app Jellyfin
jellyfin://10.10.0.112:8096/item/{itemId}

// Si app no instalada, redirige a Play Store después de 2s
setTimeout(() => {
  window.location = 'https://play.google.com/store/apps/details?id=org.jellyfin.mobile';
}, 2000);
```

### iOS/iPadOS

```javascript
// Deep link para iOS
jellyfin://10.10.0.112:8096/item/{itemId}

// Fallback a App Store
setTimeout(() => {
  window.location = 'https://apps.apple.com/app/jellyfin-mobile/id1480192618';
}, 2000);
```

### Android TV / Fire TV

```javascript
// Usa el mismo esquema de deep link
jellyfin://10.10.0.112:8096/item/{itemId}
```

### LG webOS / Samsung Tizen

Las apps web oficiales de Jellyfin funcionan directamente.

## 🎬 Soporte Chromecast y DLNA

Las apps oficiales de Jellyfin **ya incluyen**:
- ✅ Google Cast (Chromecast)
- ✅ DLNA
- ✅ AirPlay (iOS)

No necesitas implementar nada adicional. La app nativa maneja todo.

## 🔧 Configuración en Base de Datos

```sql
-- Servidor en red interna
INSERT INTO servers (server_id, name, url, network_cidr, priority, protocol)
VALUES ('local', 'Red Interna', 'http://10.10.0.112:8096', '10.10.0.0/24', 1, 'http');

-- Servidor WISP
INSERT INTO servers (server_id, name, url, network_cidr, priority, protocol)
VALUES ('wisp', 'Red WISP', 'http://172.16.0.4:8096', '172.16.0.0/16', 2, 'http');

-- Y así sucesivamente...
```

## 🌐 Ejemplo de Flujo Completo

### Usuario en Red Interna (10.10.0.50)

1. Usuario abre `https://qbitstream.serviciosqbit.net`
2. Backend detecta IP: `10.10.0.50`
3. Match con CIDR: `10.10.0.0/24` → Servidor Local
4. Ping: `10.10.0.112:8096` → 2ms ✅
5. Health check: OK ✅
6. **Respuesta**: `http://10.10.0.112:8096`
7. Si es móvil: Redirige a `jellyfin://10.10.0.112:8096`
8. App nativa se abre y conecta al servidor local

### Cliente WISP (172.16.50.100)

1. Usuario abre `https://qbitstream.serviciosqbit.net`
2. Backend detecta IP: `172.16.50.100`
3. Match con CIDR: `172.16.0.0/16` → Servidor WISP
4. Ping: `172.16.0.4:8096` → 15ms ✅
5. Health check: OK ✅
6. **Respuesta**: `http://172.16.0.4:8096`
7. Usuario conecta sin salir a internet público

### Usuario Externo (desde 8.8.8.8)

1. Usuario abre `https://qbitstream.serviciosqbit.net`
2. Backend detecta IP: `8.8.8.8`
3. No match con ningún CIDR
4. **Usa fallback**: `https://qbitstream.serviciosqbit.net` ✅
5. Conexión segura vía Cloudflare Tunnel

## 🔄 Actualización Dinámica

El sistema hace health checks periódicos (cada hora):

```javascript
// Cron job
cron.schedule('0 * * * *', async () => {
  await serverDetectionService.healthCheckAllServers();
});
```

Esto actualiza:
- ✅ Estado de salud (healthy/unhealthy)
- ✅ Latencia promedio
- ✅ Última verificación

## 🎯 Beneficios

1. **Máximo rendimiento**: Cada cliente usa su servidor óptimo
2. **Reducción de costos**: Menos tráfico por internet público
3. **Mejor experiencia**: Menor buffering, carga más rápida
4. **Resiliente**: Fallback automático si un servidor falla
5. **Transparente**: El usuario no necesita configurar nada

## 📊 Ejemplo de Latencias

| Red | Servidor | Latencia Típica |
|-----|----------|----------------|
| Interna (10.10.0.x) | Local | 1-5ms |
| WISP (172.16.x.x) | WISP | 10-30ms |
| ISP (179.120.0.x) | ISP | 20-50ms |
| Internet público | Cloudflare | 50-200ms |

## 🛠️ Testing

### Test Manual via API

```bash
# Detectar servidor desde IP específica
curl -H "X-Forwarded-For: 10.10.0.50" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/servers/detect

# Respuesta:
{
  "success": true,
  "data": {
    "serverId": "local",
    "name": "Red Interna",
    "url": "http://10.10.0.112:8096",
    "latencyMs": 2,
    "reason": "optimal"
  }
}
```

### Health Check de Todos los Servidores

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/servers/health

# Respuesta:
{
  "success": true,
  "data": [
    { "url": "http://10.10.0.112:8096", "healthy": true, "latency": 2 },
    { "url": "http://172.16.0.4:8096", "healthy": true, "latency": 15 },
    { "url": "http://179.120.0.15:8096", "healthy": false, "error": "timeout" }
  ]
}
```

## 🚀 Próximas Mejoras

- [ ] Cache de detección por cliente (cookie/localStorage)
- [ ] Métricas de uso por servidor (dashboard)
- [ ] Auto-switch si servidor actual falla durante streaming
- [ ] Geo-IP detection como complemento a CIDR
- [ ] Test de ancho de banda además de latencia
