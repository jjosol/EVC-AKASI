<template>
  <div>
    <button
      @click="handleLogoutClick"
      class="flex items-center justify-center px-6 py-3 text-lg font-medium text-white transition-all duration-300 ease-in-out bg-[#2F4A71] hover:bg-[#745dab] rounded-full shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
      :disabled="isLoading"
    >
      <Icon 
        v-if="isLoading" 
        icon="mdi:loading" 
        class="w-5 h-5 mr-2 animate-spin" 
      />
      <Icon 
        v-else 
        icon="mdi:logout" 
        class="w-5 h-5 mr-2" 
      />
      {{ isLoading ? 'Logging out...' : 'Logout' }}
    </button>

    <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
      <div class="text-center px-8 py-6 bg-white rounded-xl shadow-xl">
        <Icon 
          icon="mdi:loading" 
          class="w-12 h-12 mb-4 text-[#745dab] animate-spin"
        />
        <p class="text-lg font-medium text-gray-800">Logging out...</p>
        <p class="text-sm text-gray-600 mt-2">Please wait a moment</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { handleLogout } = useAuth()
const isLoading = ref(false)

const handleLogoutClick = async () => {
  isLoading.value = true
  try {
    const token = localStorage.getItem('token')
    if (token) {
      await fetch('http://localhost:3001/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    }
    localStorage.removeItem('token') // Remove token after successful API call
    handleLogout() // Call handleLogout to clear state and redirect
  } catch (error) {
    console.error('Logout error:', error)
    localStorage.removeItem('token') // Ensure token is removed even on error
    handleLogout() // Still call handleLogout to clear state and redirect
  } finally {
    isLoading.value = false // Ensure isLoading is always reset
  }
}
</script>