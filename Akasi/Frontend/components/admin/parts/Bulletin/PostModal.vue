<script setup>
import { ref, watch } from 'vue';
import { createPost, updatePost } from '~/services/bulletinService';

const props = defineProps({
  post: {
    type: Object,
    default: () => null
  }
});

const localText = ref('');
const localMediaFiles = ref([]);
const emit = defineEmits(['add-post', 'close']);
const isLoading = ref(false);
const error = ref(null);

const MAX_FILE_SIZE_MB = 50;  // 50MB max file size
const MAX_TOTAL_UPLOAD_MB = 100;  // 100MB max total upload

// Watch for changes in post prop
watch(() => props.post, (newPost) => {
  if (newPost) {
    localText.value = newPost.caption || newPost.text || '';
    
    if (newPost.files && newPost.files.length) {
      // Handle existing files from the database
      localMediaFiles.value = newPost.files.map(file => ({
        type: file.file_type,
        name: file.file_name,
        mime_type: file.mime_type,
        file_id: file.file_id,
        isExisting: true
      }));
    } else if (newPost.mediaFiles) {
      // Handle files from frontend state
      localMediaFiles.value = newPost.mediaFiles.map(file => ({
        type: file.type,
        name: file.name,
        preview: file.preview || file.src,
        file: file.file || null
      }));
    } else {
      localMediaFiles.value = [];
    }
  } else {
    localText.value = '';
    localMediaFiles.value = [];
  }
}, { immediate: true });

function handleFileUpload(event) {
  const files = Array.from(event.target.files);
  let totalSize = localMediaFiles.value.reduce((sum, media) => 
    sum + (media.file?.size || 0), 0) / (1024 * 1024);
    
  for (const file of files) {
    const fileSizeMB = file.size / (1024 * 1024);
    
    // Skip files that are too large
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      error.value = `File ${file.name} exceeds the maximum size of ${MAX_FILE_SIZE_MB}MB`;
      continue;
    }
    
    // Check the accumulated total size
    totalSize += fileSizeMB;
    if (totalSize > MAX_TOTAL_UPLOAD_MB) {
      error.value = `Total upload size exceeds the limit of ${MAX_TOTAL_UPLOAD_MB}MB`;
      break;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const fileType = file.type.split('/')[0];
      
      // For videos, we'll just use a generic preview rather than the actual data
      const preview = fileType === 'video' 
        ? null  // Don't set preview for videos to save memory
        : e.target.result;
        
      localMediaFiles.value.push({
        file: file,
        preview: preview,
        type: fileType,
        name: file.name,
        size: fileSizeMB.toFixed(2) + ' MB'
      });
    };
    
    // For images and smaller files, read as data URL
    // For videos, just add them without preview
    if (file.type.startsWith('video/')) {
      localMediaFiles.value.push({
        file: file,
        preview: null,
        type: 'video',
        name: file.name,
        size: fileSizeMB.toFixed(2) + ' MB'
      });
    } else {
      reader.readAsDataURL(file);
    }
  }
}

function handleImageError() {
  // Handle image load errors
  console.error('Image failed to load');
}

function removeFile(index) {
  localMediaFiles.value.splice(index, 1);
}

const submitPost = async () => {
  // Changed: Allow empty text if files are present
  if (!localText.value.trim() && localMediaFiles.value.length === 0) {
    error.value = "Please enter some text or upload files for your post";
    return;
  }
  
  isLoading.value = true;
  error.value = null;
  
  try {
    const postData = {
      admin_id: '1', // This should come from user context in a real app
      username: 'admin',
      caption: localText.value
    };
    
    const files = localMediaFiles.value
      .filter(media => media.file) // Only include files that have a file object
      .map(media => media.file);
    
    let data;
    
    if (props.post?.post_id) {
      // Update existing post
      data = await updatePost(props.post.post_id, postData, files);
    } else {
      // Create new post
      data = await createPost(postData, files);
    }
    
    emit('add-post', data);
    emit('close');
  } catch (err) {
    console.error('Upload error:', err);
    error.value = 'Failed to upload post: ' + err.message;
  } finally {
    isLoading.value = false;
  }
};

function resetPost() {
  localText.value = '';
  localMediaFiles.value = [];
  emit('close');
}
</script>

<template>
 <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
   <div class="max-w-2xl p-5 mx-auto bg-white rounded shadow-lg w-full md:w-3/4 max-h-[90vh] overflow-y-auto">
    <!-- User Info and Action buttons -->
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <img src="~/assets/logo.svg" alt="Avatar" class="w-16 h-16 rounded-full">
        <div class="ml-3">
          <h3 class="text-lg font-semibold">Health Service Unit</h3>
          <p class="text-sm text-gray-500">{{ new Date().toLocaleDateString() }}</p>
        </div>
      </div>
      <div class="flex space-x-2">
        <button @click="resetPost" :disabled="isLoading" class="text-purple-600 hover:text-purple-800">Cancel</button>
        <button @click="submitPost" :disabled="isLoading" class="p-2 text-white bg-purple-500 rounded hover:bg-purple-600">
          {{ isLoading ? 'Posting...' : props.post?.post_id ? 'Update' : 'Post' }}
        </button>
      </div>
    </div>

    <!-- Post Caption -->
    <div class="mt-4">
      <textarea 
        v-model="localText" 
        placeholder="Caption" 
        class="w-full p-4 mb-2 border rounded min-h-[100px] focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
      ></textarea>
      <div v-if="error" class="mb-2 text-sm text-red-500">{{ error }}</div>
    </div>

    <!-- File Upload and Media Preview Section -->
    <div class="flex items-center justify-between mt-2">
      <label for="file-upload" class="flex items-center space-x-1 text-gray-500 cursor-pointer hover:text-purple-500">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        <span>Attach Files</span>
      </label>
      <input id="file-upload" type="file" @change="handleFileUpload" multiple class="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx">
    </div>

    <!-- Media Previews -->
    <div v-if="localMediaFiles.length > 0" class="grid grid-cols-1 gap-4 mt-5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 max-h-60">
      <div v-for="(file, index) in localMediaFiles" :key="index" class="relative group">
        <!-- Image Preview -->
        <div v-if="file.type === 'image'" class="relative aspect-w-16 aspect-h-9">
          <img 
            :src="file.preview" 
            :alt="file.name"
            class="object-cover w-full h-full rounded-lg shadow-md"
            @error="handleImageError"
          />
        </div>

        <!-- Video Preview -->
        <div v-else-if="file.type === 'video'" class="p-4 border rounded-lg shadow-md">
          <div class="flex items-center space-x-2">
            <Icon icon="mdi:video" class="w-6 h-6 text-blue-500" />
            <span class="truncate">{{ file.name }}</span>
          </div>
          <div class="mt-1 text-xs text-gray-500">Video - {{ file.size }}</div>
        </div>

        <!-- Document Preview -->
        <div v-else class="p-4 border rounded-lg shadow-md">
          <div class="flex items-center space-x-2">
            <Icon icon="mdi:file-document-outline" class="w-6 h-6"/>
            <span class="truncate">{{ file.name }}</span>
          </div>
        </div>

        <!-- Remove Button -->
        <button 
          @click="removeFile(index)" 
          class="absolute p-1 text-white bg-red-500 rounded-full -top-2 -right-2 hover:bg-red-600"
        >
          <Icon icon="mdi:close" class="w-4 h-4"/>
        </button>
      </div>
    </div>
   </div>
 </div>

<!-- Add loading overlay -->
<div v-if="isLoading" class="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-70">
  <div class="p-5 text-center bg-white rounded-lg shadow-lg">
    <div class="w-12 h-12 mx-auto border-b-2 border-purple-500 rounded-full animate-spin"></div>
    <div class="mt-3 text-lg font-medium">Uploading...</div>
  </div>
</div>
</template>

<style scoped>
.aspect-w-16 {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
}

.aspect-w-16 > * {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  object-fit: cover;
}

/* For document preview */
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.error-message {
  color: red;
  margin-top: 1rem;
}
</style>