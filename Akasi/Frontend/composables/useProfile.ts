// composables/useProfile.ts
import { ref, onMounted } from 'vue'

export function useProfile() {
  const profile = ref(null)
  const loading = ref(true)
  const error = ref(null)

  async function fetchProfile() {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      
      profile.value = await response.json()
      loading.value = false
    } catch (err) {
      error.value = err.message
      loading.value = false
    }
  }

  return {
    profile,
    loading,
    error,
    fetchProfile
  }
}