<script setup>
import { useAuth } from '~/composables/useAuth';

definePageMeta({
  middleware: 'auth', 
  requiredRole: ['doctor'],
  layout: 'main',
});

const { isNurse, userRole } = useAuth();

onMounted(() => {
  console.log('User Role:', userRole.value);
});
</script>
<template>
    <dashboardLayout v-if="isNurse"/>
</template>

