# QbitStream - Aplicación Android

Esta es la **app móvil para Android** basada en Jellyfin.

## 📱 Descripción

App nativa de Android forkeada de [jellyfin-android](https://github.com/jellyfin/jellyfin-android) con personalizaciones para QbitStream.

## 🔧 Tecnologías

- **Lenguaje**: Kotlin
- **Player**: ExoPlayer
- **Arquitectura**: MVVM
- **DI**: Koin/Hilt
- **Networking**: Retrofit + OkHttp

## 🎯 Modificaciones Necesarias

### 1. Rebranding
- [ ] Cambiar nombre de app en `strings.xml`
- [ ] Reemplazar logo en `res/drawable/`
- [ ] Cambiar colores en `colors.xml`
- [ ] Actualizar package name: `net.serviciosqbit.stream`

### 2. Servidor Hardcodeado
- [ ] Modificar `ServerDiscoveryService.kt`
- [ ] Integrar con `/api/servers/detect` del backend
- [ ] Remover selector manual de servidor

### 3. Credenciales Persistentes
- [ ] Implementar auto-login con tokens
- [ ] Guardar en `SharedPreferences` (encrypted)
- [ ] Integrar con `/api/auth/login`

### 4. Sistema de Publicidad
- [ ] Inyectar ads en `PlayerActivity.kt`
- [ ] Pre-roll antes de reproducción
- [ ] Mid-roll calculado automáticamente
- [ ] Pause-roll cuando pausa
- [ ] Tracking de visualizaciones al backend

### 5. Integración con Backend
- [ ] Cambiar todas las llamadas a Jellyfin API por nuestro backend
- [ ] Endpoint: `https://qbitstream.serviciosqbit.net/api`
- [ ] Usar JWT para autenticación

## 🚀 Compilación

```bash
cd mobile-android

# Instalar dependencias
./gradlew build

# Ejecutar en emulador/dispositivo
./gradlew installDebug

# Generar APK de producción
./gradlew assembleRelease
```

## 📝 Archivos Clave a Modificar

```
mobile-android/
├── app/src/main/
│   ├── AndroidManifest.xml          # Package name, permisos
│   ├── res/
│   │   ├── values/strings.xml       # Nombre de app
│   │   ├── values/colors.xml        # Colores
│   │   └── drawable/                # Logos e iconos
│   └── kotlin/org/jellyfin/mobile/
│       ├── player/                  # ⚠️ PLAYER - Inyectar ads aquí
│       ├── bridge/                  # Comunicación con WebView
│       └── ui/                      # Interfaces
└── gradle.properties                # Configuración de build
```

## 🎨 Personalización Rápida

### Cambiar Nombre
```xml
<!-- res/values/strings.xml -->
<string name="app_name">QbitStream</string>
```

### Cambiar Colores
```xml
<!-- res/values/colors.xml -->
<color name="primary">#TU_COLOR_PRIMARIO</color>
<color name="primary_dark">#TU_COLOR_OSCURO</color>
```

### Hardcodear Servidor
```kotlin
// Reemplazar ServerDiscoveryService.kt
class ServerDiscoveryService {
    suspend fun getOptimalServer(): String {
        val response = apiClient.get("https://qbitstream.serviciosqbit.net/api/servers/detect")
        return response.url
    }
}
```

## 📦 Dependencias Adicionales

Agregar en `build.gradle`:

```gradle
dependencies {
    // ExoPlayer (ya incluido)
    implementation "com.google.android.exoplayer:exoplayer:2.18.x"

    // Para IMA SDK (Google Ads)
    implementation "com.google.android.gms:play-services-ads:21.x.x"

    // Retrofit para API
    implementation "com.squareup.retrofit2:retrofit:2.9.0"
    implementation "com.squareup.retrofit2:converter-gson:2.9.0"
}
```

## 🔐 Firma de APK

Para publicar en Play Store, necesitarás firmar el APK:

```bash
# Generar keystore
keytool -genkey -v -keystore qbitstream.keystore -alias qbitstream -keyalg RSA -keysize 2048 -validity 10000

# Configurar en gradle.properties
RELEASE_STORE_FILE=../qbitstream.keystore
RELEASE_STORE_PASSWORD=tu_password
RELEASE_KEY_ALIAS=qbitstream
RELEASE_KEY_PASSWORD=tu_password
```

## 📱 Testing

```bash
# Unit tests
./gradlew test

# Instrumented tests
./gradlew connectedAndroidTest
```

## 🔗 Enlaces Útiles

- [Documentación Jellyfin Android](https://jellyfin.org/docs/general/clients/android.html)
- [ExoPlayer Documentation](https://exoplayer.dev/)
- [Android Developer Guide](https://developer.android.com/)

---

**Siguiente paso:** Ver `CUSTOMIZATION_GUIDE.md` para instrucciones detalladas de personalización.
