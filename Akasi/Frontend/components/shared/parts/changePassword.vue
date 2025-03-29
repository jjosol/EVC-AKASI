<template>
  <div>
    <!-- Change Password Link -->
    <div class="text-right">
      <a 
        href="#" 
        @click.prevent="showPasswordModal = true" 
        class="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors duration-200"
      >
        Change Password
      </a>
    </div>
    
    <!-- Password Modal -->
    <div v-if="showPasswordModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium">Change Password</h3>
          <button @click="showPasswordModal = false" class="text-gray-500 hover:text-gray-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <!-- Password Form -->
        <form @submit.prevent="changePassword">
          <!-- Current Password -->
          <div class="mb-4">
            <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input 
              type="password" 
              id="currentPassword" 
              v-model="passwordForm.currentPassword"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <!-- New Password -->
          <div class="mb-4">
            <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input 
              type="password" 
              id="newPassword" 
              v-model="passwordForm.newPassword"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <!-- Confirm Password -->
          <div class="mb-4">
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="passwordForm.confirmPassword"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <!-- Error message -->
          <div v-if="passwordError" class="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {{ passwordError }}
          </div>
          
          <!-- Success message -->
          <div v-if="passwordSuccess" class="mb-4 p-3 bg-green-50 text-green-600 rounded-md text-sm">
            {{ passwordSuccess }}
          </div>
          
          <!-- Form buttons -->
          <div class="flex justify-end space-x-3">
            <button 
              type="button" 
              @click="showPasswordModal = false"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button 
              type="submit"
              :disabled="passwordLoading || !isFormValid"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="passwordLoading">Updating...</span>
              <span v-else>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineProps } from 'vue'

// Enable debug mode in development
const DEBUG_MODE = true;

// Get profile from parent component
const props = defineProps({
  profile: {
    type: Object,
    default: () => ({})
  }
});

// Password change state
const showPasswordModal = ref(false)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordLoading = ref(false)
const passwordError = ref('')
const passwordSuccess = ref('')

// Reactive auth information
const userType = ref(null);
const userId = ref(null);

// Validate form
const isFormValid = computed(() => {
  return userId.value && 
         userType.value && 
         passwordForm.value.currentPassword && 
         passwordForm.value.newPassword && 
         passwordForm.value.confirmPassword;
});

// DIRECT backend URL - no proxying
const BACKEND_URL = 'http://localhost:3001';

// Build API endpoint
const apiEndpoint = computed(() => {
  if (!userType.value || !userId.value) return null;
  return `${BACKEND_URL}/change-password/${userType.value}/${userId.value}`;
});

// Use profile data to determine user type and ID
onMounted(() => {
  updateUserInfo();
});

// Function to determine user type and ID from different sources
function updateUserInfo() {
  console.log("Updating user info from available sources");
  
  // Try getting data from profile prop first
  if (props.profile) {
    console.log("Checking profile data:", props.profile);
    
    if (props.profile.admin_id) {
      userType.value = 'admin';
      userId.value = props.profile.admin_id;
      console.log(`Found admin_id in profile: ${userId.value}`);
      return;
    } 
    else if (props.profile.client_id) {
      userType.value = 'client';
      userId.value = props.profile.client_id;
      console.log(`Found client_id in profile: ${userId.value}`);
      return;
    }
    else if (props.profile.role) {
      userType.value = props.profile.role.toLowerCase();
      userId.value = props.profile.id;
      console.log(`Using role and id from profile: ${userType.value}, ${userId.value}`);
      return;
    }
  }
  
  // Try local storage
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      console.log("User data from localStorage:", userData);
      
      if (userData.admin_id) {
        userType.value = 'admin';
        userId.value = userData.admin_id;
      } 
      else if (userData.client_id) {
        userType.value = 'client';
        userId.value = userData.client_id;
      }
      else if (userData.role) {
        userType.value = userData.role.toLowerCase();
        userId.value = userData.id;
      }
      
      if (userType.value && userId.value) {
        console.log(`Found user info in localStorage: ${userType.value}, ${userId.value}`);
        return;
      }
    }
  } catch (e) {
    console.error("Error reading localStorage:", e);
  }
  
  // If we get here, we weren't able to determine the user type and ID
  console.warn("Could not determine user type and ID");
}

async function changePassword() {
  // Reset status
  passwordError.value = ''
  passwordSuccess.value = ''
  
  // Validation
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'New passwords do not match'
    return
  }
  
  if (passwordForm.value.newPassword.length < 8) {
    passwordError.value = 'New password must be at least 8 characters long'
    return
  }
  
  // Try to update user info if not available
  if (!userId.value || !userType.value) {
    updateUserInfo();
    
    if (!userId.value || !userType.value) {
      // Special handling for Akasi's expected profile structure
      if (props.profile) {
        // Try to extract info from profile based on structure
        if (props.profile.role && props.profile.role.toLowerCase() === 'admin') {
          userType.value = 'admin';
          // Try to find admin_id in various potential locations
          userId.value = props.profile.admin_id || props.profile.id || props.profile.userId;
        } else {
          userType.value = 'client';
          userId.value = props.profile.client_id || props.profile.id || props.profile.userId;
        }
        
        console.log("Extracted from profile as fallback:", userType.value, userId.value);
      }
      
      if (!userId.value || !userType.value) {
        passwordError.value = 'Could not determine your user information. Please refresh the page or log out and log in again.';
        return;
      }
    }
  }
  
  try {
    passwordLoading.value = true
    
    // Get authorization token
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authorization token found. Please log in again.');
    }

    console.log(`Making direct request to: ${apiEndpoint.value}`);
    
    const response = await fetch(apiEndpoint.value, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        // Add CORS headers
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword
      }),
      // Enable credentials for CORS
      credentials: 'include'
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `Error: ${response.status}`;
      } catch (e) {
        errorMessage = `Request failed with status ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    passwordSuccess.value = data.message || 'Password updated successfully';
    
    // Reset form and close modal
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    
    setTimeout(() => {
      showPasswordModal.value = false;
      passwordSuccess.value = '';
    }, 2000);

  } catch (error) {
    passwordError.value = error.message;
    console.error('Password change failed:', error);
  } finally {
    passwordLoading.value = false;
  }
}
</script>