# Mobile Android - Guía de Integración de Publicidad

Esta guía explica cómo integrar el sistema de ads en el reproductor de Android.

## 📁 Archivos Creados

### 1. **AdService.kt**
`app/src/main/java/net/serviciosqbit/stream/services/AdService.kt`

Funcionalidades:
- `selectAd(accessToken, adType, contentId)` - Selecciona un ad desde el backend
- `trackAdView(...)` - Registra la visualización de un ad
- `calculateMidrollPositions(...)` - Calcula posiciones de mid-rolls
- `buildAdUrl(relativeUrl)` - Construye URL completa del ad

### 2. **AdPlayerWrapper.kt**
`app/src/main/java/net/serviciosqbit/stream/player/AdPlayerWrapper.kt`

Wrapper alrededor de ExoPlayer que maneja:
- Pre-roll ads (antes del contenido)
- Mid-roll ads (durante el contenido)
- Pause-roll ads (cuando se pausa)
- Tracking automático de visualizaciones
- Skip de ads cuando es permitido

## 🔧 Integración en el Player

### Paso 1: Crear AdPlayerWrapper en el Activity de Reproducción

```kotlin
class PlayerActivity : AppCompatActivity() {
    private lateinit var player: ExoPlayer
    private lateinit var adPlayerWrapper: AdPlayerWrapper

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Crear ExoPlayer
        player = ExoPlayer.Builder(this).build()

        // Crear wrapper de ads
        adPlayerWrapper = AdPlayerWrapper(this, player)

        // Configurar listeners de ads
        setupAdListeners()

        // Preparar contenido
        val contentId = intent.getStringExtra("CONTENT_ID") ?: ""
        val contentUrl = intent.getStringExtra("CONTENT_URL") ?: ""
        val duration = intent.getLongExtra("DURATION", 0L)

        adPlayerWrapper.prepareContent(contentId, contentUrl, duration)
    }

    private fun setupAdListeners() {
        adPlayerWrapper.setAdEventListeners(
            onAdStarted = {
                // Mostrar UI de ad (ocultar controles de contenido)
                showAdControls()
            },
            onAdCompleted = {
                // Ad completado exitosamente
                Log.d(TAG, "Ad completed")
            },
            onAdSkipped = {
                // Ad fue saltado
                Log.d(TAG, "Ad skipped")
            },
            onContentResumed = {
                // Contenido se reanuda después del ad
                showContentControls()
            }
        )
    }

    override fun onPause() {
        super.onPause()
        // Notificar pausa para mostrar pause-roll ad
        adPlayerWrapper.onContentPaused()
    }

    override fun onDestroy() {
        super.onDestroy()
        adPlayerWrapper.release()
        player.release()
    }
}
```

### Paso 2: UI para Ads

Crear un layout que muestre información del ad y botón de skip:

```xml
<!-- res/layout/ad_overlay.xml -->
<FrameLayout
    android:id="@+id/ad_overlay"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#80000000"
    android:visibility="gone">

    <LinearLayout
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_gravity="top|end"
        android:layout_margin="16dp"
        android:orientation="vertical">

        <TextView
            android:id="@+id/ad_info_text"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Anuncio"
            android:textColor="#FFFFFF"
            android:background="#E50914"
            android:padding="8dp"
            android:textSize="14sp" />

        <Button
            android:id="@+id/skip_ad_button"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_marginTop="8dp"
            android:text="Saltar >"
            android:visibility="gone" />

    </LinearLayout>

</FrameLayout>
```

### Paso 3: Mostrar/Ocultar UI de Ads

```kotlin
class PlayerActivity : AppCompatActivity() {
    private lateinit var adOverlay: View
    private lateinit var skipButton: Button
    private lateinit var adInfoText: TextView

    private fun showAdControls() {
        adOverlay.visibility = View.VISIBLE
        playerControls.visibility = View.GONE

        val ad = adPlayerWrapper.getCurrentAd()
        if (ad != null) {
            adInfoText.text = "Anuncio: ${ad.title}"

            // Mostrar botón de skip si es permitido
            if (ad.skipAfter != null) {
                handler.postDelayed({
                    skipButton.visibility = View.VISIBLE
                    skipButton.text = "Saltar anuncio >"
                }, (ad.skipAfter * 1000).toLong())
            }
        }
    }

    private fun showContentControls() {
        adOverlay.visibility = View.GONE
        playerControls.visibility = View.VISIBLE
        skipButton.visibility = View.GONE
    }

    private fun setupSkipButton() {
        skipButton.setOnClickListener {
            adPlayerWrapper.skipAd()
        }
    }
}
```

### Paso 4: Integrar con el Player Existente de Jellyfin

Modificar el archivo del player de Jellyfin para usar AdPlayerWrapper:

**Archivo:** `app/src/main/java/org/jellyfin/mobile/player/PlayerFragment.kt`

```kotlin
class PlayerFragment : Fragment() {
    private lateinit var adPlayerWrapper: AdPlayerWrapper

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Obtener ExoPlayer existente
        val player = playerViewModel.player

        // Crear wrapper de ads
        adPlayerWrapper = AdPlayerWrapper(requireContext(), player)
        adPlayerWrapper.setAdEventListeners(
            onAdStarted = { handleAdStarted() },
            onAdCompleted = { handleAdCompleted() },
            onAdSkipped = { handleAdSkipped() },
            onContentResumed = { handleContentResumed() }
        )

        // Al iniciar reproducción
        playerViewModel.mediaItem.observe(viewLifecycleOwner) { mediaItem ->
            val contentId = mediaItem.id
            val contentUrl = mediaItem.url
            val duration = mediaItem.duration

            adPlayerWrapper.prepareContent(contentId, contentUrl, duration)
        }
    }

    override fun onPause() {
        super.onPause()
        if (!requireActivity().isFinishing) {
            adPlayerWrapper.onContentPaused()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        adPlayerWrapper.release()
    }

    private fun handleAdStarted() {
        // Ocultar controles normales
        binding.playerControls.visibility = View.GONE
        binding.adOverlay.visibility = View.VISIBLE
    }

    private fun handleContentResumed() {
        // Mostrar controles normales
        binding.playerControls.visibility = View.VISIBLE
        binding.adOverlay.visibility = View.GONE
    }
}
```

## 📊 Tipos de Ads

### 1. Pre-roll
- Se muestra **antes** de que comience el contenido
- Se selecciona automáticamente al llamar `prepareContent()`
- Tracking automático de visualizaciones

### 2. Mid-roll
- Se muestra **durante** la reproducción del contenido
- Posiciones calculadas automáticamente por el backend
- Ejemplo: Para una película de 2 horas, se muestran 2 mid-rolls a los 40 y 80 minutos

### 3. Pause-roll
- Se muestra cuando el usuario **pausa** el contenido
- Opcional: Puede mostrarse en overlay sin interrumpir
- Llama a `adPlayerWrapper.onContentPaused()` cuando se pausa

## 🎯 Flujo Completo

```
1. Usuario selecciona contenido
   ↓
2. App llama prepareContent(contentId, contentUrl, duration)
   ↓
3. AdPlayerWrapper solicita pre-roll al backend
   ↓
4. Si hay pre-roll:
   a. Reproduce el ad
   b. Muestra UI de ad
   c. Permite skip si es configurado
   d. Trackea visualización
   ↓
5. Inicia contenido principal
   ↓
6. Mientras reproduce:
   a. Monitorea posición cada segundo
   b. Cuando llega a posición de mid-roll:
      - Pausa contenido
      - Reproduce ad
      - Reanuda contenido
   ↓
7. Si el usuario pausa:
   a. Solicita pause-roll al backend
   b. Muestra ad en overlay (opcional)
   ↓
8. Al finalizar:
   a. Trackea todas las visualizaciones
   b. Limpia recursos
```

## 🔐 Autenticación

Todos los requests de ads requieren autenticación:

```kotlin
val authService = AuthService(context)
val accessToken = authService.getAccessToken()

// El AdService usa el token internamente
adService.selectAd(accessToken, adType, contentId)
```

Si el token expira, el AuthService lo refresca automáticamente.

## 📱 Dependencias Necesarias

Agregar en `build.gradle.kts`:

```kotlin
dependencies {
    // ExoPlayer (ya incluido en Jellyfin)
    implementation("androidx.media3:media3-exoplayer:1.2.0")
    implementation("androidx.media3:media3-ui:1.2.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // OkHttp
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // Security Crypto
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
}
```

## ⚠️ Consideraciones Importantes

1. **Conectividad**: Si el backend no está disponible, no se muestran ads (experiencia degradada gracefully)

2. **Buffering**: Los ads se precargan mientras se reproduce el contenido principal

3. **Logs**: Todos los eventos de ads se registran en logcat con el tag `AdPlayerWrapper`

4. **Tracking**: Cada visualización se reporta al backend incluso si el ad es saltado

5. **Skip Logic**:
   - Solo se permite skip si `skipAfter` está definido en el ad
   - El usuario debe esperar los segundos configurados antes de poder saltar

## 🧪 Testing

Para probar la integración:

1. Crear un ad de prueba en el panel de admin del backend
2. Compilar e instalar la app: `./gradlew installDebug`
3. Reproducir contenido y verificar:
   - Pre-roll se muestra antes del contenido
   - Mid-rolls aparecen en las posiciones correctas
   - Skip button funciona después del tiempo configurado
   - Tracking se registra en el backend

```bash
# Ver logs de ads en tiempo real
adb logcat | grep "AdPlayerWrapper\|AdService"
```

## 🎨 Personalización del UI

Para cambiar la apariencia de los ads:

1. **Color de fondo del overlay**: Modificar `ad_overlay.xml`
2. **Estilo del botón skip**: Usar estilos de Material Design
3. **Posición de la info del ad**: Ajustar layout gravity

Ejemplo de botón skip personalizado:

```xml
<Button
    android:id="@+id/skip_ad_button"
    style="@style/Widget.Material3.Button.TonalButton"
    android:layout_width="wrap_content"
    android:layout_height="wrap_content"
    android:text="Saltar >"
    android:backgroundTint="#E50914"
    android:textColor="#FFFFFF" />
```

## 📚 Referencias

- [Documentación de ExoPlayer](https://exoplayer.dev/)
- [Backend API Docs](/docs/API.md)
- [Android Media3 Guide](https://developer.android.com/guide/topics/media/media3)

---

**Próximo paso:** Ver `INTEGRATION_GUIDE.md` para la integración completa del server detection y auto-login.
