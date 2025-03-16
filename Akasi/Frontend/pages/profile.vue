<template>
    <profileLayout/>
</template>
<script setup>
definePageMeta({
  middleware: 'auth', // Reference your middleware here
  layout: 'main',
  requiredRole: ['admin', 'client'],

});
</script>