<template>
    <div class="min-h-screen p-8 bg-white">
      <div class="max-w-4xl mx-auto">
        <div v-if="loading" class="text-center">
          Loading profile... 
        </div>
        <div v-else-if="error" class="text-red">
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
import ProfileFiles from '../../PATIENT/parts/Profile/profileFiles.vue'
import { useProfile } from '~/composables/useProfile'
import { useAuth } from '~/composables/useAuth';
const {isClient } = useAuth();

definePageMeta({
  layout: 'main',
  middleware: 'auth',
  requiredRole: ['nurse', 'client'],
})

const { loading, error, fetchProfile } = useProfile()

onMounted(() => {
  fetchProfile()
})
</script>