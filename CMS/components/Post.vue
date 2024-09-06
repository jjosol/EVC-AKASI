<script setup>
// import pisayLogo from '../components/icons/IconSupport.vue';
//prop to be used in Bulletin.vue
const props = defineProps({
  post: {
    type: Object,
    required: true
  }
});
//events to be used in Bulletin.vue
const emit = defineEmits(['delete-post', 'edit-post']);

//to delete post
function deletePost() {
  emit('delete-post', props.post.id);
}
//to edit post
function editPost() {
  emit('edit-post', props.post);
}
</script>

<template>
  <div>
    <div class="flex items-center mb-3">
      <IconSupport alt="Avatar" class="w-20 h-20 rounded-full" />
      <div>
        <div class="font-bold">Health Services Unit</div>
        <div class="text-sm text-gray-600">{{ post.date }} at {{ post.time }}</div>
      </div>
    </div>
    <p class="mb-3">{{ post.text }}</p>
    <div v-if="post.mediaFiles.length" class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="file in post.mediaFiles" :key="file.src || file.preview" class="media-item">
        <img v-if="file.type === 'image'" :src="file.src || file.preview" alt="Image" class="object-cover w-full h-full rounded">
        <video v-if="file.type === 'video'" controls :src="file.src || file.preview" class="object-cover w-full h-full rounded"></video>
        <a v-if="file.type === 'file'" :href="file.src || file.preview" target="_blank" class="text-blue-500 underline">{{ file.name }}</a>
      </div>
    </div>
    <button @click="editPost" class="p-2 mt-2 text-white bg-yellow-500 rounded">Edit</button>
    <button @click="deletePost" class="p-2 mt-2 ml-2 text-white bg-red-500 rounded">Delete</button>
  </div>
</template>

<style scoped>
img, video {
  max-width: 100%;
  max-height: 100%;
}
</style>