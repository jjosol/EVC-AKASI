<script setup>
import { ref, onMounted } from 'vue';
import { fetchPosts as fetchPostsAPI, deletePost as deletePostAPI } from '~/services/bulletinService';

const posts = ref([]);
const isModalVisible = ref(false);
const currentPost = ref(null);

// Use the service function instead of direct fetch
async function fetchPosts() {
  try {
    posts.value = await fetchPostsAPI();
  } catch (error) {
    console.error('Error fetching posts:', error);
  }
}

onMounted(fetchPosts);

// Modify addPost to properly handle the new post
async function addPost(newPost) {
  if (currentPost.value) {
    try {
      // Enhanced logging to debug what's happening
      console.log("Received updated post:", newPost);
      console.log("Files in updated post:", newPost.files);
      
      // Find the post index
      const index = posts.value.findIndex(post => post.post_id === newPost.post_id);
      
      if (index !== -1) {
        // Force Vue reactivity by creating a new object and replacing the element
        posts.value[index] = { ...newPost };
        
        // Further ensure Vue detects the change by using splice
        // This tells Vue the array was modified
        posts.value = [...posts.value];
        
        console.log("Post updated in local array");
      } else {
        console.warn("Could not find post with ID:", newPost.post_id);
        // Fallback to refetching all posts
        await fetchPosts(); 
      }
    } catch (error) {
      console.error("Error handling post update:", error);
      await fetchPosts();
    }
  } else {
    // For new posts, fetch all posts again
    await fetchPosts();
  }
  closeModal();
}

async function deletePost(id) {
  try {
    await deletePostAPI(id);
    posts.value = posts.value.filter(post => post.post_id !== id);
  } catch (error) {
    console.error(`Error deleting post ${id}:`, error);
  }
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
    <div class="container mx-auto mt-8 px-4 sm:px-0">
      <div class="flex items-center justify-center space-x-6 pb-4 border-[#2f4a71] border-b-2"> 
        <PisayLogo alt="Avatar" class="rounded-full w-20 h-20 md:w-24 md:h-24" />
        <button 
          @click="openCreateModal" 
          class="text-[#2f4a71] text-start bg-transparent border-2 border-[#2f4a71] rounded-full px-6 py-3 w-2/3
                 hover:bg-[#2f4a71] hover:text-white transition-all duration-300 
                 focus:outline-none focus:ring-2 focus:ring-[#2f4a71] focus:ring-opacity-50
                 cursor-pointer transform hover:-translate-y-1">
          Write a New Post...
        </button>
      </div>
      
      <div class="mt-8">
        <PostModal v-if="isModalVisible" :post="currentPost" @add-post="addPost" @close="closeModal" />
        
        <div v-if="posts.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p class="text-lg font-medium">No posts yet</p>
          <p class="mt-2">Create your first bulletin post to get started</p>
        </div>
        
        <transition-group name="post-list" tag="div" class="space-y-6">
          <div 
            v-for="post in posts" 
            :key="post.post_id" 
            class="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Post :post="post" @delete-post="deletePost" @edit-post="openEditModal" />
          </div>
        </transition-group>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.container {
  max-width: 800px;
}

/* Post transition animations */
.post-list-enter-active,
.post-list-leave-active {
  transition: all 0.5s ease;
}

.post-list-enter-from,
.post-list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.post-list-move {
  transition: transform 0.5s ease;
}

/* Button focus style for keyboard navigation */
button:focus-visible {
  outline: 2px solid #2f4a71;
  outline-offset: 2px;
}
</style>