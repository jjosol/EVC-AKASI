<template>
  <NuxtLayout>
    <DisplayInv 
      ref="displayInvRef"
      @openModal="openModal"
      @editModal="editModal"
    />
    <AddInv 
      :isOpen="isModalOpen" 
      :editItem="currentItem"
      :medicinePreset="medicineName"
      @closeModal="closeModal"
      @addItem="handleAddItem"
    />
  </NuxtLayout>
</template>

<script setup>
import { ref } from 'vue'

definePageMeta({
  middleware: 'auth'
})

const isModalOpen = ref(false)
const currentItem = ref(null)
const medicineName = ref('')
const displayInvRef = ref(null)

const openModal = (data) => {
  currentItem.value = null
  medicineName.value = data?.name || ''
  isModalOpen.value = true
}

const editModal = (item) => {
  currentItem.value = item
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  currentItem.value = null
  medicineName.value = ''
}

const handleAddItem = async (item) => {
  await displayInvRef.value?.refreshInventory()
  closeModal()
}
</script>