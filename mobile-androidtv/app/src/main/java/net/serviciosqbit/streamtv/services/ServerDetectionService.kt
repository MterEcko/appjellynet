package net.serviciosqbit.streamtv.services

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Service to detect the best Jellyfin server from the backend API
 */
class ServerDetectionService {
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    companion object {
        private const val TAG = "ServerDetectionService"
        private const val BACKEND_API_URL = "https://qbitstream.serviciosqbit.net/api"

        // Fallback server URLs in case backend is unavailable
        private val FALLBACK_SERVERS = listOf(
            "https://qbitstream.serviciosqbit.net",
            "http://189.168.20.1:8081",
            "http://179.120.0.15:8096",
            "http://172.16.0.4:8096",
            "http://10.10.0.112:8096"
        )
    }

    data class ServerInfo(
        val url: String,
        val name: String,
        val serverId: String,
        val latency: Int? = null
    )

    /**
     * Detect the best server for the current network
     * @param accessToken JWT access token for authentication
     * @return ServerInfo with the best server URL
     */
    suspend fun detectBestServer(accessToken: String? = null): ServerInfo = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$BACKEND_API_URL/servers/detect")
                .apply {
                    if (accessToken != null) {
                        header("Authorization", "Bearer $accessToken")
                    }
                }
                .get()
                .build()

            val response = httpClient.newCall(request).execute()

            if (response.isSuccessful) {
                val jsonData = response.body?.string()
                if (jsonData != null) {
                    val json = JSONObject(jsonData)
                    val data = json.getJSONObject("data")
                    val server = data.getJSONObject("server")

                    val serverInfo = ServerInfo(
                        url = server.getString("url"),
                        name = server.optString("name", "QbitStream"),
                        serverId = server.optString("serverId", "auto"),
                        latency = server.optInt("latency", -1).takeIf { it >= 0 }
                    )

                    Log.i(TAG, "Server detected successfully: ${serverInfo.url} (${serverInfo.name})")
                    return@withContext serverInfo
                }
            }

            Log.w(TAG, "Backend API not available (status: ${response.code}), using fallback")
            return@withContext getFallbackServer()

        } catch (e: IOException) {
            Log.e(TAG, "Error connecting to backend API", e)
            return@withContext getFallbackServer()
        } catch (e: Exception) {
            Log.e(TAG, "Unexpected error detecting server", e)
            return@withContext getFallbackServer()
        }
    }

    /**
     * Get fallback server (public domain)
     */
    private fun getFallbackServer(): ServerInfo {
        Log.i(TAG, "Using fallback server")
        return ServerInfo(
            url = FALLBACK_SERVERS[0],
            name = "QbitStream",
            serverId = "fallback"
        )
    }

    /**
     * Test connectivity to a server
     */
    suspend fun testServerConnectivity(serverUrl: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$serverUrl/System/Info/Public")
                .get()
                .build()

            val response = httpClient.newCall(request).execute()
            val isReachable = response.isSuccessful

            Log.i(TAG, "Server $serverUrl is ${if (isReachable) "reachable" else "unreachable"}")
            return@withContext isReachable

        } catch (e: Exception) {
            Log.w(TAG, "Server $serverUrl is unreachable: ${e.message}")
            return@withContext false
        }
    }

    /**
     * Get all available servers from backend
     */
    suspend fun getAllServers(accessToken: String): List<ServerInfo> = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$BACKEND_API_URL/servers")
                .header("Authorization", "Bearer $accessToken")
                .get()
                .build()

            val response = httpClient.newCall(request).execute()

            if (response.isSuccessful) {
                val jsonData = response.body?.string()
                if (jsonData != null) {
                    val json = JSONObject(jsonData)
                    val data = json.getJSONObject("data")
                    val serversArray = data.getJSONArray("servers")

                    val servers = mutableListOf<ServerInfo>()
                    for (i in 0 until serversArray.length()) {
                        val server = serversArray.getJSONObject(i)
                        servers.add(
                            ServerInfo(
                                url = server.getString("url"),
                                name = server.optString("name", "Server $i"),
                                serverId = server.optString("serverId", "server-$i"),
                                latency = server.optInt("latency", -1).takeIf { it >= 0 }
                            )
                        )
                    }

                    Log.i(TAG, "Retrieved ${servers.size} servers from backend")
                    return@withContext servers
                }
            }

            Log.w(TAG, "Failed to get servers from backend, using fallback")
            return@withContext listOf(getFallbackServer())

        } catch (e: Exception) {
            Log.e(TAG, "Error getting servers from backend", e)
            return@withContext listOf(getFallbackServer())
        }
    }
}
