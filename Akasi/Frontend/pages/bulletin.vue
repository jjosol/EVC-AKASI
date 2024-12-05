<script setup>
import { ref, onMounted } from 'vue';

const posts = ref([]);
const isModalVisible = ref(false);
const currentPost = ref(null);

onMounted(async () => {
  const response = await fetch('http://localhost:3001/posts');
  posts.value = await response.json();
});

function addPost(newPost) {
  if (currentPost.value) {
    const index = posts.value.findIndex(post => post.post_id === newPost.post_id);
    if (index !== -1) {
      posts.value[index] = newPost;
    }
  } else {
    posts.value.push(newPost);
  }
  closeModal();
}

async function deletePost(id) {
  await fetch(`http://localhost:3001/posts/${id}`, {
    method: 'DELETE'
  });
  posts.value = posts.value.filter(post => post.post_id !== id);
}

function openEditModal(post) {
  currentPost.value = { ...post };
  isModalVisible.value = true;
}

function openCreateModal() {
  currentPost.value = null;
  isModalVisible.value = true;
}

function closeModal() {
  currentPost.value = null;
  isModalVisible.value = false;
}

definePageMeta({
  middleware: 'auth',
});
</script>

<template>
  <NuxtLayout>
    <div class="container mx-auto mt-5">
      <div class="flex items-center justify-center space-x-4 border-[#2f4a71] border-b-2"> 
        <!-- Align items in the center but don't force the button to match the logo height -->
        <PisayLogo alt="Avatar" class="rounded-full w-25 h-25" />
        <button 
          @click="openCreateModal" 
          class="text-[#2f4a71] text-start bg-transparent border-2 rounded-full px-4 py-2 w-2/3">
          Write a New Post...
        </button>
      </div>
      <br>
      <br>
      <div>
        <PostModal v-if="isModalVisible" :post="currentPost" @add-post="addPost" @close="closeModal" />
        <div v-for="post in posts" :key="post.post_id" class="p-5 mt-5 bg-white rounded shadow">
          <Post :post="post" @delete-post="deletePost" @edit-post="openEditModal" />
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.container {
  max-width: 800px;
}
</style>