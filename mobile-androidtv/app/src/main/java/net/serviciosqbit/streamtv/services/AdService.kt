package net.serviciosqbit.streamtv.services

import android.util.Log
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
 * Service for handling ad selection and tracking from the backend API
 */
class AdService {
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(Constants.CONNECT_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .readTimeout(Constants.READ_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .build()

    companion object {
        private const val TAG = "AdService"
    }

    data class AdInfo(
        val id: String,
        val title: String,
        val type: String,
        val duration: Int,
        val url: String,
        val skipAfter: Int?
    )

    data class MidrollPositions(
        val positions: List<Int>
    )

    /**
     * Select an ad from the backend API
     * @param accessToken JWT access token
     * @param adType Type of ad (PREROLL, MIDROLL, PAUSEROLL)
     * @param contentId ID of the content being played
     * @return AdInfo or null if no ad is available
     */
    suspend fun selectAd(
        accessToken: String,
        adType: String,
        contentId: String? = null
    ): AdInfo? = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                put("type", adType)
                if (contentId != null) {
                    put("contentId", contentId)
                }
            }

            val request = Request.Builder()
                .url("${Constants.BACKEND_API_URL}/ads/select")
                .header("Authorization", "Bearer $accessToken")
                .post(json.toString().toRequestBody("application/json".toMediaType()))
                .build()

            val response = httpClient.newCall(request).execute()
            val responseBody = response.body?.string()

            if (response.isSuccessful && responseBody != null) {
                val jsonResponse = JSONObject(responseBody)
                val data = jsonResponse.optJSONObject("data")

                if (data != null && !data.isNull("id")) {
                    val adInfo = AdInfo(
                        id = data.getString("id"),
                        title = data.getString("title"),
                        type = data.getString("type"),
                        duration = data.getInt("duration"),
                        url = data.getString("url"),
                        skipAfter = if (data.has("skipAfter") && !data.isNull("skipAfter"))
                            data.getInt("skipAfter") else null
                    )

                    Log.i(TAG, "Ad selected: ${adInfo.title} (${adInfo.type})")
                    return@withContext adInfo
                } else {
                    Log.i(TAG, "No ad available for type: $adType")
                    return@withContext null
                }
            }

            Log.w(TAG, "Failed to select ad (status: ${response.code})")
            return@withContext null

        } catch (e: Exception) {
            Log.e(TAG, "Error selecting ad", e)
            return@withContext null
        }
    }

    /**
     * Track ad view
     * @param accessToken JWT access token
     * @param adId ID of the ad
     * @param contentId ID of the content being played
     * @param completed Whether the ad was fully watched
     * @param skipped Whether the ad was skipped
     * @param watchedSeconds How many seconds were watched
     */
    suspend fun trackAdView(
        accessToken: String,
        adId: String,
        contentId: String? = null,
        completed: Boolean,
        skipped: Boolean,
        watchedSeconds: Int
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                put("adId", adId)
                if (contentId != null) {
                    put("contentId", contentId)
                }
                put("completed", completed)
                put("skipped", skipped)
                put("watchedSeconds", watchedSeconds)
            }

            val request = Request.Builder()
                .url("${Constants.BACKEND_API_URL}/ads/track")
                .header("Authorization", "Bearer $accessToken")
                .post(json.toString().toRequestBody("application/json".toMediaType()))
                .build()

            val response = httpClient.newCall(request).execute()

            if (response.isSuccessful) {
                Log.i(TAG, "Ad view tracked: $adId (completed: $completed, skipped: $skipped)")
                return@withContext true
            }

            Log.w(TAG, "Failed to track ad view (status: ${response.code})")
            return@withContext false

        } catch (e: Exception) {
            Log.e(TAG, "Error tracking ad view", e)
            return@withContext false
        }
    }

    /**
     * Calculate mid-roll positions for content
     * @param accessToken JWT access token
     * @param contentDurationSeconds Duration of content in seconds
     * @param midrollCount Number of mid-rolls to insert
     * @return List of positions in seconds where mid-rolls should be shown
     */
    suspend fun calculateMidrollPositions(
        accessToken: String,
        contentDurationSeconds: Int,
        midrollCount: Int = 2
    ): MidrollPositions = withContext(Dispatchers.IO) {
        try {
            val json = JSONObject().apply {
                put("contentDurationSeconds", contentDurationSeconds)
                put("midrollCount", midrollCount)
            }

            val request = Request.Builder()
                .url("${Constants.BACKEND_API_URL}/ads/midroll-positions")
                .header("Authorization", "Bearer $accessToken")
                .post(json.toString().toRequestBody("application/json".toMediaType()))
                .build()

            val response = httpClient.newCall(request).execute()
            val responseBody = response.body?.string()

            if (response.isSuccessful && responseBody != null) {
                val jsonResponse = JSONObject(responseBody)
                val data = jsonResponse.getJSONObject("data")
                val positionsArray = data.getJSONArray("positions")

                val positions = mutableListOf<Int>()
                for (i in 0 until positionsArray.length()) {
                    positions.add(positionsArray.getInt(i))
                }

                Log.i(TAG, "Mid-roll positions calculated: $positions")
                return@withContext MidrollPositions(positions)
            }

            Log.w(TAG, "Failed to calculate mid-roll positions, using default")
            return@withContext calculateDefaultMidrollPositions(contentDurationSeconds, midrollCount)

        } catch (e: Exception) {
            Log.e(TAG, "Error calculating mid-roll positions", e)
            return@withContext calculateDefaultMidrollPositions(contentDurationSeconds, midrollCount)
        }
    }

    /**
     * Calculate default mid-roll positions locally
     */
    private fun calculateDefaultMidrollPositions(
        contentDurationSeconds: Int,
        midrollCount: Int
    ): MidrollPositions {
        if (contentDurationSeconds < 600) {
            // No mid-rolls for content shorter than 10 minutes
            return MidrollPositions(emptyList())
        }

        val positions = mutableListOf<Int>()
        val interval = contentDurationSeconds / (midrollCount + 1)

        for (i in 1..midrollCount) {
            positions.add(interval * i)
        }

        return MidrollPositions(positions)
    }

    /**
     * Build full ad URL (prepend backend URL if needed)
     */
    fun buildAdUrl(relativeUrl: String): String {
        return if (relativeUrl.startsWith("http")) {
            relativeUrl
        } else {
            "${Constants.BACKEND_API_URL.replace("/api", "")}$relativeUrl"
        }
    }
}
