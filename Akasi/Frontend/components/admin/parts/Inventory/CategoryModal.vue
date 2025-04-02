<script setup>
import { ref, watch, computed } from 'vue'
import * as inventoryService from '~/services/inventoryService';

const props = defineProps({
  isOpen: Boolean,
  editItem: Object
})

const emit = defineEmits(['closeModal', 'addCategory'])

const newCategory = ref({
  category_id: null,
  name: ''
})

const formError = ref('')

const modalTitle = computed(() => {
  return props.editItem ? 'Edit Category' : 'Add New Category'
})

const resetForm = () => {
  newCategory.value = {
    category_id: props.editItem?.category_id || null,
    name: ''
  }
  formError.value = ''
}

watch(() => props.editItem, (newVal) => {
  if (newVal) {
    newCategory.value = {
      category_id: newVal.category_id,
      name: newVal.name
    }
  } else {
    resetForm()
  }
}, { immediate: true })

const validateForm = () => {
  formError.value = ''
  
  if (!newCategory.value.name.trim()) {
    formError.value = 'Category name is required'
    return false
  }
  
  return true
}

const submitForm = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    let result;
    if (props.editItem?.category_id) {
      // Update existing category
      result = await inventoryService.updateCategory(
        props.editItem.category_id, 
        { name: newCategory.value.name }
      );
    } else {
      // Add new category
      result = await inventoryService.addCategory({ 
        name: newCategory.value.name 
      });
    }
    
    emit('addCategory', result);
    resetForm();
  } catch (error) {
    console.error('Error submitting category:', error);
    formError.value = 'Failed to save category';
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black opacity-50" @click="$emit('closeModal')"></div>
    <div class="z-10 w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
      <h2 class="mb-4 text-lg font-semibold">{{ modalTitle }}</h2>
      <form @submit.prevent="submitForm">
        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium">Category Name</label>
          <input 
            type="text" 
            v-model="newCategory.name"
            class="w-full px-3 py-2 border rounded-lg" 
            required 
          />
          <span v-if="formError" class="text-sm text-red-500">{{ formError }}</span>
        </div>
        
        <div class="flex justify-end space-x-2">
          <button 
            type="button"
            @click="$emit('closeModal')"
            class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg"
          >
            Cancel
          </button>
          <button 
            type="submit"
            class="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg"
          >
            {{ props.editItem ? 'Update' : 'Add' }} Category
          </button>
        </div>
      </form>
    </div>
  </div>
</template>