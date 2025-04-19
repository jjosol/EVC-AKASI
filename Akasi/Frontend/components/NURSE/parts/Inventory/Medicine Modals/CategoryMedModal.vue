<script setup>
import { ref, watch, computed } from 'vue'
import * as inventoryService from '~/services/inventoryService';
import { useProfile } from '~/composables/useProfile'; // Import the profile composable

const props = defineProps({
  isOpen: Boolean,
  editItem: Object
})

const emit = defineEmits(['closeModal', 'addCategory'])
const { profile } = useProfile(); // Get the current nurse profile

const newCategory = ref({
  category_id: null,
  name: ''
})

const formError = ref('')
const showConfirmModal = ref(false)
const confirmationMessage = ref('')

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
      category_id: newVal.category_id || newVal.medCategory_id, // Accept either ID property
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

const prepareSubmit = () => {
  if (!validateForm()) {
    return;
  }

  // For editing existing category, submit directly without confirmation
  if (props.editItem?.category_id || props.editItem?.medCategory_id) {
    submitForm();
    return;
  }
  
  // Only show confirmation for adding new category
  confirmationMessage.value = `Warning: You're about to add a new category "${newCategory.value.name}". This action cannot be undone!`;
  showConfirmModal.value = true;
}

const submitForm = async () => {
  try {
    let result;
    // Check for category ID in either property
    const categoryId = props.editItem?.medCategory_id || props.editItem?.category_id;
    
    if (categoryId) {
      // Update existing category
      result = await inventoryService.updateCategory(
        categoryId, 
        { name: newCategory.value.name }
      );
    } else {
      // Add new category with the nurse ID
      result = await inventoryService.addCategoryWithNurse({ 
        name: newCategory.value.name 
      }, profile.value?.nurse_id);
    }
    
    emit('addCategory', result);
    resetForm();
    
    // Close the modal after successful submission
    showConfirmModal.value = false;
  } catch (error) {
    console.error('Error submitting category:', error);
    formError.value = error.message || 'Failed to save category';
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black opacity-50" @click="$emit('closeModal')"></div>
    <div class="z-10 w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
      <h2 class="mb-4 text-lg font-semibold">{{ modalTitle }}</h2>
      <form @submit.prevent="prepareSubmit">
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
  
  <ConfirmationModal
    :show="showConfirmModal"
    :message="confirmationMessage"
    :confirmButtonText="props.editItem ? 'Update' : 'Add'"
    @confirm="submitForm"
    @cancel="showConfirmModal = false"
  />
</template>