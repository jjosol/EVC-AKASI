<script setup>
const route = useRoute();
  
  const links = [
    { path: '/files/student', label: 'STUDENT' },
    { path: '/files/faculty', label: 'FACULTY' },
    { path: '/files/non-teaching-staff', label: 'NON-TEACHING STAFF' }
  ];
  const isActive = (path) => computed(() => route.path === path);
  console.log(isActive.value)
</script>

<template>
  <nav class="bg-[#F6F6F6] font-inter">
    <div class="flex flex-wrap items-center justify-between max-w-screen-xl p-3 mx-auto">
      <ul class="flex text-xl rounded-lg md:p-0 md:space-x-8 md:flex-row md:mt-0 md:border-0">
        <PisayLogo width="100" height="100" />
        <li v-for="link in links" :key="link.path">
          <router-link
            :to="link.path"
            class="inline-block p-2 px-6 my-2 "
              :class="isActive(link.path).value 
                ? 'text-[#2F4A71] font-bold border-b-2 border-[#2F4A71]' 
                : 'text-[#2F4A71] hover:border-b-2 hover:border-[#2F4A71]'"
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
