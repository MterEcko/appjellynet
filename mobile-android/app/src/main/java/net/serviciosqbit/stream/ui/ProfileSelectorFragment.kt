package net.serviciosqbit.stream.ui

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import kotlinx.coroutines.launch
import net.serviciosqbit.stream.services.AuthService
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

/**
 * Profile Selector Screen - Netflix/HBO style
 * Shows all profiles for the logged-in user
 */
class ProfileSelectorFragment : Fragment() {

    private lateinit var authService: AuthService
    private lateinit var recyclerView: RecyclerView
    private lateinit var profileAdapter: ProfileAdapter

    data class Profile(
        val id: String,
        val name: String,
        val avatar: String?,
        val isPrimary: Boolean
    )

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_profile_selector, container, false)

        authService = AuthService(requireContext())
        recyclerView = view.findViewById(R.id.profilesRecyclerView)

        setupRecyclerView()
        loadProfiles()

        return view
    }

    private fun setupRecyclerView() {
        profileAdapter = ProfileAdapter { profile ->
            onProfileSelected(profile)
        }

        recyclerView.apply {
            layoutManager = GridLayoutManager(requireContext(), 2) // 2 columns
            adapter = profileAdapter
        }
    }

    private fun loadProfiles() {
        lifecycleScope.launch {
            try {
                val profiles = fetchProfilesFromBackend()
                profileAdapter.submitList(profiles)
            } catch (e: Exception) {
                // Show error
            }
        }
    }

    private suspend fun fetchProfilesFromBackend(): List<Profile> {
        val accessToken = authService.getAccessToken() ?: return emptyList()

        val client = OkHttpClient()
        val request = Request.Builder()
            .url("${Constants.BACKEND_API_URL}/profiles")
            .header("Authorization", "Bearer $accessToken")
            .get()
            .build()

        val response = client.newCall(request).execute()
        val jsonData = response.body?.string() ?: return emptyList()

        val json = JSONObject(jsonData)
        val data = json.getJSONObject("data")
        val profilesArray = data.getJSONArray("profiles")

        val profiles = mutableListOf<Profile>()
        for (i in 0 until profilesArray.length()) {
            val profileJson = profilesArray.getJSONObject(i)
            profiles.add(
                Profile(
                    id = profileJson.getString("id"),
                    name = profileJson.getString("name"),
                    avatar = profileJson.optString("avatar", null),
                    isPrimary = profileJson.getBoolean("isPrimary")
                )
            )
        }

        return profiles
    }

    private fun onProfileSelected(profile: Profile) {
        // Save selected profile
        val prefs = requireContext().getSharedPreferences("qbitstream_prefs", Context.MODE_PRIVATE)
        prefs.edit()
            .putString("selected_profile_id", profile.id)
            .putString("selected_profile_name", profile.name)
            .apply()

        // Navigate to main content
        // (integrate with your navigation)
    }

    // RecyclerView Adapter
    class ProfileAdapter(
        private val onProfileClick: (Profile) -> Unit
    ) : RecyclerView.Adapter<ProfileAdapter.ProfileViewHolder>() {

        private var profiles = listOf<Profile>()

        fun submitList(newProfiles: List<Profile>) {
            profiles = newProfiles
            notifyDataSetChanged()
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ProfileViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_profile, parent, false)
            return ProfileViewHolder(view)
        }

        override fun onBindViewHolder(holder: ProfileViewHolder, position: Int) {
            holder.bind(profiles[position], onProfileClick)
        }

        override fun getItemCount() = profiles.size

        class ProfileViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
            private val avatarImageView: ImageView = itemView.findViewById(R.id.profileAvatar)
            private val nameTextView: TextView = itemView.findViewById(R.id.profileName)

            fun bind(profile: Profile, onClick: (Profile) -> Unit) {
                nameTextView.text = profile.name

                // Load avatar (use Glide or Coil)
                // Glide.with(itemView).load(profile.avatar).into(avatarImageView)

                itemView.setOnClickListener {
                    onClick(profile)
                }
            }
        }
    }
}
