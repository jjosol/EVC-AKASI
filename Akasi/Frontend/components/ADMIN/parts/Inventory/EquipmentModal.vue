<script setup>
import { ref, watch, computed } from 'vue'
import * as inventoryService from '~/services/inventoryService';


const props = defineProps({
  isOpen: Boolean,
  editData: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['closeModal', 'equipmentSaved'])

const equipment = ref({
  name: '',
  count: 1,
  unit: '',
  expirationDate: ''
})

// Confirmation modal state
const showConfirmModal = ref(false)
const confirmationMessage = ref('')

// Form validation
const formErrors = ref({
  name: '',
  count: '',
  unit: ''
})

const isEditMode = computed(() => {
  return !!props.editData?.equip_id;
})

const modalTitle = computed(() => {
  return isEditMode.value ? 'Edit Equipment' : 'Add New Equipment';
})

// Watch for edit data changes
watch(() => props.editData, (data) => {
  if (data) {
    equipment.value = {
      name: data.name || '',
      count: data.count || 1,
      unit: data.unit || '',
      expirationDate: data.expirationDate || ''
    };
  } else {
    resetForm();
  }
}, { deep: true });

const resetForm = () => {
  equipment.value = {
    name: '',
    count: 1,
    unit: '',
    expirationDate: ''
  };
  formErrors.value = { name: '', count: '', unit: '' };
}

// Validate form before submission
const validateForm = () => {
  let isValid = true;
  formErrors.value = { name: '', count: '', unit: '' };

  if (!equipment.value.name.trim()) {
    formErrors.value.name = 'Equipment name is required';
    isValid = false;
  }
  
  if (!equipment.value.count || equipment.value.count <= 0) {
    formErrors.value.count = 'Count must be greater than 0';
    isValid = false;
  }
  
  if (!equipment.value.unit.trim()) {
    formErrors.value.unit = 'Unit is required';
    isValid = false;
  }
  
  return isValid;
}

// Prepare form submission with confirmation
const prepareSubmit = () => {
  if (!validateForm()) return;
  
  // Set confirmation message
  confirmationMessage.value = isEditMode.value
    ? `Warning: You're about to update "${equipment.value.name}". This may affect inventory counts.`
    : `Warning: You're about to add "${equipment.value.name}" to inventory. This action cannot be undone!`;
  
  showConfirmModal.value = true;
}

// Submit form after confirmation
const submitForm = async () => {
  try {
    let result;
    
    if (isEditMode.value) {
      // Update existing equipment
      result = await inventoryService.updateEquipmentItem(
        props.editData.equip_id,
        {
          name: equipment.value.name,
          count: equipment.value.count,
          unit: equipment.value.unit,
          expirationDate: equipment.value.expirationDate || null
        }
      );
    } else {
      // Add new equipment
      result = await inventoryService.addEquipmentItem({
        name: equipment.value.name,
        count: equipment.value.count,
        unit: equipment.value.unit,
        expirationDate: equipment.value.expirationDate || null
      });
    }
    
    emit('equipmentSaved', result);
    resetForm();
  } catch (error) {
    console.error('Error saving equipment:', error);
    alert(error.message || 'Failed to save equipment');
  }
}

// Reset form when modal is opened/closed
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    resetForm();
  }
}, { immediate: true })

// Check if date is expired
const isExpired = (expirationDate) => {
  if (!expirationDate) return false;
  const expDate = new Date(expirationDate);
  const today = new Date();
  return expDate < today;
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black opacity-50" @click="$emit('closeModal')"></div>
    <div class="z-10 w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
      <h2 class="mb-4 text-lg font-semibold">{{ modalTitle }}</h2>
      <form @submit.prevent="prepareSubmit">
        <!-- Equipment Name -->
        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium">Equipment Name</label>
          <input 
            type="text" 
            v-model="equipment.name"
            class="w-full px-3 py-2 border rounded-lg" 
            required
          />
          <span v-if="formErrors.name" class="text-sm text-red-500">{{ formErrors.name }}</span>
        </div>
        
        <!-- Count -->
        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium">Count</label>
          <input 
            type="number" 
            v-model="equipment.count"
            class="w-full px-3 py-2 border rounded-lg" 
            min="1"
            required 
          />
          <span v-if="formErrors.count" class="text-sm text-red-500">{{ formErrors.count }}</span>
        </div>
        
        <!-- Unit -->
        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium">Unit</label>
          <input 
            type="text" 
            v-model="equipment.unit"
            placeholder="e.g., pieces, rolls, boxes"
            class="w-full px-3 py-2 border rounded-lg" 
            required
          />
          <span v-if="formErrors.unit" class="text-sm text-red-500">{{ formErrors.unit }}</span>
        </div>
        
        <!-- Expiration Date (Optional) -->
        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium">
            Expiration Date <span class="text-xs text-gray-500">(Optional)</span>
          </label>
          <div class="relative">
            <input 
              type="date" 
              v-model="equipment.expirationDate"
              class="w-full px-3 py-2 border rounded-lg" 
              :class="{'border-red-500': isExpired(equipment.expirationDate)}"
            />
            <span v-if="isExpired(equipment.expirationDate)" 
                  class="absolute right-3 top-2.5 text-red-500 font-bold" 
                  title="Expired">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </span>
          </div>
          <span v-if="isExpired(equipment.expirationDate)" class="text-sm text-red-500">
            Warning: This date is in the past
          </span>
        </div>
        
        <!-- Form Buttons -->
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
            class="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {{ isEditMode ? 'Update' : 'Add' }} Equipment
          </button>
        </div>
      </form>
    </div>
  </div>
  
  <!-- Confirmation Modal -->
  <ConfirmationModal
    :show="showConfirmModal"
    :message="confirmationMessage"
    :confirmButtonText="isEditMode ? 'Update' : 'Add'"
    @confirm="submitForm"
    @cancel="showConfirmModal = false"
  />
</template>