<script setup>
//post as a whole
const posts = ref([]);
//for the postmodal
const isModalVisible = ref(false);
//for the post modal
const currentPost = ref(null);

//to replace the old post with the new when editing
function addPost(newPost) {
  //if updating
  if (currentPost.value) {
    const index = posts.value.findIndex(post => post.id === newPost.id);
    if (index !== -1) {
      posts.value[index] = newPost;
    }
  } 
  //if new post
  else {
    posts.value.push({ ...newPost, id: Date.now() });
  }
  closeModal();
}

//remove post
function deletePost(id) {
  posts.value = posts.value.filter(post => post.id !== id);
}

//to open the edit modal
function openEditModal(post) {
  currentPost.value = { ...post };
  isModalVisible.value = true;
}
// to open the new post modal
function openCreateModal() {
  currentPost.value = null;
  isModalVisible.value = true;
}
//close modal (edit and post)
function closeModal() {
  currentPost.value = null;
  isModalVisible.value = false;
}
definePageMeta({
  middleware: 'auth', // Reference your middleware here
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
        <PostModal v-if="isModalVisible" :post="currentPost" @add-post="addPost" @close="closeModal" /> <!--prop:post; emit: addPost, closeModal -->
        <div v-for="post in posts" :key="post.id" class="p-5 mt-5 bg-white rounded shadow">
          <Post :post="post" @delete-post="deletePost" @edit-post="openEditModal" /> <!--prop:post; emit: deletePost, openEditModal-->
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