<template>
  <NuxtLayout>
    <!-- Add a container with top padding to prevent navbar overlap -->
    <div class="pl-24"> <!-- Adjust the pt (padding-top) value based on your navbar height -->
      <DisplayDiagnosis 
        ref="displayDiagnosisRef"
        @openModal="openModal"
        @editModal="editModal"
        @openCategoryModal="openCategoryModal"
      />
      <DiagnosisModal 
        :isOpen="isModalOpen && modalType === 'diagnosis'" 
        :editItem="currentItem"
        :categories="categories"
        @closeModal="closeModal"
        @addItem="handleAddItem"
        @fetchCategories="fetchCategories"
      />
      <DiagnosisCategoryModal
        :isOpen="isModalOpen && modalType === 'category'"
        :editItem="currentItem"
        @closeModal="closeModal"
        @addCategory="handleAddCategory"
      />
    </div>
  </NuxtLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as diagnosisService from '~/services/diagnosisService';
definePageMeta({
  middleware: 'auth',
  layout: 'main',
})

const isModalOpen = ref(false)
const currentItem = ref(null)
const displayDiagnosisRef = ref(null)
const modalType = ref('diagnosis') // 'diagnosis' or 'category'
const categories = ref([])

const openModal = (data = {}) => {
  modalType.value = 'diagnosis'
  if (data.isNewDiagnosis) {
    currentItem.value = { 
      isNewDiagnosis: true, 
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
  modalType.value = 'diagnosis'
  currentItem.value = item
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  currentItem.value = null
}

const fetchCategories = async () => {
  try {
    categories.value = await diagnosisService.fetchCategories();
  } catch (error) {
    console.error('Error fetching diagnosis categories:', error);
  }
}

const handleAddItem = async (item) => {
  await displayDiagnosisRef.value?.refreshDiagnoses()
  closeModal()
}

const handleAddCategory = async (category) => {
  // Immediately fetch updated categories after adding/updating one
  await fetchCategories()
  await displayDiagnosisRef.value?.refreshDiagnoses()
  closeModal()
}

onMounted(() => {
  fetchCategories()
})
</script>