<template>
  <div class="flex flex-col p-8 bg-white border border-gray-200 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
    <!-- Profile Header with Avatar and Logout Button -->
    <div class="flex items-center justify-between mb-8">
      <!-- Avatar and Name Section -->
      <div class="flex items-center">
        <div class="flex-shrink-0 w-20 h-20 mr-5 overflow-hidden bg-gradient-to-br from-[#f8f4ff] to-[#e9deff] rounded-full flex items-center justify-center border-3 border-[#745dab] shadow-md transform hover:scale-105 transition-transform duration-300">
          <span class="text-3xl font-bold text-[#745dab]">{{ profile?.name?.charAt(0) || '?' }}</span>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1">{{ profile?.name || 'Loading...' }}</h1>
          <p class="text-sm bg-[#2f4a71]/10 text-[#2f4a71] font-medium px-3 py-1 rounded-full inline-block">
            {{ getUserTypeOrCategory }}
          </p>
        </div>
      </div>
      
      <!-- Logout Button -->
      <div class="flex-shrink-0">
        <Logout />
      </div>
    </div>

    <!-- Profile Information -->
    <div class="p-6 bg-gray-50 rounded-xl shadow-inner">
      <h2 class="text-lg font-semibold text-[#2f4a71] mb-4 border-b border-gray-200 pb-2 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Profile Information
      </h2>
      
      <!-- Grid of profile attributes -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-if="profile?.age" class="flex items-center p-3 rounded-lg hover:bg-white transition-colors duration-200">
          <div class="w-10 h-10 bg-[#f8f4ff] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#745dab]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-xs text-gray-500">Age</p>
            <p class="font-medium text-gray-800">{{ profile.age }}</p>
          </div>
        </div>

        <div v-if="profile?.gender" class="flex items-center p-3 rounded-lg hover:bg-white transition-colors duration-200">
          <div class="w-10 h-10 bg-[#f8f4ff] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#745dab]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p class="text-xs text-gray-500">Gender</p>
            <p class="font-medium text-gray-800">{{ profile.gender }}</p>
          </div>
        </div>

        <!-- Grade field for students -->
        <div
          v-if="profile?.category && profile.category.toLowerCase() === 'student' && profile?.grade"
          class="flex items-center p-3 rounded-lg hover:bg-white transition-colors duration-200"
        >
          <div class="w-10 h-10 bg-[#f8f4ff] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#745dab]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p class="text-xs text-gray-500">Grade</p>
            <p class="font-medium text-gray-800">{{ profile.grade }}</p>
          </div>
        </div>

        <!-- Section/Department field for clients -->
        <div v-if="profile?.section" class="flex items-center p-3 rounded-lg hover:bg-white transition-colors duration-200">
          <div class="w-10 h-10 bg-[#f8f4ff] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#745dab]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p class="text-xs text-gray-500">{{ profile.category && profile.category.toLowerCase() === 'student' ? 'Section' : 'Department' }}</p>
            <p class="font-medium text-gray-800">{{ profile.section }}</p>
          </div>
        </div>
        
        <!-- Email section -->
        <div v-if="profile?.gmail" class="flex items-center p-3 rounded-lg hover:bg-white transition-colors duration-200">
          <div class="w-10 h-10 bg-[#f8f4ff] rounded-full flex items-center justify-center mr-3 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-[#745dab]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p class="text-xs text-gray-500">Email</p>
            <p class="font-medium text-gray-800">{{ profile.gmail }}</p>
          </div>
        </div>
      </div>
      
      <!-- Change Password Section -->
      <div class="mt-6 pt-4 border-t border-gray-200">
        <h3 class="text-md font-semibold text-[#2f4a71] mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Security
        </h3>
        <ChangePassword v-if="profile" :profile="profile" class="mt-2" />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="mt-6 p-4 bg-[#f8f4ff]/60 rounded-xl text-center animate-pulse">
      <div class="flex items-center justify-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-[#745dab]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-[#2f4a71] font-medium">Loading profile information...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="mt-6 p-4 bg-red-50 rounded-xl border border-red-100">
      <div class="flex items-start">
        <svg class="h-6 w-6 text-red-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p class="text-red-700 font-medium">{{ error }}</p>
          <button 
            @click="retryFetch" 
            class="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 flex items-center"
          >
            <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- Modify the computed property to handle doctor type -->
<script setup>
import { onMounted, computed } from 'vue'
import { useProfile } from '~/composables/useProfile'
import ChangePassword from '~/components/shared/parts/changePassword.vue'
import Logout from '~/components/shared/parts/logout.vue'

const { profile, loading, error, fetchProfile } = useProfile()

// Computed property to determine what to display below the name
const getUserTypeOrCategory = computed(() => {
  if (!profile.value || typeof profile.value !== 'object') {
    return 'User';
  }
  
  // If user is nurse, display "nurse"
  if (profile.value.type === 'nurse') {
    return 'Nurse';
  }
  // If user is doctor, display "doctor"
  else if (profile.value.type === 'doctor') {
    return 'Doctor';
  }
  // For patients, display their category
  else if (profile.value.type === 'patient') {
    return profile.value.category || 'Patient'; // Student, Faculty, Staff, etc.
  }
  
  // Fallback to type or just "User"
  return profile.value.type || 'User';
});

const retryFetch = () => { 
  fetchProfile()
}

onMounted(() => {
  fetchProfile()
})
</script>