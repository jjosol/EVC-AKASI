<script setup>
import { ref, onMounted } from 'vue';
import PostClient from '../parts/Bulletin/PostClient.vue';
import Post from '~/components/NURSE/parts/Bulletin/Post.vue';

const posts = ref([]);
const isModalVisible = ref(false);
const currentPost = ref(null);
const isLoading = ref(true);

// Add fetchPosts function to make it reusable
async function fetchPosts() {
    isLoading.value = true;
    try {
        const response = await fetch('http://localhost:3001/posts');
        posts.value = await response.json();
    } catch (error) {
        console.error('Error fetching posts:', error);
    } finally {
        isLoading.value = false;
    }
}

onMounted(fetchPosts);

// Modify addPost to properly handle the new post
async function addPost(newPost) {
    if (currentPost.value) {
        // Handle edit case
        const index = posts.value.findIndex(post => post.post_id === newPost.post_id);
        if (index !== -1) {
            posts.value[index] = newPost;
        }
    } else {
        // For new posts, fetch all posts again to ensure we have the latest data
        await fetchPosts();
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
</script>

<template>
    <NuxtLayout>
        <div class="bulletin-container">
            <!-- Loading state -->
            <div v-if="isLoading" class="loading-container">
                <div class="loading-spinner"></div>
                <p class="loading-text">Loading bulletin posts...</p>
            </div>
            
            <!-- Empty state -->
            <div v-else-if="posts.length === 0" class="empty-state">
                <img src="~/assets/logo.svg" alt="Empty bulletin" class="empty-icon" />
                <h3 class="empty-title">No posts yet</h3>
                <p class="empty-description">Check back later for updates from the Health Services Unit.</p>
            </div>
            
            <!-- Posts list -->
            <transition-group v-else name="post-list" tag="div" class="posts-container">
                <div 
                    v-for="post in posts" 
                    :key="post.post_id" 
                    class="post-card"
                >
                    <PostClient :post="post" />
                </div>
            </transition-group>
        </div>
    </NuxtLayout>
</template>

<style scoped>
.bulletin-container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 0 1rem;
}

.posts-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.post-card {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    padding: 1.5rem;
    transition: all 0.3s ease;
}

.post-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Loading animation */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: #28436b;
    animation: spin 1s ease-in-out infinite;
    margin-bottom: 1rem;
}

.loading-text {
    color: #4b5563;
    font-size: 1rem;
}

/* Empty state styling */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 4rem 2rem;
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.empty-icon {
    width: 80px;
    height: 80px;
    margin-bottom: 1rem;
    opacity: 0.5;
}

.empty-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
}

.empty-description {
    color: #6b7280;
    max-width: 400px;
}

/* Transition animations */
.post-list-enter-active,
.post-list-leave-active {
    transition: all 0.3s ease;
}

.post-list-enter-from {
    opacity: 0;
    transform: translateY(30px);
}

.post-list-leave-to {
    opacity: 0;
    transform: translateY(-30px);
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .post-card {
        padding: 1rem;
    }
    
    .empty-state {
        padding: 3rem 1rem;
    }
}
</style>