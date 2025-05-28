<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { fetchPosts as fetchPostsAPI, deletePost as deletePostAPI } from '~/services/bulletinService';

const posts = ref([]);
const isModalVisible = ref(false);
const currentPost = ref(null);
const isLoading = ref(true);
const autoRefreshInterval = ref(null);
const lastFetchTime = ref(Date.now());

// Use the service function with enhanced error handling
async function fetchPosts() {
  try {
    isLoading.value = true;
    const newPosts = await fetchPostsAPI();
    
    // Only update if there are actual changes to avoid unnecessary re-renders
    if (JSON.stringify(newPosts) !== JSON.stringify(posts.value)) {
      posts.value = newPosts;
      lastFetchTime.value = Date.now();
      console.log('Posts updated:', newPosts.length, 'posts loaded');
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    // Show user-friendly error message
    if (error.message.includes('fetch')) {
      console.warn('Network error - will retry in background');
    }
  } finally {
    isLoading.value = false;
  }
}

// Auto-refresh posts every 30 seconds when tab is visible
function startAutoRefresh() {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value);
  }
  
  autoRefreshInterval.value = setInterval(async () => {
    if (document.visibilityState === 'visible' && !isModalVisible.value) {
      await fetchPosts();
    }
  }, 30000); // 30 seconds
}

function stopAutoRefresh() {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value);
    autoRefreshInterval.value = null;
  }
}

onMounted(async () => {
  await fetchPosts();
  startAutoRefresh();
  
  // Listen for visibility changes to pause/resume auto-refresh
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  });
});

onUnmounted(() => {
  stopAutoRefresh();
});

// Enhanced addPost with better reactivity
async function addPost(newPost) {
  const isNewPost = !currentPost.value;
  
  if (currentPost.value) {
    // This is an edit operation - update immediately for better UX
    try {
      console.log("Received updated post:", newPost);
      
      const index = posts.value.findIndex(post => post.post_id === newPost.post_id);
      
      if (index !== -1) {
        // Use Vue's reactivity properly
        posts.value[index] = { ...newPost };
        
        // Force reactivity update
        await nextTick();
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
    // New post creation - add to beginning of array for immediate feedback
    posts.value.unshift(newPost);
    
    // Refresh in background to ensure consistency
    setTimeout(async () => {
      await fetchPosts();
    }, 1000);
  }
  
  closeModal();
  
  // Auto-refresh browser only for new posts to show server-processed content
  if (isNewPost) {
    console.log("Auto-refreshing browser after new bulletin post creation...");
    setTimeout(() => {
      window.location.reload();
    }, 1500); // Slightly longer delay for better UX
  }
}

async function deletePost(id) {
  try {
    // Optimistic update - remove from UI immediately
    const originalPosts = [...posts.value];
    posts.value = posts.value.filter(post => post.post_id !== id);
    
    // Perform actual deletion
    await deletePostAPI(id);
    console.log(`Post ${id} deleted successfully`);
  } catch (error) {
    console.error(`Error deleting post ${id}:`, error);
    // Revert optimistic update on error
    posts.value = originalPosts;
    
    // Show user feedback
    alert('Failed to delete post. Please try again.');
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
    <div class="bulletin-container">
      <!-- Header section with responsive layout -->
      <div class="bulletin-header">
        <PisayLogo alt="Avatar" class="bulletin-avatar" />
        <button 
          @click="openCreateModal" 
          class="create-post-btn">
          <span class="hidden sm:inline">Write a New Post...</span>
          <span class="sm:hidden">New Post</span>
        </button>
      </div>
      
      <div class="bulletin-content">
        <PostModal v-if="isModalVisible" :post="currentPost" @add-post="addPost" @close="closeModal" />
        
        <!-- Empty state -->
        <div v-if="posts.length === 0" class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" class="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p class="empty-title">No posts yet</p>
          <p class="empty-description">Create your first bulletin post to get started</p>
        </div>
        
        <!-- Posts list -->
        <transition-group name="post-list" tag="div" class="posts-container">
          <div 
            v-for="post in posts" 
            :key="post.post_id" 
            class="post-card"
          >
            <Post :post="post" @delete-post="deletePost" @edit-post="openEditModal" />
          </div>
        </transition-group>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.bulletin-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
  min-height: 100vh;
}

/* Header styling */
.bulletin-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #2f4a71;
  margin-bottom: 2rem;
}

.bulletin-avatar {
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.create-post-btn {
  flex: 1;
  max-width: 500px;
  color: #2f4a71;
  background: transparent;
  border: 2px solid #2f4a71;
  border-radius: 9999px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  text-align: left;
  transition: all 0.3s ease;
  cursor: pointer;
  outline: none;
}

.create-post-btn:hover {
  background-color: #2f4a71;
  color: white;
  transform: translateY(-2px);
}

.create-post-btn:focus {
  box-shadow: 0 0 0 3px rgba(47, 74, 113, 0.3);
}

/* Posts container */
.posts-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.post-card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.post-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  margin-bottom: 1rem;
  color: #d1d5db;
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.empty-description {
  font-size: 0.875rem;
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

/* Mobile responsive design */
@media (max-width: 768px) {
  .bulletin-container {
    padding: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .bulletin-header {
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }
  
  .bulletin-avatar {
    width: 4rem;
    height: 4rem;
  }
  
  .create-post-btn {
    font-size: 0.875rem;
    padding: 0.625rem 1rem;
  }
  
  .post-card {
    padding: 1rem;
  }
  
  .empty-state {
    padding: 2rem 1rem;
  }
}

@media (max-width: 480px) {
  .bulletin-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }
  
  .create-post-btn {
    width: 100%;
    text-align: center;
  }
  
  .bulletin-container {
    padding: 0.25rem;
  }
  
  .post-card {
    padding: 0.75rem;
    border-radius: 0.5rem;
  }
}

/* Focus styles for accessibility */
button:focus-visible {
  outline: 2px solid #2f4a71;
  outline-offset: 2px;
}

/* Content adjustments */
.bulletin-content {
  position: relative;
}

/* Loading states */
.bulletin-container.loading {
  opacity: 0.7;
  pointer-events: none;
}
</style>