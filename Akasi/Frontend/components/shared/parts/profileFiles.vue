<template>
  <div v-if="loading" class="p-6 text-center">
    Loading records...
  </div>
  <div v-else>
    <div class="p-6 mt-6 bg-white rounded-lg shadow-md">
      <h2 class="mb-4 text-xl font-bold">Consultation Records</h2>
      <div v-if="consultationRecords.length === 0" class="text-gray-500">
        No consultation records found
      </div>
      <ul v-else class="list-disc list-inside">
        <li v-for="record in consultationRecords" :key="record.consultation_id">
          {{ formatDate(record.date) }} - {{ record.complaint }}
        </li>
      </ul>
    </div>
    
    <div class="p-6 mt-6 bg-white rounded-lg shadow-md">
      <h2 class="mb-4 text-xl font-bold">Forms and Certificates</h2>
      <div v-if="files.length === 0" class="text-gray-500">
        No files available
      </div>
      <ul v-else class="list-disc list-inside">
        <li v-for="file in files" :key="file.id">
          {{ file.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useProfile } from '~/composables/useProfile'

const { profile } = useProfile()
const loading = ref(true)
const consultationRecords = ref([])
const files = ref([])

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const fetchRecords = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`http://localhost:3001/consultation-records/client/${profile.value?.client_id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (response.ok) {
      consultationRecords.value = await response.json()
    }
  } catch (error) {
    console.error('Error fetching records:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (profile.value) {
    fetchRecords()
  }
})

watch(() => profile.value, (newProfile) => {
  if (newProfile) {
    fetchRecords()
  }
})
</script>