<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import * as inventoryService from '~/services/inventoryService';

const props = defineProps({
  isOpen: Boolean,
  editData: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['closeModal', 'equipmentSaved', 'refreshEquipment'])

const equipment = ref({
  name: '',
  count: 1,
  unit: '',
  expirationDate: '',
  categoryId: 1 // Default category ID
})

// Add categories state
const categories = ref([])
const showAddCategoryModal = ref(false)
const currentEditCategory = ref(null)

// Confirmation modal state
const showConfirmModal = ref(false)
const confirmationMessage = ref('')

// Form validation
const formErrors = ref({
  name: '',
  count: '',
  unit: '',
  categoryId: ''
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
      expirationDate: data.expirationDate || '',
      categoryId: data.categoryId || data.equipCategory_id || 1
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
    expirationDate: '',
    categoryId: 1
  };
  formErrors.value = { name: '', count: '', unit: '', categoryId: '' };
}

// Validate form before submission
const validateForm = () => {
  let isValid = true;
  formErrors.value = { name: '', count: '', unit: '', categoryId: '' };

  if (!equipment.value.name.trim()) {
    formErrors.value.name = 'Equipment name is required';
    isValid = false;
  }
  
  if (!equipment.value.count || equipment.value.count <= 0) {
    formErrors.value.count = 'Quantity must be greater than 0';
    isValid = false;
  }
  
  if (!equipment.value.unit.trim()) {
    formErrors.value.unit = 'Unit is required';
    isValid = false;
  }
  
  if (!equipment.value.categoryId) {
    formErrors.value.categoryId = 'Category is required';
    isValid = false;
  }
  
  return isValid;
}

// Prepare form submission with confirmation
const prepareSubmit = () => {
  if (!validateForm()) return;
  
  // Set confirmation message
  confirmationMessage.value = isEditMode.value
    ? `Warning: You're about to update ${equipment.value.name}. This will be logged.`
    : `Warning: You're about to add ${equipment.value.name} to equipment inventory. This action cannot be undone!`;
  
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
          expirationDate: equipment.value.expirationDate || null,
          equipCategory_id: Number(equipment.value.categoryId)
        }
      );
    } else {
      // Add new equipment
      result = await inventoryService.addEquipmentItem({
        name: equipment.value.name,
        count: equipment.value.count,
        unit: equipment.value.unit,
        expirationDate: equipment.value.expirationDate || null,
        equipCategory_id: Number(equipment.value.categoryId)
      });
    }
    
    showConfirmModal.value = false;
    emit('equipmentSaved', result);
    emit('refreshEquipment'); // Add this line to refresh equipment list
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

// Add fetch categories method
const fetchCategories = async () => {
  try {
    categories.value = await inventoryService.fetchEquipmentCategories();
    // Ensure we have at least one category
    if (categories.value.length === 0) {
      // If no categories exist, create a default one
      await createDefaultCategory();
    }
  } catch (error) {
    console.error('Error fetching equipment categories:', error);
    categories.value = [];
  }
}

// Create default category if none exists
const createDefaultCategory = async () => {
  try {
    const defaultCategory = await inventoryService.addEquipmentCategory({ name: 'General' });
    categories.value = [defaultCategory];
    equipment.value.categoryId = defaultCategory.equipCategory_id;
  } catch (error) {
    console.error('Error creating default category:', error);
  }
}

// Open category modal
const openCategoryModal = (category = null) => {
  currentEditCategory.value = category;
  showAddCategoryModal.value = true;
}

// Handle new category added
const handleCategoryAdded = async (category) => {
  await fetchCategories();
  showAddCategoryModal.value = false;
  // Select the newly added category
  if (category && category.equipCategory_id) {
    equipment.value.categoryId = category.equipCategory_id;
  }
}

onMounted(() => {
  fetchCategories();
})
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black opacity-50" @click="emit('closeModal')"></div>
    <div class="z-10 w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
      <h2 class="mb-4 text-lg font-semibold">{{ modalTitle }}</h2>
      
      <form @submit.prevent="prepareSubmit">
        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium">Equipment Name</label>
          <input 
            type="text" 
            v-model="equipment.name"
            class="w-full px-3 py-2 border rounded-lg" 
            :disabled="isEditMode"
            :class="{'bg-gray-100': isEditMode}"
            placeholder="Enter equipment name"
            required
          />
          <p v-if="formErrors.name" class="mt-1 text-sm text-red-500">{{ formErrors.name }}</p>
          <p v-if="isEditMode" class="mt-1 text-xs text-gray-500">
            Equipment name cannot be changed. Create a new item if needed.
          </p>
        </div>
        
        <!-- Category Selection -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-1">
            <label class="block text-sm font-medium">Category</label>
            <button 
              type="button" 
              @click="openCategoryModal()"
              class="px-2 py-1 text-xs text-white bg-green-500 rounded hover:bg-green-600"
            >
              Add New Category
            </button>
          </div>
          <select 
            v-model="equipment.categoryId"
            class="w-full px-3 py-2 border rounded-lg"
            required
          >
            <option v-for="category in categories" :key="category.equipCategory_id" :value="category.equipCategory_id">
              {{ category.name }}
            </option>
          </select>
          <p v-if="formErrors.categoryId" class="mt-1 text-sm text-red-500">{{ formErrors.categoryId }}</p>
        </div>
        
        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium">Quantity</label>
          <input 
            type="number" 
            v-model="equipment.count"
            class="w-full px-3 py-2 border rounded-lg" 
            min="1"
            placeholder="Enter quantity"
            required
          />
          <p v-if="formErrors.count" class="mt-1 text-sm text-red-500">{{ formErrors.count }}</p>
        </div>
        
        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium">Unit</label>
          <input 
            type="text" 
            v-model="equipment.unit"
            class="w-full px-3 py-2 border rounded-lg" 
            placeholder="e.g., pieces, boxes, rolls"
            required
          />
          <p v-if="formErrors.unit" class="mt-1 text-sm text-red-500">{{ formErrors.unit }}</p>
        </div>
        
        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium">Expiration Date (optional)</label>
          <input 
            type="date" 
            v-model="equipment.expirationDate"
            class="w-full px-3 py-2 border rounded-lg" 
          />
        </div>
        
        <div class="flex justify-end space-x-2">
          <button 
            type="button"
            @click="emit('closeModal')"
            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg"
          >
            Cancel
          </button>
          <button 
            type="submit"
            class="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            {{ isEditMode ? 'Update Equipment' : 'Add Equipment' }}
          </button>
        </div>
      </form>
    </div>
  </div>
  
  <!-- Confirmation Modal -->
  <ConfirmationModal
    :show="showConfirmModal"
    :confirmButtonText="isEditMode ? 'Update' : 'Add'"
    :message="confirmationMessage"
    @confirm="submitForm"
    @cancel="showConfirmModal = false"
  />
  
  <!-- Category Modal -->
  <EquipmentCategoryModal
    :isOpen="showAddCategoryModal"
    :editItem="currentEditCategory"
    @closeModal="showAddCategoryModal = false"
    @addCategory="handleCategoryAdded"
  />
</template>