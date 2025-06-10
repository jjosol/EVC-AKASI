<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { usePatientConsultations } from '~/composables/usePatientConsultations';

// Add activeTab state
const activeTab = ref('medicalRecords');

// Initialize the consultations composable
const { 
  consultations, 
  loading: consultationsLoading, 
  error: consultationsError,
  fetchConsultations  
} = usePatientConsultations();

// Add function to fetch consultations for a student
const fetchStudentConsultations = async (patientId) => {
  if (!patientId) {
    consultationsError.value = 'Patient ID is required';
    return;
  }

  try {
    await fetchConsultations(patientId);
    console.log('Received consultations:', consultations.value.length);
  } catch (err) {
    console.error('Error in fetchStudentConsultations:', err);
  }
};

// Initialize state
const students = ref([]);
const filteredStudents = ref([]);
const loading = ref(false);
const error = ref(null);
const debugInfo = ref('');

// Filter state
const showPendingOnly = ref(false);
const searchQuery = ref('');

// Pagination state for better performance with many users
const currentPage = ref(1);
const itemsPerPage = ref(20);
const totalPages = ref(1);
const paginatedStudents = ref([]);

// View mode state for responsive design
const viewMode = ref('grid'); // 'grid' or 'list'
const isMobile = ref(false);

// Student modal state
const showStudentModal = ref(false);
const selectedStudent = ref(null);
const isGradeDropdownOpen = ref(false);
const selectedGrade = ref('');
const studentFiles = ref([]);
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

// Constants
const grades = [
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12'
];

// Set base API URL
const apiBaseUrl = process.env.NODE_ENV === 'production'
  ? '/api'
  : import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Students with pending files
const studentsWithPendingFiles = computed(() => {
  return students.value.filter(student => student.hasPendingFiles);
});

// Apply filters to students with pagination
const applyFilters = () => {
  let result = [...students.value];
  
  // Filter by pending files
  if (showPendingOnly.value) {
    result = result.filter(student => student.hasPendingFiles);
  }
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase();
    result = result.filter(student => 
      student.name.toLowerCase().includes(query) || 
      student.section.toLowerCase().includes(query) ||
      (student.grade && student.grade.toString().includes(query))
    );
  }
  
  filteredStudents.value = result;
  
  // Update pagination
  totalPages.value = Math.ceil(result.length / itemsPerPage.value);
  currentPage.value = Math.min(currentPage.value, totalPages.value || 1);
  updatePaginatedStudents();
};

// Update paginated students
const updatePaginatedStudents = () => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  paginatedStudents.value = filteredStudents.value.slice(start, end);
};

// Pagination controls
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    updatePaginatedStudents();
  }
};

const nextPage = () => goToPage(currentPage.value + 1);
const prevPage = () => goToPage(currentPage.value - 1);

// Check if mobile device
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768;
  // Auto-switch to list view on mobile for better UX
  if (isMobile.value && viewMode.value === 'grid') {
    viewMode.value = 'list';
  }
};

// Toggle view mode
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
};

// Watch for filter changes
watch([showPendingOnly, searchQuery], () => {
  applyFilters();
});

// Watch for filter changes
watch([showPendingOnly, searchQuery], () => {
  applyFilters();
});

// Add this to your existing watch statements
watch(activeTab, (newTab) => {
  if (newTab === 'consultationRecords' && selectedStudent.value) {
    fetchStudentConsultations(selectedStudent.value.patient_id);
  }
});

// Modify your openStudentModal function to also fetch consultations if needed
const openStudentModal = (student) => {
  selectedStudent.value = student;
  showStudentModal.value = true;
  document.body.classList.add('overflow-hidden');
  
  // Reset the selected grade
  selectedGrade.value = '';
  studentFiles.value = [];
  
  // If the current tab is consultationRecords, fetch consultations
  if (activeTab.value === 'consultationRecords') {
    fetchStudentConsultations(student.patient_id);
  }
};

// Fetch students from API
const fetchStudents = async () => {
  loading.value = true;
  error.value = null;
  debugInfo.value = '';
  
  try {
    const possiblePaths = [
      '/api/get-patient/students',
      `${apiBaseUrl}/get-patient/students`
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
              const pendingResponse = await fetch(`${apiBaseUrl}/patient-files/patients-with-pending-files`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (pendingResponse.ok) {
                const pendingResult = await pendingResponse.json();
                const pendingStudentIds = new Set((pendingResult.data || []).map(s => s.patient_id));
                // Mark students with pending files
                result.data.forEach(student => {
                  student.hasPendingFiles = pendingStudentIds.has(student.patient_id);
                });
              }
            }            
            students.value = result.data;
            // Initialize filtered students
            filteredStudents.value = [...students.value];
            // Apply initial filters and pagination
            applyFilters();
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
    console.error('Error fetching students:', err);
    error.value = err instanceof Error ? err.message : 'An unknown error occurred';
    debugInfo.value += '\n' + err.message;
  } finally {
    loading.value = false;
  }
};

const closeStudentModal = () => {
  showStudentModal.value = false;
  selectedStudent.value = null;
  document.body.classList.remove('overflow-hidden');
  selectedGrade.value = '';
  studentFiles.value = [];
};

// Grade selection
const selectGrade = (grade) => {
  selectedGrade.value = grade;
  isGradeDropdownOpen.value = false;
  fetchStudentFiles();
};

// Fetch student files for selected grade
const fetchStudentFiles = async () => {
  if (!selectedStudent.value || !selectedGrade.value) return;
  
  loadingFiles.value = true;
  studentFiles.value = [];
  const patientId = selectedStudent.value.patient_id;
  const gradeNumber = parseInt(selectedGrade.value.replace('Grade ', ''));
  
  try {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    // Fetch all files for the grade
    const response = await fetch(`${apiBaseUrl}/patient-files?grade=${gradeNumber}`, {
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
    
    if (result && Array.isArray(result)) {
      // Filter files for the selected patient
      const filesForPatient = result.filter(file => file.patient_id === patientId);
      // Fetch file statuses from the file_status table
      const statusResponse = await fetch(`${apiBaseUrl}/patient-files/fetch-file-statuses?patient_id=${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const statusResult = statusResponse.ok ? await statusResponse.json() : { success: false, data: [] };
      const fileStatuses = statusResult.success ? statusResult.data : [];
      
      // Merge file data with status information
      studentFiles.value = filesForPatient.map(file => {
        const statusInfo = fileStatuses.find(s => 
          s.file_id === file.id && s.file_type === file.type
        );
        
        return {
          ...file,
          status: statusInfo ? statusInfo.status : 'pending',
          notes: statusInfo ? statusInfo.notes : null
        };
      });
      
      console.log(`Successfully fetched ${studentFiles.value.length} files for patient ${patientId}, grade ${gradeNumber}`);
    } else {
      throw new Error('Invalid response format');
    }
  } catch (err) {
    console.error('Error fetching student files:', err);
    // Display error to user
  } finally {
    loadingFiles.value = false;
  }
};

// Watch for clicks outside the dropdown
const handleClickOutside = (event) => {
  if (isGradeDropdownOpen.value && !event.target.closest('.relative')) {
    isGradeDropdownOpen.value = false;
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
    const response = await fetch(`${apiBaseUrl}/patient-files/download/${file.id}?type=${file.type}`, {
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
    patientName: selectedStudent?.value?.name || 'Unknown',
    category: 'student'
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
      patientId: selectedStudent.value.patient_id,
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
      const fileIndex = studentFiles.value.findIndex(f => 
        f.id === selectedReviewFile.value.id && f.type === selectedReviewFile.value.type
      );
      
      if (fileIndex !== -1) {
        studentFiles.value[fileIndex] = {
          ...studentFiles.value[fileIndex],
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
      
      // Refresh the students list to update the pending status
      fetchStudents();
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
  };
  
  return types[fileType] || fileType;
};  

// Add these computed properties after the other state variables
const medicalFiles = computed(() => {
  return studentFiles.value.filter(file => 
    ['medical', 'dental', 'physical', 'opthal'].includes(file.type)
  );
});

const consultationFiles = computed(() => {
  return studentFiles.value.filter(file => 
    ['admission', 'discharge', 'treatment', 'confinement'].includes(file.type)
  );
});

// Set up event listeners
onMounted(() => {
  fetchStudents();
  document.addEventListener('click', handleClickOutside);
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

// Clean up
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', checkMobile);
  if (selectedFile.value && selectedFile.value.url) {
    URL.revokeObjectURL(selectedFile.value.url);
  }
});

// Watch for grade changes to fetch files
watch(selectedGrade, (newGrade) => {
  if (newGrade && selectedStudent.value) {
    fetchStudentFiles();
  }
});
</script>

<template>  <NavBar/>
  <div class="students-container">
    <ClientOnly>
      <!-- Header Section -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">Student Files Management</h1>
        <p class="mt-1 text-sm text-gray-600">Review and manage student enrollment and consultation files</p>
      </div>

      <!-- Filter Controls -->
      <div class="p-3 mb-6 bg-white rounded-lg shadow sm:p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <!-- Search and Filter Section -->
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1">
            <div class="w-full sm:w-64 lg:w-80">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by name, section, or grade..."
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2f4a71] sm:text-base"
              />
            </div>
            <div class="flex items-center">
              <label class="inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  v-model="showPendingOnly"
                  class="form-checkbox h-4 w-4 text-[#2f4a71] border-gray-300 rounded focus:ring-[#2f4a71]"
                >
                <span class="ml-2 text-sm text-gray-700 sm:text-base">Show only pending files</span>
              </label>
            </div>
          </div>
          
          <!-- View Mode Toggle (Desktop Only) -->
          <div class="hidden sm:flex items-center space-x-2">
            <button
              @click="toggleViewMode"
              class="p-2 text-gray-500 hover:text-[#2f4a71] focus:outline-none focus:ring-2 focus:ring-[#2f4a71] rounded-md"
              :title="viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'"
            >
              <!-- Grid Icon -->
              <svg v-if="viewMode === 'list'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <!-- List Icon -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>      
      <!-- Wrap dynamic content in ClientOnly to prevent hydration mismatches -->
      <div v-if="loading" class="flex justify-center py-8">
        <div class="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
      
      <div v-else-if="error" class="px-4 py-3 text-red-700 bg-red-100 border border-red-400 rounded">
        <p>{{ error }}</p>
      </div>
      
      <div v-else-if="paginatedStudents.length === 0" class="py-8 text-center text-gray-500">
        <p v-if="showPendingOnly">No students with pending files found</p>
        <p v-else>No students found</p>
      </div>
      
      <div v-else>
        <!-- Students Grid/List View -->
        <div 
          :class="[
            viewMode === 'grid' 
              ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6' 
              : 'space-y-3'
          ]"
        >
          <div 
            v-for="student in paginatedStudents" 
            :key="student.patient_id"
            :class="[
              'transition-all duration-200 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md',
              viewMode === 'grid' 
                ? 'p-3 sm:p-4 hover:scale-105' 
                : 'p-4 flex items-center justify-between hover:bg-gray-50'
            ]"
            @click="openStudentModal(student)"
          >
            <!-- Grid View Layout -->
            <template v-if="viewMode === 'grid'">
              <div class="flex justify-between">
                <h3 class="text-lg font-semibold text-gray-800 truncate">{{ student.name }}</h3>
                <span 
                  v-if="student.hasPendingFiles" 
                  class="inline-block px-2 py-1 text-xs text-yellow-800 bg-yellow-100 rounded-full flex-shrink-0"
                >
                  Pending
                </span>
              </div>
              <div class="flex items-center justify-between mt-2">
                <span 
                  class="inline-block px-2 py-1 text-sm text-blue-800 bg-blue-100 rounded"
                  v-if="student.grade"
                >
                  Grade {{ student.grade }}
                </span>
                <span class="text-sm text-gray-600 truncate ml-2">{{ student.section }}</span>
              </div>
            </template>
            
            <!-- List View Layout -->
            <template v-else>
              <div class="flex items-center space-x-4 flex-1 min-w-0">
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-semibold text-gray-800 truncate">{{ student.name }}</h3>
                  <div class="flex items-center space-x-2 mt-1">
                    <span 
                      class="inline-block px-2 py-1 text-sm text-blue-800 bg-blue-100 rounded"
                      v-if="student.grade"
                    >
                      Grade {{ student.grade }}
                    </span>
                    <span class="text-sm text-gray-600">{{ student.section }}</span>
                  </div>
                </div>
                <div class="flex items-center space-x-3 flex-shrink-0">
                  <span 
                    v-if="student.hasPendingFiles" 
                    class="inline-block px-3 py-1 text-sm text-yellow-800 bg-yellow-100 rounded-full"
                  >
                    Pending Files
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </template>
          </div>
        </div>
        
        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="flex items-center justify-between mt-6 px-4 py-3 bg-white rounded-lg shadow">
          <div class="flex items-center space-x-2">
            <p class="text-sm text-gray-700">
              Showing 
              <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
              to 
              <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, filteredStudents.length) }}</span>
              of 
              <span class="font-medium">{{ filteredStudents.length }}</span>
              students
            </p>
          </div>
          
          <div class="flex items-center space-x-1">
            <!-- Previous Button -->
            <button
              @click="prevPage"
              :disabled="currentPage <= 1"
              class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <!-- Page Numbers -->
            <div class="hidden sm:flex space-x-1">
              <button
                v-for="page in Math.min(5, totalPages)"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'px-3 py-2 text-sm font-medium rounded-md',
                  page === currentPage
                    ? 'text-white bg-[#2f4a71] border border-[#2f4a71]'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
            </div>
            
            <!-- Mobile Page Info -->
            <div class="sm:hidden px-3 py-2 text-sm text-gray-500">
              {{ currentPage }} / {{ totalPages }}
            </div>
            
            <!-- Next Button -->
            <button
              @click="nextPage"
              :disabled="currentPage >= totalPages"
              class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      
      <!-- Debugging section -->
      <div v-if="error" class="p-4 mt-8 bg-gray-100 rounded">
        <h3 class="font-semibold">Debugging Information:</h3>
        <p>{{ debugInfo }}</p>
      </div>
    </ClientOnly>
  </div>
  <!-- Student Detail Modal -->
  <div 
    v-if="showStudentModal" 
    class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50 p-2 sm:p-4"
    @click.self="closeStudentModal"
  >
    <div class="w-full max-w-6xl mx-auto my-4 sm:my-8 overflow-hidden bg-white rounded-lg shadow-xl max-h-[95vh] flex flex-col">
      <!-- Modal Header -->
      <div class="bg-[#2f4a71] text-white p-3 sm:p-5 flex justify-between items-center flex-shrink-0">
        <h3 class="text-lg sm:text-xl font-bold">Student Information</h3>
        <button @click="closeStudentModal" class="text-white hover:text-gray-200 p-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Student Details -->
      <div class="p-3 sm:p-6 border-b border-gray-200 flex-shrink-0" v-if="selectedStudent">
        <div class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
          <div>
            <h4 class="text-xs sm:text-sm font-medium text-gray-500">Name</h4>
            <p class="text-base sm:text-lg truncate">{{ selectedStudent.name }}</p>
          </div>
          <div>
            <h4 class="text-xs sm:text-sm font-medium text-gray-500">E-mail</h4>
            <p class="text-base sm:text-lg truncate">{{ selectedStudent.gmail }}</p>
          </div>
          <div>
            <h4 class="text-xs sm:text-sm font-medium text-gray-500">Grade</h4>
            <p class="text-base sm:text-lg">{{ selectedStudent.grade }}</p>
          </div>
          <div>
            <h4 class="text-xs sm:text-sm font-medium text-gray-500">Section</h4>
            <p class="text-base sm:text-lg">{{ selectedStudent.section }}</p>
          </div>
        </div>
      </div>

      <!-- Files Section with Tabs -->
        <div class="overflow-hidden bg-white shadow-md rounded-xl">
          <div class="tabs-container">
            <!-- Tab Navigation -->
            <div class="tab-nav">
              <button 
                @click="activeTab = 'medicalRecords'" 
                :class="['tab-button', activeTab === 'medicalRecords' ? 'active' : '']"
              >
                Enrollment Files
              </button>
              <button 
                @click="activeTab = 'consultationRecords'" 
                :class="['tab-button', activeTab === 'consultationRecords' ? 'active' : '']"
              >
                Consultation Records
              </button>
            </div>
            
            <div class="tab-content">
              <!-- Medical Records Tab -->
              <div v-if="activeTab === 'medicalRecords'" class="tab-panel">
                <!-- Files Section -->
                <div class="p-6">
                  <div class="flex items-center justify-between mb-6">
                    <!-- Grade Dropdown -->
                    <div class="relative inline-block text-left">
                      <div>
                        <button 
                          @click="isGradeDropdownOpen = !isGradeDropdownOpen" 
                          type="button" 
                          class="inline-flex justify-between items-center w-44 rounded-md border border-gray-200 px-4 py-2 bg-white text-sm font-medium text-[#2f4a71] hover:bg-[#f8f4ff] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f4a71]"
                        >
                          {{ selectedGrade || 'Select Grade' }}
                          <svg class="w-5 h-5 ml-2 -mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                          </svg>
                        </button>
                      </div>

                      <div 
                        v-if="isGradeDropdownOpen" 
                        class="absolute right-0 z-10 mt-2 origin-top-right bg-white rounded-md shadow-lg w-44 ring-1 ring-black ring-opacity-5 focus:outline-none"
                      >
                        <div class="py-1">
                          <a 
                            v-for="grade in grades" 
                            :key="grade"
                            @click="selectGrade(grade)" 
                            class="block px-4 py-2 text-sm hover:bg-[#f8f4ff] cursor-pointer"
                            :class="selectedGrade === grade ? 'bg-[#f8f4ff] text-[#2f4a71] font-medium' : 'text-gray-700'"
                          >
                            {{ grade }}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Loading State -->
                  <div v-if="loadingFiles" class="flex justify-center py-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2f4a71]"></div>
                  </div>

                  <!-- No Files State -->
                  <div v-else-if="!selectedGrade || medicalFiles.length === 0" class="py-12 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p class="mt-3 text-gray-500">
                      {{ !selectedGrade ? 'Please select a grade to view files' : 'No medical records available for this grade' }}
                    </p>
                  </div>                  <!-- Files Grid -->
                  <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <!-- File Card with Status -->
                    <div 
                      v-for="file in medicalFiles" 
                      :key="`${file.type}-${file.id}`" 
                      class="overflow-hidden transition-all duration-200 border rounded-lg shadow-sm hover:shadow-md hover:scale-105"
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
                              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </span>
                          </div>
                          
                          <!-- File Info -->
                          <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between">
                              <h3 class="text-sm font-medium text-gray-900 truncate">{{ formatFileType(file.type) }}</h3>
                              
                              <!-- Status Badge -->
                              <span 
                                :class="[
                                  file.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  file.status === 'complete' ? 'bg-green-100 text-green-800' :
                                  file.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                                  file.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800',
                                  'px-2 py-1 text-xs rounded-full ml-2 flex-shrink-0'
                                ]"
                              >
                                {{ file.status ? (file.status.charAt(0).toUpperCase() + file.status.slice(1)) : 'Pending' }}
                              </span>
                            </div>
                            <p class="mt-1 text-xs text-gray-400">
                              {{ formatDate(file.date) }}
                            </p>
                            
                            <!-- Notes (if any) -->
                            <p v-if="file.notes" class="mt-1 text-xs italic text-gray-500 truncate">
                              Note: {{ file.notes }}
                            </p>
                          </div>
                        </div>
                        
                        <!-- Actions -->
                        <div class="flex flex-col sm:flex-row justify-end mt-3 gap-2">
                          <button 
                            @click.stop="viewFile(file)"
                            class="inline-flex items-center justify-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f4a71]"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          
                          <!-- Review Button -->
                          <button 
                            @click.stop="openReviewModal(file)"
                            class="inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-[#2f4a71] hover:bg-[#1d2e47] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f4a71]"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              </div>              <!-- Consultation Records Tab -->
              <div v-if="activeTab === 'consultationRecords'" class="tab-panel">
                <div class="p-3">
                    
                  <!-- Loading state -->
                  <div v-if="consultationsLoading" class="flex justify-center py-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2f4a71]"></div>
                  </div>
                  
                  <!-- Error state -->
                  <div v-else-if="consultationsError" class="p-4 text-red-700 rounded-md bg-red-50">
                    <p>{{ consultationsError }}</p>
                    <button 
                      @click="fetchStudentConsultations(selectedStudent?.patient_id)" 
                      class="mt-2 text-sm underline hover:text-red-800"
                    >
                      Try again
                    </button>
                  </div>
                  
                  <!-- No data state -->
                  <div v-else-if="!consultations || consultations.length === 0" class="py-12 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p class="mt-3 text-gray-500">
                      No consultation records found for this student
                    </p>
                  </div>
                  
                  <!-- Consultation records list -->
                  <div v-else class="divide-y divide-gray-200">
                    <div v-for="record in consultations" :key="record.id" class="p-3 sm:p-4 py-4 transition-colors rounded-lg hover:bg-gray-50">
                      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div class="flex-1 min-w-0">
                          <div class="text-xs sm:text-sm text-gray-500">{{ formatDate(record.date) }}</div>
                          <h3 class="font-medium text-base sm:text-lg text-[#2f4a71] truncate">
                            {{ record.diagnoses || 'General Consultation' }}
                          </h3>
                          <div class="flex items-center mt-1">
                            <span class="text-xs sm:text-sm text-gray-600 truncate">Attended by: {{ record.doctor || 'School Physician' }}</span>
                          </div>
                        </div>
                        
                        <!-- Status indicators -->
                        <div class="flex flex-wrap gap-1 sm:gap-2 flex-shrink-0">
                          <span v-if="record.confined" class="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                            Confined
                          </span>
                          <span v-if="record.medAdministration" class="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                            Medication
                          </span>
                          <span v-if="record.intern" class="px-2 py-1 text-xs font-medium text-purple-800 bg-purple-100 rounded-full">
                            Intern
                          </span>
                        </div>
                      </div>
                      
                      <!-- Enhanced details section with medication information -->
                      <details class="mt-2">
                        <summary class="text-sm text-[#2f4a71] cursor-pointer hover:underline focus:outline-none">
                          View details
                        </summary>
                        <div class="mt-3 ml-2 text-sm">
                          <!-- Complaint section -->
                          <div v-if="record.complaint" class="mb-2">
                            <p class="font-medium text-gray-700">Complaint:</p>
                            <p class="text-gray-600">{{ record.complaint }}</p>
                          </div>
                          
                          <!-- Medication section - show if there are any medications -->
                          <div v-if="record.medications && record.medications.length > 0" class="mb-2">
                            <p class="font-medium text-gray-700">Medications:</p>
                            <div class="mt-1 space-y-2">
                              <div v-for="(medication, index) in record.medications" :key="medication.id" 
                                  class="flex flex-col sm:flex-row sm:items-start p-2 rounded bg-blue-50 gap-2">
                                <div class="flex items-center justify-center flex-shrink-0 w-5 h-5 text-xs font-bold text-blue-800 bg-blue-100 rounded-full">
                                  {{ index + 1 }}
                                </div>
                                <div class="flex-1 min-w-0">
                                  <p class="font-medium">{{ medication.name }}</p>
                                  <div class="mt-1 text-xs text-gray-600 space-y-1">
                                    <p><span class="font-medium">Quantity:</span> {{ medication.count }}</p>
                                    <p><span class="font-medium">Schedule:</span> {{ medication.schedule }}</p>
                                    <p><span class="font-medium">Duration:</span> {{ formatDate(medication.startDate) }} - {{ formatDate(medication.endDate) }}</p>
                                    <p v-if="medication.remarks"><span class="font-medium">Notes:</span> {{ medication.remarks }}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <!-- Action Taken section -->
                          <div v-if="record.action" class="mb-2">
                            <p class="font-medium text-gray-700">Action Taken:</p>
                            <p class="text-gray-600">{{ record.action }}</p>
                          </div>
                          
                          <!-- Disposition section -->
                          <div v-if="record.disposition" class="mb-2">
                            <p class="font-medium text-gray-700">Disposition:</p>
                            <p class="text-gray-600">{{ record.disposition }}</p>
                          </div>
                          
                          <!-- Remarks section -->
                          <div v-if="record.remarks" class="mb-2">
                            <p class="font-medium text-gray-700">Remarks:</p>
                            <p class="text-gray-600">{{ record.remarks }}</p>
                          </div>
                        </div>
                      </details>
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
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-2 sm:p-4"
    @click.self="closeFileViewerModal"
  >
    <div class="flex flex-col w-full max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow-xl h-[90vh] sm:h-5/6">
      <!-- Viewer Header -->
      <div class="flex items-center justify-between p-3 sm:p-4 border-b flex-shrink-0">
        <div class="flex items-center">
          <h3 class="text-base sm:text-lg font-medium text-gray-900 truncate">{{ selectedFile?.typeLabel || formatFileType(selectedFile?.type) }}</h3>
          <span class="px-2 py-1 ml-2 text-xs bg-gray-100 rounded">
            {{ getFileExtension(selectedFile?.mimeType) }}
          </span>
          
          <!-- Status Badge in Header -->
          <span 
            v-if="selectedFile?.status"
            :class="[
              selectedFile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              selectedFile.status === 'complete' ? 'bg-green-100 text-green-800' :
              selectedFile.status === 'pending' ? 'bg-blue-100 text-blue-800' :
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
            class="mr-2 sm:mr-3 text-gray-700 hover:text-gray-900 focus:outline-none p-1"
            title="Download File"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          
          <!-- Review Button -->
          <button
            v-if="selectedFile"
            @click="openReviewModal(selectedFile)"
            class="mr-2 sm:mr-3 text-[#2f4a71] hover:text-[#1d2e47] focus:outline-none p-1"
            title="Review File"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          <!-- Close Button -->
          <button 
            @click="closeFileViewerModal" 
            class="text-gray-400 hover:text-gray-500 focus:outline-none p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- File Information section - notes -->
      <div v-if="selectedFile?.notes" class="px-3 sm:px-4 py-2 border-b bg-gray-50 flex-shrink-0">
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
            class="flex items-center justify-center h-full overflow-auto bg-gray-100"
          >
            <img 
              :src="selectedFile.url" 
              class="object-contain max-w-full max-h-full"
              alt="Document image"
            />
          </div>
          
          <!-- Fallback for other file types -->
          <div 
            v-else 
            class="flex flex-col items-center justify-center h-full p-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 sm:w-16 sm:h-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="mb-2 text-gray-600 text-center">File preview not available</p>
            <button
              @click="downloadFile"
              class="px-4 py-2 bg-[#2f4a71] text-white rounded hover:bg-[#1d2e47] focus:outline-none text-sm"
            >
              Download to view
            </button>
          </div>
        </template>
        
        <!-- Error state -->
        <div v-else-if="fileError" class="flex flex-col items-center justify-center h-full p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="mb-2 text-red-500">Failed to load file</p>
          <p class="text-sm text-gray-500">{{ fileError }}</p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Review Status Modal -->
  <div 
    v-if="showReviewModal" 
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    @click.self="closeReviewModal"
  >
    <div class="w-full max-w-md mx-4 overflow-hidden bg-white rounded-lg shadow-xl">
      <!-- Modal Header -->
      <div class="bg-[#2f4a71] text-white p-4 flex justify-between items-center">
        <h3 class="text-xl font-bold">Update File Status</h3>
        <button @click="closeReviewModal" class="text-white hover:text-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <p class="text-sm text-gray-600">Student</p>
          <p class="font-medium">{{ selectedReviewFile.patientName || 'Unknown' }}</p>
          <p v-if="selectedStudent" class="text-sm text-gray-500">
            Grade {{ selectedStudent.grade }} - {{ selectedStudent.section }}
          </p>
        </div>

        <div class="mb-6">
          <label class="block mb-2 text-sm font-medium text-gray-700">
            Set Status
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button 
              @click="updateStatus = 'complete'"
              class="flex items-center justify-center px-3 py-2 text-sm border rounded-md focus:outline-none"
              :class="updateStatus === 'complete' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-300 hover:bg-gray-50'"
            >
              <svg v-if="updateStatus === 'complete'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>Complete</span>
            </button>
            <button 
              @click="updateStatus = 'pending'"
              class="flex items-center justify-center px-3 py-2 text-sm border rounded-md focus:outline-none"
              :class="updateStatus === 'pending' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'"
            >
              <svg v-if="updateStatus === 'pending'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
              <span>Pending</span>
            </button>
            <button 
              @click="updateStatus = 'rejected'"
              class="flex items-center justify-center px-3 py-2 text-sm border rounded-md focus:outline-none"
              :class="updateStatus === 'rejected' ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-300 hover:bg-gray-50'"
            >
              <svg v-if="updateStatus === 'rejected'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-1 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <span>Rejected</span>
            </button>
          </div>
        </div>

        <div class="mb-6">
          <label for="notes" class="block mb-2 text-sm font-medium text-gray-700">
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
            <svg v-if="isSubmitting" class="w-4 h-4 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
.students-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

@media (min-width: 640px) {
  .students-container {
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .students-container {
    padding: 2rem;
  }
}

.tabs-container {
  width: 100%;
  margin: 0 auto;
}

.tab-nav {
  display: flex;
  border-bottom: 1px solid #ccc;
  margin-bottom: 20px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.tab-nav::-webkit-scrollbar {
  height: 4px;
}

.tab-nav::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.tab-nav::-webkit-scrollbar-thumb {
  background: #2f4a71;
  border-radius: 2px;
}

.tab-button {
  padding: 8px 16px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

@media (min-width: 640px) {
  .tab-button {
    padding: 10px 20px;
    font-size: 16px;
  }
}

.tab-button:hover {
  background-color: #f5f5f5;
}

.tab-button.active {
  border-bottom-color: #2f4a71;
  font-weight: bold;
}

.tab-content {
  padding: 15px 0;
}

@media (min-width: 640px) {
  .tab-content {
    padding: 20px 0;
  }
}

.tab-panel {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Responsive modal improvements */
.fixed.inset-0 {
  padding: 1rem;
}

@media (min-width: 640px) {
  .fixed.inset-0 {
    padding: 2rem;
  }
}

/* Responsive grid adjustments for file cards */
@media (max-width: 640px) {
  .grid {
    gap: 0.75rem;
  }
}

/* Add styling for details summary element */
details summary {
  list-style: none;
  display: flex;
  align-items: center;
}

details summary::-webkit-details-marker {
  display: none;
}

details summary::before {
  content: '▶';
  font-size: 0.8em;
  margin-right: 0.5em;
  transition: transform 0.15s ease;
}

details[open] summary::before {
  transform: rotate(90deg);
}

/* Styling for medications list */
.medication-item {
  border-left: 3px solid #bfdbfe;
  padding-left: 8px;
  margin-bottom: 8px;
}

/* Create better spacing between medication details */
.medication-details p {
  margin-bottom: 2px;
}

/* Enhanced loading state */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Performance optimizations */
.transition-all {
  will-change: transform, box-shadow;
}

/* Improve hover effects on touch devices */
@media (hover: none) {
  .hover\:scale-105:hover {
    transform: none;
  }
  
  .hover\:shadow-md:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
}

/* Additional responsive improvements */
@media (max-width: 768px) {
  .students-container {
    padding: 0.5rem;
  }
  
  /* Improve modal spacing on mobile */
  .fixed.inset-0 {
    padding: 0.5rem;
  }
  
  /* Make file cards more compact on mobile */
  .grid {
    gap: 0.5rem;
  }
  
  /* Better text sizing for mobile */
  .text-lg {
    font-size: 1rem;
  }
  
  .text-xl {
    font-size: 1.125rem;
  }
}

@media (max-width: 480px) {
  /* Ultra-mobile optimizations */
  .tab-button {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  /* Compact file cards */
  .grid {
    grid-template-columns: 1fr;
  }
  
  /* Stack action buttons vertically on very small screens */
  .flex.flex-col.sm\:flex-row {
    flex-direction: column;
  }
}

/* Pagination responsiveness */
@media (max-width: 640px) {
  .pagination-info {
    font-size: 0.75rem;
  }
  
  .pagination-buttons {
    gap: 0.25rem;
  }
}

/* Better scrolling for long lists */
.divide-y.divide-gray-200 {
  max-height: 60vh;
  overflow-y: auto;
}

.divide-y.divide-gray-200::-webkit-scrollbar {
  width: 6px;
}

.divide-y.divide-gray-200::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.divide-y.divide-gray-200::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.divide-y.divide-gray-200::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Improve touch targets for mobile */
@media (max-width: 768px) {
  button {
    min-height: 44px;
    min-width: 44px;
  }
  
  .cursor-pointer {
    min-height: 44px;
  }
}

/* Loading and error state improvements */
.loading-container {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-container {
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

/* Better focus states for accessibility */
button:focus,
input:focus,
textarea:focus {
  outline: 2px solid #2f4a71;
  outline-offset: 2px;
}

/* Improve card hover states */
@media (hover: hover) {
  .hover\:scale-105:hover {
    transform: scale(1.02);
  }
}

/* Skeleton loading animation */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>