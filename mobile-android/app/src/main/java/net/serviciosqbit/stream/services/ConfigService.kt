package net.serviciosqbit.stream.services

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Service to load remote configuration from external sources
 * This allows changing server URLs without updating the app
 */
class ConfigService(private val context: Context) {
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private val prefs = context.getSharedPreferences("qbitstream_config", Context.MODE_PRIVATE)

    companion object {
        private const val TAG = "ConfigService"

        // URL del archivo de configuración remoto
        // Puedes usar Google Drive, OneDrive, Dropbox, GitHub raw, o tu propio servidor
        private const val CONFIG_URL = "https://raw.githubusercontent.com/MterEcko/qbitstream-config/main/mobile-config.json"

        // Configuración de fallback en caso de que no se pueda cargar la remota
        private const val FALLBACK_BACKEND_API = "https://qbitstream.serviciosqbit.net/api"
        private const val FALLBACK_SERVER_URL = "https://qbitstream.serviciosqbit.net"

        // Keys para SharedPreferences cache
        private const val PREF_CONFIG_JSON = "config_json"
        private const val PREF_CONFIG_TIMESTAMP = "config_timestamp"
        private const val CONFIG_CACHE_DURATION_MS = 3600000L // 1 hora
    }

    data class AppConfig(
        val backendApiUrl: String,
        val defaultServerUrl: String,
        val serverUrls: List<String>,
        val features: Features,
        val version: String
    )

    data class Features(
        val adsEnabled: Boolean,
        val autoLoginEnabled: Boolean,
        val crashReportingEnabled: Boolean
    )

    /**
     * Load configuration from remote source
     * Falls back to cached config if remote fails
     * Falls back to hardcoded config if cache is also unavailable
     */
    suspend fun loadConfig(): AppConfig = withContext(Dispatchers.IO) {
        try {
            // Try to load from remote
            val remoteConfig = loadRemoteConfig()
            if (remoteConfig != null) {
                // Cache the config
                cacheConfig(remoteConfig)
                Log.i(TAG, "Loaded remote config successfully (version: ${remoteConfig.version})")
                return@withContext remoteConfig
            }

            // Remote failed, try cache
            val cachedConfig = loadCachedConfig()
            if (cachedConfig != null) {
                Log.i(TAG, "Using cached config (version: ${cachedConfig.version})")
                return@withContext cachedConfig
            }

            // Everything failed, use fallback
            Log.w(TAG, "Using fallback config")
            return@withContext getFallbackConfig()

        } catch (e: Exception) {
            Log.e(TAG, "Error loading config", e)
            return@withContext getFallbackConfig()
        }
    }

    /**
     * Load configuration from remote URL
     */
    private suspend fun loadRemoteConfig(): AppConfig? = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url(CONFIG_URL)
                .get()
                .build()

            val response = httpClient.newCall(request).execute()

            if (response.isSuccessful) {
                val jsonString = response.body?.string()
                if (jsonString != null) {
                    return@withContext parseConfig(jsonString)
                }
            }

            Log.w(TAG, "Failed to load remote config (status: ${response.code})")
            return@withContext null

        } catch (e: IOException) {
            Log.e(TAG, "Network error loading remote config", e)
            return@withContext null
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing remote config", e)
            return@withContext null
        }
    }

    /**
     * Load cached configuration
     */
    private fun loadCachedConfig(): AppConfig? {
        val jsonString = prefs.getString(PREF_CONFIG_JSON, null) ?: return null
        val timestamp = prefs.getLong(PREF_CONFIG_TIMESTAMP, 0)

        // Check if cache is still valid
        val age = System.currentTimeMillis() - timestamp
        if (age > CONFIG_CACHE_DURATION_MS) {
            Log.i(TAG, "Cached config is expired (age: ${age}ms)")
            return null
        }

        return try {
            parseConfig(jsonString)
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing cached config", e)
            null
        }
    }

    /**
     * Cache configuration to SharedPreferences
     */
    private fun cacheConfig(config: AppConfig) {
        val jsonString = buildConfigJson(config)
        prefs.edit()
            .putString(PREF_CONFIG_JSON, jsonString)
            .putLong(PREF_CONFIG_TIMESTAMP, System.currentTimeMillis())
            .apply()
        Log.i(TAG, "Config cached successfully")
    }

    /**
     * Parse JSON string into AppConfig
     */
    private fun parseConfig(jsonString: String): AppConfig {
        val json = JSONObject(jsonString)

        val features = json.getJSONObject("features")
        val serverUrlsArray = json.getJSONArray("serverUrls")

        val serverUrls = mutableListOf<String>()
        for (i in 0 until serverUrlsArray.length()) {
            serverUrls.add(serverUrlsArray.getString(i))
        }

        return AppConfig(
            backendApiUrl = json.getString("backendApiUrl"),
            defaultServerUrl = json.getString("defaultServerUrl"),
            serverUrls = serverUrls,
            features = Features(
                adsEnabled = features.getBoolean("adsEnabled"),
                autoLoginEnabled = features.getBoolean("autoLoginEnabled"),
                crashReportingEnabled = features.optBoolean("crashReportingEnabled", false)
            ),
            version = json.getString("version")
        )
    }

    /**
     * Build JSON string from AppConfig
     */
    private fun buildConfigJson(config: AppConfig): String {
        val json = JSONObject()
        json.put("backendApiUrl", config.backendApiUrl)
        json.put("defaultServerUrl", config.defaultServerUrl)
        json.put("serverUrls", config.serverUrls)
        json.put("version", config.version)

        val features = JSONObject()
        features.put("adsEnabled", config.features.adsEnabled)
        features.put("autoLoginEnabled", config.features.autoLoginEnabled)
        features.put("crashReportingEnabled", config.features.crashReportingEnabled)
        json.put("features", features)

        return json.toString()
    }

    /**
     * Get fallback configuration
     */
    private fun getFallbackConfig(): AppConfig {
        return AppConfig(
            backendApiUrl = FALLBACK_BACKEND_API,
            defaultServerUrl = FALLBACK_SERVER_URL,
            serverUrls = listOf(
                "https://qbitstream.serviciosqbit.net",
                "http://189.168.20.1:8081",
                "http://179.120.0.15:8096",
                "http://172.16.0.4:8096",
                "http://10.10.0.112:8096"
            ),
            features = Features(
                adsEnabled = true,
                autoLoginEnabled = true,
                crashReportingEnabled = false
            ),
            version = "fallback"
        )
    }

    /**
     * Force refresh configuration from remote
     */
    suspend fun refreshConfig(): AppConfig {
        // Clear cache
        prefs.edit().remove(PREF_CONFIG_JSON).remove(PREF_CONFIG_TIMESTAMP).apply()

        // Load fresh config
        return loadConfig()
    }

    /**
     * Check if feature is enabled
     */
    suspend fun isFeatureEnabled(feature: String): Boolean {
        val config = loadConfig()
        return when (feature) {
            "ads" -> config.features.adsEnabled
            "autoLogin" -> config.features.autoLoginEnabled
            "crashReporting" -> config.features.crashReportingEnabled
            else -> false
        }
    }
}
