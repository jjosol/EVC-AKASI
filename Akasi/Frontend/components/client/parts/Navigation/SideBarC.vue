<script setup>
import { computed, onMounted } from 'vue';
import { useProfile } from '~/composables/useProfile';

const route = useRoute();
const { profile, loading: profileLoading, fetchProfile } = useProfile();

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
  <div class="fixed top-0 left-0 z-50 h-full font-inter">
    <nav class="flex flex-col items-center h-full py-10 w-64 text-white bg-[#2F4A71] shadow-lg">
      <div class="mb-12">
        <MidTitle class="text-5xl"/>
      </div>
      
      <div class="flex flex-col space-y-5 w-full px-6">
        <!-- Regular navigation links (now using computed property) -->
        <router-link
          v-for="link in links" 
          :key="link.path"
          :to="link.path"
          class="px-5 py-3 text-lg font-medium text-center rounded-full transition-all duration-200 ease-in-out"
          :class="isActive(link.path).value 
            ? 'bg-[#f8f4ff] text-[#4c2f71] shadow-md border-4 border-[#745dab]' 
            : 'text-white hover:bg-[#f8f4ff] hover:text-[#2F4A71]'"
        >
          {{ link.label }}
        </router-link>
        
        <!-- Enhanced Profile button - INLINE VERSION -->
        <router-link
          :to="profileLink.path"
          class="transition-all duration-200 ease-in-out rounded-full"
          :class="isActive(profileLink.path).value 
            ? 'bg-[#f8f4ff] text-[#4c2f71] shadow-md border-4 border-[#745dab]' 
            : 'text-white hover:bg-[#f8f4ff] hover:text-[#2F4A71]'"
        >
          <div class="flex flex-row items-center py-3 px-5">
            <!-- Profile avatar -->
            <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0" 
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
              <span class="text-xs" 
                    :class="isActive(profileLink.path).value ? 'text-[#4c2f71]/80' : 'text-white/80'">
                {{ profile?.category || 'Client' }}
              </span>
            </div>
          </div>
        </router-link>
      </div>
      
    </nav>
  </div>
</template>