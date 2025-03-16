<template>
  <div>
    <button
      @click="handleLogoutClick"
      class="px-5 py-3 text-xl text-center rounded-full text-[#2F4A71] hover:bg-blue-900 hover:text-white"
      :disabled="isLoading"
    >
      {{ isLoading ? 'Logging out...' : 'Logout' }}
    </button>

    <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center bg-white/80">
      <div class="text-center">
        <Icon 
          icon="mdi:loading" 
          class="w-8 h-8 mb-4 text-gray-600 animate-spin"
        />
        <p class="text-gray-600">Logging out...</p>
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