<script setup>
import { ref, onMounted } from 'vue';

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
const fileUrls = ref({});
const isLoading = ref(true);
const postDetails = ref(null);

async function fetchPostDetails() {
  try {
    const response = await fetch(`http://localhost:3001/posts/${props.post.post_id}`);
    if (!response.ok) throw new Error('Failed to fetch post details');
    const data = await response.json();
    postDetails.value = data;
    console.log('Fetched post details:', data);
    
    if (data.files?.length) {
      for (const file of data.files) {
        const url = await displayFile(file);
        if (url) fileUrls.value[file.file_id] = url;
      }
    }
  } catch (error) {
    console.error('Error fetching post details:', error);
  } finally {
    isLoading.value = false;
  }
}

async function deletePost() {
  try {
    isDeleting.value = true;
    const response = await fetch(`http://localhost:3001/posts/${props.post.post_id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Delete failed');
    emit('delete-post', props.post.post_id);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    isDeleting.value = false;
  }
}

function editPost() {
  emit('edit-post', props.post);
}

async function displayFile(file) {
  if (!file?.file_path) {
    console.error('No file path provided');
    return null;
  }

  if (file.file_type === 'image') {
    const fileId = extractFileId(file.file_path);
    // Use thumbnail URL format instead
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }
  return file.file_path;
}

function extractFileId(url) {
  if (!url) return null;
  // Match both /file/d/ and /d/ formats
  const match = url.match(/\/(?:file\/d\/|d\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

onMounted(async () => {
  console.log('Component mounted');
  await fetchPostDetails();
});
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
            <img v-if="file.file_type === 'image' && fileUrls[file.file_id]"
                 :src="fileUrls[file.file_id]"
                 :alt="file.file_name"
                 @load="() => console.log('Image loaded:', file.file_name)"
                 @error="(e) => fileUrls[file.file_id] = file.file_path"
                 class="h-auto max-w-full rounded-lg shadow-md" />
            
            <!-- Files -->
            <a v-else
               :href="fileUrls[file.file_id]"
               target="_blank"
               class="text-blue-500 underline">
              {{ file.file_name }}
            </a>
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
</style>