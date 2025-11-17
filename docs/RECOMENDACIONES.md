# 📋 Recomendaciones y Mejores Prácticas - QbitStream

## ✅ Lo que YA está implementado

### Backend API (95% Completo)
- ✅ Autenticación JWT con refresh tokens
- ✅ Detección automática de servidor
- ✅ Sistema de perfiles con límites por plan
- ✅ Sistema de publicidad completo
- ✅ Email notifications
- ✅ Panel de administración
- ✅ Cron jobs para mantenimiento
- ✅ **NUEVO**: Gestión de planes y paquetes

### Frontend Web (40% Completo)
- ✅ Estructura Vue 3 + Vite + Tailwind
- ✅ Autenticación y manejo de sesión
- ✅ Selector de perfiles
- ⚠️ **Falta**: Integración real con Jellyfin (browsing, player)
- ⚠️ **Falta**: UI Netflix-like para contenido

### Mobile Apps (70% Completo)
- ✅ Rebranding (nombre, colores, package)
- ✅ Servicios backend (auth, server detection, ads)
- ✅ Configuración remota
- ⚠️ **UI sigue siendo Jellyfin**: Para UI tipo Netflix necesitas customizar componentes

---

## 🎯 Gestión de Planes - NUEVO AGREGADO

Acabo de agregar un sistema completo para gestionar planes desde el admin:

### Endpoints Nuevos

#### 1. Ver todos los planes disponibles
```http
GET /api/admin/plans
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "plan": "DEMO",
        "profileLimit": 1,
        "price": 0,
        "features": ["1 perfil", "Acceso limitado 7 días", "Calidad SD"]
      },
      {
        "plan": "BASIC",
        "profileLimit": 3,
        "price": 5.99,
        "features": ["3 perfiles", "Calidad HD", "Sin anuncios en pausa"]
      },
      {
        "plan": "PREMIUM",
        "profileLimit": 5,
        "price": 9.99,
        "features": ["5 perfiles", "Calidad 4K", "Sin anuncios", "Descarga offline"]
      },
      {
        "plan": "FAMILY",
        "profileLimit": 8,
        "price": 14.99,
        "features": [
          "8 perfiles",
          "Calidad 4K",
          "Sin anuncios",
          "Descarga offline",
          "Control parental"
        ]
      }
    ]
  }
}
```

#### 2. Comparación de planes (para mostrar en UI)
```http
GET /api/admin/plans/comparison
Authorization: Bearer <admin_token>
```

#### 3. Cambiar plan de un usuario
```http
PUT /api/admin/users/:userId/plan
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "plan": "PREMIUM"
}
```

**Validación**: Si el usuario tiene más perfiles de los permitidos en el nuevo plan, retorna error.

### Configuración de Planes

Los límites y precios están en `backend/src/services/plan.service.ts`:

```typescript
DEMO: {
  plan: Plan.DEMO,
  profileLimit: 1,
  price: 0,
  features: ['1 perfil', 'Acceso limitado 7 días', 'Calidad SD'],
},
BASIC: {
  plan: Plan.BASIC,
  profileLimit: 3,
  price: 5.99,
  features: ['3 perfiles', 'Calidad HD', 'Sin anuncios en pausa'],
},
// ... más planes
```

**Para cambiar límites o precios**: Edita ese archivo y reinicia el backend.

---

## 📱 UI Netflix-like - Recomendaciones

### Frontend Web

#### Opción 1: Usar Librería de Componentes (Recomendado)
Instala componentes tipo Netflix pre-hechos:

```bash
cd frontend
npm install swiper vue3-carousel
```

Crea componente de carrusel:
```vue
<!-- frontend/src/components/ContentRow.vue -->
<template>
  <div class="content-row mb-8">
    <h2 class="text-2xl font-bold mb-4">{{ title }}</h2>
    <Swiper
      :slides-per-view="6"
      :space-between="10"
      navigation
      class="content-swiper"
    >
      <SwiperSlide v-for="item in items" :key="item.id">
        <div class="card-hover cursor-pointer" @click="playItem(item)">
          <img :src="item.thumbnail" :alt="item.name" class="w-full rounded" />
          <p class="text-sm mt-2">{{ item.name }}</p>
        </div>
      </SwiperSlide>
    </Swiper>
  </div>
</template>
```

#### Opción 2: Integrar Jellyfin Web Client
Usa el web client de Jellyfin con tu branding:

```bash
cd frontend
git clone https://github.com/jellyfin/jellyfin-web.git jellyfin-web-src
# Customiza colores, logo, nombre en jellyfin-web-src
npm run build
```

**Ventaja**: Todo funciona out-of-the-box
**Desventaja**: Menos control sobre la UI

### Mobile Apps

Para UI tipo Netflix necesitas:

1. **Crear layouts personalizados**:
   - `mobile-android/app/src/main/res/layout/fragment_home_custom.xml`
   - RecyclerView horizontal para carouseles
   - ViewPager2 para hero banner

2. **Componentes a modificar**:
   ```kotlin
   // Reemplazar HomeFragment de Jellyfin
   class CustomHomeFragment : Fragment() {
       private lateinit var carouselAdapter: ContentCarouselAdapter

       override fun onCreateView(...) {
           // Tu UI personalizada
       }
   }
   ```

3. **Tiempo estimado**: 2-3 semanas para UI completa tipo Netflix

**Recomendación**: Usa la UI de Jellyfin por ahora, está bien diseñada y funcional.

---

## 🎨 Customización Rápida de UI

### Mobile Apps - Cambios Mínimos para "Look & Feel" Netflix

#### 1. Cambiar el tema oscuro
```xml
<!-- mobile-android/app/src/main/res/values/themes.xml -->
<style name="AppTheme" parent="Theme.Material3.Dark">
    <item name="colorPrimary">#E50914</item>
    <item name="colorOnPrimary">#FFFFFF</item>
    <item name="android:windowBackground">#141414</item>
</style>
```

#### 2. Agregar gradientes a las cards
```xml
<!-- mobile-android/app/src/main/res/drawable/card_gradient.xml -->
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <gradient
        android:startColor="#00000000"
        android:endColor="#CC000000"
        android:angle="270" />
</shape>
```

#### 3. Font personalizada (opcional)
```xml
<!-- mobile-android/app/src/main/res/font/netflix_sans.xml -->
<font-family xmlns:android="http://schemas.android.com/apk/res/android">
    <font android:fontStyle="normal" android:fontWeight="400"
          android:font="@font/netflix_sans_regular" />
    <font android:fontStyle="normal" android:fontWeight="700"
          android:font="@font/netflix_sans_bold" />
</font-family>
```

---

## 🚀 Prioridades Recomendadas

### Corto Plazo (1-2 semanas)

1. **✅ Completar integración del frontend con Jellyfin**
   - Consumir API de Jellyfin desde Vue
   - Implementar browsing de contenido
   - Agregar video player (Video.js)

2. **✅ Testear apps móviles**
   - Compilar mobile-android
   - Probar server detection
   - Verificar auto-login
   - Testear ads en player

3. **✅ Configurar archivo remoto**
   - Subir `mobile-config.json` a GitHub
   - Actualizar URL en ConfigService
   - Probar actualización remota

### Mediano Plazo (1 mes)

4. **✅ Panel de admin completo**
   - Interfaz para gestionar planes
   - Cambiar plan de usuarios
   - Ver métricas detalladas

5. **✅ Sistema de pagos**
   - Integrar Stripe/MercadoPago
   - Webhook para activar cuentas
   - Panel de suscripciones

6. **✅ Mejorar sistema de ads**
   - Upload masivo de ads
   - Programación de ads
   - Targeting por demografía

### Largo Plazo (2-3 meses)

7. **Customización completa de UI**
   - Hero banner animado
   - Carouseles personalizados
   - Animaciones y transiciones

8. **Features avanzadas**
   - Recomendaciones personalizadas
   - Watch parties (ver juntos)
   - Comentarios y ratings

---

## 📊 Configuración de Planes - Ejemplos

### Crear Paquetes Personalizados

Modifica `plan.service.ts` para agregar más opciones:

```typescript
// Ejemplo: Plan Estudiante
STUDENT: {
  plan: 'STUDENT' as Plan,
  profileLimit: 2,
  price: 3.99,
  features: [
    '2 perfiles',
    'Calidad HD',
    'Descuento estudiantil 50%',
  ],
}

// Ejemplo: Plan Empresarial
BUSINESS: {
  plan: 'BUSINESS' as Plan,
  profileLimit: 20,
  price: 49.99,
  features: [
    '20 perfiles',
    'Calidad 4K',
    'Sin anuncios',
    'Gestión centralizada',
    'Soporte prioritario',
  ],
}
```

Luego actualiza el enum en Prisma:

```prisma
// backend/src/prisma/schema.prisma
enum Plan {
  DEMO
  BASIC
  PREMIUM
  FAMILY
  STUDENT    // Nuevo
  BUSINESS   // Nuevo
}
```

Y ejecuta:
```bash
npx prisma generate
npx prisma db push
```

---

## 🔐 Seguridad - Checklist

Antes de producción, verifica:

- [ ] Todas las variables de entorno están en `.env` (no en el código)
- [ ] JWT secrets son fuertes (mínimo 64 caracteres)
- [ ] HTTPS habilitado en producción
- [ ] Rate limiting configurado en Nginx/Cloudflare
- [ ] Validación de entrada en todos los endpoints
- [ ] Logs no exponen información sensible
- [ ] CORS configurado correctamente
- [ ] Helmet.js agregado para headers de seguridad

```typescript
// backend/src/app.ts
import helmet from 'helmet';
app.use(helmet());
```

---

## 📈 Monitoreo y Analytics

### Recomendaciones de Herramientas

1. **Backend Monitoring**:
   - Sentry (errores en producción)
   - PM2 Plus (métricas de servidor)
   - New Relic (APM completo)

2. **Analytics**:
   - Google Analytics (web)
   - Firebase Analytics (mobile)
   - Mixpanel (eventos personalizados)

3. **Logs**:
   - Winston → Elasticsearch (ya tienes Winston)
   - Kibana para visualización
   - Cloudflare Logs

---

## 💾 Base de Datos

### Optimizaciones Recomendadas

```sql
-- Índices para mejorar performance
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_profile_user ON "Profile"("userId");
CREATE INDEX idx_adview_created ON "AdView"("createdAt");
CREATE INDEX idx_server_healthy ON "Server"("isHealthy");
```

Prisma ya crea algunos índices automáticamente, pero estos adicionales ayudan.

---

## 🎯 Respuestas a tus Preguntas

### 1. ¿Las apps usan diseño como Netflix?

**Respuesta Corta**: Los colores sí, la estructura no completamente.

- **Frontend Web**: Tiene la base (colores, Tailwind), falta integrar el contenido
- **Mobile Apps**: Solo rebranding de colores, UI sigue siendo Jellyfin

**Qué hacer**:
- Para web: Integra Jellyfin web client o crea carouseles custom
- Para mobile: Usa UI actual de Jellyfin (es buena) o invierte 2-3 semanas en customizar

### 2. ¿Puedo controlar cantidad de perfiles en admin?

**Respuesta**: ✅ SÍ, acabo de agregarlo.

**Cómo usarlo**:
```bash
# Ver planes disponibles
curl -X GET http://localhost:3001/api/admin/plans \
  -H "Authorization: Bearer <admin_token>"

# Cambiar plan de usuario
curl -X PUT http://localhost:3001/api/admin/users/USER_ID/plan \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"plan": "PREMIUM"}'
```

Los límites de perfiles son:
- DEMO: 1 perfil
- BASIC: 3 perfiles
- PREMIUM: 5 perfiles
- FAMILY: 8 perfiles

### 3. ¿Puedo generar diferentes paquetes?

**Respuesta**: ✅ SÍ, con modificaciones.

**Dos opciones**:

**Opción A - Modificar planes hardcoded** (actual):
- Edita `plan.service.ts`
- Agrega más valores al enum `Plan`
- Actualiza Prisma schema
- Ejecuta `npx prisma db push`

**Opción B - Planes dinámicos en DB** (más flexible):
```prisma
model Plan {
  id           String   @id @default(uuid())
  name         String   @unique
  profileLimit Int
  price        Float
  features     Json
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
}
```

Con esto puedes crear planes desde el panel de admin sin tocar código.

**Recomendación**: Por ahora usa Opción A (más simple), luego migra a Opción B si necesitas crear muchos paquetes.

---

## 🎬 Siguiente Paso Inmediato

Te recomiendo:

1. **Testear el backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Probar los nuevos endpoints de planes**:
   ```bash
   # Login como admin
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@serviciosqbit.net","password":"admin123"}'

   # Ver planes
   curl -X GET http://localhost:3001/api/admin/plans \
     -H "Authorization: Bearer <token_from_login>"
   ```

3. **Configurar archivo remoto** en GitHub para las apps móviles

4. **Compilar y probar una app móvil**:
   ```bash
   cd mobile-android
   ./gradlew assembleDebug
   ```

---

## 📞 Soporte

¿Necesitas ayuda con algo específico?
- Implementar UI tipo Netflix
- Configurar planes personalizados
- Integrar sistema de pagos
- Optimizar performance
- Deploy a producción

¡Avísame y te ayudo! 🚀
