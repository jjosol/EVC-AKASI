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
</script>

<template>
  <nav class="bg-[#F6F6F6]">
    <div class="flex flex-wrap items-center justify-between max-w-screen-xl p-3 mx-auto">
      <ul class="flex rounded-lg text-1xl md:p-0 md:space-x-8 md:flex-row md:mt-0 md:border-0">
        <PisayLogo width="100" height="100" />
        <li v-for="link in links" :key="link.path">
          <router-link
            :to="link.path"
            class="inline-block p-2 px-6 my-2 rounded-full"
            :class="isActive(link.path).value ? 'bg-blue-900 text-white' : 'text-[#2F4A71]'"
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
        <Icon icon="ion:search-sharp" class="text-[#2f4a71] text-4xl"/>
      </button>
    </div>
    </div>
  </nav>
</template>
