<template>
  <NavBar/>
  <div class="staff-container">

    <ClientOnly>
      <!-- Wrap dynamic content in ClientOnly to prevent hydration mismatches -->
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      
      <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{{ error }}</p>
      </div>
      
      <div v-else-if="staff.length === 0" class="text-center py-8 text-gray-500">
        No staff found
      </div>
      
      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="member in staff" 
            :key="member.client_id"
            class="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
            @click="openStaffModal(member)"
          >
            <h3 class="font-semibold text-lg text-gray-800">{{ member.name }}</h3>
            <div class="mt-2">
              <span 
                class="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded float-right"
                v-if="member.section"
              >
                {{ member.section }}
              </span>
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
    v-if="showStaffModal" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto"
    @click.self="closeStaffModal"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 my-8 overflow-hidden">
      <!-- Modal Header -->
      <div class="bg-[#2f4a71] text-white p-5 flex justify-between items-center">
        <h3 class="text-xl font-bold">Staff Information</h3>
        <button @click="closeStaffModal" class="text-white hover:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Staff Details -->
      <div class="p-6 border-b border-gray-200" v-if="selectedStaff">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="text-sm font-medium text-gray-500">Name</h4>
            <p class="text-lg">{{ selectedStaff.name }}</p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500">E-mail</h4>
            <p class="text-lg">{{ selectedStaff.gmail }}</p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-gray-500">Department</h4>
            <p class="text-lg">{{ selectedStaff.section || 'N/A' }}</p>
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
              <!-- Loading State -->
              <div v-if="loadingFiles" class="flex justify-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2f4a71]"></div>
              </div>

              <!-- No Files State -->
              <div v-else-if="medicalFiles.length === 0" class="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="mt-3 text-gray-500">No medical records available</p>
              </div>

              <!-- Medical Files Grid -->
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
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
                            file.type === 'medical' ? 'bg-green-100 text-green-700' :
                            file.type === 'physical' ? 'bg-blue-100 text-blue-700' :
                            file.type === 'dental' ? 'bg-purple-100 text-purple-700' :
                            file.type === 'opthal' ? 'bg-orange-100 text-orange-700' :
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
                        <h3 class="text-sm font-medium text-gray-900 truncate">{{ formatFileType(file.type) }}</h3>
                        <p class="text-xs text-gray-400 mt-1">
                          {{ formatDate(file.date) }}
                        </p>
                      </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="mt-3 flex justify-end">
                      <button 
                        @click="viewFile(file)"
                        class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f4a71]"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Confinement Records Tab -->
            <div v-if="activeTab === 'confinementRecords'" class="tab-panel">
              <!-- Loading State -->
              <div v-if="loadingFiles" class="flex justify-center py-8">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2f4a71]"></div>
              </div>

              <!-- No Files State -->
              <div v-else-if="confinementFiles.length === 0" class="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="mt-3 text-gray-500">No confinement records available</p>
              </div>

              <!-- Confinement Files Grid -->
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
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
                        <h3 class="text-sm font-medium text-gray-900 truncate">{{ formatFileType(file.type) }}</h3>
                        <p class="text-xs text-gray-400 mt-1">
                          {{ formatDate(file.date) }}
                        </p>
                      </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="mt-3 flex justify-end">
                      <button 
                        @click="viewFile(file)"
                        class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f4a71]"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
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
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

// Initialize state
const staff = ref([]);
const loading = ref(false);
const error = ref(null);
const debugInfo = ref('');

// Staff modal state
const showStaffModal = ref(false);
const selectedStaff = ref(null);
const staffFiles = ref([]);
const loadingFiles = ref(false);
const activeTab = ref('medicalRecords');

// File viewer modal state
const showFileViewerModal = ref(false);
const selectedFile = ref(null);
const fileLoading = ref(false);
const fileError = ref(null);

// Computed properties for the categorized files
const medicalFiles = computed(() => {
  return staffFiles.value.filter(file => 
    ['medical', 'dental', 'physical', 'opthal'].includes(file.type)
  );
});

const confinementFiles = computed(() => {
  return staffFiles.value.filter(file => 
    ['admission', 'discharge', 'treatment', 'confinement'].includes(file.type)
  );
});

// Set base API URL
const apiBaseUrl = process.env.NODE_ENV === 'production'
  ? '/api'
  : 'http://localhost:3001';

// Fetch staff from API
const fetchStaff = async () => {
  loading.value = true;
  error.value = null;
  debugInfo.value = '';
  
  try {
    const possiblePaths = [
      '/api/get-clients/staff',
      'http://localhost:3001/get-clients/staff',
      '/api/api/get-clients/staff',
      'http://localhost:3001/api/get-clients/staff',
      '/api/staff',
      'http://localhost:3001/staff',
      '/api/clients/staff',
      'http://localhost:3001/clients/staff'
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
            staff.value = result.data;
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
const openStaffModal = (member) => {
  selectedStaff.value = member;
  showStaffModal.value = true;
  document.body.classList.add('overflow-hidden');
  fetchStaffFiles();
};

const closeStaffModal = () => {
  showStaffModal.value = false;
  selectedStaff.value = null;
  document.body.classList.remove('overflow-hidden');
  staffFiles.value = [];
};

// Fetch staff files
const fetchStaffFiles = async () => {
  if (!selectedStaff.value) return;
  
  loadingFiles.value = true;
  staffFiles.value = [];
  const staffId = selectedStaff.value.client_id;
  
  try {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    // Make sure to include the token with the Bearer prefix
    const response = await fetch(`${apiBaseUrl}/fetch-staff-files-admin?staff_id=${staffId}`, {
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
      staffFiles.value = result.data;
      console.log(`Successfully fetched ${staffFiles.value.length} files for staff ${staffId}`);
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
    const response = await fetch(`${apiBaseUrl}/fetch-staff-files-admin/file/${file.type}/${file.id}`, {
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
    'confinement': 'Confinement Report',
    
    // Other document types
    'cv': 'Curriculum Vitae',
    'certification': 'Certification',
    'contract': 'Contract Document',
    'evaluation': 'Performance Evaluation',
    'id': 'ID Document',
    'academic': 'Academic Record'
  };
  
  return types[fileType] || fileType;
};

// Set up event listeners
onMounted(() => {
  fetchStaff();
});

// Clean up
onUnmounted(() => {
  if (selectedFile.value && selectedFile.value.url) {
    URL.revokeObjectURL(selectedFile.value.url);
  }
});
</script>

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