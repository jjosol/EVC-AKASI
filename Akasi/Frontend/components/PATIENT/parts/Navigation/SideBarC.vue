<script setup>
import { computed, onMounted, inject, ref } from 'vue';
import { useProfile } from '~/composables/useProfile';

const route = useRoute();
const { profile, loading: profileLoading, fetchProfile } = useProfile();

// Get mobile state from parent if available
const sidebarActive = inject('sidebarActive', ref(false));
const isMobile = inject('isMobile', ref(false));

// If sidebar is clicked on mobile, auto-close it when clicking links
const handleLinkClick = () => {
  if (isMobile.value) {
    setTimeout(() => {
      sidebarActive.value = false;
    }, 150); // Small delay for better UX
  }
};

// Define all possible links
const allLinks = [
  { path: '/bulletin', label: 'Bulletin' },
  { path: '/services', label: 'Services' },
];

// Filtered links based on user profile
const links = computed(() => {
  if (!profile.value) return allLinks;

  return allLinks.filter(link => {
    // Hide services link for students with grade 13 or higher
    if (link.path === '/services' &&
      profile.value.category === 'Student' &&
      profile.value.grade >= 13) {
      return false;
    }
    return true;
  });
});

// Separate profile link for special formatting
const profileLink = { path: '/profile', label: 'Profile' };

const isActive = (path) => computed(() => {
  if (route.path === path) {
    return true;
  } else if (path === '/bulletin' && route.path === '/bulletin') {
    return true;
  } else if (path === '/services' && route.path === '/services') {
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
  <nav class="flex flex-col items-center h-full py-10 text-white transition-all duration-300">
    <div class="mb-12">
      <MidTitle class="text-5xl sm:text-4xl" />
    </div>

    <div class="flex flex-col w-full px-6 space-y-5 overflow-y-auto">
      <!-- Regular navigation links (using computed property) -->
      <router-link v-for="link in links" :key="link.path" :to="link.path" @click="handleLinkClick"
        class="px-5 py-3 text-lg font-medium text-center transition-all duration-200 ease-in-out rounded-full" :class="isActive(link.path).value
          ? 'bg-[#f8f4ff] text-[#4c2f71] shadow-md border-4 border-[#745dab]'
          : 'text-white hover:bg-[#f8f4ff] hover:text-[#2F4A71]'">
        {{ link.label }}
      </router-link>

      <!-- Enhanced Profile button -->
      <router-link :to="profileLink.path" @click="handleLinkClick"
        class="transition-all duration-200 ease-in-out rounded-full" :class="isActive(profileLink.path).value
          ? 'bg-[#f8f4ff] text-[#4c2f71] shadow-md border-4 border-[#745dab]'
          : 'text-white hover:bg-[#f8f4ff] hover:text-[#2F4A71]'">
        <div class="flex flex-row items-center px-5 py-3">
          <!-- Profile avatar -->
          <div class="flex items-center justify-center flex-shrink-0 w-10 h-10 mr-3 rounded-full"
            :class="isActive(profileLink.path).value ? 'bg-[#2F4A71]' : 'bg-[#f8f4ff]'">
            <span class="text-lg font-bold"
              :class="isActive(profileLink.path).value ? 'text-[#f8f4ff]' : 'text-[#2F4A71]'">
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
              {{ profile?.category || 'Client' }}
            </span>
          </div>
        </div>
      </router-link>
    </div>
  </nav>
</template>

<style scoped>
.shadow-right {
  box-shadow: 1px 0 12px 0px rgba(0, 0, 0, 0.5);
}
</style>