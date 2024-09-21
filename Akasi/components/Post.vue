<script setup>
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
  <div class="p-4 bg-white rounded-lg shadow-md">
    <!-- Profile section -->
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

    <!-- Post content -->
    <p class="mb-4 text-gray-700">{{ post.text }}</p>

    <!-- Media section -->
    <div v-if="post.mediaFiles.length" class="mb-4 overflow-hidden rounded-lg">
      <img v-if="post.mediaFiles[0].type === 'image'" :src="post.mediaFiles[0].src || post.mediaFiles[0].preview" alt="Post image" class="w-full rounded-lg" />
      <video v-if="post.mediaFiles[0].type === 'video'" controls :src="post.mediaFiles[0].src || post.mediaFiles[0].preview" class="w-full rounded-lg"></video>
      <a v-if="post.mediaFiles[0].type === 'file'" :href="post.mediaFiles[0].src || post.mediaFiles[0].preview" target="_blank" class="text-blue-500 underline">{{ post.mediaFiles[0].name }}</a>
    </div>

    <!-- Buttons for editing and deleting -->
    <div class="flex justify-end space-x-2">
      <!-- <button @click="editPost" class="px-4 py-2 text-white bg-yellow-500 rounded-lg">Edit</button> -->
      <button @click="deletePost" class="px-4 py-2 text-white bg-red-500 rounded-lg">Delete</button>
    </div>
  </div>
</template>

<style scoped>
img, video {
  max-width: 100%;
  max-height: 100%;
}
</style>