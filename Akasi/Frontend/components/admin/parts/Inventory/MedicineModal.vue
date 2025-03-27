<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import * as inventoryService from '~/services/inventoryService';
const props = defineProps({
  isOpen: Boolean,
  editItem: Object,
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['closeModal', 'addItem', 'fetchCategories'])

const newItem = ref({
  med_id: null,
  name: '',
  expirationDate: '',
  count: 0,
  category_id: null
})

const formErrors = ref({
  name: '',
  expirationDate: '',
  count: '',
  category_id: ''
})

const modalTitle = computed(() => {
  return props.editItem ? 'Edit Item' : 'Add New Item';
})

// Add this computed property to determine when category field should be disabled
const isCategoryDisabled = computed(() => {
  // Disable when adding new batch or adding medicine to specific category
  return props.editItem?.isNewBatch || props.editItem?.isNewMedicine
})

// Add this computed property for the name field
const isNameDisabled = computed(() => {
  // Disable name field when adding a new batch of an existing medicine
  return props.editItem?.isNewBatch 
})

const resetForm = () => {
  newItem.value = {
    med_id: null,
    name: '',
    expirationDate: '',
    count: 0,
    category_id: null
  }
}

const validateForm = () => {
  let isValid = true
  
  // Reset errors
  formErrors.value = {
    name: '',
    expirationDate: '',
    count: '',
    category_id: ''
  }

  // Always validate name
  if (!newItem.value.name.trim()) {
    formErrors.value.name = 'Medicine name is required'
    isValid = false
  }

  if (!newItem.value.expirationDate) {
    formErrors.value.expirationDate = 'Expiration date is required'
    isValid = false
  }

  if (!newItem.value.count || newItem.value.count <= 0) {
    formErrors.value.count = 'Count must be greater than 0'
    isValid = false
  }

  if (!newItem.value.category_id) {
    formErrors.value.category_id = 'Category is required'
    isValid = false
  }

  return isValid
}

const submitForm = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    const isUpdate = newItem.value.med_id != null;
    
    if (!isUpdate) {
      const existingItems = await inventoryService.fetchInventoryItems();
      
      // Check if item with same name already exists
      const existingItem = existingItems.find(item => 
        item.medName.toLowerCase() === newItem.value.name.toLowerCase()
      );
      
      if (existingItem) {
        // If item exists, update its count instead
        const result = await inventoryService.increaseInventory(
          existingItem.med_id, 
          {
            medName: existingItem.medName,
            quantity: parseInt(newItem.value.count)
          }
        );
        
        emit('addItem', result);
        resetForm();
        return;
      }
    }
    
    // Continue with normal create/update flow
    let result;
    if (isUpdate) {
      result = await inventoryService.updateInventoryItem(
        newItem.value.med_id,
        newItem.value.name,
        {
          name: newItem.value.name,
          expirationDate: newItem.value.expirationDate,
          count: newItem.value.count,
          category_id: newItem.value.category_id
        }
      );
    } else {
      result = await inventoryService.addInventoryItem({
        name: newItem.value.name,
        expirationDate: newItem.value.expirationDate,
        count: newItem.value.count,
        category_id: newItem.value.category_id
      });
    }
    
    emit('addItem', result);
    resetForm();
  } catch (error) {
    console.error('Error submitting inventory item:', error);
  }
}

watch(() => props.editItem, (newVal) => {
  // Handle medicine items
  if (newVal) {
    if (newVal.isNewBatch) {
      newItem.value = {
        med_id: null,
        name: newVal.medicineName || newVal.name,
        expirationDate: '',
        count: 0,
        category_id: Number(newVal.categoryId) // Convert to number for consistent type
      }
    } else if (newVal.isNewMedicine) {
      newItem.value = {
        med_id: null,
        name: '',
        expirationDate: '',
        count: 0,
        category_id: Number(newVal.categoryId) // Convert to number for consistent type
      }
    } else {
      // Regular edit of existing item
      newItem.value = {
        med_id: newVal.med_id,
        name: newVal.medName || newVal.name,
        expirationDate: newVal.expirationDate,
        count: newVal.count,
        category_id: Number(newVal.category_id)
      }
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// Request fresh category data when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    emit('fetchCategories')
  }
}, { immediate: true })
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black opacity-50" @click="$emit('closeModal')"></div>
    <div class="z-10 w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
      <h2 class="mb-4 text-lg font-semibold">{{ modalTitle }}</h2>
      <form @submit.prevent="submitForm">
        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium">Category</label>
          <select 
            v-model="newItem.category_id" 
            class="w-full px-3 py-2 border rounded-lg"
            required
            :disabled="isCategoryDisabled"
          >
            <option value="">Select Category</option>
            <option v-for="category in props.categories" :key="category.category_id" :value="category.category_id">
              {{ category.name }}
            </option>
          </select>
          <span v-if="formErrors.category_id" class="text-sm text-red-500">{{ formErrors.category_id }}</span>
        </div>
        
        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium">Medicine Name</label>
          <input 
            type="text" 
            v-model="newItem.name"
            class="w-full px-3 py-2 border rounded-lg" 
            required
            :disabled="isNameDisabled"
          />
          <span v-if="formErrors.name" class="text-sm text-red-500">{{ formErrors.name }}</span>
        </div>

        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium">Expiration Date</label>
          <input 
            type="date" 
            v-model="newItem.expirationDate"
            class="w-full px-3 py-2 border rounded-lg" 
            required 
          />
          <span v-if="formErrors.expirationDate" class="text-sm text-red-500">{{ formErrors.expirationDate }}</span>
        </div>

        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium">Count</label>
          <input 
            type="number" 
            v-model="newItem.count"
            class="w-full px-3 py-2 border rounded-lg" 
            min="1"
            required 
          />
          <span v-if="formErrors.count" class="text-sm text-red-500">{{ formErrors.count }}</span>
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
            {{ props.editItem ? 'Update' : 'Add' }} Item
          </button>
        </div>
      </form>
    </div>
  </div>
</template>