<template>
  <homeLayoutD/>
</template>

<script setup>
import homeLayoutD from '~/components/DOCTOR/builder/homeLayoutD.vue';

definePageMeta({
  middleware: 'auth',
  layout: 'main',
  requiredRole: ['doctor'] // Only allow doctors to access this page
});
</script>