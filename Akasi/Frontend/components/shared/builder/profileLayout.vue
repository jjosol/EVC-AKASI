<template>
  <NuxtLayout name="default">
    <div class="min-h-screen p-8 bg-gray-100">
      <div class="max-w-4xl mx-auto">
        <div v-if="loading" class="text-center">
          Loading profile...
        </div>
        <div v-else-if="error" class="text-red-500">
          {{ error }}
        </div>
        <template v-else>
          <ProfileHeader />
          <ProfileFiles />
        </template>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import ProfileHeader from '../parts/profileInformation.vue'
import ProfileFiles from '../parts/profileFiles.vue'
import { useProfile } from '~/composables/useProfile'

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const { loading, error, fetchProfile } = useProfile()

onMounted(() => {
  fetchProfile()
})
</script>