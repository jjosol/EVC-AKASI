<script setup>
import pisayLogo from '../components/icons/IconSupport.vue'
const props = defineProps({
  post: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <div>
    <div class="flex items-center mb-3">
        <pisayLogo alt="Avatar" class="w-20 h-20 rounded-full" />
      <div>
        <div class="font-bold">Health Services Unit</div>
        <div class="text-sm text-gray-600">{{ post.date }} at {{ post.time }}</div>
      </div>
    </div>
    <p class="mb-3">{{ post.text }}</p>
    <img v-if="post.image" :src="post.image" alt="Post Image" class="w-full rounded">
  </div>
</template>

<style scoped>
img {
  max-width: 100%;
}
</style>