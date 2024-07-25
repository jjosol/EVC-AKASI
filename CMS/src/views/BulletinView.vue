<script setup>
import { ref } from 'vue';
import NavBar from '../components/NavBar.vue';
import NewPost from '../components/NewPost.vue';
import Post from '../components/Post.vue';

const posts = ref([]);

function addPost(newPost) {
  posts.value.push({ ...newPost, id: Date.now() });
}
</script>

<template>
  <div>
    <NavBar />
    <div class="container mx-auto mt-5">
      <NewPost @add-post="addPost" />
      <div v-for="post in posts" :key="post.id" class="p-5 mt-5 bg-white rounded shadow">
        <Post :post="post" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
}
</style>