<template>
  <div>
    <BulletinLayoutA v-if="isAdmin" />
    <BulletinLayoutC v-else-if="isClient" />
    <div v-else>
      <p>No Bulletin Layout</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';

definePageMeta({
  middleware: 'auth', 
  requiredRole: ['admin', 'client'],
  layout: 'main',
});
const { isAdmin, isClient, userRole } = useAuth();


onMounted(() => {
  console.log('User Role:', userRole.value);
  console.log('Is Admin:', isAdmin.value);
  console.log('Is Client:', isClient.value);
});
</script>