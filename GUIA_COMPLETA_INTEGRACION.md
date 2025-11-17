# 🚀 Guía Completa de Integración - QbitStream

Esta guía te muestra cómo poner en marcha **todo el ecosistema QbitStream** desde cero.

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Mobile Android Setup](#mobile-android-setup)
5. [Mobile Android TV Setup](#mobile-android-tv-setup)
6. [Configuración de Servidores Jellyfin](#configuración-de-servidores-jellyfin)
7. [Configuración Remota](#configuración-remota)
8. [Testing Completo](#testing-completo)
9. [Deploy a Producción](#deploy-a-producción)

---

## 🔧 Requisitos Previos

### Software Necesario:

**Para Backend y Frontend:**
- Node.js 18+ ([descargar](https://nodejs.org/))
- PostgreSQL 15+ ([descargar](https://www.postgresql.org/download/))
- Redis (opcional, para caché)
- Git

**Para Mobile Apps:**
- Android Studio ([descargar](https://developer.android.com/studio))
- JDK 11+
- Android SDK (API 21+)

**Para Servidores Jellyfin:**
- Jellyfin 10.8+ instalado en tus servidores ([descargar](https://jellyfin.org/downloads/))

---

## 🖥️ Backend Setup

### 1. Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
psql -U postgres
CREATE DATABASE qbitstream;
CREATE USER qbitstream_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE qbitstream TO qbitstream_user;
\q
```

### 2. Configurar Variables de Entorno

```bash
cd backend
cp .env.example .env
```

Edita `.env`:

```env
# Database
DATABASE_URL="postgresql://qbitstream_user:tu_password_seguro@localhost:5432/qbitstream"

# JWT
JWT_SECRET="TU_SECRET_MUY_LARGO_Y_SEGURO_MINIMO_64_CARACTERES_AQUI"
JWT_REFRESH_SECRET="OTRO_SECRET_DIFERENTE_TAMBIEN_MUY_LARGO"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# SMTP (para emails)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu_email@gmail.com"
SMTP_PASS="tu_app_password"
SMTP_FROM_NAME="QbitStream"
SMTP_FROM_EMAIL="no-reply@qbitstream.com"

# Jellyfin Servers (se sobrescriben desde DB)
JELLYFIN_SERVER_LOCAL="http://10.10.0.112:8096"
JELLYFIN_SERVER_WISP="http://172.16.0.4:8096"
JELLYFIN_SERVER_ISP="http://179.120.0.15:8096"
JELLYFIN_SERVER_PUBLIC="https://qbitstream.serviciosqbit.net"

# Admin Credentials
JELLYFIN_ADMIN_USER="admin"
JELLYFIN_ADMIN_PASSWORD="admin_password_jellyfin"

# App Settings
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
```

### 3. Instalar Dependencias y Ejecutar

```bash
npm install

# Generar Prisma Client
npx prisma generate

# Crear tablas en DB
npx prisma db push

# Seed inicial (crea admin y servidores)
npx prisma db seed

# Ejecutar en desarrollo
npm run dev
```

**Resultado esperado:**
```
✓ Server running on port 3001
✓ Database connected
✓ Cron jobs started
```

### 4. Verificar API

```bash
curl http://localhost:3001/api/health
# Response: {"status":"ok","timestamp":"2025-01-17T..."}
```

---

## 🎨 Frontend Setup

### 1. Instalar Dependencias

```bash
cd frontend
npm install
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita `.env`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=QbitStream
VITE_APP_VERSION=1.0.0
```

### 3. Ejecutar en Desarrollo

```bash
npm run dev
```

Abre: **http://localhost:5173**

### 4. Probar el Frontend

**Credenciales de prueba:**
- Email: `demo@example.com`
- Password: `demo123`

O usa el admin:
- Email: `admin@serviciosqbit.net`
- Password: `admin123`

**Flujo de testing:**
1. Login → Debería redirigir a `/profiles`
2. Seleccionar perfil → Debería redirigir a `/browse`
3. Ver hero banner y carruseles con contenido de Jellyfin
4. Click en una película → Debería abrir `/watch/:id`
5. Video player carga con pre-roll ad
6. Skip ad o esperar → Comienza contenido

---

## 📱 Mobile Android Setup

### 1. Abrir Proyecto en Android Studio

```bash
# Abrir Android Studio
File → Open → Seleccionar: /ruta/a/appjellynet/mobile-android
```

### 2. Sync Gradle

Espera a que Gradle descargue dependencias (puede tomar varios minutos la primera vez).

### 3. Configurar Backend API URL

Edita `mobile-android/app/src/main/java/net/serviciosqbit/stream/Constants.kt`:

```kotlin
const val BACKEND_API_URL = "http://10.0.2.2:3001/api" // Para emulador
// O
const val BACKEND_API_URL = "http://TU_IP_LOCAL:3001/api" // Para dispositivo físico
```

> **Nota:** `10.0.2.2` es la IP especial del emulador para acceder a `localhost` de tu PC.

### 4. Compilar

**Opción A - Android Studio:**
- Build → Make Project
- Run → Run 'app'

**Opción B - Terminal:**
```bash
cd mobile-android
./gradlew assembleDebug

# Instalar en dispositivo conectado
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 5. Configurar Archivo Remoto (Opcional pero Recomendado)

Ver sección [Configuración Remota](#configuración-remota)

### 6. Probar la App

1. Abre la app en el dispositivo
2. Login con credenciales de backend
3. Debería mostrar selector de perfiles
4. Selecciona perfil → Se conecta automáticamente a Jellyfin
5. Reproduce contenido → Pre-roll ad se muestra primero

---

## 📺 Mobile Android TV Setup

**Proceso idéntico a Mobile Android**, pero:

1. Abrir proyecto: `/ruta/a/appjellynet/mobile-androidtv`
2. Editar `Constants.kt` en el namespace `net.serviciosqbit.streamtv`
3. Compilar y ejecutar en TV o emulador de TV

```bash
cd mobile-androidtv
./gradlew assembleDebug
adb -d install app/build/outputs/apk/debug/app-debug.apk
```

---

## 🎬 Configuración de Servidores Jellyfin

### 1. Instalar Jellyfin en Tus Servidores

Sigue la [guía oficial](https://jellyfin.org/docs/general/installation/)

**Tus servidores (según `seed.ts`):**
- `http://10.10.0.112:8096` - Red interna
- `http://172.16.0.4:8096` - Red WISP
- `http://179.120.0.15:8096` - ISP
- `http://189.168.20.1:8081` - IP pública
- `https://qbitstream.serviciosqbit.net` - Dominio público

### 2. Configurar Cloudflare Tunnel (Opcional)

Para exponer el servidor público de forma segura:

```bash
# Instalar cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared

# Autenticar
./cloudflared tunnel login

# Crear tunnel
./cloudflared tunnel create qbitstream

# Configurar DNS
# En Cloudflare Dashboard → DNS → Agregar registro CNAME
# Nombre: qbitstream
# Target: [tunnel-id].cfargotunnel.com

# Crear config
cat > ~/.cloudflared/config.yml << EOF
tunnel: [tu-tunnel-id]
credentials-file: /root/.cloudflared/[tu-tunnel-id].json

ingress:
  - hostname: qbitstream.serviciosqbit.net
    service: http://localhost:8096
  - service: http_status:404
EOF

# Ejecutar tunnel
./cloudflared tunnel run qbitstream
```

### 3. Verificar Conectividad

```bash
# Desde el backend
curl http://10.10.0.112:8096/System/Info/Public
curl https://qbitstream.serviciosqbit.net/System/Info/Public
```

### 4. Actualizar URLs en Backend

Si tus IPs son diferentes, actualiza `backend/src/prisma/seed.ts` líneas 40-70 y ejecuta:

```bash
npx prisma db seed
```

---

## 🌐 Configuración Remota

Para actualizar las apps móviles sin recompilarlas:

### 1. Crear Repositorio de Config en GitHub

```bash
mkdir qbitstream-config
cd qbitstream-config

# Copiar el archivo de config
cp /ruta/a/appjellynet/mobile-config.json .

# Editar con tus URLs reales
nano mobile-config.json

# Subir a GitHub
git init
git add mobile-config.json
git commit -m "Initial config"
git remote add origin https://github.com/TU_USUARIO/qbitstream-config.git
git push -u origin main
```

### 2. Obtener URL Raw

```
https://raw.githubusercontent.com/TU_USUARIO/qbitstream-config/main/mobile-config.json
```

### 3. Actualizar Apps

**Android:**
```kotlin
// mobile-android/app/src/main/java/net/serviciosqbit/stream/services/ConfigService.kt
// Línea 21
private const val CONFIG_URL = "https://raw.githubusercontent.com/TU_USUARIO/qbitstream-config/main/mobile-config.json"
```

**Android TV:**
```kotlin
// mobile-androidtv/app/src/main/java/net/serviciosqbit/streamtv/services/ConfigService.kt
// Línea 21
private const val CONFIG_URL = "https://raw.githubusercontent.com/TU_USUARIO/qbitstream-config/main/mobile-config.json"
```

### 4. Actualizar Config Sin Recompilar

Simplemente edita `mobile-config.json` en GitHub y haz push. Las apps cargarán la nueva config en menos de 1 hora (tiempo de caché).

---

## 🧪 Testing Completo

### Backend API

```bash
# Health check
curl http://localhost:3001/api/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@serviciosqbit.net","password":"admin123"}'

# Guardar el accessToken que retorna

# Detectar servidor
curl -X GET http://localhost:3001/api/servers/detect \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"

# Ver planes
curl -X GET http://localhost:3001/api/admin/plans \
  -H "Authorization: Bearer TU_ACCESS_TOKEN"
```

### Frontend Web

1. **Login:** http://localhost:5173/login
2. **Profiles:** Debería mostrar perfiles del usuario
3. **Browse:** Debería cargar contenido de Jellyfin
4. **Play:** Click en contenido → Debería reproducir con ads

### Mobile Apps

**Checklist:**
- [ ] App instala correctamente
- [ ] Login funciona
- [ ] Selector de perfiles se muestra
- [ ] Seleccionar perfil redirige a contenido
- [ ] Server detection funciona (verifica logs)
- [ ] Contenido carga de Jellyfin
- [ ] Ads se reproducen antes del contenido
- [ ] Skip ad funciona después del timer

---

## 🚀 Deploy a Producción

### Backend (Node.js)

**Opción 1: VPS con PM2**

```bash
# En tu servidor
cd backend
npm install --production

# Configurar .env para producción
nano .env
# Cambiar NODE_ENV=production
# Actualizar URLs

# Ejecutar con PM2
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Opción 2: Docker**

```bash
cd backend
docker build -t qbitstream-backend .
docker run -d -p 3001:3001 --env-file .env qbitstream-backend
```

**Opción 3: Servicios Cloud**
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Google Cloud Run

### Frontend (Vue)

**Build:**
```bash
cd frontend
npm run build
# Genera: frontend/dist/
```

**Deploy en:**

**Opción 1: Netlify** (Recomendado - Gratis)
```bash
# Instalar CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

**Opción 2: Vercel**
```bash
npm install -g vercel
vercel --prod
```

**Opción 3: Tu propio servidor (Nginx)**
```nginx
server {
    listen 80;
    server_name qbitstream.serviciosqbit.net;

    root /var/www/qbitstream-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Mobile Apps

**Build Release:**

```bash
# Android
cd mobile-android
./gradlew assembleRelease

# El APK estará en:
# app/build/outputs/apk/release/app-release.apk
```

**Firmar APK:**

```bash
# Crear keystore
keytool -genkey -v -keystore qbitstream.keystore -alias qbitstream -keyalg RSA -keysize 2048 -validity 10000

# Firmar
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore qbitstream.keystore app-release-unsigned.apk qbitstream

# Optimizar
zipalign -v 4 app-release-unsigned.apk qbitstream-release.apk
```

**Publicar en Google Play:**
1. Crear cuenta de desarrollador ($25 one-time fee)
2. Crear app en Play Console
3. Subir APK firmado
4. Llenar información de la app
5. Publicar

---

## 📊 Monitoreo

### Logs

**Backend:**
```bash
pm2 logs qbitstream-backend
```

**Mobile:**
```bash
adb logcat | grep "AdService\|AuthService\|ConfigService"
```

### Métricas

Agrega a `backend/src/app.ts`:

```typescript
import { register } from 'prom-client';

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

Luego integra con Prometheus + Grafana.

---

## 🔧 Troubleshooting

### Backend no inicia

```bash
# Verificar PostgreSQL
psql -U postgres -c "SELECT version();"

# Verificar puerto libre
lsof -i :3001

# Ver logs
npm run dev --verbose
```

### Frontend no conecta a backend

- Verificar CORS en `backend/src/app.ts`
- Verificar `.env` tiene `VITE_API_URL` correcta
- Verificar backend está corriendo en puerto 3001

### Mobile no detecta servidor

- Verificar `BACKEND_API_URL` en `Constants.kt`
- Para emulador, usa `10.0.2.2` en lugar de `localhost`
- Para dispositivo físico, usa IP local de tu PC
- Verificar firewall permite conexiones entrantes

### Ads no se muestran

- Verificar hay ads en la base de datos (crear desde admin panel)
- Verificar fecha de inicio/fin del ad
- Verificar `isActive` del ad es `true`
- Ver logs del backend: `Ad selected: ...`

---

## 📚 Documentación Adicional

- [docs/API.md](./docs/API.md) - Documentación completa de API
- [docs/GUIA_RAPIDA_API.md](./docs/GUIA_RAPIDA_API.md) - Guía rápida de uso
- [docs/RECOMENDACIONES.md](./docs/RECOMENDACIONES.md) - Mejores prácticas
- [mobile-android/INTEGRATION_GUIDE.md](./mobile-android/INTEGRATION_GUIDE.md) - Integración móvil
- [mobile-android/ADS_INTEGRATION_GUIDE.md](./mobile-android/ADS_INTEGRATION_GUIDE.md) - Sistema de ads
- [mobile-android/REMOTE_CONFIG_GUIDE.md](./mobile-android/REMOTE_CONFIG_GUIDE.md) - Config remota

---

## ✅ Checklist Final

### Backend
- [ ] PostgreSQL instalado y configurado
- [ ] Variables de entorno configuradas
- [ ] Base de datos creada con `prisma db push`
- [ ] Seed ejecutado con admin y servidores
- [ ] Backend corriendo en puerto 3001
- [ ] Health endpoint responde

### Frontend
- [ ] Dependencias instaladas con `npm install`
- [ ] Variables de entorno configuradas
- [ ] Ejecutando en http://localhost:5173
- [ ] Login funciona
- [ ] Browse muestra contenido de Jellyfin
- [ ] Video player funciona con ads

### Mobile Android
- [ ] Android Studio instalado
- [ ] Proyecto abre sin errores de Gradle
- [ ] `Constants.kt` tiene URL correcta del backend
- [ ] App compila correctamente
- [ ] Login funciona
- [ ] Server detection funciona
- [ ] Ads se reproducen

### Mobile Android TV
- [ ] Mismo checklist que Android
- [ ] Prueba en TV o emulador de TV

### Jellyfin Servers
- [ ] Al menos 1 servidor Jellyfin instalado y funcionando
- [ ] URLs actualizadas en `seed.ts`
- [ ] Contenido disponible en Jellyfin
- [ ] Backend puede conectarse a Jellyfin

### Configuración Remota
- [ ] `mobile-config.json` subido a GitHub/Drive/OneDrive
- [ ] URL raw obtenida
- [ ] `ConfigService.kt` actualizado con URL
- [ ] Apps cargan config correctamente

---

## 🎉 ¡Listo!

Si completaste todos los pasos, ahora tienes:

✅ Backend API funcionando con todos los endpoints
✅ Frontend web con UI tipo Netflix
✅ Apps móviles para Android y Android TV
✅ Sistema de publicidad end-to-end
✅ Servidor detection automático
✅ Auto-login con credenciales seguras
✅ Configuración remota actualizable sin recompilar
✅ Integración completa con Jellyfin

**¿Problemas?** Revisa la sección de Troubleshooting o consulta la documentación específica.

**¿Siguiente paso?** Agrega contenido a Jellyfin y empieza a usarlo! 🚀
