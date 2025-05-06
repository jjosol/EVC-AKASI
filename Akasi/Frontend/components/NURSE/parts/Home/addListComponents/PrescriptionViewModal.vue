<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="relative w-11/12 max-w-5xl p-6 mx-auto bg-white rounded-lg shadow-xl h-5/6 flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between pb-4 border-b border-gray-300">
        <h2 class="text-xl font-semibold text-[#2f4a71]">View Prescription</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center flex-grow">
        <div class="flex flex-col items-center">
          <div class="w-12 h-12 border-4 border-t-4 border-[#2f4a71] border-t-transparent rounded-full animate-spin"></div>
          <p class="mt-4 text-gray-600">Loading prescription...</p>
        </div>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="flex items-center justify-center flex-grow">
        <div class="p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="mt-4 text-lg font-medium text-gray-900">Error Loading Prescription</h3>
          <p class="mt-2 text-sm text-gray-600">{{ error }}</p>
          <button @click="$emit('close')" class="px-4 py-2 mt-4 text-white bg-[#2f4a71] rounded hover:bg-opacity-90">
            Close
          </button>
        </div>
      </div>
      
      <!-- Content -->
      <div v-else class="flex flex-col flex-grow">
        <!-- Prescription info and toolbar -->
        <div class="flex items-center justify-between px-4 py-2 bg-gray-50">
          <div>
            <span class="block text-sm text-gray-500">{{ prescriptionInfo?.file_name }}</span>
            <span class="block text-xs text-gray-400">Uploaded: {{ formatDate(prescriptionInfo?.date_uploaded) }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <button @click="downloadFile" class="px-3 py-1 text-sm text-white bg-[#2f4a71] rounded hover:bg-opacity-90">
              Download
            </button>
            <button @click="printFile" class="px-3 py-1 text-sm text-white bg-[#2f4a71] rounded hover:bg-opacity-90">
              Print
            </button>
          </div>
        </div>
        
        <!-- File preview -->
        <div class="relative flex-grow p-2 overflow-auto bg-gray-100">
          <!-- PDF preview -->
          <div v-if="fileType === 'pdf'" class="w-full h-full">
            <iframe v-if="fileUrl" :src="fileUrl" class="w-full h-full" frameborder="0"></iframe>
            <div v-else class="flex items-center justify-center w-full h-full">
              <p>Unable to preview PDF</p>
            </div>
          </div>
          
          <!-- Image preview -->
          <div v-else-if="fileType === 'image'" class="flex items-center justify-center w-full h-full">
            <img v-if="fileUrl" :src="fileUrl" class="object-contain max-w-full max-h-full" alt="Prescription" />
            <div v-else class="flex items-center justify-center w-full h-full">
              <p>Unable to preview image</p>
            </div>
          </div>
          
          <!-- Unsupported file type -->
          <div v-else class="flex items-center justify-center w-full h-full">
            <p>File type not supported for preview</p>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="pt-4 border-t border-gray-300">
        <div class="flex justify-end">
          <button @click="$emit('close')" class="px-4 py-2 text-white bg-[#2f4a71] rounded hover:bg-opacity-90">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import * as consultationRecordService from '~/services/consultationRecordService';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  consultationId: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['close']);

const loading = ref(true);
const error = ref(null);
const prescriptionInfo = ref(null);
const fileBlob = ref(null);
const fileUrl = ref(null);

const fileType = computed(() => {
  if (!prescriptionInfo.value || !prescriptionInfo.value.mime_type) return null;
  
  const mimeType = prescriptionInfo.value.mime_type;
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'other';
});

// Function to load the prescription file
const loadPrescription = async () => {
  loading.value = true;
  error.value = null;
  fileBlob.value = null;
  fileUrl.value = null;
  
  try {
    // Fetch the prescription information
    prescriptionInfo.value = await consultationRecordService.fetchPrescriptionFile(props.consultationId);
    console.log('Prescription info:', prescriptionInfo.value);
    
    if (!prescriptionInfo.value || !prescriptionInfo.value.prescription_id) {
      throw new Error('No prescription found for this consultation');
    }
    
    // Fetch the prescription file as blob
    fileBlob.value = await consultationRecordService.downloadPrescriptionFile(prescriptionInfo.value.prescription_id);
    
    // Create a URL for the blob
    fileUrl.value = URL.createObjectURL(fileBlob.value);
  } catch (err) {
    console.error('Error loading prescription:', err);
    error.value = err.message || 'Failed to load prescription';
  } finally {
    loading.value = false;
  }
};

// Function to download the file
const downloadFile = () => {
  if (!fileBlob.value || !prescriptionInfo.value) return;
  
  const link = document.createElement('a');
  link.href = fileUrl.value;
  link.download = prescriptionInfo.value.file_name || 'prescription.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Function to print the file
const printFile = () => {
  if (!fileUrl.value) return;
  
  const printWindow = window.open(fileUrl.value, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

// Watch for changes in show prop
watch(() => props.show, (newVal) => {
  if (newVal && props.consultationId) {
    loadPrescription();
  } else if (!newVal) {
    // Clean up when modal is closed
    if (fileUrl.value) {
      URL.revokeObjectURL(fileUrl.value);
      fileUrl.value = null;
    }
  }
});

// Load prescription when component is mounted if show is true
onMounted(() => {
  if (props.show && props.consultationId) {
    loadPrescription();
  }
});
</script>

<style scoped>
/* Add any custom styles if needed */
</style>