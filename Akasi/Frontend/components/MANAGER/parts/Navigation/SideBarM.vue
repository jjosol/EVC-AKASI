<script setup>
import { computed, onMounted } from 'vue';
import { useProfile } from '~/composables/useProfile';

const route = useRoute();
const { profile, loading: profileLoading, fetchProfile } = useProfile();

const links = [
  { path: '/dashboard', label: 'Dashboard' },
  // Add any other links for managers here
];
const isActive = (path) => computed(() => {
  if (route.path === path) {
    return true;
  } else if (path === '/dashboard' && route.path === '/dashboard') {
    return true;
  } else {
    return false;
  }
});

onMounted(() => {
  fetchProfile();
});
</script>

<template>
  <div class="fixed top-0 left-0 z-50 h-full font-inter">
    <nav class="flex flex-col items-center h-full py-10 w-64 text-white bg-[#2F4A71] shadow-lg">
      <div class="mb-12">
        <MidTitle class="text-5xl"/>
      </div>
      
      <div class="flex flex-col space-y-5 w-full px-6">
        <!-- Regular navigation links -->
        <router-link
          v-for="link in links" 
          :key="link.path"
          :to="link.path"
          class="px-5 py-3 text-lg font-medium text-center rounded-full transition-all duration-200 ease-in-out"
          :class="isActive(link.path).value 
            ? 'bg-[#f8f4ff] text-[#745dab] shadow-md border-4 border-[#745dab]' 
            : 'text-[#f8f4ff] hover:bg-[#f8f4ff] hover:text-[#745dab]'"
        >
          {{ link.label }}
        </router-link>
      
      </div>

      <!-- Logout button at bottom -->
      <div class="mt-auto mb-8">
        <logoutManager/>
      </div>
    </nav>
  </div>
</template>