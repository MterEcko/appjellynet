package net.serviciosqbit.streamtv.services

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import net.serviciosqbit.streamtv.Constants
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Service for handling backend authentication
 */
class AuthService(private val context: Context) {
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(Constants.CONNECT_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .readTimeout(Constants.READ_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .build()

    private val prefs: SharedPreferences by lazy {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            context,
            "qbitstream_secure_prefs",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    companion object {
        private const val TAG = "AuthService"
    }

    data class LoginResult(
        val success: Boolean,
        val accessToken: String? = null,
        val refreshToken: String? = null,
        val userId: String? = null,
        val email: String? = null,
        val errorMessage: String? = null
    )

    /**
     * Login to backend API
     */
    suspend fun login(email: String, password: String): LoginResult = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                put("email", email)
                put("password", password)
            }

            val request = Request.Builder()
                .url("${Constants.BACKEND_API_URL}/auth/login")
                .post(json.toString().toRequestBody("application/json".toMediaType()))
                .build()

            val response = httpClient.newCall(request).execute()
            val responseBody = response.body?.string()

            if (response.isSuccessful && responseBody != null) {
                val jsonResponse = JSONObject(responseBody)
                val data = jsonResponse.getJSONObject("data")
                val user = data.getJSONObject("user")

                val accessToken = data.getString("accessToken")
                val refreshToken = data.getString("refreshToken")
                val userId = user.getString("id")
                val userEmail = user.getString("email")

                // Save credentials securely
                prefs.edit().apply {
                    putString(Constants.PREF_ACCESS_TOKEN, accessToken)
                    putString(Constants.PREF_REFRESH_TOKEN, refreshToken)
                    putString(Constants.PREF_USER_EMAIL, userEmail)
                    putBoolean(Constants.PREF_AUTO_LOGIN_ENABLED, true)
                    apply()
                }

                Log.i(TAG, "Login successful for user: $userEmail")

                return@withContext LoginResult(
                    success = true,
                    accessToken = accessToken,
                    refreshToken = refreshToken,
                    userId = userId,
                    email = userEmail
                )
            } else {
                val errorMsg = if (responseBody != null) {
                    try {
                        val errorJson = JSONObject(responseBody)
                        errorJson.getJSONObject("error").getString("message")
                    } catch (e: Exception) {
                        "Login failed"
                    }
                } else {
                    "Login failed"
                }

                Log.w(TAG, "Login failed: $errorMsg")
                return@withContext LoginResult(success = false, errorMessage = errorMsg)
            }

        } catch (e: Exception) {
            Log.e(TAG, "Login error", e)
            return@withContext LoginResult(
                success = false,
                errorMessage = e.message ?: "Connection error"
            )
        }
    }

    /**
     * Refresh access token
     */
    suspend fun refreshAccessToken(): String? = withContext(Dispatchers.IO) {
        try {
            val refreshToken = prefs.getString(Constants.PREF_REFRESH_TOKEN, null)
                ?: return@withContext null

            val json = JSONObject().apply {
                put("refreshToken", refreshToken)
            }

            val request = Request.Builder()
                .url("${Constants.BACKEND_API_URL}/auth/refresh")
                .post(json.toString().toRequestBody("application/json".toMediaType()))
                .build()

            val response = httpClient.newCall(request).execute()
            val responseBody = response.body?.string()

            if (response.isSuccessful && responseBody != null) {
                val jsonResponse = JSONObject(responseBody)
                val data = jsonResponse.getJSONObject("data")
                val newAccessToken = data.getString("accessToken")

                // Save new access token
                prefs.edit().putString(Constants.PREF_ACCESS_TOKEN, newAccessToken).apply()

                Log.i(TAG, "Access token refreshed successfully")
                return@withContext newAccessToken
            }

            Log.w(TAG, "Failed to refresh access token")
            return@withContext null

        } catch (e: Exception) {
            Log.e(TAG, "Error refreshing token", e)
            return@withContext null
        }
    }

    /**
     * Check if user is logged in
     */
    fun isLoggedIn(): Boolean {
        val accessToken = prefs.getString(Constants.PREF_ACCESS_TOKEN, null)
        val autoLoginEnabled = prefs.getBoolean(Constants.PREF_AUTO_LOGIN_ENABLED, false)
        return !accessToken.isNullOrEmpty() && autoLoginEnabled
    }

    /**
     * Get stored access token
     */
    fun getAccessToken(): String? {
        return prefs.getString(Constants.PREF_ACCESS_TOKEN, null)
    }

    /**
     * Get stored refresh token
     */
    fun getRefreshToken(): String? {
        return prefs.getString(Constants.PREF_REFRESH_TOKEN, null)
    }

    /**
     * Get stored user email
     */
    fun getUserEmail(): String? {
        return prefs.getString(Constants.PREF_USER_EMAIL, null)
    }

    /**
     * Logout - clear all stored credentials
     */
    fun logout() {
        prefs.edit().clear().apply()
        Log.i(TAG, "User logged out, credentials cleared")
    }

    /**
     * Save Jellyfin credentials
     */
    fun saveJellyfinCredentials(userId: String, accessToken: String) {
        prefs.edit().apply {
            putString(Constants.PREF_JELLYFIN_USER_ID, userId)
            putString(Constants.PREF_JELLYFIN_ACCESS_TOKEN, accessToken)
            apply()
        }
        Log.i(TAG, "Jellyfin credentials saved")
    }

    /**
     * Get Jellyfin user ID
     */
    fun getJellyfinUserId(): String? {
        return prefs.getString(Constants.PREF_JELLYFIN_USER_ID, null)
    }

    /**
     * Get Jellyfin access token
     */
    fun getJellyfinAccessToken(): String? {
        return prefs.getString(Constants.PREF_JELLYFIN_ACCESS_TOKEN, null)
    }
}
