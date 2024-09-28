<template>
  <NuxtPage />
</template>

<script setup>
import { ref, onMounted } from 'vue';

const users = ref([]);
const userIds = ref([]); // Initialize userIds as a ref

onMounted(async () => {
  try {
    // Fetch admins from the API
    users.value = await $fetch('/api/getAdmins');

    // Log the fetched users to check the data structure
    console.log('Fetched Users:', users.value); // Check what is fetched
    
    // Extract all user IDs and log each admin's details
    users.value.forEach(user => {
      console.log('Admin ID:', user.admin_id); // Log admin ID
      console.log('Username:', user.username); // Log username
      console.log('Email:', user.gmail); // Log email
      // If you want to log the password, do so carefully as it should generally be kept secure
      console.log('Password:', user.password); // Log password
    });

    // You can also store user IDs if needed
    userIds.value = users.value.map(user => user.admin_id);
    
  } catch (error) {
    console.error('Error fetching users:', error);
  }
});
</script>
