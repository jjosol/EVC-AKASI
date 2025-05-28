<template>
  <NuxtLayout>
    <!-- Mobile-responsive container -->
    <div class="min-h-screen bg-gray-50">
      <div class="container px-4 py-6 mx-auto sm:px-6 lg:px-8">
        <!-- Mobile-first responsive grid layout -->
        <div class="space-y-6 lg:space-y-8">
          <DisplayMed
            ref="displayInvRef"
            @openModal="openModal"
            @editModal="editModal"
            @refreshNeeded="handleRefreshNeeded"
            @openCategoryModal="openCategoryModal"
          />
          <DisplayEquip
            ref="displayEquipRef"
            @refreshNeeded="refreshInventoryData"
          />
          <InventoryHistory
            ref="historyRef"
          />
        </div>
      </div>
    </div>
    <MedicineModalInv 
      :isOpen="isModalOpen && modalType === 'medicine'" 
      :categories="categories"
      :prefillData="currentItem"
      @closeModal="closeModal"
      @addItem="handleAddItem"
      @fetchCategories="fetchCategories"
      @refreshInventory="refreshInventoryData"
    />
    <CategoryMedModal
      :isOpen="isModalOpen && modalType === 'category'"
      :editItem="currentItem"
      @closeModal="closeModal"
      @addCategory="handleAddCategory"
    />
    <!-- Equipment modals are handled within the DisplayEquip component -->
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
const displayEquipRef = ref(null)
const historyRef = ref(null)
const modalType = ref('medicine') // 'medicine' or 'category'
const categories = ref([])

const openModal = (data = {}) => {
  modalType.value = 'medicine'
  if (data.isNewBatch) {
    currentItem.value = { 
      name: data.medicineName,
      medicineName: data.medicineName,
      isNewBatch: true,
      categoryId: data.categoryId,
      med_id: data.med_id,
      isOTC: data.isOTC
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

// Comprehensive refresh function that updates all components
const refreshInventoryData = async () => {
  console.log("Refreshing all inventory data...")
  
  // Refresh medicine inventory
  if (displayInvRef.value && typeof displayInvRef.value.refreshInventory === 'function') {
    console.log("Refreshing medicine inventory...")
    await displayInvRef.value.refreshInventory()
  }
  
  // Refresh equipment inventory
  if (displayEquipRef.value && typeof displayEquipRef.value.refreshEquipment === 'function') {
    console.log("Refreshing equipment inventory...")
    await displayEquipRef.value.refreshEquipment()
  }
  
  // Refresh history component
  if (historyRef.value) {
    console.log("Refreshing inventory history...")
    if (typeof historyRef.value.fetchInventoryEdits === 'function') {
      await historyRef.value.fetchMedicineEdits() // Fixed function name
    }
    if (typeof historyRef.value.fetchEquipmentEdits === 'function') {
      await historyRef.value.fetchEquipmentEdits()
    }
  }
  
  console.log("All inventory data refreshed!")
}

const handleAddItem = async (item) => {
  await refreshInventoryData()
  closeModal()
}

const handleAddCategory = async (category) => {
  // Immediately fetch updated categories after adding/updating one
  await fetchCategories()
  await refreshInventoryData()
  closeModal()
}

// Handle refresh requests from child components
const handleRefreshNeeded = () => {
  refreshInventoryData()
}

onMounted(() => {
  fetchCategories()
})
</script>