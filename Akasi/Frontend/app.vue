<template>
  <NuxtLayout>  
    <NuxtPage/>
  </NuxtLayout>
</template>

<script setup>
// Create a reactive variable to store the list of admins
const admins = ref([])

// Fetch the admins from the backend API
const fetchAdmins = async () => {
  try {
    const response = await fetch('http://localhost:3001/admins')  // Make sure the URL matches your NestJS API
    if (response.ok) {
      admins.value = await response.json()
      console.log(admins.value)
    } else {
      console.error('Failed to fetch admins:', response.statusText)
    }
  } catch (error) {
    console.error('Error fetching admins:', error)
  }
}

// Fetch the data when the component is mounted
onMounted(() => {
  fetchAdmins()
})
</script>
