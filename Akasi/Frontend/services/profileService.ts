/**
 * Fetches the user profile based on the provided JWT token.
 * Returns profile data for one of three possible roles: nurse, doctor, or patient.
 * 
 * @param {string} token - JWT authentication token
 * @returns {Promise<object>} Profile data with type field indicating the role
 */
export async function fetchUserProfile(token: string) {
    try {
      const response = await fetch('http://localhost:3001/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed');
        }
        throw new Error('Failed to fetch profile');
      }
  
      const profile = await response.json();
      
      // Ensure the profile has a type property to indicate role
      // This is used throughout the app to handle role-specific logic
      if (!profile.type && profile.nurse_id) {
        profile.type = 'nurse';
      } else if (!profile.type && profile.doctor_id) {
        profile.type = 'doctor';
      } else if (!profile.type && profile.patient_id) {
        profile.type = 'patient';
      }
      
      return profile;
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  }

/**
 * Fetches the profile of a specific patient by ID
 * Requires authentication token with sufficient permissions
 * 
 * @param {number} patientId - ID of the patient
 * @param {string} token - JWT authentication token
 * @returns {Promise<object>} Patient profile data
 */
export async function fetchPatientProfile(patientId: number, token: string) {
  try {
    const response = await fetch(`http://localhost:3001/patient/${patientId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch patient profile');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching patient ${patientId} profile:`, error);
    throw error;
  }
}

/**
 * Updates the user's own profile
 * 
 * @param {string} token - JWT authentication token
 * @param {object} data - Profile data to update
 * @returns {Promise<object>} Updated profile data
 */
export async function updateProfile(token: string, data: any) {
  try {
    const response = await fetch('http://localhost:3001/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
}