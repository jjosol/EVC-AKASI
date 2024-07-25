<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import pisayLogo from '../components/icons/IconSupport.vue';
const route = useRoute();
const links = [
  { path: '/home', label: 'Home' },
  { path: '/bulletin', label: 'Bulletin' },
  { path: '/files', label: 'Files' },
  { path: '/reports', label: 'Reports' },
  { path: '/inventory', label: 'Inventory' },
];
const isActive = (path) => computed(() => route.path === path).value;
</script>

<template>
  <nav class="bg-[#F6F6F6]">
    <div class="flex flex-wrap items-center justify-between max-w-screen-xl p-3 mx-auto">
      <ul class="flex rounded-lg text-1xl md:p-0 md:space-x-8 md:flex-row md:mt-0 md:border-0">
        <pisayLogo width="100" height="100" />
        <li v-for="link in links" :key="link.path">
          <router-link
            :to="link.path"
            class="inline-block p-2 px-6 my-2 rounded-full"
            :class="isActive(link.path) ? 'bg-blue-900 text-white' : 'text-[#2F4A71]'"
          >
            {{ link.label }}
          </router-link>
        </li>
      </ul>
      <div class="flex items-center">
      <input
        type="text"
        placeholder="Search..."
        class="border border-[#2F4A71] rounded-full px-4 py-2 text-black focus:outline-none"
      />
      <button class="ml-5 text-[#2F4A71] focus:outline-none">
        <i class="text-2xl fa-solid fa-magnifying-glass" ></i>
      </button>
    </div>
    </div>
  </nav>
</template>
