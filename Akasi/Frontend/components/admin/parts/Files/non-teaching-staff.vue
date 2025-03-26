<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';

// Initialize state
const staff = ref([]);
const filteredFaculty = ref([]);
const loading = ref(false);
const error = ref(null);
const debugInfo = ref('');

// Filter state
const showPendingOnly = ref(false);
const searchQuery = ref('');

// Staff modal state
const showFacultyModal = ref(false);
const selectedFaculty = ref(null);
const facultyFiles = ref([]);
const loadingFiles = ref(false);

// File viewer modal state
const showFileViewerModal = ref(false);
const selectedFile = ref(null);
const fileLoading = ref(false);
const fileError = ref(null);

// Review modal state
const showReviewModal = ref(false);
const selectedReviewFile = ref(null);
const updateStatus = ref('');
const updateNotes = ref('');
const isSubmitting = ref(false);

// Set base API URL
const apiBaseUrl = process.env.NODE_ENV === 'production'
  ? '/api'
  : 'http://localhost:3001';

// Staff with pending files
const facultyWithPendingFiles = computed(() => {
  return staff.value.filter(staff => staff.hasPendingFiles);
});

// Apply filters to staff
const applyFilters = () => {
  let result = [...staff.value];
  
  // Filter by pending files
  if (showPendingOnly.value) {
    result = result.filter(staff => staff.hasPendingFiles);
  }
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase();
    result = result.filter(staff => 
      staff.name.toLowerCase().includes(query) || 
      staff.section.toLowerCase().includes(query)
    );
  }
  
  filteredFaculty.value = result;
};

// Watch for filter changes
watch([showPendingOnly, searchQuery], () => {
  applyFilters();
});

// Fetch staff from API
const fetchFaculty = async () => {
  loading.value = true;
  error.value = null;
  debugInfo.value = '';
  
  try {
    const possiblePaths = [
      '/api/get-clients/staff',
      'http://localhost:3001/get-clients/staff'
    ];
    
    let errorMessages = [];
    
    // Try each path in sequence
    for (const path of possiblePaths) {
      try {
        console.log(`Attempting to fetch from: ${path}`);
        const response = await fetch(path);
        debugInfo.value += `Tried ${path}: Status ${response.status}\n`;
        
        if (response.ok) {
          const result = await response.json();
          if (result && result.success) {
            // Fetch pending file information
            const token = localStorage.getItem('token');
            
            if (token) {
              const pendingResponse = await fetch(`${apiBaseUrl}/students-with-pending-files`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (pendingResponse.ok) {
                const pendingResult = await pendingResponse.json();
                const pendingFacultyIds = new Set(pendingResult.data.map(s => s.client_id));
                
                // Mark staff with pending files
                result.data.forEach(staff => {
                  staff.hasPendingFiles = pendingFacultyIds.has(staff.client_id);
                });
              }
            }
            
            staff.value = result.data;
            // Initialize filtered staff
            filteredFaculty.value = [...staff.value];
            debugInfo.value += `SUCCESS with ${path}`;
            console.log(`Successfully fetched from: ${path}`);
            loading.value = false;
            return;
          } else {
            errorMessages.push(`${path}: Response was OK but data format incorrect`);
          }
        } else {
          errorMessages.push(`${path}: Failed with status ${response.status}`);
        }
      } catch (e) {
        errorMessages.push(`${path}: ${e.message}`);
      }
    }
    
    // If we reach here, all attempts failed
    throw new Error(`All API attempts failed:\n${errorMessages.join('\n')}`);
    
  } catch (err) {
    console.error('Error fetching staff:', err);
    error.value = err instanceof Error ? err.message : 'An unknown error occurred';
    debugInfo.value += '\n' + err.message;
  } finally {
    loading.value = false;
  }
};

// Modal functions
const openFacultyModal = (staff) => {
  selectedFaculty.value = staff;
  showFacultyModal.value = true;
  document.body.classList.add('overflow-hidden');
  fetchFacultyFiles();
  facultyFiles.value = [];
};

const closeFacultyModal = () => {
  showFacultyModal.value = false;
  selectedFaculty.value = null;
  document.body.classList.remove('overflow-hidden');
  facultyFiles.value = [];
};

// Fetch staff files for selected grade
const fetchFacultyFiles = async () => {
  if (!selectedFaculty.value) return;
  
  loadingFiles.value = true;
  facultyFiles.value = [];
  const clientId = selectedFaculty.value.client_id;
  
  try {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    // Make sure to include the token with the Bearer prefix
    const response = await fetch(`${apiBaseUrl}/fetch-staff-files-admin?client_id=${clientId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      throw new Error('Unauthorized. You may not have permission to access these files or your session has expired.');
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result && result.success) {
      // Fetch file statuses from the file_status table
      const statusResponse = await fetch(`${apiBaseUrl}/fetch-file-statuses?client_id=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const statusResult = statusResponse.ok ? await statusResponse.json() : { success: false, data: [] };
      const fileStatuses = statusResult.success ? statusResult.data : [];
      
      // Merge file data with status information
      facultyFiles.value = result.data.map(file => {
        const statusInfo = fileStatuses.find(s => 
          s.file_id === file.id && s.file_type === file.type
        );
        
        return {
          ...file,
          status: statusInfo ? statusInfo.status : 'pending',
          notes: statusInfo ? statusInfo.notes : null
        };
      });
      
      console.log(`Successfully fetched ${facultyFiles.value.length} files for client ${clientId}`);
    } else {
      throw new Error('Invalid response format');
    }
  } catch (err) {
    console.error('Error fetching staff files:', err);
    // Display error to user
  } finally {
    loadingFiles.value = false;
  }
};

// Helper function to detect MIME type from file content (magic numbers)
const detectMimeType = async (blob) => {
  // Only read the first few bytes to check the file signature
  const firstBytes = await blob.slice(0, 4).arrayBuffer();
  const signature = new Uint8Array(firstBytes);
  
  // Check for PDF signature: %PDF (25 50 44 46)
  if (signature[0] === 0x25 && signature[1] === 0x50 && 
      signature[2] === 0x44 && signature[3] === 0x46) {
    return 'application/pdf';
  }
  
  // Check for PNG signature: PNG (89 50 4E 47)
  if (signature[0] === 0x89 && signature[1] === 0x50 && 
      signature[2] === 0x4E && signature[3] === 0x47) {
    return 'image/png';
  }
  
  // Check for JPEG signature: FFD8 (first 2 bytes)
  if (signature[0] === 0xFF && signature[1] === 0xD8) {
    return 'image/jpeg';
  }
  
  // Default to PDF if we can't determine the type
  return 'application/pdf';
};

// File type checking function
const isFileType = (type) => {
  if (!selectedFile.value || !selectedFile.value.mimeType) return false;
  
  const mimeType = selectedFile.value.mimeType.toLowerCase();
  
  switch (type) {
    case 'pdf':
      return mimeType === 'application/pdf';
    case 'image':
      return mimeType.startsWith('image/');
    default:
      return false;
  }
};

// Get file extension from mime type
const getFileExtension = (mimeType) => {
  if (!mimeType) return '';
  
  // Map of common mime types to their extensions
  const mimeToExt = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/bmp': 'BMP',
    'image/tiff': 'TIFF',
    'image/webp': 'WEBP'
  };
  
  return mimeToExt[mimeType.toLowerCase()] || mimeType.split('/')[1]?.toUpperCase() || '';
};

// Enhanced viewFile function with proper MIME type detection
const viewFile = async (file) => {
  try {
    fileLoading.value = true;
    fileError.value = null;
    selectedFile.value = { ...file };
    showFileViewerModal.value = true;
    document.body.classList.add('overflow-hidden');
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    // Fetch the file data from the API
    const response = await fetch(`${apiBaseUrl}/fetch-client-files-admin/file/${file.type}/${file.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 401) {
      throw new Error('Unauthorized. You may not have permission to access this file or your session has expired.');
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    // Get file content as blob
    const blob = await response.blob();
    console.log('Received blob size:', blob.size, 'type:', blob.type);
    
    // If the server doesn't provide a mime type, try to detect it from the first bytes
    let mimeType = blob.type;
    if (!mimeType || mimeType === 'application/octet-stream') {
      mimeType = await detectMimeType(blob);
    }
    
    // Create URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Update the file with URL and MIME type
    selectedFile.value = {
      ...file,
      url: url,
      mimeType: mimeType,
      size: blob.size
    };
  } catch (err) {
    console.error('Error viewing file:', err);
    fileError.value = err instanceof Error ? err.message : 'An unknown error occurred';
  } finally {
    fileLoading.value = false;
  }
};

// Download file function
const downloadFile = () => {
  if (!selectedFile.value || !selectedFile.value.url) return;
  
  // Create a hidden anchor element
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = selectedFile.value.url;
  
  // Generate a filename based on file type
  const fileType = selectedFile.value.type;
  const fileId = selectedFile.value.id;
  const extension = getFileExtension(selectedFile.value.mimeType).toLowerCase();
  
  a.download = `${fileType}_${fileId}.${extension || 'pdf'}`;
  
  // Add to document, click it, and remove it
  document.body.appendChild(a);
  a.click();
  
  // Small delay before removal to ensure download starts
  setTimeout(() => {
    document.body.removeChild(a);
  }, 100);
};

const closeFileViewerModal = () => {
  if (selectedFile.value && selectedFile.value.url) {
    // Release the blob URL to free memory
    URL.revokeObjectURL(selectedFile.value.url);
  }
  
  showFileViewerModal.value = false;
  document.body.classList.remove('overflow-hidden');
  selectedFile.value = null;
  fileError.value = null;
};

// Review modal functions
const openReviewModal = (file) => {
  selectedReviewFile.value = {
    ...file,
    clientName: selectedFaculty?.value?.name || 'Unknown',
    category: 'staff'
  };
  showReviewModal.value = true;
  updateStatus.value = file.status || 'pending';
  updateNotes.value = file.notes || '';
};

// Close review modal function
const closeReviewModal = () => {
  showReviewModal.value = false;
  selectedReviewFile.value = null;
  updateStatus.value = '';
  updateNotes.value = '';
};

// Submit review function
// This example shows how to update the UI after updating a file status

// Submit review function (from your Vue.js file)
const submitReview = async () => {
  if (!selectedReviewFile.value || !updateStatus.value) return;
  
  isSubmitting.value = true;
  
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    const fileData = {
      fileId: selectedReviewFile.value.id,
      fileType: selectedReviewFile.value.type,
      clientId: selectedFaculty.value.client_id,
      status: updateStatus.value,
      notes: updateNotes.value || null
    };

    const response = await fetch(`${apiBaseUrl}/update-file-status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fileData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update status: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result && result.success) {
      // Update the file in the UI
      const fileIndex = facultyFiles.value.findIndex(f => 
        f.id === selectedReviewFile.value.id && f.type === selectedReviewFile.value.type
      );
      
      if (fileIndex !== -1) {
        facultyFiles.value[fileIndex] = {
          ...facultyFiles.value[fileIndex],
          status: updateStatus.value,
          notes: updateNotes.value || null
        };
      }
      
      // Also update the selectedFile if it's the same file
      if (selectedFile.value && 
          selectedFile.value.id === selectedReviewFile.value.id && 
          selectedFile.value.type === selectedReviewFile.value.type) {
        selectedFile.value = {
          ...selectedFile.value,
          status: updateStatus.value,
          notes: updateNotes.value || null
        };
      }
      
      // Close the modal
      closeReviewModal();
      
      // Show success notification (you can implement a toast notification system here)
      alert('File status updated successfully');
      
      // Refresh the staff list to update the pending status (client status will be updated by the API)
      fetchFaculty();
    } else {
      throw new Error('Invalid response format');
    }
  } catch (err) {
    console.error('Error updating file status:', err);
    alert('Error updating file status: ' + (err.message || 'Unknown error'));
  } finally {
    isSubmitting.value = false;
  }
};

// Helper functions
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch (e) {
    return dateString;
  }
};

const formatFileType = (fileType) => {
  const types = {
    // Medical records
    'medical': 'Medical Certificate',
    'dental': 'Dental Certificate',
    'physical': 'Physical Examination',
    'opthal': 'Ophthalmological Certificate',
    
    // Confinement records
    'admission': 'Hospital Admission',
    'discharge': 'Discharge Summary',
    'treatment': 'Treatment Record',
    'confinement': 'Confinement Report'
  };
  
  return types[fileType] || fileType;
};  

// Add these computed properties after the other state variables
const medicalFiles = computed(() => {
  return facultyFiles.value.filter(file => 
    ['medical', 'dental', 'physical', 'opthal'].includes(file.type)
  );
});

const confinementFiles = computed(() => {
  return facultyFiles.value.filter(file => 
    ['admission', 'discharge', 'treatment', 'confinement'].includes(file.type)
  );
});

// Add activeTab state
const activeTab = ref('medicalRecords');

// Set up event listeners
onMounted(() => {
  fetchFaculty();
});

// Clean up
onUnmounted(() => {
  if (selectedFile.value && selectedFile.value.url) {
    URL.revokeObjectURL(selectedFile.value.url);
  }
});

</script>

<template>
  <NavBar/>
  <div class="staff-container">
    <ClientOnly>
      <!-- Filter Controls -->
      <div class="mb-6 p-4 bg-white rounded-lg shadow">
        <div class="flex flex-col sm:flex-row gap-3 items-center">
          <div class="w-full sm:w-1/2">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2f4a71]"
            />
          </div>
          <div class="flex items-center">
            <label class="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                v-model="showPendingOnly"
                class="form-checkbox h-4 w-4 text-[#2f4a71] border-gray-300 rounded focus:ring-[#2f4a71]"
              >
              <span class="ml-2 text-gray-700">Show only staff with pending files</span>
            </label>
          </div>
        </div>
      </div>
      
      <!-- Wrap dynamic content in ClientOnly to prevent hydration mismatches -->
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      
      <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{{ error }}</p>
      </div>
      
      <div v-else-if="filteredFaculty.length === 0" class="text-center py-8 text-gray-500">
        <p v-if="showPendingOnly">No staff with pending files found</p>
        <p v-else>No staff found</p>
      </div>
      
      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="staff in filteredFaculty" 
            :key="staff.client_id"
            class="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
            @click="openFacultyModal(staff)"
          >
            <div class="flex justify-between">
              <h3 class="font-semibold text-lg text-gray-800">{{ staff.name }}</h3>
              <span 
                v-if="staff.hasPendingFiles" 
                class="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full"
              >
                Pending
              </span>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <span class="text-gray-600 text-sm">{{ staff.section }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Debugging section -->
      <div v-if="error" class="mt-8 p-4 bg-gray-100 rounded">
        <h3 class="font-semibold">Debugging Information:</h3>
        <p>{{ debugInfo }}</p>
      </div>
    </ClientOnly>
  </div>

  <!-- Staff Detail Modal -->
  <div 
    v-if="showFacultyModal" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto"
    @click.self="closeFacultyModal"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 my-8 overflow-hidden">
      <!-- Modal Header -->
      <div class="bg-[#2f4a71] text-white p-5 flex justify-between items-center">
        <h3 class="text-xl font-bold">Staff Information</h3>
        <button @click="closeFacultyModal" class="text-white hover:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Staff Details -->
      <div class="p-6 border-b border-gray-200" v-if="selectedFaculty">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="text-sm font-medium text-gray-500">Name</h4>
            <p class="text-lg">{{ selectedFaculty.name }}</p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500">E-mail</h4>
            <p class="text-lg">{{ selectedFaculty.gmail }}</p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500">Department</h4>
            <p class="text-lg">{{ selectedFaculty.section }}</p>
          </div>
        </div>
      </div>

      <!-- Files Section with Tabs -->
        <div class="bg-white shadow-md rounded-xl overflow-hidden">
          <div class="tabs-container">
            <!-- Tab Navigation -->
            <div class="tab-nav">
              <button 
                @click="activeTab = 'medicalRecords'" 
                :class="['tab-button', activeTab === 'medicalRecords' ? 'active' : '']"
              >
                Medical Records
              </button>
              <button 
                @click="activeTab = 'confinementRecords'" 
                :class="['tab-button', activeTab === 'confinementRecords' ? 'active' : '']"
              >
                Confinement Records
              </button>
            </div>
            
            <div class="tab-content">
              <!-- Medical Records Tab -->
              <div v-if="activeTab === 'medicalRecords'" class="tab-panel">
                <!-- Files Section -->
                <div class="p-6">

                  <!-- Loading State -->
                  <div v-if="loadingFiles" class="flex justify-center py-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2f4a71]"></div>
                  </div>

                  <!-- No Files State -->
                  <div v-else-if="medicalFiles.length === 0" class="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p class="mt-3 text-gray-500">
                      {{ 'No medical records available' }}
                    </p>
                  </div>

                  <!-- Files Grid -->
                  <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- File Card with Status -->
                    <div 
                      v-for="file in medicalFiles" 
                      :key="`${file.type}-${file.id}`" 
                      class="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div class="p-4">
                        <div class="flex items-start">
                          <!-- File Type Icon -->
                          <div class="flex-shrink-0 mr-3">
                            <span 
                              :class="[
                                file.type === 'dental' ? 'bg-blue-100 text-blue-700' :
                                file.type === 'medical' ? 'bg-green-100 text-green-700' :
                                file.type === 'opthal' ? 'bg-purple-100 text-purple-700' :
                                file.type === 'physical' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-700',
                                'inline-block p-2 rounded-md'
                              ]"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </span>
                          </div>
                          
                          <!-- File Info -->
                          <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-start">
                              <h3 class="text-sm font-medium text-gray-900 truncate">{{ formatFileType(file.type) }}</h3>
                              
                              <!-- Status Badge -->
                              <span 
                                :class="[
                                  file.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  file.status === 'complete' ? 'bg-green-100 text-green-800' :
                                  file.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                                  file.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800',
                                  'px-2 py-1 text-xs rounded-full ml-2'
                                ]"
                              >
                                {{ file.status ? (file.status.charAt(0).toUpperCase() + file.status.slice(1)) : 'Pending' }}
                              </span>
                            </div>
                            <p class="text-xs text-gray-400 mt-1">
                              {{ formatDate(file.date) }}
                            </p>
                            
                            <!-- Notes (if any) -->
                            <p v-if="file.notes" class="text-xs italic text-gray-500 mt-1 truncate">
                              Note: {{ file.notes }}
                            </p>
                          </div>
                        </div>
                        
                        <!-- Actions -->
                        <div class="mt-3 flex justify-end">
                          <button 
                            @click.stop="viewFile(file)"
                            class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f4a71] mr-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          
                          <!-- Review Button -->
                          <button 
                            @click.stop="openReviewModal(file)"
                            class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-[#2f4a71] hover:bg-[#1d2e47] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f4a71]"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Review
                          </button>
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Confinement Records Tab -->
              <div v-if="activeTab === 'confinementRecords'" class="tab-panel">
                <div class="p-6">

                  <!-- Loading State -->
                  <div v-if="loadingFiles" class="flex justify-center py-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2f4a71]"></div>
                  </div>

                  <!-- No Files State -->
                  <div v-else-if="confinementFiles.length === 0" class="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p class="mt-3 text-gray-500">
                      {{'No confinement records available' }}
                    </p>
                  </div>

                  <!-- Confinement Files Grid -->
                  <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Confinement File Card with Status -->
                    <div 
                      v-for="file in confinementFiles" 
                      :key="`${file.type}-${file.id}`" 
                      class="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div class="p-4">
                        <div class="flex items-start">
                          <!-- File Type Icon -->
                          <div class="flex-shrink-0 mr-3">
                            <span 
                              :class="[
                                file.type === 'admission' ? 'bg-indigo-100 text-indigo-700' :
                                file.type === 'discharge' ? 'bg-teal-100 text-teal-700' :
                                file.type === 'treatment' ? 'bg-amber-100 text-amber-700' :
                                file.type === 'confinement' ? 'bg-rose-100 text-rose-700' :
                                'bg-gray-100 text-gray-700',
                                'inline-block p-2 rounded-md'
                              ]"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </span>
                          </div>
                          
                          <!-- File Info -->
                          <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-start">
                              <h3 class="text-sm font-medium text-gray-900 truncate">{{ formatFileType(file.type) }}</h3>
                              
                              <!-- Status Badge -->
                              <span 
                                :class="[
                                  file.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  file.status === 'complete' ? 'bg-green-100 text-green-800' :
                                  file.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                                  file.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800',
                                  'px-2 py-1 text-xs rounded-full ml-2'
                                ]"
                              >
                                {{ file.status ? (file.status.charAt(0).toUpperCase() + file.status.slice(1)) : 'Pending' }}
                              </span>
                            </div>
                            <p class="text-xs text-gray-400 mt-1">
                              {{ formatDate(file.date) }}
                            </p>
                            
                            <!-- Notes (if any) -->
                            <p v-if="file.notes" class="text-xs italic text-gray-500 mt-1 truncate">
                              Note: {{ file.notes }}
                            </p>
                          </div>
                        </div>
                        
                        <!-- Actions -->
                        <div class="mt-3 flex justify-end">
                          <button 
                            @click.stop="viewFile(file)"
                            class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f4a71] mr-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          
                          <!-- Review Button -->
                          <button 
                            @click.stop="openReviewModal(file)"
                            class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-[#2f4a71] hover:bg-[#1d2e47] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f4a71]"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Review
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

  <!-- File Viewer Modal -->
  <div 
    v-if="showFileViewerModal" 
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    @click.self="closeFileViewerModal"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 overflow-hidden h-5/6 flex flex-col">
      <!-- Viewer Header -->
      <div class="flex justify-between items-center p-4 border-b">
        <div class="flex items-center">
          <h3 class="text-lg font-medium text-gray-900">{{ selectedFile?.typeLabel || formatFileType(selectedFile?.type) }}</h3>
          <span class="ml-2 px-2 py-1 bg-gray-100 text-xs rounded">
            {{ getFileExtension(selectedFile?.mimeType) }}
          </span>
          
          <!-- Status Badge in Header -->
          <span 
            v-if="selectedFile?.status"
            :class="[
              selectedFile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              selectedFile.status === 'complete' ? 'bg-green-100 text-green-800' :
              selectedFile.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
              selectedFile.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800',
              'ml-2 px-2 py-1 text-xs rounded-full'
            ]"
          >
            {{ selectedFile.status.charAt(0).toUpperCase() + selectedFile.status.slice(1) }}
          </span>
        </div>
        <div class="flex items-center">
          <!-- Download Button -->
          <button
            v-if="selectedFile && selectedFile.url"
            @click="downloadFile"
            class="mr-3 text-gray-700 hover:text-gray-900 focus:outline-none"
            title="Download File"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          
          <!-- Review Button -->
          <button
            v-if="selectedFile"
            @click="openReviewModal(selectedFile)"
            class="mr-3 text-[#2f4a71] hover:text-[#1d2e47] focus:outline-none"
            title="Review File"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          <!-- Close Button -->
          <button 
            @click="closeFileViewerModal" 
            class="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- File Information section - notes -->
      <div v-if="selectedFile?.notes" class="px-4 py-2 bg-gray-50 border-b">
        <p class="text-sm text-gray-600">
          <span class="font-medium">Note:</span> {{ selectedFile.notes }}
        </p>
      </div>
      
      <!-- File Display -->
      <div class="flex-grow p-2 overflow-hidden">
        <!-- Loading indicator -->
        <div v-if="fileLoading" class="flex items-center justify-center h-full">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2f4a71]"></div>
        </div>
        
        <!-- File content based on type -->
        <template v-else-if="selectedFile && selectedFile.url">
          <!-- PDF Files -->
          <iframe 
            v-if="isFileType('pdf')" 
            :src="selectedFile.url" 
            class="w-full h-full border-0"
            title="PDF Viewer"
          ></iframe>
          
          <!-- Image Files (PNG, JPG, etc) -->
          <div 
            v-else-if="isFileType('image')" 
            class="flex items-center justify-center h-full bg-gray-100 overflow-auto"
          >
            <img 
              :src="selectedFile.url" 
              class="max-w-full max-h-full object-contain"
              alt="Document image"
            />
          </div>
          
          <!-- Fallback for other file types -->
          <div 
            v-else 
            class="flex flex-col items-center justify-center h-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-gray-600 mb-2">File preview not available</p>
            <button
              @click="downloadFile"
              class="px-4 py-2 bg-[#2f4a71] text-white rounded hover:bg-[#1d2e47] focus:outline-none"
            >
              Download to view
            </button>
          </div>
        </template>
        
        <!-- Error state -->
        <div v-else-if="fileError" class="flex flex-col items-center justify-center h-full text-center p-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-red-500 mb-2">Failed to load file</p>
          <p class="text-gray-500 text-sm">{{ fileError }}</p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Review Status Modal -->
  <div 
    v-if="showReviewModal" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeReviewModal"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
      <!-- Modal Header -->
      <div class="bg-[#2f4a71] text-white p-4 flex justify-between items-center">
        <h3 class="text-xl font-bold">Update File Status</h3>
        <button @click="closeReviewModal" class="text-white hover:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Content -->
      <div class="p-6" v-if="selectedReviewFile">
        <div class="mb-4">
          <p class="text-sm text-gray-600">File type</p>
          <p class="font-medium">{{ formatFileType(selectedReviewFile.type) }}</p>
        </div>
        
        <div class="mb-4">
          <p class="text-sm text-gray-600">Staff</p>
          <p class="font-medium">{{ selectedReviewFile.clientName || 'Unknown' }}</p>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Set Status
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button 
              @click="updateStatus = 'complete'"
              class="py-2 px-3 rounded-md border flex items-center justify-center text-sm focus:outline-none"
              :class="updateStatus === 'complete' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-300 hover:bg-gray-50'"
            >
              <svg v-if="updateStatus === 'complete'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>Complete</span>
            </button>
            <button 
              @click="updateStatus = 'ongoing'"
              class="py-2 px-3 rounded-md border flex items-center justify-center text-sm focus:outline-none"
              :class="updateStatus === 'ongoing' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'"
            >
              <svg v-if="updateStatus === 'ongoing'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
              <span>Ongoing</span>
            </button>
            <button 
              @click="updateStatus = 'rejected'"
              class="py-2 px-3 rounded-md border flex items-center justify-center text-sm focus:outline-none"
              :class="updateStatus === 'rejected' ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-300 hover:bg-gray-50'"
            >
              <svg v-if="updateStatus === 'rejected'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <span>Rejected</span>
            </button>
          </div>
        </div>

        <div class="mb-6">
          <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            v-model="updateNotes"
            rows="3"
            class="shadow-sm block w-full focus:ring-[#2f4a71] focus:border-[#2f4a71] sm:text-sm border border-gray-300 rounded-md"
            placeholder="Add any notes about this file review..."
          ></textarea>
        </div>

        <div class="flex justify-end space-x-3">
          <button 
            @click="closeReviewModal"
            class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f4a71]"
          >
            Cancel
          </button>
          <button 
            @click="submitReview"
            :disabled="!updateStatus || isSubmitting"
            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#2f4a71] hover:bg-[#1d2e47] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f4a71] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="isSubmitting" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.staff-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

.tabs-container {
  width: 100%;
  margin: 0 auto;
}

.tab-nav {
  display: flex;
  border-bottom: 1px solid #ccc;
  margin-bottom: 20px;
}

.tab-button {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
}

.tab-button:hover {
  background-color: #f5f5f5;
}

.tab-button.active {
  border-bottom-color: #2f4a71;
  font-weight: bold;
}

.tab-content {
  padding: 20px 0;
}

.tab-panel {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>