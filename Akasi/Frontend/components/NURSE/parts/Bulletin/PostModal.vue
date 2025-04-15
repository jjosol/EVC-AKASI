<script setup>
import { ref, watch, onMounted } from 'vue';
import { getFileUrl, createPost, updatePost } from '../../../../services/bulletinService'; // Import the getFileUrl, createPost, and updatePost functions
import { useProfile } from '~/composables/useProfile';

// Add the profile composable to get the current user's information
const { profile, loading: profileLoading, fetchProfile } = useProfile();

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

// Fetch the user profile when component is mounted
onMounted(async () => {
  if (!profile.value) {
    await fetchProfile();
  }
});

watch(() => props.post, (newPost) => {
  if (newPost) {
    localText.value = newPost.text || '';
    
    // Handle existing files from backend
    if (newPost.files && newPost.files.length) {
      localMediaFiles.value = newPost.files.map(file => {
        // Determine file type based on mime_type
        let fileType = 'document';
        if (file.mime_type?.startsWith('image/')) {
          fileType = 'image';
        } else if (file.mime_type?.startsWith('video/')) {
          fileType = 'video';
        } else if (file.mime_type?.startsWith('application/pdf')) {
          fileType = 'pdf';
        }
        
        return {
          type: fileType,
          name: file.file_name,
          // Use proper URL for existing files
          preview: getFileUrl(file.file_id),
          fileId: file.file_id,
          // No file property for existing files
        };
      });
    } else if (newPost.mediaFiles) {
      // Handle locally added files that haven't been uploaded yet
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
  
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // More robust file type detection
      let fileType = 'document';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('video/')) {
        fileType = 'video';
      } else if (file.type.startsWith('application/pdf')) {
        fileType = 'pdf';
      }
      
      localMediaFiles.value.push({
        file: file,
        preview: e.target.result,
        type: fileType,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  });
}

// Improve handleImageError to add more debugging
function handleImageError(e) {
  console.error('Media failed to load:', e.target.src);
  // For images
  if (e.target.tagName.toLowerCase() === 'img') {
    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItaW1hZ2UiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIj48L3JlY3Q+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiPjwvY2lyY2xlPjxwb2x5bGluZSBwb2ludHM9IjIxIDE1IDE2IDEwIDUgMjEiPjwvcG9seWxpbmU+PC9zdmc+';
  }
  // Add fallback content for videos
  if (e.target.tagName.toLowerCase() === 'video') {
    const parent = e.target.parentNode;
    const errorMsg = document.createElement('div');
    errorMsg.className = 'p-4 bg-gray-100 rounded-lg text-center';
    errorMsg.textContent = 'Video cannot be played';
    parent.replaceChild(errorMsg, e.target);
  }
}

// Add a function to check file URLs
function debugFileUrl(file) {
  if (file.fileId) {
    const url = getFileUrl(file.fileId);
    console.log(`Debug: File URL for ${file.name} (ID: ${file.fileId}): ${url}`);
    
    // Test fetch the URL
    fetch(url)
      .then(response => {
        console.log(`URL ${url} responded with status: ${response.status}`);
        if (!response.ok) throw new Error(`Response not OK: ${response.status}`);
        return response.headers.get('Content-Type');
      })
      .then(contentType => {
        console.log(`Content-Type for ${file.name}: ${contentType}`);
      })
      .catch(err => {
        console.error(`Error checking ${url}:`, err);
      });
    
    return url;
  }
  return file.preview;
}

// Add this to debug your files when the component mounts
onMounted(() => {
  if (props.post?.files?.length) {
    console.log('Debugging attached files:', props.post.files);
    props.post.files.forEach(file => {
      debugFileUrl({
        name: file.file_name,
        fileId: file.file_id
      });
    });
  }
});

function removeFile(index) {
  console.log(`Removing file at index ${index}:`, localMediaFiles.value[index]);
  localMediaFiles.value.splice(index, 1);
  console.log(`Files after removal:`, localMediaFiles.value.map(f => f.name || f.fileId));
}

const onSubmit = async () => {
  isLoading.value = true;
  try {
    // Build postData using actual nurse information from profile
    const postData = {
      caption: localText.value
    };
    
    // Use the authenticated nurse's information if available
    if (profile.value && profile.value.type === 'nurse') {
      postData.nurse_id = profile.value.nurse_id.toString();
      postData.username = profile.value.username;
    } else {
      // Fallback values if profile isn't loaded yet or for testing
      postData.nurse_id = '1';
      postData.username = 'nurse';
    }
    
    console.log('Using nurse data:', {
      nurse_id: postData.nurse_id,
      username: postData.username
    });

    // Get only the file objects from localMediaFiles
    const filesToUpload = localMediaFiles.value
      .filter(media => media.file)
      .map(media => media.file);
    
    // Track existing file IDs to keep them associated with the post
    const existingFileIds = localMediaFiles.value
      .filter(media => media.fileId)
      .map(media => media.fileId);
    
    console.log('Submitting update with:', {
      caption: localText.value,
      newFiles: filesToUpload.map(f => f.name),
      existingFileIds: existingFileIds
    });
    
    let result;
    
    if (props.post && props.post.post_id) {
      // Update existing post
      result = await updatePost(
        props.post.post_id,
        postData,
        filesToUpload,
        existingFileIds
      );
      console.log('Update result:', result);
    } else {
      // Create new post
      result = await createPost(postData, filesToUpload);
    }
    
    emit('add-post', result);
    emit('close');
  } catch (err) {
    console.error('Upload/Update error:', err);
    error.value = `Failed to ${props.post ? 'update' : 'upload'} post`;
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
        <h3 class="text-lg font-semibold">Health Services Unit</h3>
        <p class="text-sm text-gray-500">January 31, 2023</p>
      </div>
    </div>
    <div class="flex space-x-2">
      <button @click="resetPost" :disabled="isLoading" 
        class="px-3 py-1 text-[#2f4a71] hover:text-purple-800 transition-colors duration-200 rounded">
        Cancel
      </button>
      <button @click="onSubmit" :disabled="isLoading" 
        class="p-2 text-white bg-[#28436b] hover:bg-purple-600 transition-colors duration-200 rounded">
        {{ isLoading ? 'Posting...' : 'Post' }}
      </button>
    </div>
  </div>

  <!-- Post Caption -->
  <div class="mt-4">
    <textarea 
      v-model="localText" 
      placeholder="Caption" 
      class="w-full p-2 mb-2 border rounded textarea-focus-effect"
    >
    </textarea>
  </div>

  <!-- File Upload and Media Preview Section -->
  <div class="flex items-center justify-between mt-2">
    <label for="file-upload" class="flex items-center space-x-1 text-gray-500 hover:text-[#28436b] cursor-pointer transition-colors duration-200">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
      </svg>
      <span>Attach Files</span>
    </label>
    <input id="file-upload" type="file" @change="handleFileUpload" multiple class="hidden">
  </div>

  <!-- Media Previews -->
  <div class="grid grid-cols-1 gap-4 mt-5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 max-h-60">
    <div v-for="(file, index) in localMediaFiles" :key="index" class="relative group">
      <!-- Image Preview -->
      <div v-if="file.type === 'image'" class="relative aspect-w-16 aspect-h-9">
        <img 
          :src="debugFileUrl(file)"
          :alt="file.name"
          class="object-cover w-full h-full rounded-lg shadow-md"
          @error="handleImageError"
        />
      </div>

      <!-- Video Preview -->
      <div v-else-if="file.type === 'video'" class="relative aspect-w-16 aspect-h-9">
        <video 
          :src="debugFileUrl(file)"
          controls
          class="w-full h-full rounded-lg shadow-md"
          @error="handleImageError"
        >
          Your browser does not support video playback.
        </video>
      </div>

      <!-- PDF Preview -->
      <div v-else-if="file.type === 'pdf'" class="p-4 border rounded-lg shadow-md">
        <div class="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <line x1="10" y1="9" x2="8" y2="9"></line>
          </svg>
          <span class="truncate">{{ file.name }}</span>
        </div>
      </div>

      <!-- Document Preview -->
      <div v-else class="p-4 border rounded-lg shadow-md">
        <div class="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <span class="truncate">{{ file.name }}</span>
        </div>
      </div>

      <!-- Remove Button -->
      <button 
        @click="removeFile(index)" 
        class="absolute p-1 text-white bg-red-500 rounded-full -top-2 -right-2 hover:bg-red-600 hover:scale-110 transform transition-all duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
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

/* Add cursor styling and transitions */
button:not(:disabled) {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.textarea-focus-effect {
  transition: border-color 0.2s ease;
}

.textarea-focus-effect:focus {
  border-color: #7462A9; /* [#28436b] */
  outline: none;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}
</style>