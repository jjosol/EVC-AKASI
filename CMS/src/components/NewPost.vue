<script setup>
import { ref } from 'vue';
import icon from '../components/icons/IconSupport.vue'

const text = ref('');
const image = ref(null);

const emit = defineEmits(['add-post']);

function handleFileUpload(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    image.value = e.target.result;
  };
  reader.readAsDataURL(file);
}

function addNewPost() {
  if (text.value) {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    emit('add-post', { text: text.value, image: image.value, date, time });
    text.value = '';
    image.value = null;
  }
}
</script>

<template>
  <div class="p-5 mb-5 bg-white rounded shadow">
    <textarea v-model="text" placeholder="Write something..." class="w-full p-2 mb-2 border rounded"></textarea>
    <input type="file" @change="handleFileUpload" class="mb-2" />
    <button @click="addNewPost" class="p-2 text-white bg-blue-500 rounded">Post</button>
  </div>
</template>

<style scoped>
textarea {
  min-height: 100px;
}
</style>