package net.serviciosqbit.streamtv

/**
 * App-wide constants for QbitStream
 */
object Constants {
    // Backend API
    const val BACKEND_API_URL = "https://qbitstream.serviciosqbit.net/api"

    // Default Jellyfin server (fallback)
    const val DEFAULT_SERVER_URL = "https://qbitstream.serviciosqbit.net"

    // Shared Preferences keys
    const val PREF_SERVER_URL = "server_url"
    const val PREF_ACCESS_TOKEN = "access_token"
    const val PREF_REFRESH_TOKEN = "refresh_token"
    const val PREF_USER_EMAIL = "user_email"
    const val PREF_AUTO_LOGIN_ENABLED = "auto_login_enabled"
    const val PREF_JELLYFIN_USER_ID = "jellyfin_user_id"
    const val PREF_JELLYFIN_ACCESS_TOKEN = "jellyfin_access_token"

    // Request timeouts
    const val CONNECT_TIMEOUT_SECONDS = 10L
    const val READ_TIMEOUT_SECONDS = 30L
    const val WRITE_TIMEOUT_SECONDS = 30L

    // Ad types
    const val AD_TYPE_PREROLL = "PREROLL"
    const val AD_TYPE_MIDROLL = "MIDROLL"
    const val AD_TYPE_PAUSEROLL = "PAUSEROLL"
}
