<template>
  <NuxtPage />
</template>

<script setup lang="ts">
import { jwtDecode } from 'jwt-decode'; // Correct import
import { useRouter } from 'vue-router';
import { onMounted } from 'vue'; // Import onMounted lifecycle hook

const router = useRouter();

// Function to check if the token is expired
function checkTokenExpiration() {
  const token = localStorage.getItem('token');
  if (!token) {
    router.push('/login'); // Redirect if no token
    return;
  }

  try {
    const decoded = jwtDecode<any>(token); // Decode token
    const currentTime = Date.now() / 1000;

    if (decoded.exp && decoded.exp < currentTime) {
      localStorage.removeItem('token');
      router.push('/login'); // Redirect if token expired
    }
  } catch (error) {
    console.error('Error decoding token:', error);
    router.push('/login');
  }
}

// Ensure this is run only on the client side
onMounted(() => {
  checkTokenExpiration(); // Initial check
  setInterval(checkTokenExpiration, 30000); // Check every 30 seconds
});
</script>
