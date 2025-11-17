# Mobile Android - Guía de Integración

Esta guía explica cómo integrar las nuevas funcionalidades de QbitStream en la app de Android.

## ✅ Cambios Realizados

### 1. Rebranding
- ✅ Nombre de la app cambiado a "QbitStream" en `strings_donottranslate.xml`
- ✅ Colores actualizados en `colors.xml` (rojo #E50914 como color primario)
- ✅ Package name cambiado a `net.serviciosqbit.stream` en `build.gradle.kts`

### 2. Servicios Nuevos Creados

#### **ServerDetectionService.kt**
Ubicación: `app/src/main/java/net/serviciosqbit/stream/services/ServerDetectionService.kt`

Funcionalidades:
- `detectBestServer(accessToken)` - Detecta el mejor servidor desde el backend API
- `testServerConnectivity(serverUrl)` - Verifica conectividad a un servidor
- `getAllServers(accessToken)` - Obtiene todos los servidores disponibles
- Fallback automático a servidor público si el backend no está disponible

#### **AuthService.kt**
Ubicación: `app/src/main/java/net/serviciosqbit/stream/services/AuthService.kt`

Funcionalidades:
- `login(email, password)` - Autenticación con el backend
- `refreshAccessToken()` - Refresca el token de acceso
- `isLoggedIn()` - Verifica si el usuario está autenticado
- `logout()` - Cierra sesión y limpia credenciales
- `saveJellyfinCredentials()` - Guarda credenciales de Jellyfin
- Almacenamiento seguro con **EncryptedSharedPreferences**

#### **Constants.kt**
Ubicación: `app/src/main/java/net/serviciosqbit/stream/Constants.kt`

Define:
- URLs del backend API
- Keys para SharedPreferences
- Timeouts de conexión
- Tipos de anuncios

## 🔧 Pasos de Integración

### Paso 1: Reemplazar la Pantalla de Conexión

**Archivo a modificar:** `app/src/main/java/org/jellyfin/mobile/ui/screens/connect/`

```kotlin
// En lugar de mostrar el formulario de conexión manual, hacer:
val authService = AuthService(context)
val serverDetectionService = ServerDetectionService()

// 1. Verificar si ya está autenticado
if (authService.isLoggedIn()) {
    // 2. Obtener servidor automáticamente
    val accessToken = authService.getAccessToken()
    val serverInfo = serverDetectionService.detectBestServer(accessToken)

    // 3. Conectar automáticamente
    connectToServer(serverInfo.url, authService.getJellyfinAccessToken())
} else {
    // Mostrar pantalla de login del backend
    showBackendLogin()
}
```

### Paso 2: Implementar Pantalla de Login del Backend

Crear una nueva Activity/Screen para login:

```kotlin
class BackendLoginScreen : ComponentActivity() {
    private val authService by lazy { AuthService(this) }

    private suspend fun performLogin(email: String, password: String) {
        val result = authService.login(email, password)

        if (result.success) {
            // Login exitoso, detectar servidor
            val serverInfo = serverDetectionService.detectBestServer(result.accessToken)

            // Conectar a Jellyfin
            connectToJellyfin(serverInfo.url)
        } else {
            showError(result.errorMessage)
        }
    }
}
```

### Paso 3: Modificar el Flujo de Inicio

**Archivo:** `app/src/main/java/org/jellyfin/mobile/MainActivity.kt` o el archivo principal

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val authService = AuthService(this)

    if (authService.isLoggedIn()) {
        // Auto-login habilitado
        lifecycleScope.launch {
            val serverInfo = ServerDetectionService().detectBestServer(
                authService.getAccessToken()
            )

            // Guardar servidor detectado
            saveServerUrl(serverInfo.url)

            // Continuar con el flujo normal de Jellyfin
            navigateToHome()
        }
    } else {
        // Mostrar login del backend
        navigateToBackendLogin()
    }
}
```

### Paso 4: Persistencia de Servidor

Modificar `ConnectionHelper.kt` para usar el servidor detectado:

```kotlin
class ConnectionHelper {
    fun getServerUrl(context: Context): String {
        val prefs = context.getSharedPreferences("qbitstream_prefs", Context.MODE_PRIVATE)
        return prefs.getString(Constants.PREF_SERVER_URL, Constants.DEFAULT_SERVER_URL)
            ?: Constants.DEFAULT_SERVER_URL
    }

    fun saveServerUrl(context: Context, url: String) {
        context.getSharedPreferences("qbitstream_prefs", Context.MODE_PRIVATE)
            .edit()
            .putString(Constants.PREF_SERVER_URL, url)
            .apply()
    }
}
```

### Paso 5: Actualizar Dependencias

Agregar en `build.gradle.kts` (app level):

```kotlin
dependencies {
    // Seguridad para credenciales
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // HTTP client (ya debe estar incluido)
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // Coroutines (ya debe estar incluido)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
}
```

## 📱 Flujo de Usuario Final

1. Usuario abre la app
2. App verifica si hay sesión guardada
3. Si hay sesión:
   - Detecta servidor automáticamente desde backend
   - Conecta a Jellyfin usando credenciales guardadas
   - Muestra contenido
4. Si no hay sesión:
   - Muestra pantalla de login del backend
   - Usuario ingresa email/password
   - Backend autentica y retorna tokens
   - App detecta servidor óptimo
   - Conecta a Jellyfin
   - Guarda credenciales de forma segura

## 🔐 Seguridad

- **EncryptedSharedPreferences**: Todas las credenciales se guardan cifradas
- **HTTPS**: Todas las comunicaciones con el backend usan HTTPS
- **Token Refresh**: Los tokens se refrescan automáticamente cuando expiran
- **Logout Seguro**: Al cerrar sesión, se borran todas las credenciales

## 🧪 Testing

Para probar la integración:

1. Compilar la app: `./gradlew assembleDebug`
2. Instalar en dispositivo: `adb install app-debug.apk`
3. Probar login con credenciales de prueba
4. Verificar que la detección de servidor funciona
5. Verificar que las credenciales persisten después de cerrar la app

## ⚠️ Notas Importantes

1. **No eliminar código de Jellyfin**: Los servicios nuevos complementan el código existente, no lo reemplazan completamente.

2. **Servidor de respaldo**: Si el backend API no está disponible, la app usará el servidor público como fallback.

3. **Migración gradual**: Se recomienda mantener la opción de login manual para casos de emergencia o debugging.

4. **Logs**: Todos los servicios tienen logging extensivo para facilitar debugging.

## 🎯 Próximos Pasos

1. **Sistema de Ads**: Ver `ADS_INTEGRATION_GUIDE.md` (próximo a crear)
2. **Cambiar logo de la app**: Reemplazar iconos en `res/mipmap-*/`
3. **Testing completo**: Probar en diferentes redes (WiFi, móvil, etc.)
4. **Firma de la app**: Configurar keystore para releases

---

**¿Necesitas ayuda?** Consulta la documentación del backend API en `/docs/API.md`
