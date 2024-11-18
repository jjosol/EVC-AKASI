<script setup>
 const route = useRoute();
 
const links = [
  { path: '/home', label: 'Home' },
  { path: '/bulletin', label: 'Bulletin' },
  { path: '/files/student', label: 'Files' },
  { path: '/reports', label: 'Reports' },
  { path: '/inventory', label: 'Inventory' },
];
const isActive = (path) => computed(() => {
  if (route.path === path)  {
    return true;
  }
  else if(path === '/files/student' && route.path === '/files/student' ||path === '/files/student' && route.path === '/files/faculty'||path === '/files/student' && route.path ==='/files/non-teaching-staff'){
    return true;
  }
   else {
    return false;
  }
});
console.log(isActive().value)
</script>
  
<template>
  <div class="fixed top-0 left-0 z-50 h-full font-inter">
    <!-- Left-side Navbar -->
    <nav class="flex flex-col items-center h-full space-y-16 pt-10 w-64 text-white bg-[#e6e6e6]">
      <MidTitle class="text-5xl"/>
      <div class="flex items-center w-full px-4">
        <input
          type="text"
          placeholder="Search..."
          class="border border-[#2F4A71] rounded-full px-4 py-2 text-black focus:outline-none w-full"
        />
        <button class="ml-44 text-[#2F4A71] focus:outline-none absolute">
          <Icon icon="ion:search-sharp" class="text-[#2F4A71] text-4xl"/>
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
      <!-- <a href="#" class="text-2xl hover:text-blue-400">STUDENT</a>
      <a href="#" class="text-2xl hover:text-blue-400">FACULTY</a>
      <a href="#" class="text-2xl text-center hover:text-blue-400">NON-TEACHING STAFF</a> -->
    </nav>
  </div>
</template>
