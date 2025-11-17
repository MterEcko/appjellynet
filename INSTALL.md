# Guía de Instalación - StreamQbit Platform

## Requisitos Previos

- **Node.js** 18.x o superior
- **PostgreSQL** 15.x o superior
- **Redis** 7.x o superior
- **Docker** y **Docker Compose** (opcional pero recomendado)
- **Servidor Jellyfin** configurado y accesible
- **Cloudflare Tunnel** (ya configurado en tu caso)

## Instalación con Docker Compose (Recomendado)

### 1. Clonar el repositorio

```bash
git clone <tu-repo>
cd streamqbit-platform
```

### 2. Configurar variables de entorno

```bash
# Copiar archivos de ejemplo
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Editar archivos .env

Edita los archivos `.env` con tus credenciales:

**Backend (`backend/.env`):**
- Configurar `DATABASE_URL`
- Configurar `JWT_SECRET` y `JWT_REFRESH_SECRET`
- Configurar credenciales de SMTP
- Configurar claves de Stripe/MercadoPago
- Configurar URLs de servidores Jellyfin y `JELLYFIN_API_KEY`

**Frontend (`frontend/.env`):**
- Configurar `VITE_API_URL` (http://localhost:3001 para desarrollo)
- Configurar `VITE_JELLYFIN_PUBLIC_URL`

### 4. Levantar los servicios con Docker Compose

```bash
docker-compose up -d
```

Esto levantará:
- Frontend (Puerto 5173)
- Backend (Puerto 3001)
- PostgreSQL (Puerto 5432)
- Redis (Puerto 6379)

### 5. Ejecutar migraciones de base de datos

```bash
docker-compose exec backend npm run prisma:migrate
```

### 6. Poblar base de datos con datos iniciales (seed)

```bash
docker-compose exec backend npm run seed
```

Esto creará:
- Usuario admin: `admin@serviciosqbit.net` / `admin123`
- Usuario demo: `demo@example.com` / `demo123`
- Servidores Jellyfin configurados

### 7. Acceder a la aplicación

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

## Instalación Manual (Sin Docker)

### Backend

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
npx prisma migrate dev

# Seed inicial
npm run seed

# Compilar TypeScript
npm run build

# Iniciar servidor (modo desarrollo)
npm run dev

# O compilar y ejecutar en producción
npm run build
npm run start
```

### Frontend

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

## Verificación

### 1. Verificar que el backend esté funcionando

```bash
curl http://localhost:3001/api/health
```

Deberías recibir: `{"status":"ok","timestamp":"..."}`

### 2. Verificar que la base de datos esté funcionando

```bash
# Ver base de datos con Prisma Studio
cd backend
npx prisma studio
```

Esto abrirá una interfaz web en http://localhost:5555

### 3. Probar login con usuario admin

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@serviciosqbit.net",
    "password": "admin123"
  }'
```

Deberías recibir un token de acceso y datos del usuario.

## Configuración de Jellyfin

1. Accede a tu servidor Jellyfin
2. Ve a **Dashboard → API Keys**
3. Crea una nueva API Key
4. Copia la clave y pégala en `JELLYFIN_API_KEY` en tu archivo `.env`

## Configuración de Stripe (Opcional)

1. Crea una cuenta en [Stripe](https://stripe.com)
2. Obtén tus claves de API (test mode)
3. Configura las variables:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `VITE_STRIPE_PUBLIC_KEY` (frontend)

## Configuración de SMTP para Emails

Para Gmail:
1. Habilita "Verificación en 2 pasos" en tu cuenta de Gmail
2. Genera una "Contraseña de aplicación"
3. Usa esa contraseña en `SMTP_PASS`

## Comandos Útiles

### Backend
```bash
npm run dev              # Modo desarrollo con hot reload
npm run build            # Compilar TypeScript
npm run start            # Ejecutar en producción
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:studio    # Abrir Prisma Studio
npm run seed             # Poblar base de datos
npm run lint             # Linter
npm run test             # Ejecutar tests
```

### Frontend
```bash
npm run dev              # Modo desarrollo
npm run build            # Compilar para producción
npm run preview          # Preview de build de producción
npm run lint             # Linter
```

### Docker
```bash
docker-compose up -d              # Levantar servicios
docker-compose down               # Detener servicios
docker-compose logs -f backend    # Ver logs del backend
docker-compose restart backend    # Reiniciar backend
docker-compose exec backend sh    # Acceder a contenedor backend
```

## Solución de Problemas

### Error: "Cannot connect to database"
- Verifica que PostgreSQL esté corriendo
- Verifica que `DATABASE_URL` esté correctamente configurada

### Error: "Redis connection failed"
- Verifica que Redis esté corriendo
- Verifica que `REDIS_URL` esté correctamente configurada

### Error: "Jellyfin API key invalid"
- Verifica que `JELLYFIN_API_KEY` esté correctamente configurada
- Verifica que los servidores Jellyfin estén accesibles

## Próximos Pasos

1. Cambiar contraseñas por defecto de admin y demo
2. Configurar webhooks WISP (si aplica)
3. Subir anuncios publicitarios desde el panel admin
4. Crear cuentas de usuario
5. Configurar perfiles de Jellyfin

## Soporte

Para más información, consulta:
- [README.md](README.md) - Documentación general
- [structure.txt](structure.txt) - Estructura del proyecto
- [information.json](information.json) - Especificación técnica completa
