# 🚀 Instrucciones Rápidas - StreamQbit Backend

## ❌ Error que estabas viendo:
```
Error: Cannot find module 'C:\...\backend\dist\server.js'
```

## ✅ Solución en 3 Pasos

### 1️⃣ Crear la Base de Datos PostgreSQL

**Opción A: Usando pgAdmin**
1. Abre pgAdmin
2. Conecta a tu servidor PostgreSQL (puerto 5433)
3. Click derecho en "Databases" → "Create" → "Database..."
4. Nombre: `streamqbit`
5. Owner: `postgres`
6. Click "Save"

**Opción B: Usando psql (línea de comandos)**
```bash
# En PowerShell o CMD:
psql -U postgres -p 5433 -c "CREATE DATABASE streamqbit;"

# Te pedirá la contraseña: Supermetroid1.
```

**Opción C: Usar el script SQL**
```bash
psql -U postgres -p 5433 -f create-database.sql
```

### 2️⃣ Compilar el Proyecto

**Método Automático (RECOMENDADO):**
```bash
# Ejecuta el script que automatiza todo:
build-and-start.bat
```

Este script hace:
- ✅ Instala dependencias
- ✅ Genera cliente de Prisma
- ✅ Compila TypeScript
- ✅ Ejecuta migraciones
- ✅ Inicia el servidor

**Método Manual:**
```bash
# Paso por paso:
npm install
npx prisma generate
npm run build
npx prisma migrate dev --name init
npm start
```

### 3️⃣ Iniciar el Servidor

Si compilaste manualmente:
```bash
npm start
```

Deberías ver:
```
🚀 Server running on port 3000
📝 Environment: development
🔗 API URL: http://localhost:3000/api
```

## 🐛 Solución de Problemas

### Error: "Prisma generate falla con error 500"
**Causa:** Los servidores de Prisma están temporalmente caídos (problema conocido).

**Solución:**
1. Espera 2-4 horas
2. Intenta nuevamente: `npx prisma generate`
3. Si persiste, usa una VPN o intenta desde otra red

### Error: "Cannot connect to database"
**Causa:** PostgreSQL no está corriendo o las credenciales son incorrectas.

**Solución:**
1. Verifica que PostgreSQL esté corriendo:
   ```bash
   # En PowerShell:
   Get-Service postgresql*
   ```
2. Verifica el puerto: `5433` (en tu caso)
3. Verifica las credenciales en `.env`:
   ```
   DATABASE_URL=postgresql://postgres:Supermetroid1.@localhost:5433/streamqbit
   ```

### Error: "SMTP connection failed"
**Causa:** El email es opcional, puedes ignorarlo en desarrollo.

**Solución:** El servidor funcionará sin email configurado.

### Error: "dist/server.js not found" persiste
**Causa:** TypeScript no se compiló debido a errores de Prisma.

**Solución:**
1. `npx prisma generate` debe ejecutarse SIN errores primero
2. Luego `npm run build`
3. Verifica que exista el archivo: `dist/server.js`

## 📋 Checklist Rápido

Antes de ejecutar `npm start`, verifica:

- ✅ PostgreSQL corriendo en puerto 5433
- ✅ Base de datos `streamqbit` creada
- ✅ Archivo `.env` configurado
- ✅ `npm install` ejecutado
- ✅ `npx prisma generate` ejecutado SIN errores
- ✅ `npm run build` ejecutado
- ✅ Archivo `dist/server.js` existe
- ✅ `npx prisma migrate dev` ejecutado (crea las tablas)

## 🔗 URLs Importantes

Una vez que el servidor esté corriendo:

- **API Backend:** http://localhost:3000
- **API Docs:** http://localhost:3000/api
- **Health Check:** http://localhost:3000/health (si existe)
- **Prisma Studio:** Ejecuta `npm run prisma:studio` para ver la base de datos

## 📞 Ayuda Adicional

Si algo no funciona:
1. Lee `SETUP_GUIDE.md` para instrucciones detalladas
2. Verifica los logs de error
3. Asegúrate de que Prisma esté funcionando (el problema más común)

## 🎯 Próximos Pasos

Una vez que el backend funcione:
1. Configura tus servidores Jellyfin en `.env`
2. Configura las claves de API de Stripe/MercadoPago si necesitas pagos
3. Ejecuta el frontend de StreamQbit
4. Accede a la aplicación completa

---

**Nota:** El error principal que tenías era que faltaba compilar el TypeScript.
El comando `npm start` ejecuta `node dist/server.js`, pero ese archivo se genera
con `npm run build`. Sin embargo, antes de compilar, Prisma debe generar sus tipos.
