<script setup>
import { ref, onMounted } from 'vue';
import PostClient from '../parts/Bulletin/PostClient.vue';
import Post from '~/components/admin/parts/Bulletin/Post.vue';

const posts = ref([]);
const isModalVisible = ref(false);
const currentPost = ref(null);

// Add fetchPosts function to make it reusable
async function fetchPosts() {
    const response = await fetch('http://localhost:3001/posts');
    posts.value = await response.json();
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
        <div class="container mx-auto mt-5">
        <div>
            <div v-for="post in posts" :key="post.post_id" class="p-5 mt-5 bg-white rounded shadow">
            <PostClient :post="post" />
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