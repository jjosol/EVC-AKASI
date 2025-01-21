<script setup>
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

function handleFileSelection(event) {
  const files = Array.from(event.target.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      localMediaFiles.value.push({
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
        name: file.name,
        preview: e.target.result,
        file: file
      });
    };
    reader.readAsDataURL(file);
  });
}

function removeFile(index) {
  localMediaFiles.value.splice(index, 1);
}
async function addNewPost() {
  try {
    isLoading.value = true;
    const formData = new FormData();
    formData.append('admin_id', 1);
    formData.append('username', 'admin');
    formData.append('caption', localText.value);
    
    localMediaFiles.value.forEach(fileObj => {
      if (fileObj.file) {
        formData.append('files', fileObj.file);
      }
    });

    const response = await fetch('http://localhost:3001/posts', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Upload failed');
    emit('close');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    isLoading.value = false;
  }
}
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
      <button @click="addNewPost" :disabled="isLoading" class="p-2 text-white bg-purple-500 rounded">
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
    <input id="file-upload" type="file" @change="handleFileSelection" multiple class="hidden">
  </div>

  <!-- Media Previews -->
  <div class="grid grid-cols-1 gap-2 mt-5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 max-h-60">
    <div v-for="(file, index) in localMediaFiles" :key="file.name" class="relative">
      <img v-if="file.type === 'image'" :src="file.preview" alt="Image" class="object-cover w-full h-full rounded">
      <video v-if="file.type === 'video'" controls :src="file.preview" class="object-cover w-full h-full rounded"></video>
      <a v-if="file.type === 'file'" :href="file.preview" target="_blank" class="text-blue-500 underline">{{ file.name }}</a>
      <button @click="removeFile(index)" class="absolute p-1 text-white bg-red-500 rounded top-1 right-1">X</button>
    </div>
  </div>
</div>

<!-- Add loading overlay -->
<div v-if="isLoading" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
  <div class="text-white">Uploading...</div>
</div>
</template>

<style scoped>
textarea {
  min-height: 100px;
}
</style>