# 🚀 Guía Rápida - StreamQbit

## 📋 Requisitos Previos

- ✅ Node.js 18+ instalado
- ✅ PostgreSQL instalado (puerto 5433 configurado)
- ✅ Jellyfin Server corriendo en `http://10.10.1.111:8096`

---

## ⚙️ Configuración Inicial

### 1. Configurar Backend

Crea el archivo `backend/.env`:

```env
NODE_ENV=development
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=Supermetroid1.
DB_NAME=qbitstream

DATABASE_URL=postgresql://postgres:Supermetroid1.@localhost:5433/qbitstream

JELLYFIN_SERVER_LOCAL=http://10.10.1.111:8096
JELLYFIN_SERVER_WISP=http://10.10.1.111:8096
JELLYFIN_SERVER_ISP=http://10.10.1.111:8096
JELLYFIN_SERVER_PUBLIC=http://10.10.1.111:8096

JELLYFIN_API_KEY=c07d422f84bc40579b5f918aa60ea97f

JWT_SECRET=qbitstream-super-secret-key-production-2025
JWT_REFRESH_SECRET=qbitstream-refresh-secret-key-production-2025

PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### 2. Crear Base de Datos

```bash
psql -U postgres -p 5433
CREATE DATABASE qbitstream;
\q
```

### 3. Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Ejecutar Migraciones

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

---

## 🏃‍♂️ Ejecutar el Proyecto

### Terminal 1 - Backend:
```bash
cd C:\Users\Anchondo_HDD480G\Desktop\appjellynet\backend
npm run dev
```

El backend estará disponible en: `http://localhost:3001`

### Terminal 2 - Frontend:
```bash
cd C:\Users\Anchondo_HDD480G\Desktop\appjellynet\frontend
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

---

## 🔑 Credenciales por Defecto

Después de ejecutar `prisma db seed`:

**Admin:**
- Email: `admin@serviciosqbit.net`
- Password: `admin123`

**Demo:**
- Email: `demo@example.com`
- Password: `demo123`

---

## 🎯 Endpoints del Backend

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/health` | GET | Estado del servidor |
| `/api/auth/login` | POST | Login y obtener JWT |
| `/api/auth/register` | POST | Registrar nuevo usuario |
| `/api/profiles` | POST | Crear perfil (requiere JWT) |
| `/api/jellyfin/latest` | GET | Últimos items de Jellyfin |
| `/api/servers/detect` | GET | Detectar mejor servidor |

---

## ✅ Verificar que Todo Funcione

### 1. Test del Backend
```bash
curl http://localhost:3001/api/health
```

Debería responder: `{"status":"ok","timestamp":"..."}`

### 2. Test de Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@serviciosqbit.net","password":"admin123"}'
```

Debería devolver un JWT token.

### 3. Test de Jellyfin (con tu IP local)
```bash
curl http://10.10.1.111:8096/System/Info \
  -H "X-Emby-Token: c07d422f84bc40579b5f918aa60ea97f"
```

Debería devolver información del servidor Jellyfin.

---

## 🐛 Solución de Problemas

### Error: "Cannot find module"
```bash
cd backend
npm install
```

### Error: "Port 3001 already in use"
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Error: "PostgreSQL connection refused"
Verifica que PostgreSQL esté corriendo:
```bash
pg_isready -p 5433
```

### Error: "Jellyfin redirect loop"
✅ **Solucionado**: Ahora el backend usa la IP local `http://10.10.1.111:8096` en lugar del dominio de Cloudflare.

---

## 📊 Estado del Proyecto

- ✅ Backend: Funcional (85%)
- ✅ Frontend: Estructura lista
- ✅ Base de datos: Configurada
- ✅ Jellyfin: Conectado por IP local
- ⚠️ Pendiente: Crear primer perfil y validar flujo completo

Ver detalles completos en: `BACKEND_TESTING_SUMMARY.md`

---

## 🔗 IPs y Puertos

| Servicio | IP/Puerto |
|----------|-----------|
| Backend (esta PC) | `10.10.1.163:3001` |
| Frontend (esta PC) | `10.10.1.163:5173` |
| PostgreSQL | `localhost:5433` |
| Jellyfin Server | `10.10.1.111:8096` |

---

## 📝 Notas Importantes

1. **IP Local vs Cloudflare**: El backend DEBE usar `http://10.10.1.111:8096` (IP local) para evitar problemas de redirects con Cloudflare.

2. **Puerto PostgreSQL**: Asegúrate de usar el puerto `5433` como está configurado en tu sistema.

3. **API Key de Jellyfin**: La key `c07d422f84bc40579b5f918aa60ea97f` está configurada y es válida.

4. **Primer Uso**: Al crear el primer perfil, se creará automáticamente un usuario en Jellyfin con el mismo nombre.

---

## 🎉 ¡Listo para Probar!

Ejecuta los comandos en orden y el sistema debería funcionar correctamente. Si encuentras algún error, revisa la sección de "Solución de Problemas" arriba.
