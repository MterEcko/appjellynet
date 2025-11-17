# QbitStream - Aplicación Android TV

Esta es la **app para Android TV** basada en Jellyfin.

## 📺 Descripción

App nativa de Android TV forkeada de [jellyfin-androidtv](https://github.com/jellyfin/jellyfin-androidtv) con personalizaciones para QbitStream.

## 🔧 Tecnologías

- **Lenguaje**: Kotlin
- **Player**: ExoPlayer
- **UI**: Leanback Library (Android TV UI)
- **Arquitectura**: MVVM
- **DI**: Koin

## 🎯 Modificaciones Necesarias

### 1. Rebranding
- [ ] Cambiar nombre de app en `strings.xml`
- [ ] Reemplazar banner en `res/drawable-xhdpi/`
- [ ] Cambiar colores del tema
- [ ] Actualizar package name: `net.serviciosqbit.streamtv`

### 2. Servidor Hardcodeado
- [ ] Modificar `ServerRepository.kt`
- [ ] Integrar con backend para detección
- [ ] Remover pantalla de selección de servidor

### 3. Auto-Login
- [ ] Implementar almacenamiento de credenciales
- [ ] Auto-conectar al abrir app
- [ ] Sincronizar con backend

### 4. Sistema de Publicidad
- [ ] Inyectar ads en `PlaybackOverlayFragment.kt`
- [ ] Pre-roll al inicio
- [ ] Mid-roll durante reproducción
- [ ] Soporte para control remoto durante ads

### 5. UI Personalizada
- [ ] Customizar home screen
- [ ] Agregar categorías personalizadas
- [ ] Modificar browsing de contenido

## 🚀 Compilación

```bash
cd mobile-androidtv

# Build
./gradlew assembleDebug

# Instalar en Android TV
adb connect YOUR_TV_IP:5555
./gradlew installDebug

# Release
./gradlew assembleRelease
```

## 📝 Archivos Clave

```
mobile-androidtv/
├── app/src/main/
│   ├── AndroidManifest.xml
│   ├── res/
│   │   ├── values/strings.xml
│   │   ├── drawable-xhdpi/         # Banners TV
│   │   └── layout/                 # Layouts Leanback
│   └── java/org/jellyfin/androidtv/
│       ├── ui/playback/            # ⚠️ Player - Inyectar ads
│       ├── ui/browsing/            # Navegación
│       └── auth/                   # Autenticación
```

## 🎨 Personalización

### Banner de TV
```
Tamaño: 320x180 px
Ubicación: res/drawable-xhdpi/app_banner.png
```

### Colores
```xml
<!-- res/values/colors.xml -->
<color name="lb_basic_card_bg_color">#TU_COLOR</color>
```

## 📦 Dependencias

```gradle
dependencies {
    // Leanback (ya incluido)
    implementation "androidx.leanback:leanback:1.0.0"

    // ExoPlayer
    implementation "com.google.android.exoplayer:exoplayer:2.18.x"

    // IMA SDK para ads
    implementation "com.google.ads.interactivemedia.v3:interactivemedia:3.x.x"
}
```

## 🎮 Testing en Android TV

```bash
# Conectar a Android TV via ADB
adb connect 192.168.1.XXX:5555

# Instalar APK
adb install app-debug.apk

# Ver logs
adb logcat | grep QbitStream
```

## 🔗 Enlaces

- [Android TV Development](https://developer.android.com/training/tv)
- [Leanback Library](https://developer.android.com/training/tv/playback/browsing)
- [ExoPlayer for TV](https://exoplayer.dev/hello-world.html)
