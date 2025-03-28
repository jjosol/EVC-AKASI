<script setup>
import { ref, watch, computed } from 'vue'
import * as inventoryService from '~/services/inventoryService';

const props = defineProps({
  isOpen: Boolean,
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['closeModal', 'addItem', 'fetchCategories'])

const newItem = ref({
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

const todayFormatted = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
})

const resetForm = () => {
  newItem.value = {
    name: '',
    expirationDate: '',
    count: 0,
    category_id: null
  }
}

const validateForm = () => {
  let isValid = true
  formErrors.value = { name: '', expirationDate: '', count: '', category_id: '' }

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
  if (!validateForm()) return;

  try {
    const result = await inventoryService.addInventoryItem({
      name: newItem.value.name,
      expirationDate: newItem.value.expirationDate,
      count: newItem.value.count,
      category_id: newItem.value.category_id,
    });
    
    emit('addItem', result);
    resetForm();
  } catch (error) {
    console.error('Error submitting inventory item:', error);
  }
}

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm();
    emit('fetchCategories')
  }
}, { immediate: true })

const isExpiringSoon = (expirationDate) => {
  if (!expirationDate) return false;
  const expDate = new Date(expirationDate);
  const today = new Date();
  const daysDiff = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
  return daysDiff >= 0 && daysDiff <= 30;
};

const isExpired = (expirationDate) => {
  if (!expirationDate) return false;
  const expDate = new Date(expirationDate);
  const today = new Date();
  return expDate < today;
};

const formatDate = inventoryService.formatDate;
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black opacity-50" @click="$emit('closeModal')"></div>
    <div class="z-10 w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
      <h2 class="mb-4 text-lg font-semibold">Add New Item</h2>
      <form @submit.prevent="submitForm">
        <div>
          <div class="mb-4">
            <label class="block mb-1 text-sm font-medium">Category</label>
            <select 
              v-model="newItem.category_id" 
              class="w-full px-3 py-2 border rounded-lg"
              required
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
            />
            <span v-if="formErrors.name" class="text-sm text-red-500">{{ formErrors.name }}</span>
          </div>
          <div class="mb-4">
            <label class="block mb-1 text-sm font-medium">Expiration Date</label>
            <div class="relative">
              <input 
                type="date" 
                v-model="newItem.expirationDate"
                class="w-full px-3 py-2 border rounded-lg" 
                :class="{'border-red-500': isExpired(newItem.expirationDate)}"
                required 
              />
              <span v-if="isExpired(newItem.expirationDate)" 
                    class="absolute right-3 top-2.5 text-red-500 font-bold" 
                    title="Expired">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </span>
            </div>
            <span v-if="isExpired(newItem.expirationDate)" class="text-sm text-red-500">
              Warning: This medicine is expired
            </span>
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
            Add Item
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.expiring-soon {
  background-color: #fff3cd;
}
.expired {
  background-color: #f8d7da;
  border: 1px solid #f5c2c7;
}
</style>