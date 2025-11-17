package net.serviciosqbit.stream.player

import android.content.Context
import android.util.Log
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import net.serviciosqbit.stream.Constants
import net.serviciosqbit.stream.services.AdService
import net.serviciosqbit.stream.services.AuthService

/**
 * Wrapper around ExoPlayer that handles ad injection
 */
class AdPlayerWrapper(
    private val context: Context,
    private val player: ExoPlayer
) {
    private val adService = AdService()
    private val authService = AuthService(context)
    private val scope = CoroutineScope(Dispatchers.Main + Job())

    private var currentContentId: String? = null
    private var contentDuration: Long = 0
    private var midrollPositions: List<Int> = emptyList()
    private var shownMidrolls = mutableSetOf<Int>()
    private var isPlayingAd = false
    private var currentAdInfo: AdService.AdInfo? = null
    private var adStartTime: Long = 0

    private var onAdStarted: (() -> Unit)? = null
    private var onAdCompleted: (() -> Unit)? = null
    private var onAdSkipped: (() -> Unit)? = null
    private var onContentResumed: (() -> Unit)? = null

    companion object {
        private const val TAG = "AdPlayerWrapper"
        private const val POSITION_CHECK_INTERVAL_MS = 1000L
    }

    /**
     * Set listeners for ad events
     */
    fun setAdEventListeners(
        onAdStarted: () -> Unit,
        onAdCompleted: () -> Unit,
        onAdSkipped: () -> Unit,
        onContentResumed: () -> Unit
    ) {
        this.onAdStarted = onAdStarted
        this.onAdCompleted = onAdCompleted
        this.onAdSkipped = onAdSkipped
        this.onContentResumed = onContentResumed
    }

    /**
     * Prepare content for playback with ads
     */
    fun prepareContent(contentId: String, contentUrl: String, duration: Long) {
        currentContentId = contentId
        contentDuration = duration
        shownMidrolls.clear()

        // Calculate mid-roll positions
        if (duration > 600_000) { // 10 minutes
            scope.launch {
                val accessToken = authService.getAccessToken() ?: return@launch
                val result = adService.calculateMidrollPositions(
                    accessToken = accessToken,
                    contentDurationSeconds = (duration / 1000).toInt(),
                    midrollCount = 2
                )
                midrollPositions = result.positions
                Log.i(TAG, "Mid-roll positions: $midrollPositions")
            }
        }

        // Show pre-roll ad
        showPrerollAd()
    }

    /**
     * Show pre-roll ad before content
     */
    private fun showPrerollAd() {
        scope.launch {
            val accessToken = authService.getAccessToken()
            if (accessToken == null) {
                Log.w(TAG, "No access token, skipping pre-roll ad")
                startContent()
                return@launch
            }

            val ad = adService.selectAd(
                accessToken = accessToken,
                adType = Constants.AD_TYPE_PREROLL,
                contentId = currentContentId
            )

            if (ad != null) {
                playAd(ad)
            } else {
                Log.i(TAG, "No pre-roll ad available, starting content")
                startContent()
            }
        }
    }

    /**
     * Play an ad
     */
    private fun playAd(ad: AdService.AdInfo) {
        Log.i(TAG, "Playing ad: ${ad.title}")

        isPlayingAd = true
        currentAdInfo = ad
        adStartTime = System.currentTimeMillis()

        val adUrl = adService.buildAdUrl(ad.url)
        val adMediaItem = MediaItem.fromUri(adUrl)

        player.setMediaItem(adMediaItem)
        player.prepare()
        player.play()

        onAdStarted?.invoke()

        // Monitor ad playback
        monitorAdPlayback(ad)
    }

    /**
     * Monitor ad playback for completion or skip
     */
    private fun monitorAdPlayback(ad: AdService.AdInfo) {
        scope.launch {
            val listener = object : Player.Listener {
                override fun onPlaybackStateChanged(playbackState: Int) {
                    if (playbackState == Player.STATE_ENDED) {
                        // Ad completed
                        handleAdCompleted(ad, completed = true, skipped = false)
                        player.removeListener(this)
                    }
                }
            }
            player.addListener(listener)
        }
    }

    /**
     * Handle ad completion or skip
     */
    private fun handleAdCompleted(ad: AdService.AdInfo, completed: Boolean, skipped: Boolean) {
        val watchedSeconds = ((System.currentTimeMillis() - adStartTime) / 1000).toInt()

        // Track ad view
        scope.launch {
            val accessToken = authService.getAccessToken()
            if (accessToken != null) {
                adService.trackAdView(
                    accessToken = accessToken,
                    adId = ad.id,
                    contentId = currentContentId,
                    completed = completed,
                    skipped = skipped,
                    watchedSeconds = watchedSeconds
                )
            }
        }

        isPlayingAd = false
        currentAdInfo = null

        if (completed) {
            Log.i(TAG, "Ad completed: ${ad.title}")
            onAdCompleted?.invoke()
        } else if (skipped) {
            Log.i(TAG, "Ad skipped: ${ad.title}")
            onAdSkipped?.invoke()
        }

        // Resume content
        startContent()
    }

    /**
     * Skip current ad (if skippable)
     */
    fun skipAd() {
        val ad = currentAdInfo
        if (ad != null && ad.skipAfter != null) {
            val watchedSeconds = ((System.currentTimeMillis() - adStartTime) / 1000).toInt()

            if (watchedSeconds >= ad.skipAfter) {
                Log.i(TAG, "Skipping ad: ${ad.title}")
                handleAdCompleted(ad, completed = false, skipped = true)
            } else {
                Log.w(TAG, "Cannot skip ad yet, need to watch ${ad.skipAfter} seconds")
            }
        }
    }

    /**
     * Start or resume content playback
     */
    private fun startContent() {
        isPlayingAd = false
        onContentResumed?.invoke()

        // Start monitoring for mid-rolls
        if (midrollPositions.isNotEmpty()) {
            startMidrollMonitoring()
        }
    }

    /**
     * Monitor playback position for mid-rolls
     */
    private fun startMidrollMonitoring() {
        scope.launch {
            while (true) {
                delay(POSITION_CHECK_INTERVAL_MS)

                if (isPlayingAd) continue

                val currentPosition = (player.currentPosition / 1000).toInt()

                // Check if we should show a mid-roll
                for (position in midrollPositions) {
                    if (position !in shownMidrolls &&
                        currentPosition >= position &&
                        currentPosition < position + 5
                    ) {
                        shownMidrolls.add(position)
                        showMidrollAd()
                        break
                    }
                }
            }
        }
    }

    /**
     * Show mid-roll ad
     */
    private fun showMidrollAd() {
        scope.launch {
            val accessToken = authService.getAccessToken() ?: return@launch

            val ad = adService.selectAd(
                accessToken = accessToken,
                adType = Constants.AD_TYPE_MIDROLL,
                contentId = currentContentId
            )

            if (ad != null) {
                // Pause content
                player.pause()
                val resumePosition = player.currentPosition

                // Play ad
                playAd(ad)

                // After ad, resume content at saved position
                scope.launch {
                    delay((ad.duration * 1000).toLong())
                    player.seekTo(resumePosition)
                    player.play()
                }
            }
        }
    }

    /**
     * Show pause-roll ad when user pauses
     */
    fun onContentPaused() {
        if (isPlayingAd) return

        scope.launch {
            val accessToken = authService.getAccessToken() ?: return@launch

            val ad = adService.selectAd(
                accessToken = accessToken,
                adType = Constants.AD_TYPE_PAUSEROLL,
                contentId = currentContentId
            )

            if (ad != null) {
                // Show ad in overlay (not full player)
                Log.i(TAG, "Pause-roll ad available: ${ad.title}")
                // TODO: Show in overlay instead of interrupting content
            }
        }
    }

    /**
     * Check if currently playing an ad
     */
    fun isPlayingAd(): Boolean = isPlayingAd

    /**
     * Get current ad info
     */
    fun getCurrentAd(): AdService.AdInfo? = currentAdInfo

    /**
     * Clean up resources
     */
    fun release() {
        scope.launch {
            // Cancel all coroutines
        }
    }
}
