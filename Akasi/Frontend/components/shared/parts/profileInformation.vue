<template>
  <div class="p-6 bg-white rounded-lg shadow-md">
    <div v-if="loading" class="text-center">
      Loading profile...
    </div>
    <div v-else-if="error" class="text-red-500">
      {{ error }}
    </div>
    <div v-else>
      <h1 class="mb-4 text-2xl font-bold">PROFILE INFORMATION</h1>
      <div class="space-y-2">
        <p><span class="font-semibold">Name:</span> {{ profile?.name }}</p>
        <p><span class="font-semibold">Role:</span> {{ profile?.role }}</p>
        <p v-if="profile?.age"><span class="font-semibold">Age:</span> {{ profile?.age }}</p>
        <p v-if="profile?.gender"><span class="font-semibold">Gender:</span> {{ profile?.gender }}</p>
        <p v-if="profile?.grade"><span class="font-semibold">Grade:</span> {{ profile?.grade }}</p>
        <p v-if="profile?.section"><span class="font-semibold">Section:</span> {{ profile?.section }}</p>
        <p><span class="font-semibold">Email:</span> {{ profile?.email }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useProfile } from '~/composables/useProfile'

const { profile, loading, error } = useProfile()
</script>