<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  editItem: Object
})

const emit = defineEmits(['closeModal', 'addItem'])

const newItem = ref({
  med_id: null,
  name: '',
  expirationDate: '',
  count: 0
})

const formErrors = ref({
  name: '',
  expirationDate: '', // Add error field for date
  count: ''
})

const resetForm = () => {
  newItem.value = {
    med_id: null,
    name: '',
    expirationDate: '',
    count: 0
  }
}

const validateForm = () => {
  let isValid = true
  formErrors.value = {
    name: '',
    expirationDate: '',
    count: ''
  }

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

  return isValid
}

const submitForm = async () => {
  if (!validateForm()) {
    return
  }

  const isUpdate = newItem.value.med_id != null
  
  if (!isUpdate) {
    const response = await fetch('http://localhost:3001/inventory');
    const existingItems = await response.json();
    
    const duplicateItem = existingItems.find(item => 
      item.medName === newItem.value.name && 
      formatDate(item.expiration) === newItem.value.expirationDate
    );

    if (duplicateItem) {
      if (confirm('An item with the same name and expiration date exists. Do you want to combine quantities?')) {
        const url = `http://localhost:3001/inventory/${duplicateItem.med_id}/${duplicateItem.medName}`;
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: duplicateItem.medName,
            expirationDate: newItem.value.expirationDate,
            count: duplicateItem.count + parseInt(newItem.value.count)
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          emit('addItem', result);
          resetForm();
          emit('closeModal');
        }
        return;
      }
    }
  }
  
  const url = isUpdate 
    ? `http://localhost:3001/inventory/${newItem.value.med_id}/${props.editItem.name}`
    : 'http://localhost:3001/inventory'

  try {
    const response = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newItem.value.name,
        expirationDate: newItem.value.expirationDate || null,
        count: parseInt(newItem.value.count)
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      emit('addItem', result)
      resetForm()
      emit('closeModal')
    }
  } catch (error) {
    console.error('Error submitting form:', error)
  }
}

const formatDate = (dateString) => {
  return dateString ? new Date(dateString).toISOString().split('T')[0] : '';
}

watch(() => props.editItem, (newVal) => {
  if (newVal) {
    newItem.value = {
      med_id: newVal.med_id,
      name: newVal.name,
      expirationDate: newVal.expirationDate,
      count: newVal.count
    }
  } else if (newVal?.isNewBatch) {
    newItem.value = {
      med_id: null,
      name: newVal.name,
      expirationDate: '',
      count: 0
    }
  } else {
    resetForm()
  }
}, { immediate: true })
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black opacity-50" @click="$emit('closeModal')"></div>
    <div class="z-10 w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
      <h2 class="mb-4 text-lg font-semibold">{{ editItem ? 'Edit' : 'Add New' }} Item</h2>
      <form @submit.prevent="submitForm">
        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium">Name</label>
          <input 
            type="text" 
            v-model="newItem.name"
            :disabled="editItem?.isNewBatch"
            class="w-full px-3 py-2 border rounded-lg" 
            required 
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
            min="1"
            class="w-full px-3 py-2 border rounded-lg"
            required 
          />
          <span v-if="formErrors.count" class="text-sm text-red-500">{{ formErrors.count }}</span>
        </div>
        <div class="flex justify-end gap-2">
          <button 
            type="button"
            @click="$emit('closeModal')"
            class="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button 
            type="submit"
            class="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {{ editItem ? 'Update' : 'Add' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>