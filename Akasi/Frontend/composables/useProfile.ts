// composables/useProfile.ts
import { ref } from 'vue'

// Define types for client and admin profiles
type ClientProfile = {
  type: 'client';
  client_id: number;
  username: string;
  name: string;
  gmail: string;
  age: number;
  gender: string;
  category: string;
  grade: number | null;
  section: string;
}

type AdminProfile = {
  type: 'admin';
  admin_id: number;
  username: string;
  gmail: string;
}

// Union type for profiles
type Profile = ClientProfile | AdminProfile;

export function useProfile() {
  const profile = ref<Profile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isAdmin = ref(false)

  async function fetchProfile() {
    try {
      loading.value = true
      error.value = null

      const token = localStorage.getItem('token')
      if (!token) {
        // For development, provide mock data if no token exists
        if (process.env.NODE_ENV === 'development') {
          console.warn('No token found, using mock profile for development')
          // Get user role from localStorage if available
          const role = localStorage.getItem('userRole')
          profile.value = role === 'admin' ? createMockAdminProfile() : createMockProfile()
          isAdmin.value = role === 'admin'
          return profile.value
        }
        throw new Error('No authentication token found')
      }

      // Use a single endpoint for both admin and client profiles
      try {
        const response = await fetch('http://localhost:3001/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Authentication error (${response.status}), using mock profile for development`)
            const role = localStorage.getItem('userRole') || 'client'
            profile.value = role === 'admin' ? createMockAdminProfile() : createMockProfile()
            isAdmin.value = role === 'admin'
            return profile.value
          }

          if (response.status === 401) {
            throw new Error('Authentication failed')
          }
          throw new Error(`Failed to fetch profile: ${response.status}`)
        }

        const userData = await response.json()

        // Determine the profile type based on the data received
        if (userData.admin_id !== undefined) {
          // This is an admin profile
          profile.value = {
            type: 'admin',
            admin_id: userData.admin_id,
            username: userData.username,
            gmail: userData.gmail
          }
          isAdmin.value = true
          localStorage.setItem('userRole', 'admin')
        } else if (userData.client_id !== undefined) {
          // This is a client profile
          profile.value = {
            type: 'client',
            ...userData
          }
          isAdmin.value = false
          localStorage.setItem('userRole', 'client')
        } else {
          // Cannot determine the profile type
          throw new Error('Unknown profile type received')
        }

        return profile.value
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Profile fetch error, using mock profile for development')
          const role = localStorage.getItem('userRole') || 'client'
          profile.value = role === 'admin' ? createMockAdminProfile() : createMockProfile()
          isAdmin.value = role === 'admin'
          return profile.value
        }
        throw err
      }
    } catch (err) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = String(err)
      }
      console.error('Profile fetch error:', err)

      // Provide mock data in development mode
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error occurred, using mock profile based on last saved role')
        const role = localStorage.getItem('userRole') || 'client'
        profile.value = role === 'admin' ? createMockAdminProfile() : createMockProfile()
        isAdmin.value = role === 'admin'
        return profile.value
      }
      return null
    } finally {
      loading.value = false
    }
  }

  // Helper function to create a mock client profile for development
  function createMockProfile(): ClientProfile {
    return {
      type: 'client',
      client_id: 1,
      username: 'test_user',
      name: 'Test User',
      gmail: 'test@example.com',
      age: 15,
      gender: 'Male',
      category: 'Student',
      grade: 9,
      section: 'A'
    }
  }

  // Helper function to create a mock admin profile
  function createMockAdminProfile(): AdminProfile {
    return {
      type: 'admin',
      admin_id: 1,
      username: 'admin_user',
      gmail: 'admin@example.com'
    }
  }

  return {
    profile,
    loading,
    error,
    isAdmin,
    fetchProfile
  }
} 