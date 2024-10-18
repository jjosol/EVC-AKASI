<template>
    <NuxtLayout>
        <DisplayInv/>
        <AddInv/>
    </NuxtLayout>
   
</template>
<script setup>
definePageMeta({
  middleware: 'auth' // Reference your middleware here
})
</script>