# Guía de Configuración Remota

Esta guía explica cómo usar el sistema de configuración remota para actualizar las apps sin necesidad de recompilar.

## 🎯 Ventajas

✅ **Sin actualizar la app**: Cambia URLs de servidores sin republicar en Play Store
✅ **Actualización instantánea**: Cambios se reflejan en menos de 1 hora en todas las apps
✅ **Flexibilidad total**: Puedes agregar/quitar servidores, habilitar/deshabilitar features
✅ **Mismo archivo para todas las apps**: Android, Android TV, y iOS usan el mismo config
✅ **Fallback inteligente**: Si el archivo remoto falla, usa config en caché o hardcoded

## 📁 Archivo de Configuración

### Formato JSON

```json
{
  "version": "1.0.0",
  "backendApiUrl": "https://qbitstream.serviciosqbit.net/api",
  "defaultServerUrl": "https://qbitstream.serviciosqbit.net",
  "serverUrls": [
    "https://qbitstream.serviciosqbit.net",
    "http://189.168.20.1:8081",
    "http://179.120.0.15:8096",
    "http://172.16.0.4:8096",
    "http://10.10.0.112:8096"
  ],
  "features": {
    "adsEnabled": true,
    "autoLoginEnabled": true,
    "crashReportingEnabled": false
  },
  "updateMessage": null
}
```

### Descripción de Campos

- **version**: Versión del archivo de configuración (para tracking)
- **backendApiUrl**: URL del backend API de QbitStream
- **defaultServerUrl**: Servidor por defecto si la detección falla
- **serverUrls**: Lista de servidores Jellyfin disponibles (en orden de prioridad)
- **features.adsEnabled**: Si el sistema de ads está habilitado
- **features.autoLoginEnabled**: Si el auto-login está habilitado
- **features.crashReportingEnabled**: Si el crash reporting está habilitado
- **updateMessage**: Mensaje opcional para mostrar al usuario (ej: "Nueva versión disponible")

## 🌐 Opciones de Hosting

### Opción 1: GitHub (Recomendado - Gratis)

1. Crea un repositorio público en GitHub:
   - Nombre: `qbitstream-config`
   - Visibilidad: Público

2. Crea el archivo `mobile-config.json` en el repo

3. Obtén la URL raw:
   ```
   https://raw.githubusercontent.com/TU_USUARIO/qbitstream-config/main/mobile-config.json
   ```

4. Actualiza `ConfigService.kt` línea 21:
   ```kotlin
   private const val CONFIG_URL = "https://raw.githubusercontent.com/TU_USUARIO/qbitstream-config/main/mobile-config.json"
   ```

**Ventajas:**
- ✅ Gratis
- ✅ Versionado con Git
- ✅ Fácil de actualizar
- ✅ CDN global de GitHub

### Opción 2: Google Drive

1. Sube `mobile-config.json` a Google Drive
2. Haz clic derecho → Compartir → Cambiar a "Cualquiera con el enlace"
3. Copia el ID del archivo (está en la URL)
4. Construye la URL de descarga directa:
   ```
   https://drive.google.com/uc?export=download&id=TU_FILE_ID
   ```

**Ventajas:**
- ✅ Fácil de usar
- ✅ Interfaz familiar
- ❌ URL cambia si resubes el archivo

### Opción 3: OneDrive

1. Sube `mobile-config.json` a OneDrive
2. Haz clic derecho → Compartir → Configurar para "Cualquiera con el enlace"
3. Copia el enlace compartido
4. Convierte a enlace de descarga directa usando una herramienta online

**Ventajas:**
- ✅ Integrado con Microsoft 365
- ❌ Requiere conversión de URL

### Opción 4: Dropbox

1. Sube `mobile-config.json` a Dropbox
2. Crea un enlace compartido
3. Cambia el final de la URL de `dl=0` a `dl=1`
   ```
   https://www.dropbox.com/s/XXXXX/mobile-config.json?dl=1
   ```

**Ventajas:**
- ✅ Muy confiable
- ✅ URL permanente
- ❌ Límite de ancho de banda en plan gratis

### Opción 5: Tu Propio Servidor

Si tienes un servidor web:

```bash
# Coloca el archivo en tu servidor
/var/www/html/config/mobile-config.json

# Asegúrate que sea accesible públicamente
chmod 644 /var/www/html/config/mobile-config.json

# URL resultante
https://tudominio.com/config/mobile-config.json
```

**Ventajas:**
- ✅ Control total
- ✅ Sin límites de ancho de banda
- ❌ Requiere servidor propio

## 🔧 Implementación en la App

### Paso 1: Usar ConfigService en MainActivity

```kotlin
class MainActivity : AppCompatActivity() {
    private lateinit var configService: ConfigService

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        configService = ConfigService(this)

        lifecycleScope.launch {
            // Cargar configuración al iniciar
            val config = configService.loadConfig()

            // Usar las URLs del config
            Constants.BACKEND_API_URL = config.backendApiUrl
            Constants.DEFAULT_SERVER_URL = config.defaultServerUrl

            // Verificar si features están habilitadas
            if (config.features.adsEnabled) {
                initializeAdSystem()
            }

            if (config.features.autoLoginEnabled) {
                attemptAutoLogin()
            }

            // Continuar con el flujo normal
            initializeApp()
        }
    }
}
```

### Paso 2: Actualizar Constants.kt

```kotlin
object Constants {
    // Estas variables ahora se actualizan desde ConfigService
    var BACKEND_API_URL = "https://qbitstream.serviciosqbit.net/api"
    var DEFAULT_SERVER_URL = "https://qbitstream.serviciosqbit.net"

    // ... resto del código
}
```

### Paso 3: Refrescar Config Periódicamente

```kotlin
class ConfigRefreshWorker(context: Context, params: WorkerParameters) :
    CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val configService = ConfigService(applicationContext)

        return try {
            configService.refreshConfig()
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}

// Programar trabajo periódico
val workRequest = PeriodicWorkRequestBuilder<ConfigRefreshWorker>(
    1, TimeUnit.HOURS
).build()

WorkManager.getInstance(context).enqueue(workRequest)
```

## 📝 Actualizar la Configuración

### Escenario 1: Cambiar URL del Servidor

1. Edita `mobile-config.json`:
   ```json
   {
     "version": "1.0.1",
     "backendApiUrl": "https://nuevo-dominio.com/api",
     "defaultServerUrl": "https://nuevo-dominio.com",
     ...
   }
   ```

2. Sube el archivo actualizado a GitHub/Drive/etc.

3. Espera hasta 1 hora (tiempo de caché)

4. Todas las apps usarán las nuevas URLs automáticamente

### Escenario 2: Agregar Nuevo Servidor

```json
{
  "version": "1.0.2",
  "serverUrls": [
    "https://qbitstream.serviciosqbit.net",
    "http://nuevo-servidor.com:8096",  // ← Nuevo servidor
    "http://189.168.20.1:8081",
    ...
  ]
}
```

### Escenario 3: Deshabilitar Ads Temporalmente

```json
{
  "version": "1.0.3",
  "features": {
    "adsEnabled": false,  // ← Deshabilitado
    "autoLoginEnabled": true,
    "crashReportingEnabled": false
  }
}
```

### Escenario 4: Mostrar Mensaje de Mantenimiento

```json
{
  "version": "1.0.4",
  "updateMessage": "Mantenimiento programado mañana 10:00-12:00"
}
```

## 🔒 Cache y Fallback

El sistema tiene 3 niveles de fallback:

1. **Config Remoto**: Intenta descargar desde la URL configurada
2. **Config en Caché**: Si remoto falla, usa la última versión guardada (válido por 1 hora)
3. **Config Hardcoded**: Si todo falla, usa valores predefinidos en el código

```
┌─────────────────────┐
│   Config Remoto     │
│  (GitHub/Drive)     │
└──────┬──────────────┘
       │ ✓ Success
       ├────────────────► Guardar en caché y usar
       │
       │ ✗ Failed
       ▼
┌─────────────────────┐
│   Config en Caché   │
│  (SharedPrefs)      │
└──────┬──────────────┘
       │ ✓ Válido
       ├────────────────► Usar config en caché
       │
       │ ✗ Expirado/No existe
       ▼
┌─────────────────────┐
│  Config Hardcoded   │
│  (en el código)     │
└──────┬──────────────┘
       │
       └────────────────► Usar valores por defecto
```

## 🧪 Testing

### Probar Cambio de Config

1. Edita el archivo remoto
2. Fuerza refresh en la app:
   ```kotlin
   lifecycleScope.launch {
       val newConfig = configService.refreshConfig()
       Log.d("Config", "New backend URL: ${newConfig.backendApiUrl}")
   }
   ```
3. Verifica en logcat:
   ```bash
   adb logcat | grep "ConfigService"
   ```

### Simular Fallo de Red

1. Desactiva WiFi y datos móviles
2. Abre la app
3. Debe usar config en caché o fallback
4. Verificar en logcat:
   ```
   ConfigService: Using cached config (version: 1.0.0)
   ```

## 📊 Monitoreo

Para monitorear cuántas apps están usando cada versión de config:

```kotlin
// En la app, enviar analytics
val config = configService.loadConfig()
FirebaseAnalytics.logEvent("config_loaded") {
    param("version", config.version)
    param("source", if (wasLoadedFromRemote) "remote" else "cache")
}
```

## 🚀 Mejores Prácticas

1. **Versiona tu config**: Incrementa el número de versión en cada cambio
2. **Prueba antes de publicar**: Verifica que el JSON sea válido
3. **Usa GitHub para tracking**: Mantén historial de cambios
4. **Actualiza gradualmente**: Si cambias URLs críticas, hazlo en horarios de bajo tráfico
5. **Mantén fallback actualizado**: Cada cierto tiempo actualiza el config hardcoded con los valores actuales

## ⚠️ Consideraciones de Seguridad

- El archivo es **público** (cualquiera puede leerlo)
- **No incluyas** API keys, secrets, o credenciales
- **Solo** incluye URLs públicas y configuraciones generales
- Para configuración sensible, usa tu backend API con autenticación

## 🔗 URLs de Ejemplo

```kotlin
// GitHub
private const val CONFIG_URL = "https://raw.githubusercontent.com/MterEcko/qbitstream-config/main/mobile-config.json"

// Google Drive
private const val CONFIG_URL = "https://drive.google.com/uc?export=download&id=1ABC...XYZ"

// Tu servidor
private const val CONFIG_URL = "https://qbitstream.serviciosqbit.net/config/mobile.json"

// Dropbox
private const val CONFIG_URL = "https://www.dropbox.com/s/abc123/mobile-config.json?dl=1"
```

---

**Recomendación:** Usa GitHub para el config remoto. Es gratis, confiable, y te permite versionar los cambios.

Para crear el repositorio de config:
```bash
mkdir qbitstream-config
cd qbitstream-config
git init
cp ../mobile-config.json .
git add mobile-config.json
git commit -m "Initial config"
git push -u origin main
```

¡Listo! Ahora puedes actualizar las URLs de tus apps sin recompilarlas.
