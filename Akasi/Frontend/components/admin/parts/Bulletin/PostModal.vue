<script setup>
import { ref } from 'vue';
// import axios from 'axios';

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

watch(props.post, (newPost) => {
  if (newPost) {
    localText.value = newPost.text || '';
    localMediaFiles.value = newPost.mediaFiles.map(file => ({
      type: file.type,
      name: file.name,
      preview: file.preview || file.src,
      file: file.file || null
    })) || [];
  } else {
    localText.value = '';
    localMediaFiles.value = [];
  }
}, { immediate: true });

function handleFileUpload(event) {
  const files = Array.from(event.target.files);
  
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      localMediaFiles.value.push({
        file: file, // Store the actual file object
        preview: e.target.result,
        type: file.type.split('/')[0],
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  });
}

function removeFile(index) {
  localMediaFiles.value.splice(index, 1);
}

const onSubmit = async () => {
  isLoading.value = true;
  try {
    const formData = new FormData();
    formData.append('admin_id', '1');
    formData.append('username', 'admin');
    formData.append('caption', localText.value);

    // Append actual file objects
    localMediaFiles.value.forEach(media => {
      if (media.file) {
        formData.append('files', media.file);
      }
    });

    const response = await fetch('http://localhost:3001/posts', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    emit('add-post', data);
    emit('close');
  } catch (err) {
    console.error('Upload error:', err);
    error.value = 'Failed to upload post';
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
 <div class="max-w-2xl p-5 mx-auto mt-10 mb-5 bg-transparent rounded">
  <!-- User Info and Action buttons -->
  <div class="flex items-center justify-between">
    <div class="flex items-center">
      <img src="~/assets/logo.svg" alt="Avatar" class="w-20 h-20 rounded-full">
      <div>
        <h3 class="text-lg font-semibold">John Doe</h3>
        <p class="text-sm text-gray-500">January 31, 2023</p>
      </div>
    </div>
    <div class="flex space-x-2">
      <button @click="resetPost" :disabled="isLoading" class="text-purple-600">Cancel</button>
      <button @click="onSubmit" :disabled="isLoading" class="p-2 text-white bg-purple-500 rounded">
        {{ isLoading ? 'Posting...' : 'Post' }}
      </button>
    </div>
  </div>

  <!-- Post Caption -->
  <div class="mt-4">
    <textarea v-model="localText" placeholder="Caption" class="w-full p-2 mb-2 border rounded"></textarea>
  </div>

  <!-- File Upload and Media Preview Section -->
  <div class="flex items-center justify-between mt-2">
    <label for="file-upload" class="flex items-center space-x-1 text-gray-500 cursor-pointer">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
      </svg>
      <span>Attach Files</span>
    </label>
    <input id="file-upload" type="file" @change="handleFileUpload" multiple class="hidden">
  </div>

  <!-- Media Previews -->
  <div class="grid grid-cols-1 gap-4 mt-5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 max-h-60">
    <div v-for="(file, index) in localMediaFiles" :key="file.name" class="relative group">
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
      <div v-else-if="file.type === 'video'" class="relative aspect-w-16 aspect-h-9">
        <video 
          :src="file.preview" 
          controls
          class="w-full h-full rounded-lg shadow-md"
        >
          Your browser does not support video playback.
        </video>
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

<!-- Add loading overlay -->
<div v-if="isLoading" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  <div class="text-white">Uploading...</div>
</div>

<div v-if="error" class="error-message">
  {{ error }}
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