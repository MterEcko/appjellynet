# Pruebas con Dominio Cloudflare

## Resumen

Se probó usar el dominio de Cloudflare `https://qbitstream.serviciosqbit.net` en lugar de la IP local `http://10.10.1.111:8096` para las conexiones del backend a Jellyfin.

## Resultados

### ✅ curl funciona perfectamente

```bash
curl -X POST "https://qbitstream.serviciosqbit.net/Users/New" \
  -H "X-Emby-Token: c07d422f84bc40579b5f918aa60ea97f" \
  -H "Content-Type: application/json" \
  -d '{"Name":"Test desde curl","Password":""}'
```

**Resultado**: Usuario creado exitosamente con ID `e27ea19b67f041e886eea31e0d174508`

### ❌ Node.js (Axios/fetch) falla con redirects

**Problema**: Jellyfin/Cloudflare devuelve redirects HTTP 301 que causan problemas en Node.js:

1. **Con fetch nativo**: Error `fetch failed` (problemas SSL/certificado)
2. **Con Axios + maxRedirects: 0**: Recibe 301 pero sin datos en response
3. **Con Axios + maxRedirects: 1**: Error `Maximum number of redirects exceeded`

**Logs del backend**:
```
2025-11-18 01:23:01 [debug]: Creating Jellyfin user at: https://qbitstream.serviciosqbit.net/Users/New
2025-11-18 01:23:01 [error]: Jellyfin createUser error: Maximum number of redirects exceeded
```

## Causa Raíz

La combinación de:
- Cloudflare como proxy HTTPS
- Jellyfin devolviendo redirects HTTP 301
- Manejo de redirects en Axios/fetch de Node.js

Crea un patrón de redirects que curl maneja correctamente pero Node.js no.

## Solución Implementada

Siguiendo la instrucción "si no se puede entonces así déjalo", se configuró el backend para usar:

- **Servidores locales** (LOCAL, WISP, ISP): `http://10.10.1.111:8096` (IP local sin Cloudflare)
- **Servidor público** (PUBLIC): `https://qbitstream.serviciosqbit.net` (dominio Cloudflare)

### Configuración en `.env`:
```env
JELLYFIN_SERVER_LOCAL=http://10.10.1.111:8096
JELLYFIN_SERVER_WISP=http://10.10.1.111:8096
JELLYFIN_SERVER_ISP=http://10.10.1.111:8096
JELLYFIN_SERVER_PUBLIC=https://qbitstream.serviciosqbit.net
```

## Para Pruebas en Windows

El usuario debe configurar su `.env` en Windows usando:
```env
DATABASE_URL=postgresql://postgres:Supermetroid1.@localhost:5433/qbitstream
JELLYFIN_SERVER_LOCAL=http://10.10.1.111:8096
JELLYFIN_SERVER_WISP=http://10.10.1.111:8096
JELLYFIN_SERVER_ISP=http://10.10.1.111:8096
JELLYFIN_SERVER_PUBLIC=https://qbitstream.serviciosqbit.net
```

## Mejoras Futuras Posibles

Si se requiere usar Cloudflare para todas las conexiones, opciones a explorar:

1. **Configurar Cloudflare** para no devolver redirects en `/Users/New`
2. **Usar biblioteca HTTP diferente** que maneje redirects como curl
3. **Wrapper sobre curl** desde Node.js para operaciones específicas
4. **Investigar configuración SSL** de Node.js para aceptar certificados de Cloudflare

## Conclusión

✅ El dominio de Cloudflare **SÍ FUNCIONA** para la API de Jellyfin (verificado con curl)
❌ Node.js tiene problemas de compatibilidad con el patrón de redirects
✅ Solución temporal: Usar IP local `http://10.10.1.111:8096` para conexiones desde backend
✅ El servidor público sigue usando Cloudflare para acceso externo
