<template>
  <div class="flex items-center p-6 space-x-6 bg-white rounded-lg shadow-lg">
    <!-- Profile Icon -->
    <div class="flex-shrink-0">
      <div class="flex items-center justify-center w-16 h-16 text-white bg-blue-500 rounded-full">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A12.053 12.053 0 0112 15.5c2.219 0 4.29.601 6.121 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0zM21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
        </svg>
      </div>
    </div>

    <!-- Profile Information -->
    <div class="flex-grow">
      <h1 class="text-lg font-bold text-blue-900">{{ profile?.name }}</h1>
      <div class="grid grid-cols-2 gap-2 mt-2 text-gray-700">
        <p><span class="font-semibold">Role:</span> {{ profile?.role }}</p>
        <p v-if="profile?.age"><span class="font-semibold">Age:</span> {{ profile?.age }}</p>
        <p v-if="profile?.gender"><span class="font-semibold">Gender:</span> {{ profile?.gender }}</p>
        <p v-if="profile?.grade"><span class="font-semibold">Grade:</span> {{ profile?.grade }}</p>
        <p v-if="profile?.section"><span class="font-semibold">Section:</span> {{ profile?.section }}</p>
        <p class="col-span-2" v-if="profile?.email">
          <span class="font-semibold">Email:</span> {{ profile?.email }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useProfile } from '~/composables/useProfile'

const { profile, loading, error, fetchProfile } = useProfile()

const retryFetch = () => { 
  fetchProfile()
}

onMounted(() => {
  fetchProfile()
})
</script>
