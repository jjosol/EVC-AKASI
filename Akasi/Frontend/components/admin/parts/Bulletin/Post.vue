<script setup>
import { ref, onMounted, onUnmounted } from 'vue';


// Add at top of script
const EXCEL_MIME_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel.sheet.macroEnabled.12'
];

const isExcelFile = (mimeType) => EXCEL_MIME_TYPES.includes(mimeType);

// Define props with default values
const props = defineProps({
  post: {
    type: Object,
    required: true,
    default: () => ({
      text: '',
      caption: '',
      files: [],
      post_id: null,
      created_at: null
    })
  }
});

const emit = defineEmits(['delete-post', 'edit-post']);

const isDeleting = ref(false);
const isLoading = ref(true);
const postDetails = ref(props.post);
const fileLoadErrors = ref({});
const deleteTimeout = ref(null);
const pdfLoadError = ref(false);

async function fetchPostDetails() {
  try {
    const response = await fetch(`http://localhost:3001/posts/${props.post.post_id}`);
    if (!response.ok) throw new Error('Failed to fetch post details');
    postDetails.value = await response.json();
  } catch (error) {
    console.error('Error fetching post details:', error);
  } finally {
    isLoading.value = false;
  }
}

// Debounced delete function
async function deletePost() {
  if (isDeleting.value) return;
  
  try {
    isDeleting.value = true;
    
    // Clear any existing timeout
    if (deleteTimeout.value) {
      clearTimeout(deleteTimeout.value);
    }
    
    // Set timeout to prevent rapid consecutive calls
    deleteTimeout.value = setTimeout(async () => {
      const response = await fetch(`http://localhost:3001/posts/${props.post.post_id}`, {
        method: 'DELETE'
      });

      if (!response.ok && response.status !== 404) {
        throw new Error('Delete failed');
      }
      
      emit('delete-post', props.post.post_id);
    }, 300);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    isDeleting.value = false;
  }
}

// Clean up on component unmount
onUnmounted(() => {
  if (deleteTimeout.value) {
    clearTimeout(deleteTimeout.value);
  }
});

function editPost() {
  emit('edit-post', props.post);
}

const handleImageError = (file) => {
  fileLoadErrors.value[file.file_id] = true;
};

const handleIframeLoad = (fileId) => {
  fileLoadErrors.value[fileId] = false;
};

const handleIframeError = (fileId) => {
  fileLoadErrors.value[fileId] = true;
};

const getFileViewerComponent = (file) => {
  // Images - Direct display
  if (file.file_type === 'image') {
    return 'image';
  }
  // Videos - Native player
  if (file.file_type === 'video') {
    return 'video';
  }
  // PDFs - Use the native viewer
  if (file.mime_type === 'application/pdf') {
    return 'pdf';
  }
  // Office files - Download only
  if (isOfficeFile(file.mime_type)) {
    return 'office';
  }
  // Other files - Generic download
  return 'other';
};

const isOfficeFile = (mimeType) => {
  return [
    ...EXCEL_MIME_TYPES,
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ].includes(mimeType);
};

const getFileIcon = (mimeType) => {
  if (mimeType.includes('sheet')) return 'mdi:file-excel';
  if (mimeType.includes('word')) return 'mdi:file-word';
  if (mimeType.includes('pdf')) return 'mdi:file-pdf';
  return 'mdi:file-document-outline';
};

onMounted(fetchPostDetails);


</script>

<template>
  <div class="relative p-4 bg-white rounded-lg shadow">
    <div v-if="isDeleting" class="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
      <div class="text-white">Deleting...</div>
    </div>

    <div class="flex items-center mb-4">
      <PisayLogo alt="Avatar" class="w-20 h-20 rounded-full" />
      <div>
        <div class="text-lg font-semibold">Health Service Unit</div>
        <div class="text-gray-500">{{ post.date }}</div>
      </div>
      <button @click="editPost" class="p-2 ml-auto">
        <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2"></circle>
          <circle cx="12" cy="12" r="2"></circle>
          <circle cx="12" cy="19" r="2"></circle>
        </svg>
      </button>
    </div>

    <p class="mb-4 text-gray-700">{{ post?.text }}</p>
    <div class="post-content">
      <p>{{ post.caption }}</p>
      
      <div v-if="isLoading" class="text-center">Loading files...</div>
      <div v-else>
        <div v-if="postDetails?.files?.length" class="grid gap-4">
          <div v-for="file in postDetails.files" :key="file.file_id">
            <!-- Images -->
            <div v-if="file.file_type === 'image'" class="relative">
              <img 
                :src="`http://localhost:3001/files/${file.file_id}`" 
                :alt="file.file_name" 
                class="h-auto max-w-full rounded-lg shadow-md"
                @error="handleImageError(file)"
              />
            </div>

            <!-- Videos -->
            <div v-else-if="file.file_type === 'video'" class="relative">
              <video 
                :src="`http://localhost:3001/files/${file.file_id}`" 
                controls
                class="w-full rounded-lg shadow-md"
              >
                Your browser does not support video playback.
              </video>
            </div>

            <!-- PDFs -->
            <div v-else-if="getFileViewerComponent(file) === 'pdf'" class="p-4 border rounded-lg shadow-md">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-2">
                  <Icon icon="mdi:file-pdf" class="w-6 h-6 text-red-500" />
                  <span>{{ file.file_name }}</span>
                </div>
                <a 
                  :href="`http://localhost:3001/files/${file.file_id}`"
                  class="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                  target="_blank"
                >
                  Open PDF in New Tab
                </a>
              </div>
              <object
                :data="`http://localhost:3001/files/${file.file_id}`"
                type="application/pdf"
                class="w-full h-[600px]"
              >
                <p>
                  It appears you don't have a PDF plugin for this browser.
                  You can <a :href="`http://localhost:3001/files/${file.file_id}`" download>download the PDF file</a>
                  to view it.
                </p>
              </object>
            </div>

            <!-- PDF Files using PDFvuer -->
            <div v-else-if="getFileViewerComponent(file) === 'pdfAlt'" class="p-4 border rounded-lg shadow-md">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-2">
                  <Icon icon="mdi:file-pdf" class="w-6 h-6 text-red-500" />
                  <span>{{ file.file_name }}</span>
                </div>
                <a 
                  :href="`http://localhost:3001/files/${file.file_id}`"
                  class="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                  target="_blank"
                >
                  Open PDF in New Tab
                </a>
              </div>
              <PDFvuer 
                :src="`http://localhost:3001/files/${file.file_id}`" 
                width="100%" 
                height="600px"
                @error="pdfLoadError = true"
              />
              <div v-if="pdfLoadError" class="mt-2 text-red-500">
                Failed to load PDF. <a :href="`http://localhost:3001/files/${file.file_id}`" download>Download PDF</a>
              </div>
            </div>

            <!-- Office Files -->
            <div v-else-if="getFileViewerComponent(file) === 'office'" class="p-4 border rounded-lg shadow-md">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <Icon :icon="getFileIcon(file.mime_type)" class="w-6 h-6"/>
                  <span>{{ file.file_name }}</span>
                </div>
                <a 
                  :href="`http://localhost:3001/files/${file.file_id}`"
                  class="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                  download
                >
                  Download
                </a>
              </div>
            </div>

            <!-- Other Files -->
            <div v-else class="p-4 border rounded-lg shadow-md">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <Icon icon="mdi:file-document-outline" class="w-6 h-6"/>
                  <span>{{ file.file_name }}</span>
                </div>
                <a 
                  :href="`http://localhost:3001/files/${file.file_id}`"
                  class="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                  download
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end space-x-2">
      <button @click="deletePost" 
              :disabled="isDeleting" 
              class="px-4 py-2 text-white bg-red-500 rounded-lg">
        {{ isDeleting ? 'Deleting...' : 'Delete' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
img, video {
  max-width: 100%;
  max-height: 100%;
}

.relative {
  position: relative;
}

.image-loading {
  min-height: 200px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>