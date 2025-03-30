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