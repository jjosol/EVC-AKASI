<script setup>
  const route = useRoute();
  
  const links = [
    { path: '/files/student', label: 'STUDENT' },
    { path: '/files/faculty', label: 'FACULTY' },
    { path: '/files/non-teaching-staff', label: 'NON-TEACHING STAFF' }
  ];
  const isActive = (path) => computed(() => route.path === path).value;
</script>
  
<template>
  <div class="fixed flex h-screen ">
    <!-- Left-side Navbar -->
    <nav class="flex flex-col items-center  space-y-20 pt-10 w-64 text-white bg-[#e6e6e6] font-['DM_Serif_Display']">
      <ul v-for="link in links" :key="link.path">
        <router-link
          :to="link.path"
          class="p-3 text-lg text-center rounded-full"
          :class="isActive(link.path) ? 'bg-blue-900  text-white' : 'text-[#2F4A71]'"
        >
          {{ link.label }}
        </router-link>
      </ul>
      <!-- <a href="#" class="text-2xl hover:text-blue-400">STUDENT</a>
      <a href="#" class="text-2xl hover:text-blue-400">FACULTY</a>
      <a href="#" class="text-2xl text-center hover:text-blue-400">NON-TEACHING STAFF</a> -->
    </nav>
  </div>
</template>
