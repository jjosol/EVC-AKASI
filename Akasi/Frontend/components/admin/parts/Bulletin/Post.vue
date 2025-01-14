<script setup>
// Define props with default values
const props = defineProps({
  post: {
    type: Object,
    default: () => ({
      text: '',
      mediaFiles: []
    })
  }
})

// Or if using data directly
const post = ref({
  text: '',
  mediaFiles: []
})

const emit = defineEmits(['delete-post', 'edit-post']);

function deletePost() {
  emit('delete-post', props.post.post_id);
}

function editPost() {
  emit('edit-post', props.post);
}
</script>

<template>
  <div class="p-4 bg-white rounded-lg shadow">
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

    <div v-if="post?.mediaFiles?.length > 0" class="mb-4">
      <img 
        v-if="post.mediaFiles[0]?.type === 'image'" 
        :src="post.mediaFiles[0]?.src || post.mediaFiles[0]?.preview" 
        alt="Post image" 
        class="w-full rounded-lg" 
      />
      <video 
        v-if="post.mediaFiles[0]?.type === 'video'" 
        controls 
        :src="post.mediaFiles[0]?.src || post.mediaFiles[0]?.preview" 
        class="w-full rounded-lg"
      ></video>
      <a 
        v-if="post.mediaFiles[0]?.type === 'file'" 
        :href="post.mediaFiles[0]?.src || post.mediaFiles[0]?.preview" 
        target="_blank" 
        class="text-blue-500 underline"
      >
        {{ post.mediaFiles[0]?.name }}
      </a>
    </div>

    <div class="flex justify-end space-x-2">
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