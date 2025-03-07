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

</script>

<template>
  <NuxtLayout>
    <div class="container flex flex-col h-full mx-auto mt-5">
      
      
      <!-- Posts container with scrollable area -->
      <div class="flex-grow pb-6 mt-6 overflow-y-auto">
        <PostModal v-if="isModalVisible" :post="currentPost" @add-post="handleAddPost" @close="closeModal" />
        
        <div v-if="isLoading" class="flex items-center justify-center h-40">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4a71]"></div>
        </div>
        
        <div v-else-if="posts.length === 0" class="py-10 text-center text-gray-500">
          No posts available. Create your first post!
        </div>
        
        <div v-else>
          <div v-for="post in posts" :key="post.post_id" class="mb-5">
            <PostC :post="post"/>
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