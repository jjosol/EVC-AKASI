<script setup>
import { ref, watch, computed } from 'vue'
import * as inventoryService from '~/services/inventoryService';
import ConfirmationModal from '~/components/SHARED/parts/confirmationModal.vue';

const props = defineProps({
  isOpen: Boolean,
  categories: {
    type: Array,
    default: () => []
  },
  // Add new props for pre-filled data
  prefillData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['closeModal', 'addItem', 'fetchCategories', 'refreshInventory'])

const newItem = ref({
  name: '',
  expirationDate: '',
  count: 0,
  category_id: null,
  isOTC: false // Add OTC property
})

// Add confirmation modal state
const showConfirmModal = ref(false)
const confirmationMessage = ref('')

// Update computed properties to lock fields appropriately
const isCategoryLocked = computed(() => {
  return (!!props.prefillData?.isNewMedicine && !!props.prefillData?.categoryId) || 
         !!props.prefillData?.isNewBatch;
})

// Add computed property to lock medicine name
const isMedicineNameLocked = computed(() => {
  return !!props.prefillData?.isNewBatch;
})

// Add computed property to lock OTC toggle
const isOTCLocked = computed(() => {
  return !!props.prefillData?.isNewBatch;
})

// Watch for prefill data changes
watch(() => props.prefillData, async (data) => {
  if (data && Object.keys(data).length > 0) {
    // Pre-fill form with provided data
    if (data.medicineName) {
      newItem.value.name = data.medicineName;
    } else if (data.name) {
      newItem.value.name = data.name;
    }
    
    if (data.categoryId) {
      newItem.value.category_id = Number(data.categoryId);
    }
    
    // Handle OTC status for new batches
    if (data.isNewBatch) {
      // If isOTC is explicitly provided, use it directly
      if (data.isOTC !== undefined) {
        newItem.value.isOTC = data.isOTC === true;
      }
      // Only call API if isOTC wasn't provided
      else if (data.med_id) {
        try {
          const otcStatus = await inventoryService.getOtcStatus(data.med_id, data.medicineName || data.name);
          newItem.value.isOTC = otcStatus.otc === true;
        } catch (error) {
          console.error('Error fetching OTC status:', error);
          newItem.value.isOTC = false;
        }
      }
    } 
    // For other cases (non-new batches)
    else if (data.med_id) {
      try {
        const otcStatus = await inventoryService.getOtcStatus(data.med_id, data.medicineName || data.name);
        newItem.value.isOTC = otcStatus.otc === true;
      } catch (error) {
        console.error('Error fetching OTC status:', error);
        newItem.value.isOTC = false;
      }
    } 
    // For completely new medicines
    else if (data.isOTC !== undefined) {
      newItem.value.isOTC = data.isOTC === true;
    }
    
    // Set today's date as default for new batches
    if (data.isNewBatch) {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      newItem.value.expirationDate = formatDate(oneYearFromNow);
      newItem.value.count = 1; // Default count
    }
  }
}, { deep: true });

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
    category_id: null,
    isOTC: false // Reset OTC value too
  }
  formErrors.value = { name: '', expirationDate: '', count: '', category_id: '' }
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

const prepareSubmit = () => {
  if (!validateForm()) return;
  
  // Set confirmation message with warning about irreversibility
  confirmationMessage.value = props.prefillData?.isNewBatch 
    ? `Warning: You're about to add a new batch of ${newItem.value.name}. This action cannot be undone!`
    : `Warning: You're about to add ${newItem.value.name} to inventory. This action cannot be undone!`;
    
  showConfirmModal.value = true;
}

const submitForm = async () => {
  try {
    const result = await inventoryService.addMedicineItem({
      name: newItem.value.name,
      expirationDate: newItem.value.expirationDate,
      count: newItem.value.count,
      medCategory_id: newItem.value.category_id,
      isOTC: newItem.value.isOTC, // Include OTC status in API call
    });
    showConfirmModal.value = false;
    emit('addItem', result);
    emit('refreshInventory'); 
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
      <h2 class="mb-4 text-lg font-semibold">
        {{ props.prefillData?.isNewBatch ? 'Add New Batch' : 'Add New Medicine' }}
      </h2>
      <form @submit.prevent="prepareSubmit">
        <div>
          <div class="mb-4">
            <label class="block mb-1 text-sm font-medium">Category</label>
            <select 
              v-model="newItem.category_id" 
              class="w-full px-3 py-2 border rounded-lg"
              :disabled="isCategoryLocked"
              :class="{'bg-gray-100': isCategoryLocked}"
              required
            >
              <option value="">Select Category</option>
              <option v-for="category in props.categories" :key="category.medCategory_id" :value="category.medCategory_id">
                {{ category.name }}
              </option>
            </select>
            <span v-if="isCategoryLocked" class="mt-1 text-xs text-gray-500">
              {{ props.prefillData?.isNewBatch ? 
                'Category is locked when adding a new batch' : 
                'Category is locked because you\'re adding to a specific category' }}
            </span>
            <span v-if="formErrors.category_id" class="text-sm text-red-500">{{ formErrors.category_id }}</span>
          </div>
          
          <div class="mb-4">
            <label class="block mb-1 text-sm font-medium">Medicine Name</label>
            <input 
              type="text" 
              v-model="newItem.name"
              class="w-full px-3 py-2 border rounded-lg"
              :disabled="isMedicineNameLocked"
              :class="{'bg-gray-100': isMedicineNameLocked}" 
              required
            />
            <span v-if="isMedicineNameLocked" class="mt-1 text-xs text-gray-500">
              Medicine name is locked when adding a new batch
            </span>
            <span v-if="formErrors.name" class="text-sm text-red-500">{{ formErrors.name }}</span>
          </div>
          
          <!-- New OTC toggle switch -->
          <div class="mb-4">
            <div class="flex items-center justify-between">
              <label class="block text-sm font-medium">Over The Counter (OTC)</label>
              <label class="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  v-model="newItem.isOTC"
                  :disabled="isOTCLocked"
                  class="sr-only peer"
                />
                <div 
                  class="w-11 h-6 rounded-full peer transition-colors duration-200 ease-in-out"
                  :class="{
                    'bg-purple-600': newItem.isOTC,
                    'bg-gray-200': !newItem.isOTC,
                    'opacity-50': isOTCLocked
                  }"
                >
                  <div 
                    class="absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform duration-200 ease-in-out"
                    :class="{'translate-x-5': newItem.isOTC}"
                  ></div>
                </div>
                <span class="ml-3 text-sm font-medium" :class="{'text-green-600': newItem.isOTC, 'text-red-600': !newItem.isOTC}">
                  {{ newItem.isOTC ? 'OTC' : 'RX' }}
                </span>
              </label>
            </div>
            <span v-if="isOTCLocked" class="mt-1 text-xs text-gray-500">
              OTC status is locked when adding a new batch to maintain consistency
            </span>
          </div>
          
          <div class="mb-4">
            <label class="block mb-1 text-sm font-medium">Expiration Date</label>
            <!-- Existing expiration date input -->
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
            {{ props.prefillData?.isNewBatch ? 'Add Batch' : 'Add Medicine' }}
          </button>
        </div>
      </form>
    </div>
  </div>
  
  <!-- Confirmation Modal -->
  <ConfirmationModal
    :show="showConfirmModal"
    :message="confirmationMessage"
    confirmButtonText="Add"
    @confirm="submitForm"
    @cancel="showConfirmModal = false"
  />
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