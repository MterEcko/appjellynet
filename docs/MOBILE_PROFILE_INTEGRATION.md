# 📱 Integración del Selector de Perfiles en Apps Móviles

Esta guía explica cómo integrar el selector de perfiles personalizado en las aplicaciones móviles de Android y Android TV.

---

## 🎯 Objetivo

Agregar un paso de selección de perfiles **después** de conectarse al servidor pero **antes** de mostrar el contenido de Jellyfin, manteniendo la UI y el reproductor original de Jellyfin.

---

## 📋 Archivos Necesarios

Ya creados en el proyecto:

### Android
```
mobile-android/app/src/main/java/net/serviciosqbit/stream/ui/ProfileSelectorFragment.kt
mobile-android/app/src/main/res/layout/fragment_profile_selector.xml
mobile-android/app/src/main/res/layout/item_profile.xml
mobile-android/app/src/main/res/drawable/ic_default_avatar.xml
```

### Android TV
```
mobile-android-tv/app/src/main/java/net/serviciosqbit/stream/ui/ProfileSelectorFragment.kt
mobile-android-tv/app/src/main/res/layout/fragment_profile_selector.xml
mobile-android-tv/app/src/main/res/layout/item_profile.xml
mobile-android-tv/app/src/main/res/drawable/ic_default_avatar.xml
```

---

## 🔧 Opción 1: Integración Mínima (Recomendada)

Esta opción mantiene la app Jellyfin prácticamente intacta y solo agrega el selector de perfiles como un paso opcional.

### Paso 1: Agregar el Fragment al Navigation

Edita `mobile-android/app/src/main/res/navigation/nav_graph.xml` (si existe):

```xml
<fragment
    android:id="@+id/profileSelectorFragment"
    android:name="net.serviciosqbit.stream.ui.ProfileSelectorFragment"
    android:label="Seleccionar Perfil">
    <action
        android:id="@+id/action_profileSelector_to_webView"
        app:destination="@id/webViewFragment" />
</fragment>
```

### Paso 2: Mostrar Selector de Perfiles

En `MainActivity.kt`, agrega lógica para verificar si hay perfil seleccionado:

```kotlin
private fun handleServerState(state: ServerState) {
    with(supportFragmentManager) {
        val currentFragment = findFragmentById(R.id.fragment_container)
        when (state) {
            is ServerState.Available -> {
                // Verificar si hay perfil seleccionado
                val prefs = getSharedPreferences("qbitstream_prefs", Context.MODE_PRIVATE)
                val selectedProfileId = prefs.getString("selected_profile_id", null)

                if (selectedProfileId == null) {
                    // Mostrar selector de perfiles
                    if (currentFragment !is ProfileSelectorFragment) {
                        replaceFragment<ProfileSelectorFragment>()
                    }
                } else {
                    // Continuar con el flujo normal de Jellyfin
                    if (currentFragment !is WebViewFragment || currentFragment.server != state.server) {
                        replaceFragment<WebViewFragment>(
                            Bundle().apply {
                                putParcelable(Constants.FRAGMENT_WEB_VIEW_EXTRA_SERVER, state.server)
                            },
                        )
                    }
                }
            }
            // ... resto del código
        }
    }
}
```

### Paso 3: Callback del Selector

En `ProfileSelectorFragment.kt`, cuando se seleccione un perfil, continuar al WebView:

```kotlin
private fun onProfileSelected(profile: Profile) {
    val prefs = requireContext().getSharedPreferences("qbitstream_prefs", Context.MODE_PRIVATE)
    prefs.edit()
        .putString("selected_profile_id", profile.id)
        .putString("selected_profile_name", profile.name)
        .apply()

    // Notificar al MainViewModel para que recargue el estado
    (requireActivity() as? MainActivity)?.mainViewModel?.refreshServerState()
}
```

---

## 🔧 Opción 2: Selector como Dialog

Si prefieres no modificar el flujo principal, puedes mostrar el selector como un Dialog:

### Paso 1: Crear ProfileSelectorDialog

```kotlin
class ProfileSelectorDialog : DialogFragment() {
    private lateinit var profileAdapter: ProfileAdapter

    interface ProfileSelectionListener {
        fun onProfileSelected(profile: Profile)
    }

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val view = layoutInflater.inflate(R.layout.fragment_profile_selector, null)

        // Setup RecyclerView...

        return AlertDialog.Builder(requireContext())
            .setView(view)
            .setCancelable(false)
            .create()
    }

    private fun onProfileSelected(profile: Profile) {
        // Guardar en SharedPreferences
        val prefs = requireContext().getSharedPreferences("qbitstream_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putString("selected_profile_id", profile.id)
            .putString("selected_profile_name", profile.name)
            .apply()

        (activity as? ProfileSelectionListener)?.onProfileSelected(profile)
        dismiss()
    }
}
```

### Paso 2: Mostrar Dialog en MainActivity

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // ... código existente ...

    // Verificar si necesitamos seleccionar perfil
    lifecycleScope.launch {
        checkProfileSelection()
    }
}

private suspend fun checkProfileSelection() {
    val prefs = getSharedPreferences("qbitstream_prefs", Context.MODE_PRIVATE)
    val selectedProfileId = prefs.getString("selected_profile_id", null)

    if (selectedProfileId == null) {
        // Obtener token de autenticación
        val authService = AuthService(this)
        val accessToken = authService.getAccessToken()

        if (accessToken != null) {
            // Mostrar selector de perfiles
            ProfileSelectorDialog().show(supportFragmentManager, "profile_selector")
        }
    }
}
```

---

## 🔧 Opción 3: Solo Backend Integration (Sin UI)

Si quieres mantener la UI de Jellyfin completamente, pero usar nuestro backend para autenticación:

### En MainActivity.onCreate():

```kotlin
lifecycleScope.launch {
    // 1. Login en nuestro backend
    val authService = AuthService(this@MainActivity)
    val isLoggedIn = authService.isLoggedIn()

    if (!isLoggedIn) {
        // Mostrar login custom o usar Jellyfin login
        // Después de login exitoso en Jellyfin, hacer login en nuestro backend
        authService.loginWithJellyfinCredentials(email, password)
    }

    // 2. Obtener perfil actual
    val profileId = getSharedPreferences("qbitstream_prefs", MODE_PRIVATE)
        .getString("selected_profile_id", null)

    // 3. Si no hay perfil, usar el primario por defecto
    if (profileId == null) {
        val profiles = authService.getProfiles()
        val primaryProfile = profiles.firstOrNull { it.isPrimary }
        if (primaryProfile != null) {
            getSharedPreferences("qbitstream_prefs", MODE_PRIVATE)
                .edit()
                .putString("selected_profile_id", primaryProfile.id)
                .apply()
        }
    }

    // 4. Continuar con flujo normal de Jellyfin
}
```

---

## 🎨 Personalización de Estilos

Edita `mobile-android/app/src/main/res/values/colors.xml`:

```xml
<resources>
    <color name="qbit_primary">#E50914</color>
    <color name="qbit_dark">#141414</color>
    <color name="qbit_dark_lighter">#1F1F1F</color>
</resources>
```

Y actualiza los layouts para usar estos colores.

---

## 📡 Sincronización con Backend

### Trackear Selección de Perfil

Cuando el usuario seleccione un perfil, puedes reportarlo al backend:

```kotlin
private fun onProfileSelected(profile: Profile) {
    lifecycleScope.launch {
        try {
            // Guardar localmente
            val prefs = requireContext().getSharedPreferences("qbitstream_prefs", Context.MODE_PRIVATE)
            prefs.edit()
                .putString("selected_profile_id", profile.id)
                .putString("selected_profile_name", profile.name)
                .apply()

            // Notificar al backend (opcional - para analytics)
            val authService = AuthService(requireContext())
            authService.setCurrentProfile(profile.id)

            // Continuar
            navigateToMain()
        } catch (e: Exception) {
            Log.e("ProfileSelector", "Error selecting profile", e)
        }
    }
}
```

---

## 🔄 Cambio de Perfil Durante Sesión

### Agregar Botón de Cambio de Perfil

En el menú de la app (si existe), agrega:

```kotlin
menu.add("Cambiar Perfil").setOnMenuItemClickListener {
    ProfileSelectorDialog().show(supportFragmentManager, "profile_selector")
    true
}
```

Cuando se cambie de perfil:
1. Guardar nuevo perfil en SharedPreferences
2. Recargar WebView para que Jellyfin use el usuario correcto
3. (Opcional) Notificar al backend

---

## 🧪 Testing

### Probar en Desarrollo

1. **Desinstalar app anterior:**
   ```bash
   adb uninstall net.serviciosqbit.stream
   ```

2. **Instalar nueva versión:**
   ```bash
   ./gradlew installDebug
   ```

3. **Verificar logs:**
   ```bash
   adb logcat | grep -i "profile\|qbit"
   ```

### Escenarios a Probar

- ✅ Primera instalación (sin perfil seleccionado)
- ✅ Cambio de perfil
- ✅ Múltiples perfiles (2-5 perfiles)
- ✅ Usuario con un solo perfil (debería saltarse selector)
- ✅ Usuario DEMO (1 perfil max)
- ✅ Usuario BASIC (3 perfiles max)
- ✅ Usuario PREMIUM (5 perfiles max)

---

## 📝 Notas Importantes

### Compatibilidad con Jellyfin

- ✅ **Mantiene** el reproductor de Jellyfin (ExoPlayer)
- ✅ **Mantiene** la UI de Jellyfin para navegación
- ✅ **Agrega** selector de perfiles personalizado
- ✅ **Agrega** integración con backend para plans y límites

### Datos Guardados Localmente

```kotlin
// SharedPreferences: "qbitstream_prefs"
{
    "selected_profile_id": "uuid-del-perfil",
    "selected_profile_name": "Nombre del Perfil",
    "access_token": "jwt-token",
    "refresh_token": "refresh-jwt-token"
}
```

### Sincronización con Jellyfin

El `jellyfinUserId` del perfil seleccionado se usa para:
- Obtener contenido personalizado
- Guardar progreso de visualización
- Recomendaciones

---

## 🚀 Despliegue

### Build de Release

```bash
cd mobile-android
./gradlew assembleRelease
```

El APK estará en:
```
mobile-android/app/build/outputs/apk/release/app-release.apk
```

### Firmar APK

```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore tu-keystore.jks \
  app-release.apk \
  tu-alias
```

---

## 🔗 Referencias

- [Documentación API](./API.md)
- [Guía de Integración Completa](../GUIA_COMPLETA_INTEGRACION.md)
- [Configuración Remota](./REMOTE_CONFIG.md)

---

¡Listo! Con estas opciones puedes integrar el selector de perfiles según tus necesidades. 🎉
