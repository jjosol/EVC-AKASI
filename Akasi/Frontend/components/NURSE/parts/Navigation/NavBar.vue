<script setup>
import { computed, onMounted } from 'vue';

const route = useRoute();

const links = [
  { path: '/files/student', label: 'STUDENT' },
  { path: '/files/faculty', label: 'FACULTY' },
  { path: '/files/non-teaching-staff', label: 'NON-TEACHING STAFF' }
];

const isActive = (path) => computed(() => route.path === path);

onMounted(() => {
  console.log(isActive(links[0].path).value); // Example usage: log the active state of the first link
});
</script>

<template>
  <nav class="font-inter border-b border-[#2F4A71]">
    <div class="flex flex-wrap items-center justify-between max-w-screen-xl p-3 mx-auto">
      <ul class="flex text-xl rounded-lg md:p-0 md:space-x-8 md:flex-row md:mt-0 md:border-0 nav-list">
        <li v-for="link in links" :key="link.path">
          <router-link
            :to="link.path"
            class="inline-block p-2 px-6 my-2 nav-link"
            :class="isActive(link.path).value
              ? 'text-[#2F4A71] font-bold border-b-2 border-[#2F4A71]'
              : 'text-[#2F4A71] hover:border-b-2 hover:border-[#2F4A71]'"
          >
            {{ link.label }}
          </router-link>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
.nav-list {
  font-size: 1.25rem;
}
.nav-link {
  padding: 0.5rem 1.5rem;
  font-size: 1.25rem;
}
@media (max-width: 768px) {
  .nav-list {
    font-size: 1rem;
    flex-direction: column;
    gap: 0.25rem;
  }
  .nav-link {
    padding: 0.25rem 0.75rem;
    font-size: 1rem;
  }
}
@media (max-width: 480px) {
  .nav-list {
    font-size: 0.95rem;
    flex-direction: column;
    gap: 0.1rem;
  }
  .nav-link {
    padding: 0.15rem 0.5rem;
    font-size: 0.95rem;
  }
}
</style>
