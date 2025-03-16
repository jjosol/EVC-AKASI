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
      
      <div class="grid grid-cols-2 gap-4">
        <div v-if="profile?.age" class="flex items-center">
          <span class="w-5 h-5 mr-2 text-[#2f4a71]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
          <div>
            <p class="text-xs text-gray-500">Age</p>
            <p class="font-medium">{{ profile.age }} years</p>
          </div>
        </div>

        <div v-if="profile?.gender" class="flex items-center">
          <span class="w-5 h-5 mr-2 text-[#2f4a71]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </span>
          <div>
            <p class="text-xs text-gray-500">Gender</p>
            <p class="font-medium">{{ profile.gender }}</p>
          </div>
        </div>

        <div v-if="profile?.grade" class="flex items-center">
          <span class="w-5 h-5 mr-2 text-[#2f4a71]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          </span>
          <div>
            <p class="text-xs text-gray-500">Grade</p>
            <p class="font-medium">{{ profile.grade }}</p>
          </div>
        </div>

        <div v-if="profile?.section" class="flex items-center">
          <span class="w-5 h-5 mr-2 text-[#2f4a71]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </span>
          <div>
            <p class="text-xs text-gray-500">Section</p>
            <p class="font-medium">{{ profile.section }}</p>
          </div>
        </div>
      </div>

      <div v-if="profile?.email" class="mt-4 pt-4 border-t">
        <div class="flex items-center">
          <span class="w-5 h-5 mr-2 text-[#2f4a71]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </span>
          <div>
            <p class="text-xs text-gray-500">Email</p>
            <p class="font-medium">{{ profile.email }}</p>
          </div>
        </div>
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
import { computed, onMounted } from 'vue'
import { useProfile } from '~/composables/useProfile'

const { profile, loading, error, fetchProfile } = useProfile()

const retryFetch = () => { 
  fetchProfile()
}

onMounted(() => {
  fetchProfile()
})
</script>