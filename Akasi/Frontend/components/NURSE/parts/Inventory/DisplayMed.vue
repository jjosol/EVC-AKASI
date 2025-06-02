<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import * as inventoryService from '~/services/inventoryService';
import { defineEmits } from 'vue';

const emit = defineEmits(['openModal', 'editModal', 'openCategoryModal', 'refreshNeeded']); // Add 'refreshNeeded' here

// Existing refs
const items = ref([]);
const categories = ref([]);
const expandedCategories = ref(new Set());
const expandedItems = ref(new Set());
const searchQuery = ref('');

const editMedicineModalOpen = ref(false);
const currentEditMedicine = ref({
  name: '',
  categoryId: null
});

const fetchCategories = async () => {
  try {
    categories.value = await inventoryService.fetchCategories();
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
};

const fetchInventory = async () => {
  try {
    const data = await inventoryService.fetchInventoryItems();
    items.value = data;
  } catch (error) {
    console.error('Error fetching inventory:', error);
  }
};

const refreshInventory = async () => {
  await fetchCategories();
  await fetchInventory();
};

// Format date helper
const formatDate = (dateString) => {
  return dateString ? new Date(dateString).toISOString().split('T')[0] : '';
};

// Add function to check if date is expired
const isExpired = (expirationDate) => {
  if (!expirationDate) return false;
  
  const expDate = new Date(expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of day for fair comparison
  
  return expDate < today;
};

// Group items by category first, then by medicine name
const groupedByCategory = computed(() => {
  const groups = {};
  
  // Initialize with all categories (even empty ones)
  categories.value.forEach(category => {
    // Use medCategory_id instead of category_id
    groups[category.medCategory_id] = {
      ...category,
      items: {}
    };
  });
  
  // Group items by category_id and then by name
  items.value.forEach(item => {
    const categoryId = item.medCategory_id; // Use medCategory_id instead
    
    // If category doesn't exist in our groups (should not happen, but just in case)
    if (!groups[categoryId]) {
      groups[categoryId] = {
        medCategory_id: categoryId, // Use medCategory_id instead
        name: item.category?.name || 'Uncategorized',
        items: {}
      };
    }
    
    // Group by medicine name within the category
    if (!groups[categoryId].items[item.medName]) {
      groups[categoryId].items[item.medName] = [];
    };
    
    groups[categoryId].items[item.medName].push(item);
    
    // Sort each medicine's batches by expiration date (closest to expiring first)
    Object.keys(groups[categoryId].items).forEach(medName => {
      groups[categoryId].items[medName].sort((a, b) => {
        if (!a.expiration) return 1; // Items without expiration go to the bottom
        if (!b.expiration) return -1;
        return new Date(a.expiration).getTime() - new Date(b.expiration).getTime();
      });
    });
  });
  
  return groups;
});

// Calculate total count for each medicine group
const getMedicineTotalCount = (medicines) => {
  return medicines.reduce((total, med) => total + (med.count || 0), 0);
};

const getMedicineOtcStatus = (medicines) => {
  // If any batch has otc === false, the medicine is considered prescription-only
  // Otherwise, if at least one batch has otc === true, it's considered OTC
  const hasNonOtc = medicines.some(med => med.otc === false);
  if (hasNonOtc) return false;
  return medicines.some(med => med.otc === true);
};

// Filter based on search query
const filteredCategories = computed(() => {
  if (!searchQuery.value) return groupedByCategory.value;
  
  const filtered = {};
  const query = searchQuery.value.toLowerCase();
  
  Object.entries(groupedByCategory.value).forEach(([categoryId, category]) => {
    const matchingMedicines = {};
    
    Object.entries(category.items).forEach(([name, medicines]) => {
      if (name.toLowerCase().includes(query)) {
        matchingMedicines[name] = medicines;
      }
    });
    
    if (Object.keys(matchingMedicines).length > 0 || 
        category.name.toLowerCase().includes(query)) {
      filtered[categoryId] = {
        ...category,
        items: matchingMedicines
      };
    }
  });
  
  return filtered;
});

const openModal = (item = null) => {
  if (item?.isEditMedicine && item?.isEditNameOnly) {
    currentEditMedicine.value = {
      name: item.medicineName,
      categoryId: item.categoryId
    };
    editMedicineModalOpen.value = true;
  } else {
    emit('openModal', item);
  }
};

const openCategoryModal = (category = null) => {
  emit('openCategoryModal', category);
};

const editCategory = (category) => {
  openCategoryModal(category);
};

const toggleExpandCategory = (categoryId) => {
  categoryId = Number(categoryId);
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId);
  } else {
    expandedCategories.value.add(categoryId);
  }
};

const toggleExpandItem = (name) => {
  if (expandedItems.value.has(name)) {
    expandedItems.value.delete(name);
  } else {
    expandedItems.value.add(name);
  }
};

const addNewBatch = async (medicineName, categoryId, medicines) => {
  try {
    // Get the first batch's medicine ID to correctly fetch OTC status
    const firstBatch = medicines[0];
    
    if (!firstBatch || !firstBatch.medicine_id) {
      console.error('No valid batch found for', medicineName);
      return;
    }
    
    // Using medicine_id for proper API call
    const med_id = firstBatch.medicine_id;
    
    // Get the OTC status directly from the API
    const otcStatusResponse = await inventoryService.getOtcStatus(med_id, medicineName);
    const otcValue = otcStatusResponse.otc === true;
    
    // Create the new batch item
    const newBatchItem = {
      isNewBatch: true,
      medicineName: medicineName,
      name: medicineName, 
      categoryId: categoryId,
      med_id: med_id,
      isOTC: otcValue
    };
    
    emit('openModal', newBatchItem);
  } catch (error) {
    console.error('Error fetching OTC status:', error);
    alert('Failed to add new batch: ' + (error.message || 'Unknown error'));
  }
};

const addNewMedicine = (categoryId) => {
  const newMedicineItem = {
    isNewMedicine: true,
    categoryId: categoryId
  };
  emit('openModal', newMedicineItem);
};

const handleMedicineUpdated = async () => {
  await refreshInventory();
};

const increaseBatch = async (item) => {
  // Get quantity from user (could be modal or prompt)
  const quantity = prompt(`Enter quantity to add to ${item.medName}:`, '1');
  if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) return;
  
  try {
    await inventoryService.increaseInventory(
      item.med_id, 
      { 
        medName: item.medName,
        quantity: Number(quantity),
        cause: 'Manual addition'
      }
    );
    await refreshInventory();
  } catch (error) {
    console.error('Error increasing inventory:', error);
    alert(error.message || 'Failed to increase inventory');
  }
};

const reduceBatch = async (item) => {
  const quantity = prompt(`Enter quantity to remove from ${item.medName}:`, '1');
  if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0 || Number(quantity) > item.count) return;
  
  try {
    await inventoryService.reduceInventory(
      item.med_id, 
      item.medName,
      { 
        quantity: Number(quantity),
        cause: 'Manual reduction'
      }
    );
    await refreshInventory();
  } catch (error) {
    console.error('Error reducing inventory:', error);
    alert(error.message || 'Failed to reduce inventory');
  }
};

onMounted(() => {
  refreshInventory();
});

// Expose refreshInventory for parent component
defineExpose({ refreshInventory });
</script>

<template>
  <div class="w-full max-w-none p-4 sm:p-6 bg-white rounded-lg shadow lg:w-5/6 lg:float-end">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
      <div class="flex items-center space-x-2">
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="Search medicines..."
          class="w-full sm:w-auto px-4 py-2 border rounded-lg"
        />
      </div>
      <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <button 
          @click="openCategoryModal()"
          class="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 text-sm sm:text-base"
        >
          Add New Category
        </button>
        <button 
          @click="openModal"
          class="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 text-sm sm:text-base"
        >
          Add New Medicine
        </button>
      </div>
    </div>
    
    <!-- Categories and Medicines with Dropdown Design -->
    <div class="space-y-4">
      <div v-for="(category, categoryId) in filteredCategories" :key="categoryId" class="overflow-hidden border rounded-lg">        <!-- Category Header (Always visible) -->
        <div 
          class="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b cursor-pointer bg-gray-50 gap-2"
          @click="toggleExpandCategory(categoryId)"
        >
          <div class="flex items-center flex-1">
            <Icon 
              :icon="expandedCategories.has(Number(categoryId)) ? 'mdi:chevron-down' : 'mdi:chevron-right'" 
              class="mr-2 text-gray-600 flex-shrink-0" 
              width="20"
            />
            <h3 class="font-semibold text-gray-800 text-sm sm:text-base">{{ category.name }}</h3>
            <span class="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full whitespace-nowrap">
              {{ Object.keys(category.items).length }} medicines
            </span>
          </div>
          
          <div class="flex space-x-2 flex-shrink-0">
            <button 
              @click.stop="addNewMedicine(categoryId)"
              class="p-1 text-white bg-blue-500 rounded hover:bg-blue-600" 
              title="Add Medicine to Category"
            >
              <Icon icon="mdi:pill" width="16" />
            </button>
            <button 
              @click.stop="editCategory(category)"
              class="p-1 text-white bg-yellow-500 rounded hover:bg-yellow-600" 
              title="Edit Category"
            >
              <Icon icon="mdi:pencil" width="16" />
            </button>
          </div>
        </div>
        
        <!-- Medicine List (visible when category is expanded) -->
        <div v-if="expandedCategories.has(Number(categoryId))" class="divide-y divide-gray-100">
          <div v-if="!Object.keys(category.items).length" class="p-4 text-center text-gray-500">
            No medicines in this category
          </div>
          
          <div v-for="(medicines, name) in category.items" :key="name" class="border-b">            <!-- Medicine Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3 pl-8 bg-white cursor-pointer hover:bg-gray-50 gap-2"
              @click="toggleExpandItem(name)">
              <div class="flex items-center flex-1 min-w-0">
                <Icon 
                  :icon="expandedItems.has(name) ? 'mdi:chevron-down' : 'mdi:chevron-right'" 
                  class="mr-2 text-gray-600 flex-shrink-0" 
                  width="18"
                />
                <!-- Apply color based on OTC status -->
                <span 
                  class="font-medium text-sm sm:text-base truncate" 
                  :class="{
                    'text-green-600': getMedicineOtcStatus(medicines), 
                    'text-red-600': !getMedicineOtcStatus(medicines)
                  }"
                >
                  {{ name }}
                  <!-- Add OTC indicator -->
                  <span 
                    class="ml-2 text-xs px-1 py-0.5 rounded-sm whitespace-nowrap" 
                    :class="{
                      'bg-green-100 text-green-800': getMedicineOtcStatus(medicines),
                      'bg-red-100 text-red-800': !getMedicineOtcStatus(medicines)
                    }"
                  >
                    {{ getMedicineOtcStatus(medicines) ? 'OTC' : 'RX' }}
                  </span>
                </span>
              </div>
              
              <div class="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                <span class="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm whitespace-nowrap">
                  Total: {{ getMedicineTotalCount(medicines) }}
                </span>
                
                <div class="flex space-x-1">
                  <button 
                    @click.stop="addNewBatch(name, categoryId, medicines)"
                    class="p-1 text-white bg-green-500 rounded hover:bg-green-600" 
                    title="Add New Batch"
                  >
                    <Icon icon="mdi:package-variant-plus" width="16" />
                  </button>
                  <button 
                    @click.stop="openModal({isEditMedicine: true, isEditNameOnly: true, medicineName: name, categoryId: categoryId})"
                    class="p-1 text-white bg-yellow-500 rounded hover:bg-yellow-600" 
                    title="Edit Medicine Name"
                  >
                    <Icon icon="mdi:pencil" width="16" />
                  </button>
                </div>
              </div>
            </div>
              <!-- Medicine Batches (visible when medicine is expanded) -->
            <div v-if="expandedItems.has(name)" class="p-2 bg-gray-50">
              <!-- Mobile-first responsive table -->
              <div class="hidden sm:block">
                <table class="min-w-full text-sm">
                  <thead>
                    <tr class="text-left text-gray-600">
                      <th class="p-2 font-medium">Expiration</th>
                      <th class="p-2 font-medium">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr 
                      v-for="med in medicines" 
                      :key="med.med_id"
                      :class="{'expired-row': isExpired(med.expiration)}"
                      class="bg-white"
                    >
                      <td class="p-2">
                        <span 
                          :class="{'text-red-600 font-medium': isExpired(med.expiration)}"
                        >
                          {{ formatDate(med.expiration) }}
                          <span v-if="isExpired(med.expiration)" class="ml-1 text-xs font-bold text-red-600">(EXPIRED)</span>
                        </span>
                      </td>
                      <td class="p-2">{{ med.count }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Mobile card layout -->
              <div class="space-y-2 sm:hidden">
                <div 
                  v-for="med in medicines" 
                  :key="med.med_id"
                  :class="{'bg-red-50 border-red-200': isExpired(med.expiration)}"
                  class="p-3 bg-white border rounded-lg"
                >
                  <div class="flex justify-between items-center">
                    <div class="flex-1">
                      <div class="text-xs text-gray-500 mb-1">Expiration</div>
                      <div 
                        :class="{'text-red-600 font-medium': isExpired(med.expiration)}"
                        class="text-sm"
                      >
                        {{ formatDate(med.expiration) }}
                        <span v-if="isExpired(med.expiration)" class="block text-xs font-bold text-red-600">EXPIRED</span>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-xs text-gray-500 mb-1">Count</div>
                      <div class="text-sm font-medium">{{ med.count }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Categories Message -->
      <div v-if="!Object.keys(filteredCategories).length" class="p-8 text-center text-gray-500">
        <div class="mb-4">
          <Icon icon="mdi:pill-off" class="w-12 h-12 mx-auto text-gray-400" />
        </div>
        <p v-if="searchQuery" class="mb-2">No medicines found matching "{{ searchQuery }}"</p>
        <p v-else class="mb-2">No medicines or categories found</p>
        <p class="text-sm">Get started by adding a category or medicine using the buttons above</p>
      </div>
    </div>
  </div>

  <EditMedicineNameModal 
    :isOpen="editMedicineModalOpen"
    :medicineName="currentEditMedicine.name"
    :categoryId="currentEditMedicine.categoryId"
    @closeModal="editMedicineModalOpen = false"
    @medicineUpdated="handleMedicineUpdated"
  />
</template>

<style scoped>
.expired-row {
  background-color: #fee2e2; /* Light red background */
}
</style>