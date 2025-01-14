<script setup>
definePageMeta({
  middleware: 'auth', // Reference your middleware here
});
</script>
<template>
    <NuxtLayout>
        <Generator/>
    </NuxtLayout>
    
</template>