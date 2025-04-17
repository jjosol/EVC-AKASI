<template>
  <ReportsLayoutA/>
</template>
<script setup>
definePageMeta({
  middleware: 'auth', // Reference your middleware here
  layout: 'main',
  requiredRole: ['nurse'],

});
</script>