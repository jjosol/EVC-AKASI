<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { 
  fetchPostDetails as fetchPostDetailsAPI, 
  getFileUrl 
} from '../../../../services/bulletinService'; // Import the bulletinService functions

// Add at top of script
const EXCEL_MIME_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel.sheet.macroEnabled.12'
];

const isExcelFile = (mimeType) => EXCEL_MIME_TYPES.includes(mimeType);

// Add video error handler like in Post.vue
const handleVideoError = (event, file) => {
  console.error(`Video error for ${file.file_name}:`, event);
  fileLoadErrors.value[file.file_id] = true;
  
  // Check the video URL accessibility
  fetch(getFileUrl(file.file_id))
    .then(response => {
      console.log(`Video ${file.file_id} response:`, 
        response.status, 
        response.headers.get('Content-Type'),
        response.headers.get('Content-Length')
      );
      
      // Check if the content length is reasonable
      const contentLength = response.headers.get('Content-Length');
      if (contentLength) {
        const sizeMB = parseInt(contentLength) / (1024 * 1024);
        console.log(`Video size: ${sizeMB.toFixed(2)} MB`);
        
        if (sizeMB > 50) {
          console.warn(`Large video detected (${sizeMB.toFixed(2)} MB). This may cause playback issues.`);
        }
      }
    })
    .catch(err => console.error(`Fetch error for video ${file.file_id}:`, err));
};

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

const isLoading = ref(true);
const postDetails = ref(props.post);
const fileLoadErrors = ref({});
const pdfLoadError = ref(false);

async function loadPostDetails() {
  try {
    postDetails.value = await fetchPostDetailsAPI(props.post.post_id);
  } catch (error) {
    console.error('Error fetching post details:', error);
  } finally {
    isLoading.value = false;
  }
}

const handleImageError = (file) => {
  console.error(`Failed to load image: ${file.file_name} (ID: ${file.file_id})`);
  fileLoadErrors.value[file.file_id] = true;
  
  // For debugging - check if the URL is accessible
  fetch(getFileUrl(file.file_id))
    .then(response => {
      console.log(`File ${file.file_id} response:`, 
        response.status, 
        response.headers.get('Content-Type')
      );
    })
    .catch(err => console.error(`Fetch error for ${file.file_id}:`, err));
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

onMounted(loadPostDetails);
</script>

<template>
  <div class="relative p-4 bg-white rounded-lg shadow">
    <div class="flex items-center mb-4">
      <PisayLogo alt="Avatar" class="w-20 h-20 rounded-full" />
      <div>
        <div class="text-lg font-semibold">Health Service Unit</div>
        <div class="text-gray-500">{{ new Date(post.created_at).toLocaleString() }}</div>
      </div>
    </div>

    <p v-if="post?.text" class="mb-4 text-gray-700">{{ post?.text }}</p>
    <p v-if="post?.caption" class="mb-4 text-gray-700">{{ post.caption }}</p>
    
    <div class="post-content">
      <div v-if="isLoading" class="text-center">Loading files...</div>
      <div v-else-if="postDetails?.files?.length" class="grid gap-4">
        <div v-for="file in postDetails.files" :key="file.file_id">
          <!-- Images -->
          <div v-if="file.file_type === 'image'" class="relative">
            <img 
              :src="getFileUrl(file.file_id)" 
              :alt="file.file_name" 
              class="h-auto max-w-full rounded-lg shadow-md"
              @error="handleImageError(file)"
            />
            <div v-if="fileLoadErrors[file.file_id]" class="p-4 text-center text-red-500">
              Failed to load image: {{ file.file_name }}
              <div class="mt-2">
                <a 
                  :href="getFileUrl(file.file_id)"
                  class="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                  download
                >
                  Download Instead
                </a>
              </div>
            </div>
          </div>

          <!-- Videos -->
          <div v-else-if="file.file_type === 'video'" class="relative">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-2">
                <Icon icon="mdi:video" class="w-6 h-6 text-blue-500" />
                <span>{{ file.file_name }}</span>
              </div>
              <a 
                :href="getFileUrl(file.file_id)"
                class="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                download
              >
                Download Video
              </a>
            </div>
            <div class="relative">
              <video 
                :src="getFileUrl(file.file_id)" 
                controls
                preload="metadata"
                class="w-full rounded-lg shadow-md"
                @error="(e) => handleVideoError(e, file)"
              >
                Your browser does not support video playback.
              </video>
              <div v-if="fileLoadErrors[file.file_id]" class="p-4 text-center text-red-500">
                Failed to load video: {{ file.file_name }}
                <div class="mt-2">
                  <a 
                    :href="getFileUrl(file.file_id)"
                    class="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                    download
                  >
                    Download Video
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- PDFs -->
          <div v-else-if="getFileViewerComponent(file) === 'pdf'" class="p-4 border rounded-lg shadow-md">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-2">
                <Icon icon="mdi:file-pdf" class="w-6 h-6 text-red-500" />
                <span>{{ file.file_name }}</span>
              </div>
              <a 
                :href="getFileUrl(file.file_id)"
                class="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                target="_blank"
              >
                Open PDF in New Tab
              </a>
            </div>
            <object
              :data="getFileUrl(file.file_id)"
              type="application/pdf"
              class="w-full h-[600px]"
              @error="handleIframeError(file.file_id)"
            >
              <p>
                It appears you don't have a PDF plugin for this browser or the PDF couldn't be loaded.
                You can <a :href="getFileUrl(file.file_id)" download>download the PDF file</a>
                to view it.
              </p>
            </object>
          </div>

          <!-- Office Files -->
          <div v-else-if="getFileViewerComponent(file) === 'office'" class="p-4 border rounded-lg shadow-md">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <Icon :icon="getFileIcon(file.mime_type)" class="w-6 h-6"/>
                <span>{{ file.file_name }}</span>
              </div>
              <a 
                :href="getFileUrl(file.file_id)"
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
                :href="getFileUrl(file.file_id)"
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