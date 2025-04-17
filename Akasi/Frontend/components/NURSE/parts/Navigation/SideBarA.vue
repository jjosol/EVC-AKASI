<script setup>
import { computed, onMounted } from 'vue';
import { useProfile } from '~/composables/useProfile';

const route = useRoute();
const { profile, loading: profileLoading, fetchProfile } = useProfile();

const links = [
  { path: '/home', label: 'Home' },
  { path: '/bulletin', label: 'Bulletin' },
  { path: '/files/student', label: 'Files' },
  { path: '/reports', label: 'Reports' },
  { path: '/inventory', label: 'Inventory' },
  { path: '/dashboard', label: 'Dashboard'}
];

// Separate profile link for special formatting
const profileLink = { path: '/profile', label: 'Profile' };

const isActive = (path) => computed(() => {
  if (route.path === path) {
    return true;
  } else if (path === '/files/student' && (route.path === '/files/student' || route.path === '/files/faculty' || route.path === '/files/non-teaching-staff')) {
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
    <nav class="flex flex-col items-center h-full py-10 w-64 text-white bg-[#2F4A71] shadow-right">
      <div class="mb-12">
        <MidTitle class="text-5xl"/>
      </div>
      
      <div class="flex flex-col w-full px-6 space-y-5">
        <!-- Regular navigation links -->
        <router-link
          v-for="link in links" 
          :key="link.path"
          :to="link.path"
          class="px-5 py-3 text-lg font-medium text-center transition-all duration-200 ease-in-out rounded-full"
          :class="isActive(link.path).value 
            ? 'bg-[#f8f4ff] text-[#4c2f71] shadow-md border-4 border-[#745dab]' 
            : 'text-white hover:bg-[#f8f4ff] hover:text-[#2F4A71]'"
        >
          {{ link.label }}
        </router-link>
        
        <!-- Enhanced Profile button - INLINE VERSION -->
      <router-link
        :to="profileLink.path"
        class="transition-all duration-200 ease-in-out rounded-3xl"
        :class="isActive(profileLink.path).value 
          ? 'bg-[#f8f4ff] text-[#4c2f71] shadow-md border-4 border-[#745dab]' 
          : 'text-white hover:bg-[#f8f4ff] hover:text-[#2F4A71]'"
      >
        <div class="flex flex-row items-center px-5 py-3">
          <!-- Profile avatar -->
          <div class="flex items-center justify-center flex-shrink-0 w-10 h-10 mr-3 rounded-full" :class="isActive(profileLink.path).value ? 'bg-[#2F4A71]' : 'bg-[#f8f4ff]'">
            <span class="text-lg font-bold" :class="isActive(profileLink.path).value ? 'text-[#f8f4ff]' : 'text-[#2F4A71]'">
              {{ profile?.name?.charAt(0) || '?' }}
            </span>
          </div>
          
          <!-- Name and role in column -->
          <div class="flex flex-col items-start">
            <!-- Profile name -->
            <span class="text-base font-medium leading-tight">
              {{ profile?.name || 'Profile' }}
            </span>
            
            <!-- Role or category -->
            <span class="text-xs" :class="isActive(profileLink.path).value ? 'text-[#4c2f71]/80' : 'text-white/80'">
              {{ profile?.type === 'admin' ? 'Admin' : profile?.category || 'User' }}
            </span>
          </div>
        </div>
      </router-link>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.shadow-right {
  box-shadow: 1px 0 12px 0px rgba(0, 0, 0, 0.5);
}
</style>