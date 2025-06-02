<template>
  <div class="p-6 bg-white rounded-lg shadow">
    <h2 class="mb-6 text-2xl font-bold text-[#2f4a71]">Uploads Management</h2>

    <!-- School Year Selection Section -->
    <div class="mb-6">
      <div class="flex items-center mb-4">
        <label for="schoolYear" class="block mr-3 text-sm font-medium text-gray-700">School Year:</label>
        <select 
          id="schoolYear" 
          v-model="selectedSchoolYear"
          class="w-48 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2f4a71]"
          :disabled="isLoading"
        >
          <option v-for="year in schoolYears" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
        <span 
          v-if="selectedSchoolYear === currentSchoolYear"
          class="px-2 py-1 ml-3 text-xs font-medium text-green-800 bg-green-100 rounded-full"
        >
          Active
        </span>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="flex items-center justify-center py-4">
        <div class="w-6 h-6 border-b-2 border-gray-600 rounded-full animate-spin"></div>
        <span class="ml-2 text-gray-600">Loading...</span>
      </div>
    </div>

    <!-- Actions Section -->
    <div class="flex flex-wrap gap-4 mb-8">
      <!-- Delete Button -->
      <button 
        @click="confirmDelete" 
        class="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        :disabled="isLoading || !selectedSchoolYear"
      >
        <span class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Contents
        </span>
      </button>

      <!-- Create New School Year Button -->
      <button 
        @click="createNewSchoolYear" 
        class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        :disabled="isLoading"
      >
        <span class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New School Year
        </span>
      </button>

      <!-- Set Active School Year Button -->
      <button 
        @click="setActiveSchoolYear" 
        class="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        :disabled="isLoading || !selectedSchoolYear || selectedSchoolYear === currentSchoolYear"
      >
        <span class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Use School Year
        </span>
      </button>
    </div>

    <!-- School Year Information -->
    <div v-if="selectedSchoolYear" class="p-4 bg-gray-50 rounded-lg">
      <h3 class="mb-2 text-lg font-semibold text-gray-700">{{ selectedSchoolYear }}</h3>
      
      <div class="mb-2 text-sm text-gray-600">
        <span v-if="selectedSchoolYear === currentSchoolYear" class="font-medium text-green-600">
          This is the current active school year. All new uploads will be saved to this folder.
        </span>
        <span v-else class="font-medium text-blue-600">
          Select "Use School Year" to make this the active folder for all new uploads.
        </span>
      </div>
      
      <div class="text-sm text-gray-600">
        <p>School year folders contain all uploads organized by category:</p>
        <ul class="pl-5 mt-2 list-disc">
          <li>Medical certificates</li>
          <li>Dental certificates</li>
          <li>Ophthalmological certificates</li>
          <li>Physical examination records</li>
          <li>Laboratory results</li>
          <li>Bulletin files</li>
          <li>Prescriptions</li>
          <li>Other documents</li>
        </ul>
      </div>
    </div>

    <!-- Deletion Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-10 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>

        <div class="z-20 w-full max-w-md p-6 overflow-hidden transition-all transform bg-white rounded-lg shadow-xl">
          <div class="mb-4 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <h3 class="mt-2 text-lg font-medium text-gray-900">Confirm Deletion</h3>
          </div>
          <p class="mb-6 text-sm text-gray-600">
            Are you sure you want to delete all contents of the <strong>{{ selectedSchoolYear }}</strong> school year folder? This action cannot be undone.
          </p>
          <div class="flex justify-end space-x-3">
            <button 
              @click="showDeleteModal = false" 
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button 
              @click="deleteSchoolYearContents" 
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              :disabled="isDeleting"
            >
              <span v-if="isDeleting" class="flex items-center">
                <div class="w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin"></div>
                Deleting...
              </span>
              <span v-else>Delete Contents</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Message Notification -->
    <div 
      v-if="notification.show" 
      :class="[
        'fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 transition-opacity',
        notification.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' :
        notification.type === 'error' ? 'bg-red-100 text-red-800 border-l-4 border-red-500' : 
        'bg-blue-100 text-blue-800 border-l-4 border-blue-500'
      ]"
    >
      <div class="flex">
        <div class="flex-shrink-0">
          <svg 
            v-if="notification.type === 'success'" 
            class="w-5 h-5 text-green-500" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <svg 
            v-else-if="notification.type === 'error'" 
            class="w-5 h-5 text-red-500" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <svg 
            v-else 
            class="w-5 h-5 text-blue-500" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">{{ notification.message }}</p>
        </div>
        <div class="pl-3 ml-auto">
          <button 
            @click="notification.show = false"
            class="inline-flex text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { getApiUrl } from '../../../../config/api';

// State variables
const schoolYears = ref([]);
const selectedSchoolYear = ref('');
const currentSchoolYear = ref('');
const isLoading = ref(false);
const isDeleting = ref(false);
const showDeleteModal = ref(false);
const notification = ref({
  show: false,
  message: '',
  type: 'info', // 'success', 'error', 'info'
});

// Fetch school years from the backend
const fetchSchoolYears = async () => {
  isLoading.value = true;
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Authentication failed. Please log in again.', 'error');
      return;
    }
    
    const response = await fetch(getApiUrl('/storage/school-years'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch school years: ${response.statusText}`);
    }

    const data = await response.json();
    schoolYears.value = data.schoolYears || [];
    currentSchoolYear.value = data.currentYear || '';
    
    // If no school year is selected yet, select the current one
    if (!selectedSchoolYear.value && data.currentYear) {
      selectedSchoolYear.value = data.currentYear;
    }
  } catch (error) {
    console.error('Error fetching school years:', error);
    showNotification(`Error: ${error.message}`, 'error');
  } finally {
    isLoading.value = false;
  }
};

// Create a new school year folder
const createNewSchoolYear = async () => {
  isLoading.value = true;
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Authentication failed. Please log in again.', 'error');
      return;
    }
    
    const response = await fetch(getApiUrl('/storage/school-years/new'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to create new school year: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success && data.newSchoolYear) {
      // Add the new school year to the list if it's not already there
      if (!schoolYears.value.includes(data.newSchoolYear)) {
        schoolYears.value.unshift(data.newSchoolYear); // Add to the beginning
      }
      
      showNotification(`Created new school year folder: ${data.newSchoolYear}`, 'success');
    } else {
      throw new Error('Failed to create new school year folder.');
    }
  } catch (error) {
    console.error('Error creating new school year:', error);
    showNotification(`Error: ${error.message}`, 'error');
  } finally {
    isLoading.value = false;
  }
};

// Set the active school year
const setActiveSchoolYear = async () => {
  if (!selectedSchoolYear.value || selectedSchoolYear.value === currentSchoolYear.value) {
    return;
  }
  
  isLoading.value = true;
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Authentication failed. Please log in again.', 'error');
      return;
    }

    const response = await fetch(getApiUrl('/storage/school-years/set-active'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ schoolYear: selectedSchoolYear.value })
    });

    if (!response.ok) {
      throw new Error(`Failed to set active school year: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      currentSchoolYear.value = selectedSchoolYear.value;
      showNotification(`School year ${selectedSchoolYear.value} is now active for all uploads`, 'success');
    } else {
      throw new Error(data.message || 'Failed to set active school year');
    }
  } catch (error) {
    console.error('Error setting active school year:', error);
    showNotification(`Error: ${error.message}`, 'error');
  } finally {
    isLoading.value = false;
  }
};

// Show deletion confirmation modal
const confirmDelete = () => {
  if (selectedSchoolYear.value) {
    showDeleteModal.value = true;
  }
};

// Delete school year folder contents
const deleteSchoolYearContents = async () => {
  if (!selectedSchoolYear.value) {
    showDeleteModal.value = false;
    return;
  }
  
  isDeleting.value = true;
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('Authentication failed. Please log in again.', 'error');
      showDeleteModal.value = false;
      return;
    }

    const response = await fetch(getApiUrl(`/storage/school-years/clear/${encodeURIComponent(selectedSchoolYear.value)}`), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete school year contents: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      showNotification(`Successfully deleted contents of school year folder ${selectedSchoolYear.value}`, 'success');
    } else {
      throw new Error(data.message || 'Failed to delete school year contents');
    }
  } catch (error) {
    console.error('Error deleting school year contents:', error);
    showNotification(`Error: ${error.message}`, 'error');
  } finally {
    isDeleting.value = false;
    showDeleteModal.value = false;
  }
};

// Helper function to show notifications
const showNotification = (message, type = 'info') => {
  notification.value = {
    show: true,
    message,
    type
  };
  
  // Auto-hide notification after 5 seconds
  setTimeout(() => {
    notification.value.show = false;
  }, 5000);
};

// Lifecycle hooks
onMounted(async () => {
  await fetchSchoolYears();
});

// Watch for changes in selected school year
watch(selectedSchoolYear, (newValue) => {
  console.log(`Selected school year changed to: ${newValue}`);
});
</script>
