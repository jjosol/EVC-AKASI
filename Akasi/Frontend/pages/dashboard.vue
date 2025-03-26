<script setup>
import { useAuth } from '~/composables/useAuth';

definePageMeta({
  middleware: 'auth', 
  requiredRole: ['manager'],
  layout: 'main',
});

const { isManager, userRole } = useAuth();

onMounted(() => {
  console.log('User Role:', userRole.value);
});
</script>
<template>
    <dashboardLayout v-if="isManager"/>
</template>

