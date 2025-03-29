<template>
  <NuxtLayout>
    <DisplayInv 
      ref="displayInvRef"
      @openModal="openModal"
      @editModal="editModal"
      @openCategoryModal="openCategoryModal"
    />
    <MedicineModal 
      :isOpen="isModalOpen && modalType === 'medicine'" 
      :categories="categories"
      :prefillData="currentItem"
      @closeModal="closeModal"
      @addItem="handleAddItem"
      @fetchCategories="fetchCategories"
    />
    <CategoryModal
      :isOpen="isModalOpen && modalType === 'category'"
      :editItem="currentItem"
      @closeModal="closeModal"
      @addCategory="handleAddCategory"
    />
  </NuxtLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as inventoryService from '~/services/inventoryService';
definePageMeta({
  middleware: 'auth',
  layout: 'main',
})

const isModalOpen = ref(false)
const currentItem = ref(null)
const displayInvRef = ref(null)
const modalType = ref('medicine') // 'medicine' or 'category'
const categories = ref([])

const openModal = (data = {}) => {
  modalType.value = 'medicine'
  if (data.isNewBatch) {
    currentItem.value = { 
      name: data.medicineName, // This should be consistent with what MedicineModal expects
      medicineName: data.medicineName, // Add this line to be consistent
      isNewBatch: true,
      categoryId: data.categoryId
    }
  } else if (data.isNewMedicine) {
    currentItem.value = { 
      isNewMedicine: true, 
      categoryId: data.categoryId 
    }
  } else {
    currentItem.value = null
  }
  isModalOpen.value = true
}

const openCategoryModal = (category = null) => {
  modalType.value = 'category'
  currentItem.value = category
  isModalOpen.value = true
}

const editModal = (item) => {
  modalType.value = 'medicine'
  currentItem.value = item
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  currentItem.value = null
}

const fetchCategories = async () => {
  try {
    categories.value = await inventoryService.fetchCategories();
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
}

const handleAddItem = async (item) => {
  await displayInvRef.value?.refreshInventory()
  closeModal()
}

const handleAddCategory = async (category) => {
  // Immediately fetch updated categories after adding/updating one
  await fetchCategories()
  await displayInvRef.value?.refreshInventory()
  closeModal()
}

onMounted(() => {
  fetchCategories()
})
</script>