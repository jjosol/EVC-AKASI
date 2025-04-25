// composables/useProfile.ts
import { ref } from 'vue'

// Define types for patient and nurse profiles
type PatientProfile = {
  type: 'patient';
  patient_id: number;
  username: string;
  name: string;
  gmail: string;
  age: number;
  gender: string;
  type_str: string;  // 'student', 'faculty', 'staff', 'other'
  civil_status: string; // 'single', 'married', 'widowed', 'separated'
  address: string;
  division?: string;
  position?: string;
  grade?: number | null;
  section?: string;
  category?: string; // 'Intern', 'Extern'
}

type NurseProfile = {
  type: 'nurse';
  nurse_id: number;
  username: string;
  name: string;
  gmail: string;
}

type DoctorProfile = {
  type: 'doctor';
  doctor_id: number;
  username: string;
  name: string;
  gmail: string;
}

// Union type for profiles
type Profile = PatientProfile | NurseProfile | DoctorProfile;

export function useProfile() {
  const profile = ref<Profile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isNurse = ref(false)
  const isDoctor = ref(false)
  const isPatient = ref(false)

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
          if (role === 'nurse') {
            profile.value = createMockNurseProfile()
            isNurse.value = true
            isDoctor.value = false
            isPatient.value = false
          } else if (role === 'doctor') {
            profile.value = createMockDoctorProfile()
            isNurse.value = false
            isDoctor.value = true
            isPatient.value = false
          } else {
            profile.value = createMockPatientProfile()
            isNurse.value = false
            isDoctor.value = false
            isPatient.value = true
          }
          console.log('Created mock profile:', profile.value)
          return profile.value
        }
        throw new Error('No authentication token found')
      }

      // Use a single endpoint for profiles
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
            const role = localStorage.getItem('userRole') || 'patient'
            if (role === 'nurse') {
              profile.value = createMockNurseProfile()
              isNurse.value = true
              isDoctor.value = false
              isPatient.value = false
            } else if (role === 'doctor') {
              profile.value = createMockDoctorProfile()
              isNurse.value = false
              isDoctor.value = true
              isPatient.value = false
            } else {
              profile.value = createMockPatientProfile()
              isNurse.value = false
              isDoctor.value = false
              isPatient.value = true
            }
            console.log('Created mock profile after auth error:', profile.value)
            return profile.value
          }

          if (response.status === 401) {
            throw new Error('Authentication failed')
          }
          throw new Error(`Failed to fetch profile: ${response.status}`)
        }

        const userData = await response.json()
        console.log('API response userData:', userData)

        // Determine the profile type based on the data received
        if (userData.nurse_id !== undefined) {
          // This is a nurse profile
          profile.value = {
            type: 'nurse',
            nurse_id: userData.nurse_id,
            username: userData.username,
            name: userData.name,
            gmail: userData.gmail
          }
          isNurse.value = true
          isDoctor.value = false
          isPatient.value = false
          localStorage.setItem('userRole', 'nurse')
          console.log('Processed nurse profile:', profile.value)
        } else if (userData.doctor_id !== undefined) {
          // This is a doctor profile
          profile.value = {
            type: 'doctor',
            doctor_id: userData.doctor_id,
            username: userData.username,
            name: userData.name,
            gmail: userData.gmail
          }
          isNurse.value = false
          isDoctor.value = true
          isPatient.value = false
          localStorage.setItem('userRole', 'doctor')
          console.log('Processed doctor profile:', profile.value)
        } else if (userData.patient_id !== undefined) {
          // This is a patient profile
          profile.value = {
            type: 'patient',
            patient_id: userData.patient_id,
            username: userData.username,
            name: userData.name,
            gmail: userData.gmail,
            age: userData.age,
            gender: userData.gender,
            type_str: userData.type, // Store the type as type_str to avoid conflict with union type
            civil_status: userData.civil_status,
            address: userData.address,
            division: userData.division,
            position: userData.position,
            grade: userData.grade,
            section: userData.section,
            category: userData.category
          }
          isNurse.value = false
          isDoctor.value = false
          isPatient.value = true
          localStorage.setItem('userRole', 'patient')
          console.log('Processed patient profile:', profile.value)
        } else {
          // Cannot determine the profile type
          throw new Error('Unknown profile type received')
        }

        return profile.value
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Profile fetch error, using mock profile for development')
          const role = localStorage.getItem('userRole') || 'patient'
          if (role === 'nurse') {
            profile.value = createMockNurseProfile()
            isNurse.value = true
            isDoctor.value = false
            isPatient.value = false
          } else if (role === 'doctor') {
            profile.value = createMockDoctorProfile()
            isNurse.value = false
            isDoctor.value = true
            isPatient.value = false
          } else {
            profile.value = createMockPatientProfile()
            isNurse.value = false
            isDoctor.value = false
            isPatient.value = true
          }
          console.log('Created mock profile after fetch error:', profile.value)
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
        const role = localStorage.getItem('userRole') || 'patient'
        if (role === 'nurse') {
          profile.value = createMockNurseProfile()
          isNurse.value = true
          isDoctor.value = false
          isPatient.value = false
        } else if (role === 'doctor') {
          profile.value = createMockDoctorProfile()
          isNurse.value = false
          isDoctor.value = true
          isPatient.value = false
        } else {
          profile.value = createMockPatientProfile()
          isNurse.value = false
          isDoctor.value = false
          isPatient.value = true
        }
        console.log('Created mock profile after general error:', profile.value)
        return profile.value
      }
      return null
    } finally {
      loading.value = false
    }
  }

  // Helper function to create a mock patient profile for development
  function createMockPatientProfile(): PatientProfile {
    return {
      type: 'patient',
      patient_id: 1,
      username: 'test_user',
      name: 'Test User',
      gmail: 'test@example.com',
      age: 15,
      gender: 'Male',
      type_str: 'student',
      civil_status: 'single',
      address: '123 Test Street',
      division: 'Main',
      position: 'student',
      grade: 9,
      section: 'A',
      category: 'Extern'
    }
  }

  // Helper function to create a mock nurse profile
  function createMockNurseProfile(): NurseProfile {
    return {
      type: 'nurse',
      nurse_id: 1,
      name: 'Nurse User',
      username: 'nurse_user',
      gmail: 'nurse@example.com'
    }
  }

  // Helper function to create a mock doctor profile
  function createMockDoctorProfile(): DoctorProfile {
    return {
      type: 'doctor',
      doctor_id: 1,
      name: 'Doctor User',
      username: 'doctor_user',
      gmail: 'doctor@example.com'
    }
  }

  return {
    profile,
    loading,
    error,
    isNurse,
    isDoctor,
    isPatient,
    fetchProfile
  }
}