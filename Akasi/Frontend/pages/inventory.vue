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
const displayInvRef = ref(null)

const openModal = (data = {}) => {
  if (data.isNewBatch) {
    currentItem.value = { name: data.medicineName, isNewBatch: true }
  } else {
    currentItem.value = null
  }
  isModalOpen.value = true
}

const editModal = (item) => {
  currentItem.value = item
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  currentItem.value = null
}

const handleAddItem = async (item) => {
  await displayInvRef.value?.refreshInventory()
  closeModal()
}
</script>