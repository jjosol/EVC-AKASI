<template>
    <div class="min-h-screen p-8 bg-gray-100">
      <div class="max-w-4xl mx-auto">
        <div v-if="loading" class="text-center">
          Loading profile...
        </div>
        <div v-else-if="error" class="text-red-500">
          {{ error }}
        </div>
        <template v-else>
          <ProfileHeader/>
          <ProfileFiles v-if="isClient"/>
        </template>
      </div>
    </div>

</template>

<script setup>
import ProfileHeader from '../parts/profileInformation.vue'
import ProfileFiles from '../../client/parts/Profile/profileFiles.vue'
import { useProfile } from '~/composables/useProfile'
import { useAuth } from '~/composables/useAuth';
const {isClient } = useAuth();

definePageMeta({
  layout: 'main',
  middleware: 'auth',
  requiredRole: ['admin', 'client'],
})

const { loading, error, fetchProfile } = useProfile()

onMounted(() => {
  fetchProfile()
})
</script>