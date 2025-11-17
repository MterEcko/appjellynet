# StreamQbit 🎬

> Plataforma de streaming personalizada para Jellyfin con gestión avanzada de perfiles, publicidad inteligente y detección automática de servidor.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-green.svg)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)

---

## 📖 Tabla de Contenidos

- [Características](#-características)
- [Demo](#-demo)
- [Arquitectura](#-arquitectura)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API Documentation](#-api-documentation)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Roadmap](#-roadmap)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)
- [Contacto](#-contacto)

---

## ✨ Características

### 🎯 Core Features

- **🔐 Gestión Avanzada de Cuentas**
  - Cuentas maestras con múltiples perfiles (3-8 según plan)
  - Sincronización bidireccional con Jellyfin
  - Cambio de contraseña automático en todos los perfiles
  - Soporte para diferentes tipos de cuenta (WISP, Demo, Mensual, Semanal)

- **📺 Sistema de Publicidad Inteligente**
  - Pre-roll, mid-roll y pause-roll ads
  - Cálculo automático de posiciones de mid-rolls
  - Tracking completo de impresiones, completados y skips
  - Ad-blocker detection
  - Gestión de campañas publicitarias

- **🌐 Detección Automática de Servidor**
  - Selección inteligente del servidor Jellyfin óptimo
  - Basado en latencia y ubicación de red
  - Soporte para múltiples servidores (local, WISP, ISP, público)
  - Cache de detección para mejor rendimiento

- **📱 Compatibilidad Móvil Total**
  - Deep linking automático a apps nativas de Jellyfin
  - Detección de dispositivo y redirección inteligente
  - PWA (Progressive Web App) ready
  - Responsive design (mobile-first)

- **💳 Sistema de Subscripciones**
  - Integración con Stripe y MercadoPago
  - Planes Basic y Premium
  - Cuentas demo con expiración configurable
  - Clientes WISP (gratis con servicio de internet)
  - Suspensión automática por falta de pago

- **🔗 Webhooks y API Pública**
  - API REST completa para integraciones externas
  - Sistema de webhooks salientes (notificaciones de eventos)
  - Webhooks entrantes (WISP, Stripe, MercadoPago)
  - Rate limiting y autenticación JWT/API Key

- **📊 Panel de Administración**
  - Dashboard con métricas en tiempo real
  - Gestión de cuentas y perfiles
  - Upload y gestión de anuncios publicitarios
  - Analytics y estadísticas de uso
  - Configuración de servidores Jellyfin
  - Logs de auditoría

### 🎨 UI/UX Features

- Interfaz tipo Netflix moderna y responsiva
- Hero banner con trailer autoplay
- Filas de contenido horizontales (scroll infinito)
- Búsqueda en tiempo real
- Filtros por género y biblioteca
- Selector de perfiles con avatares personalizables
- Tema oscuro por defecto
- Animaciones fluidas con GSAP

---

## 🎥 Demo

### Screenshots

#### Landing Page
![Landing Page](docs/images/landing.png)

#### Browse Interface
![Browse](docs/images/browse.png)

#### Admin Dashboard
![Admin Dashboard](docs/images/admin.png)

### Video Demo
[Ver demo en YouTube](https://youtube.com/link-to-demo) *(próximamente)*

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE TUNNEL                       │
│                  (stream.serviciosqbit.net)                  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    NODE.JS BACKEND (Express)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   REST API   │  │ Jellyfin API │  │   Webhooks   │      │
│  │              │  │    Proxy     │  │   Handler    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────┬────────────────────┬────────────────────┬──────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌────────────────┐  ┌──────────────────┐  ┌────────────────┐
│   PostgreSQL   │  │  Redis (Cache)   │  │ Jellyfin Servers│
│   (Database)   │  │                  │  │  10.10.0.111    │
└────────────────┘  └──────────────────┘  │  172.16.8.23    │
                                           │  100.10.0.15    │
                                           └────────────────┘
         ▲
         │
         │ Vue 3 Frontend (SPA)
         │
┌────────┴────────────────────────────────────────────────────┐
│           USUARIOS (Web, Mobile, TV Apps)                    │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Usuario

1. **Login** → Usuario ingresa en `stream.serviciosqbit.net`
2. **Selección de Perfil** → Elige uno de sus perfiles configurados
3. **Detección de Servidor** → Backend detecta el servidor Jellyfin óptimo
4. **Redirección (Móvil)** → Deep link abre la app nativa de Jellyfin
5. **Reproducción (Web)** → Player con ads (si plan básico)

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: Vue Router 4
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Animations**: GSAP
- **HTTP Client**: Axios
- **Video Player**: Jellyfin Web Player + Video.js

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15+ (compatible con MySQL)
- **Cache**: Redis 7+
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **Email**: Nodemailer
- **Cron Jobs**: node-cron
- **Logging**: Winston

### DevOps
- **Containerization**: Docker + Docker Compose
- **Tunnel**: Cloudflare Tunnel (no Nginx necesario)
- **Process Manager**: PM2
- **CI/CD**: GitHub Actions (opcional)

### Third-Party Integrations
- **Jellyfin API**: Gestión de usuarios y contenido
- **Stripe**: Pagos y subscripciones
- **MercadoPago**: Pagos (LATAM)
- **SMTP**: Notificaciones por email

---

## 📋 Requisitos Previos

Antes de instalar, asegúrate de tener:

- **Node.js** 18.x o superior
- **PostgreSQL** 15.x o superior (o MySQL 8.0+)
- **Redis** 7.x o superior
- **Docker** y **Docker Compose** (opcional pero recomendado)
- **Servidor Jellyfin** configurado y accesible
- **Cloudflare Tunnel** configurado (o servidor con IP pública)
- **Cuenta de Stripe/MercadoPago** (para pagos)

---

## 🚀 Instalación

### Opción 1: Docker (Recomendado)

```bash
# Clonar el repositorio
git clone https://github.com/tuusuario/streamqbit-platform.git
cd streamqbit-platform

# Copiar archivos de ejemplo
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Editar archivos .env con tus credenciales

# Levantar todos los servicios
docker-compose up -d

# Ejecutar migraciones de base de datos
docker-compose exec backend npm run migrate

# Seed inicial (admin user, etc.)
docker-compose exec backend npm run seed
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Opción 2: Instalación Manual

#### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar .env
cp .env.example .env
# Editar .env con tus credenciales

# Generar Prisma Client
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Seed inicial
npm run seed

# Compilar TypeScript
npm run build

# Iniciar servidor
npm run start

# O en modo desarrollo
npm run dev
```

#### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Copiar .env
cp .env.example .env
# Editar .env con la URL del backend

# Iniciar en desarrollo
npm run dev

# O compilar para producción
npm run build
```

---

## ⚙️ Configuración

### 1. Variables de Entorno

#### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/streamqbit

# JWT
JWT_SECRET=tu-secret-key-seguro
JWT_REFRESH_SECRET=tu-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Jellyfin Servers
JELLYFIN_SERVER_LOCAL=http://10.10.0.111:8096
JELLYFIN_SERVER_WISP=http://172.16.8.23:8096
JELLYFIN_SERVER_ISP=http://100.10.0.15:8096
JELLYFIN_SERVER_PUBLIC=https://stream.serviciosqbit.net
JELLYFIN_API_KEY=tu-api-key-de-jellyfin

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# MercadoPago (opcional)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
```

#### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
VITE_JELLYFIN_PUBLIC_URL=https://stream.serviciosqbit.net
VITE_APP_NAME=StreamQbit
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

### 2. Configurar Cloudflare Tunnel

```bash
# Instalar cloudflared
# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# Autenticar
cloudflared tunnel login

# Crear tunnel
cloudflared tunnel create streamqbit

# Configurar en cloudflare/config.yml
tunnel: TU_TUNNEL_ID
credentials-file: /path/to/credentials.json
ingress:
  - hostname: stream.serviciosqbit.net
    service: http://localhost:3000
  - service: http_status:404

# Rutear DNS
cloudflared tunnel route dns streamqbit stream.serviciosqbit.net

# Iniciar tunnel
cloudflared tunnel run streamqbit
```

### 3. Configurar Jellyfin

En tu servidor Jellyfin:

1. Crear API Key: **Dashboard → API Keys → New API Key**
2. Copiar la API Key al archivo `.env` del backend
3. Asegurar que Jellyfin esté accesible en las URLs configuradas

### 4. Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb streamqbit

# O usando psql
psql -U postgres
CREATE DATABASE streamqbit;
\q

# Ejecutar migraciones
cd backend
npx prisma migrate deploy

# Verificar
npx prisma studio  # Abre interfaz web en http://localhost:5555
```

---

## 📖 Uso

### Crear Primera Cuenta

1. **Via API** (recomendado para setup inicial):

```bash
# Crear cuenta admin
curl -X POST http://localhost:3000/api/admin/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "admin@serviciosqbit.net",
    "plan": "premium",
    "account_type": "monthly",
    "profiles_count": 8
  }'
```

2. **Via Dashboard Admin**:
   - Accede a http://localhost:3000/admin
   - Login con credenciales de admin (del seed)
   - Click en "Crear Cuenta"
   - Llenar formulario

### Crear Cuenta Demo

```bash
curl -X POST http://localhost:3000/api/admin/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "demo@example.com",
    "plan": "demo",
    "account_type": "demo",
    "profiles_count": 4,
    "demo_duration_days": 7
  }'
```

### Subir Anuncio Publicitario

```bash
curl -X POST http://localhost:3000/api/admin/ads \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "file=@/path/to/ad-video.mp4" \
  -F "type=preroll" \
  -F "campaign_name=Coca-Cola 2024" \
  -F "weight=5" \
  -F "start_date=2024-01-01" \
  -F "end_date=2024-12-31"
```

### Configurar Webhook WISP

En tu sistema de facturación WISP, configura webhook POST a:

```
https://stream.serviciosqbit.net/api/webhooks/wisp
```

Con payload:

```json
{
  "event": "service.suspended",
  "customer_id": "WISP-12345",
  "reason": "non_payment"
}
```

---

## 📚 API Documentation

### Authentication

Todos los endpoints (excepto públicos) requieren autenticación JWT.

**Login:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": { ... }
}
```

**Usar Token:**
```http
GET /api/account/me
Authorization: Bearer eyJhbGc...
```

### Endpoints Principales

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login | Público |
| POST | `/api/auth/refresh` | Renovar token | Público |
| GET | `/api/account/me` | Info de cuenta | Usuario |
| POST | `/api/account/change-password` | Cambiar password | Usuario |
| GET | `/api/profiles` | Listar perfiles | Usuario |
| POST | `/api/profiles` | Crear perfil | Usuario |
| GET | `/api/jellyfin/detect-server` | Detectar servidor | Usuario |
| POST | `/api/admin/accounts` | Crear cuenta | Admin |
| GET | `/api/stats/overview` | Estadísticas | Usuario |

[**Documentación completa de API →**](docs/API.md)

---

## 📁 Estructura del Proyecto

```
streamqbit-platform/
├── backend/                    # Node.js + Express API ✅
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   ├── services/          # Business logic
│   │   ├── routes/            # API routes
│   │   ├── middlewares/       # Express middlewares
│   │   ├── jobs/              # Cron jobs
│   │   └── prisma/            # Database schema
│   └── tests/
│
├── frontend/                   # Vue 3 Web Application (pendiente)
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── views/             # Páginas
│   │   ├── stores/            # Pinia stores
│   │   ├── services/          # API services
│   │   └── router/            # Vue Router
│   └── public/
│
├── mobile-android/             # App Android (Kotlin) ✅
│   ├── app/
│   │   └── src/main/
│   │       ├── kotlin/        # Código Kotlin
│   │       └── res/           # Recursos (layouts, drawables)
│   ├── README_QBITSTREAM.md   # Guía de personalización
│   └── build.gradle
│
├── mobile-androidtv/           # App Android TV (Kotlin) ✅
│   ├── app/
│   │   └── src/main/
│   │       ├── java/          # Código Java/Kotlin
│   │       └── res/           # Recursos Leanback UI
│   ├── README_QBITSTREAM.md   # Guía de personalización
│   └── build.gradle
│
├── mobile-ios/                 # App iOS/tvOS (Swift) (pendiente)
│   ├── Swiftfin/
│   │   ├── Views/
│   │   ├── ViewModels/
│   │   └── Resources/
│   └── README_QBITSTREAM.md
│
├── docker/                     # Docker configs
├── docs/                       # Documentación
│   ├── API.md
│   └── SERVER-DETECTION.md
├── scripts/                    # Utility scripts
└── docker-compose.yml
```

[**Ver estructura completa →**](docs/PROJECT-STRUCTURE.md)

---

## 🗺️ Roadmap

### ✅ v1.0 (Actual)
- [x] Sistema de cuentas y perfiles
- [x] Detección automática de servidor
- [x] Sistema de publicidad
- [x] Subscripciones y pagos
- [x] Panel de administración
- [x] API pública y webhooks

### 🚧 v1.1 (Próximo)
- [ ] Modo offline (descargas)
- [ ] Watch together (sincronización entre usuarios)
- [ ] Control parental avanzado
- [ ] Notificaciones push (PWA)
- [ ] Multi-idioma (i18n)

### 🔮 v2.0 (Futuro)
- [ ] App nativa React Native
- [ ] Smart TV app (Android TV, webOS)
- [ ] Chromecast sender personalizado
- [ ] Sistema de recomendaciones con ML
- [ ] Programa de referidos
- [ ] Gift cards

[**Ver roadmap completo →**](docs/ROADMAP.md)

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor sigue estos pasos:

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución

- Sigue el estilo de código existente
- Añade tests para nuevas funcionalidades
- Actualiza la documentación
- Usa commits semánticos (feat, fix, docs, etc.)

[**Leer guía completa de contribución →**](CONTRIBUTING.md)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 📧 Contacto

**Jesús Rodríguez** - [@tuusuario](https://twitter.com/tuusuario)

**Sitio Web**: [serviciosqbit.net](https://serviciosqbit.net)

**Email**: contacto@serviciosqbit.net

**Link del Proyecto**: [https://github.com/tuusuario/streamqbit-platform](https://github.com/tuusuario/streamqbit-platform)

---

## 🙏 Agradecimientos

- [Jellyfin](https://jellyfin.org/) - Media server open source
- [Vue.js](https://vuejs.org/) - The Progressive JavaScript Framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Cloudflare](https://www.cloudflare.com/) - Tunnel service

---

## ⚠️ Disclaimer

Este proyecto es una interfaz personalizada para Jellyfin y no está afiliado oficialmente con el proyecto Jellyfin. Jellyfin® es una marca registrada de Jellyfin.

El uso de este software debe cumplir con todas las leyes locales aplicables sobre derechos de autor y distribución de contenido multimedia.

---

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/tuusuario/streamqbit-platform)
![GitHub forks](https://img.shields.io/github/forks/tuusuario/streamqbit-platform)
![GitHub issues](https://img.shields.io/github/issues/tuusuario/streamqbit-platform)
![GitHub pull requests](https://img.shields.io/github/issues-pr/tuusuario/streamqbit-platform)

---

<p align="center">
  Hecho con ❤️ por <a href="https://serviciosqbit.net">Servicios Qbit</a>
</p>

<p align="center">
  <a href="#streamqbit-">⬆️ Volver arriba</a>
</p>
