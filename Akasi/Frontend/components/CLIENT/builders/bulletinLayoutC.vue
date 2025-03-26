<script setup>
import { ref, onMounted } from 'vue';
import { fetchPosts as fetchPostsAPI, deletePost as deletePostAPI } from '~/services/bulletinService';

const posts = ref([]);
const isModalVisible = ref(false);
const currentPost = ref(null);
const isLoading = ref(true);

// Load posts from API
async function loadPosts() {
  try {
    isLoading.value = true;
    posts.value = await fetchPostsAPI();
  } catch (error) {
    console.error('Error fetching posts:', error);
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadPosts);

// Handle adding or updating a post
async function handleAddPost(newPost) {
  if (currentPost.value) {
    // Handle edit case
    const index = posts.value.findIndex(post => post.post_id === newPost.post_id);
    if (index !== -1) {
      posts.value[index] = newPost;
    }
  } else {
    // For new posts, add it to the top of the list
    posts.value.unshift(newPost);
  }
  closeModal();
}

// Handle post deletion
async function handleDeletePost(id) {
  // Simply remove the post from the array - the API call is already handled in Post component
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
</script>

<template>
  <NuxtLayout>
    <div class="container flex flex-col h-full mx-auto mt-5">
      <!-- <div class="flex items-center justify-center space-x-4 border-[#2f4a71] border-b-2"> 
        <PisayLogo alt="Avatar" class="rounded-full w-25 h-25" />
        <button 
          @click="openCreateModal" 
          class="text-[#2f4a71] text-start bg-transparent border-2 rounded-full px-4 py-2 w-2/3">
          Write a New Post...
        </button>
      </div>
       -->
      <!-- Posts container with scrollable area -->
      <div class="flex-grow pb-6 mt-6 overflow-y-auto">
        <!-- <PostModal v-if="isModalVisible" :post="currentPost" @add-post="handleAddPost" @close="closeModal" /> -->
        
        <div v-if="isLoading" class="flex items-center justify-center h-40">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4a71]"></div>
        </div>
        
        <div v-else-if="posts.length === 0" class="py-10 text-center text-gray-500">
          No posts available. Create your first post!
        </div>
        
        <div v-else>
          <div v-for="post in posts" :key="post.post_id" class="mb-5">
            <PostC :post="post" @delete-post="handleDeletePost" @edit-post="openEditModal" />
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.container {
  max-width: 800px;
  height: calc(100vh - 2rem);
}

/* Hide scrollbar for Chrome, Safari and Opera */
.overflow-y-auto::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.overflow-y-auto {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>