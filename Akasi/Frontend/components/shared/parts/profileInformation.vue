<template>
  <div class="flex flex-col p-8 bg-white border border-gray-200 rounded-xl shadow-md">
    <!-- Profile Header with Avatar -->
    <div class="flex items-center mb-6">
      <div class="flex-shrink-0 w-16 h-16 mr-4 overflow-hidden bg-[#f8f4ff] rounded-full flex items-center justify-center">
        <span class="text-2xl font-bold text-[#2f4a71]">{{ profile?.name?.charAt(0) || '?' }}</span>
      </div>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ profile?.name || 'Loading...' }}</h1>
        <p class="text-sm text-[#2f4a71] font-medium">{{ profile?.role || 'User' }}</p>
      </div>
    </div>

    <!-- Profile Information -->
    <div class="p-4 bg-gray-50 rounded-lg">
      <h2 class="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Profile Information</h2>
      
      <!-- Grid of profile attributes -->
      <div class="grid grid-cols-2 gap-4">
        <div v-if="profile?.age" class="flex items-center">
          <!-- Age content -->
        </div>

        <div v-if="profile?.gender" class="flex items-center">
          <!-- Gender content -->
        </div>

        <!-- Other profile fields -->
      </div>

      <div v-if="profile?.gmail" class="mt-4 pt-4 border-t">
        <div class="flex items-center">
          <span class="w-5 h-5 mr-2 text-[#2f4a71]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </span>
          <div>
            <p class="text-xs text-gray-500">Email</p>
            <p class="font-medium">{{ profile.gmail }}</p>
          </div>
        </div>
      </div>
      
      <!-- Change Password Section -->
      <div class="mt-4 pt-4 border-t">
        <ChangePassword v-if="profile" :profile="profile" />
      </div>
    </div>

    <!-- Loading and Error States -->
    <div v-if="loading" class="mt-4 p-4 bg-[#f8f4ff]/60 rounded-lg text-center">
      <p class="text-[#2f4a71]">Loading profile information...</p>
    </div>

    <div v-if="error" class="mt-4 p-4 bg-red-50 rounded-lg">
      <p class="text-red-600">{{ error }}</p>
      <button @click="retryFetch" class="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200">
        Retry
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useProfile } from '~/composables/useProfile'
import ChangePassword from '~/components/shared/parts/changePassword.vue'

const { profile, loading, error, fetchProfile } = useProfile()

// Simplified logic, pass profile to ChangePassword
const retryFetch = () => { 
  fetchProfile()
}

onMounted(() => {
  fetchProfile()
})
</script>