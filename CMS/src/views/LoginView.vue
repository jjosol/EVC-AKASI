<script setup>
import Header from '../components/Header.vue'
import Title from '../components/Title.vue'
import LoginButton from '../components/LoginButton.vue'
</script>

<template>
  <main class="font-['DM_Serif_Display'] p-10">
    <Header/>
    <Title/>
    <RouterLink :to="{name:'loginform'}"><LoginButton/></RouterLink>
  </main>
</template>
