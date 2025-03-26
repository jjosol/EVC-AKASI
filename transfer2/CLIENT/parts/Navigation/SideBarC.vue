<script setup>
import { computed, onMounted } from 'vue';

const route = useRoute();

const links = [
  { path: '/bulletin', label: 'Bulletin' },
  { path: '/profile', label: 'Profile' },
  { path: '/services', label: 'Services' },
];

const isActive = (path) => computed(() => {
  if (route.path === path) {
    return true;
  } else if (path === '/bulletin' && route.path === '/bulletin') {
    return true;
  }
   else if (path === '/profile' && route.path === '/profile') {
    return true;
  }
  else if (path === '/services' && route.path === '/services') {
    return true;
  }
   else {
    return false;
  }
});

onMounted(() => {
  console.log(isActive(links[0].path).value);
});
</script>

<template>
  <div class="fixed top-0 left-0 z-50 h-full font-inter">
    <!-- Left-side Navbar -->
    <nav class="flex flex-col items-center h-full space-y-16 pt-10 w-64 text-white bg-[#f8f4ff]">
      <MidTitle class="text-5xl" />
      
      <ul v-for="link in links" :key="link.path">
        <router-link
          :to="link.path"
          class="px-5 py-3 text-xl text-center rounded-full"
          :class="isActive(link.path).value ? 'bg-blue-900  text-white' : 'text-[#2F4A71] hover:bg-blue-900 hover:text-white '"
        >
          {{ link.label }}
        </router-link>
      </ul>
      <Logout />
    </nav>
  </div>
</template>
