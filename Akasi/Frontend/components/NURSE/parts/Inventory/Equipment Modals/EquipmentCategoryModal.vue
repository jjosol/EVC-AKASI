<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black opacity-50" @click="closeModal"></div>
    <div class="z-10 w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
      <h2 class="mb-4 text-lg font-semibold">{{ modalTitle }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label class="block mb-2 text-sm font-medium">Category Name</label>
          <input 
            type="text"
            v-model="newCategory.name"
            class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            placeholder="Enter category name" 
            required
          />
        </div>
        
        <div v-if="formError" class="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
          {{ formError }}
        </div>
        
        <div class="flex justify-end space-x-3">
          <button 
            type="button"
            @click="closeModal"
            class="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button 
            type="submit"
            class="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            {{ props.editItem ? 'Update' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import * as inventoryService from '~/services/inventoryService'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  editItem: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['closeModal', 'addCategory'])

const newCategory = ref({
  equipCategory_id: null,
  name: ''
})

const formError = ref('')

const modalTitle = computed(() => {
  return props.editItem ? 'Edit Equipment Category' : 'Add New Equipment Category'
})

const resetForm = () => {
  newCategory.value = {
    equipCategory_id: props.editItem?.equipCategory_id || null,
    name: ''
  }
  formError.value = ''
}

watch(() => props.editItem, (newVal) => {
  if (newVal) {
    newCategory.value = {
      equipCategory_id: newVal.equipCategory_id, 
      name: newVal.name
    }
  } else {
    resetForm()
  }
}, { immediate: true })

const closeModal = () => {
  resetForm()
  emit('closeModal')
}

const handleSubmit = async () => {
  try {
    formError.value = ''
    
    if (!newCategory.value.name.trim()) {
      formError.value = 'Category name is required'
      return
    }
    
    if (props.editItem) {
      // Update existing category
      await inventoryService.updateEquipmentCategory(
        newCategory.value.equipCategory_id,
        { name: newCategory.value.name }
      )
    } else {
      // Create new category
      await inventoryService.addEquipmentCategory({ name: newCategory.value.name })
    }
    
    // Notify parent and close
    emit('addCategory', newCategory.value)
    closeModal()
  } catch (error) {
    console.error('Error saving equipment category:', error)
    formError.value = error.message || 'Failed to save equipment category'
  }
}
</script>