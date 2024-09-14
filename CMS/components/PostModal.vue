<script setup>
const props = defineProps({
  post: {
    type: Object,
    default: () => null
  }
});

//text content of the post
const localText = ref('');
//file content of the post
const localMediaFiles = ref([]);
//events to be used in Bulletin.vue
const emit = defineEmits(['add-post', 'close']);

//for editing so that it shows whihc files is being edited
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

//handle the files upload
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
//remove the file
function removeFile(index) {
  localMediaFiles.value.splice(index, 1);
}

//creating a new post 
function addNewPost() {
  if (localText.value || localMediaFiles.value.length) {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const post = {
      text: localText.value,
      mediaFiles: localMediaFiles.value.map(file => ({
        type: file.type,
        name: file.name,
        preview: file.preview,
        file: file.file
      })),
      date,
      time
    };
    if (props.post) {
      Object.assign(post, { id: props.post.id });
    }
    emit('add-post', post);
  }
}

//reset when click close
function resetPost() {
  localText.value = '';
  localMediaFiles.value = [];
  emit('close');
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-75">
    <div class="w-full max-w-2xl p-5 mb-5 bg-white rounded shadow">
      <!-- <button @click="resetPost" class="absolute top-0 right-0 p-5 m-5 text-white bg-gray-500 rounded">X</button> -->
      <textarea v-model="localText" placeholder="Write something..." class="w-full p-2 mb-2 border rounded"></textarea>
      <div class="relative mt-5">
        <label for="file-upload" class="p-3 text-white bg-blue-500 rounded cursor-pointer">
          Choose File
        </label>
        <input id="file-upload" type="file" @change="handleFileSelection" multiple class="absolute left-0 w-full opacity-0" />
      </div>

      <div class="grid grid-cols-1 gap-2 mt-5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 max-h-60">
        <div v-for="(file, index) in localMediaFiles" :key="file.name" class="relative">
          <img v-if="file.type === 'image'" :src="file.preview" alt="Image" class="object-cover w-full h-full rounded">
          <video v-if="file.type === 'video'" controls :src="file.preview" class="object-cover w-full h-full rounded"></video>
          <a v-if="file.type === 'file'" :href="file.preview" target="_blank" class="text-blue-500 underline">{{ file.name }}</a>
          <button @click="removeFile(index)" class="absolute p-1 text-white bg-red-500 rounded top-1 right-1">X</button>
        </div>
      </div>
      <button @click="addNewPost" class="p-3 mt-5 text-white bg-blue-500 rounded">Post</button>
      <button @click="resetPost" class="p-3 ml-2 text-white bg-gray-500 rounded">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
textarea {
  min-height: 100px;
}
</style>
