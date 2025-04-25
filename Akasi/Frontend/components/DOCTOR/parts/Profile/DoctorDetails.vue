<template>
  <div class="mt-8 doctor-profile">
    <div class="p-6 bg-white rounded-lg shadow-lg">
      <h2 class="mb-6 text-2xl font-bold text-gray-800">Doctor Profile</h2>
      
      <!-- Basic Information -->
      <div class="mb-6">
        <h3 class="mb-4 text-xl font-semibold text-gray-700">Basic Information</h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p class="text-sm font-medium text-gray-500">Name</p>
            <p class="text-lg">{{ profile?.name || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Email</p>
            <p class="text-lg">{{ profile?.gmail || 'N/A' }}</p>
          </div>
        </div>
      </div>
      
      <!-- Statistics -->
      <div class="mb-6">
        <h3 class="mb-4 text-xl font-semibold text-gray-700">Dashboard</h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div class="p-4 bg-blue-50 rounded-lg">
            <p class="text-sm font-medium text-gray-500">Total Consultations</p>
            <p class="text-2xl font-bold text-blue-600">{{ stats.consultations }}</p>
          </div>
          <div class="p-4 bg-green-50 rounded-lg">
            <p class="text-sm font-medium text-gray-500">Patients Served</p>
            <p class="text-2xl font-bold text-green-600">{{ stats.patients }}</p>
          </div>
          <div class="p-4 bg-purple-50 rounded-lg">
            <p class="text-sm font-medium text-gray-500">Today's Consultations</p>
            <p class="text-2xl font-bold text-purple-600">{{ stats.today }}</p>
          </div>
        </div>
      </div>
      
      <!-- Account Management -->
      <div class="mb-6">
        <h3 class="mb-4 text-xl font-semibold text-gray-700">Account Management</h3>
        <button 
          @click="showChangePassword = !showChangePassword" 
          class="px-4 py-2 mr-2 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Change Password
        </button>
        <button 
          @click="logout" 
          class="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Logout
        </button>
      </div>
      
      <!-- Change Password Form -->
      <div v-if="showChangePassword" class="p-6 mt-4 bg-gray-100 rounded-lg">
        <h3 class="mb-4 text-lg font-semibold">Change Password</h3>
        <form @submit.prevent="changePassword" class="space-y-4">
          <div>
            <label for="current" class="block text-sm font-medium text-gray-700">Current Password</label>
            <input 
              type="password" 
              id="current" 
              v-model="passwordForm.current" 
              required 
              class="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
          </div>
          <div>
            <label for="new" class="block text-sm font-medium text-gray-700">New Password</label>
            <input 
              type="password" 
              id="new" 
              v-model="passwordForm.new" 
              required 
              class="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
          </div>
          <div>
            <label for="confirm" class="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input 
              type="password" 
              id="confirm" 
              v-model="passwordForm.confirm" 
              required 
              class="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
          </div>
          <p v-if="passwordError" class="text-sm text-red-600">{{ passwordError }}</p>
          <div class="flex justify-end">
            <button 
              @click="showChangePassword = false" 
              type="button" 
              class="px-4 py-2 mr-2 text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="px-4 py-2 text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              :disabled="isChangingPassword"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useProfile } from '~/composables/useProfile';
import { useAuth } from '~/composables/useAuth';
import * as consultationRecordService from '~/services/consultationRecordService';

const { profile, fetchProfile } = useProfile();
const { handleLogout, userRole, isDoctor } = useAuth();

// Password change functionality
const showChangePassword = ref(false);
const isChangingPassword = ref(false);
const passwordError = ref('');
const passwordForm = ref({
  current: '',
  new: '',
  confirm: ''
});

// Stats for the dashboard
const stats = ref({
  consultations: 0,
  patients: 0,
  today: 0
});

// Logout function
const logout = () => {
  if (confirm('Are you sure you want to log out?')) {
    handleLogout();
  }
};

// Function to change password
const changePassword = async () => {
  try {
    passwordError.value = '';
    isChangingPassword.value = true;
    
    if (passwordForm.value.new !== passwordForm.value.confirm) {
      passwordError.value = 'New passwords do not match';
      return;
    }
    
    // Add your actual password change API call here
    // For example:
    // await changePasswordService.change({
    //   currentPassword: passwordForm.value.current,
    //   newPassword: passwordForm.value.new
    // });
    
    showChangePassword.value = false;
    passwordForm.value = { current: '', new: '', confirm: '' };
    alert('Password has been changed successfully');
  } catch (error) {
    passwordError.value = error.message || 'Failed to change password';
  } finally {
    isChangingPassword.value = false;
  }
};

// Fetch doctor stats
const fetchDoctorStats = async () => {
  try {
    console.log("Fetching doctor stats...");
    // Simulate or fetch actual stats
    // For example:
    // const response = await consultationRecordService.getDoctorStats();
    // stats.value = response.data;
    
    // For now using placeholder data
    stats.value = {
      consultations: 152,
      patients: 87,
      today: 5
    };
    console.log("Stats fetched:", stats.value);
  } catch (error) {
    console.error('Failed to fetch doctor stats', error);
  }
};

// Log profile data for debugging
watch(() => profile.value, (newProfile) => {
  if (newProfile) {
    console.log("Doctor profile updated:", newProfile);
  }
}, { immediate: true });

// Fetch profile and stats on component mount
onMounted(async () => {
  console.log("DoctorDetails mounted, checking role:", userRole.value, "isDoctor:", isDoctor.value);
  await fetchProfile();
  fetchDoctorStats();
});
</script>

<style scoped>
.doctor-profile {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>