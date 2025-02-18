<script setup>
import { computed, onMounted } from 'vue';

const route = useRoute();

const links = [
  { path: '/bulletin', label: 'Bulletin' },
  { path: '/profile', label: 'Profile' },
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
    <nav class="flex flex-col items-center h-full space-y-16 pt-10 w-64 text-white bg-[#e6e6e6]">
      <MidTitle class="text-5xl" />
      <div class="flex items-center w-full px-4">
        <input
          type="text"
          placeholder="Search..."
          class="border border-[#2F4A71] rounded-full px-4 py-2 text-black focus:outline-none w-full"
        />
        <button class="ml-44 text-[#2F4A71] focus:outline-none absolute">
          <Icon icon="ion:search-sharp" class="text-[#2F4A71] text-4xl" />
        </button>
      </div>
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
