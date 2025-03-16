// composables/useProfile.ts
import { ref, onMounted } from 'vue'

export function useProfile() {
  const profile = ref(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function fetchProfile() {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await fetch('http://localhost:3001/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed')
        }
        throw new Error('Failed to fetch profile')
      }

      profile.value = await response.json()
    } catch (err) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = String(err)
      }
      console.error('Profile fetch error:', err)
    } finally {
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