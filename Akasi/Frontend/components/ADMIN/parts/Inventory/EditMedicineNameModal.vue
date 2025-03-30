<script setup>
import { ref, watch } from 'vue'
import * as inventoryService from '~/services/inventoryService';

const props = defineProps({
  isOpen: Boolean,
  medicineName: String,
  categoryId: [String, Number]
})

const emit = defineEmits(['closeModal', 'medicineUpdated'])

const newName = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.medicineName) {
    newName.value = props.medicineName
    errorMessage.value = ''
  }
}, { immediate: true })

watch(() => props.medicineName, (value) => {
  if (value) {
    newName.value = value
  }
})

const updateMedicineName = async () => {
  if (!newName.value.trim()) {
    errorMessage.value = 'Medicine name is required'
    return
  }

  if (newName.value === props.medicineName) {
    emit('closeModal')
    return
  }

  try {
    isLoading.value = true
    // Assume the inventoryService has a method to update medicine name
    await inventoryService.updateMedicineName(props.medicineName, newName.value, props.categoryId)
    emit('medicineUpdated')
    emit('closeModal')
  } catch (error) {
    errorMessage.value = error.message || 'Failed to update medicine name'
    console.error('Error updating medicine name:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black opacity-50" @click="$emit('closeModal')"></div>
    <div class="z-10 w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
      <h2 class="mb-4 text-lg font-semibold">Edit Medicine Name</h2>
      <form @submit.prevent="updateMedicineName">
        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium">Medicine Name</label>
          <input 
            type="text" 
            v-model="newName"
            class="w-full px-3 py-2 border rounded-lg" 
            required
            :disabled="isLoading"
          />
          <span v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</span>
        </div>
        <div class="flex justify-end space-x-2">
          <button 
            type="button"
            @click="$emit('closeModal')"
            class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg"
            :disabled="isLoading"
          >
            Cancel
          </button>
          <button 
            type="submit"
            class="px-4 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Updating...' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>