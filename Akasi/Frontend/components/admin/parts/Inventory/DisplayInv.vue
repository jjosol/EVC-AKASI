<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import * as inventoryService from '~/services/inventoryService';
import EditMedicineNameModal from './EditMedicineNameModal.vue';

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
    groups[category.category_id] = {
      ...category,
      items: {}
    };
  });
  
  // Group items by category_id and then by name
  items.value.forEach(item => {
    const categoryId = item.category_id;
    
    // If category doesn't exist in our groups (should not happen, but just in case)
    if (!groups[categoryId]) {
      groups[categoryId] = {
        category_id: categoryId,
        name: item.category?.name || 'Uncategorized',
        items: {}
      };
    }
    
    // Group by medicine name within the category
    if (!groups[categoryId].items[item.medName]) {
      groups[categoryId].items[item.medName] = [];
    }
    
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

const emit = defineEmits(['openModal', 'editModal', 'openCategoryModal']);

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

const deleteGroup = async (name) => {
  if (confirm(`Are you sure you want to delete all batches of ${name}?`)) {
    try {
      await inventoryService.deleteMedicineGroup(name);
      await refreshInventory();
    } catch (error) {
      console.error('Error deleting medicine group:', error);
    }
  }
};

const deleteItem = async (item) => {
  if (confirm('Are you sure you want to delete this batch?')) {
    try {
      await inventoryService.deleteInventoryItem(item.med_id, item.medName);
      await refreshInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }
};

const deleteCategory = async (categoryId) => {
  // Check if category has items
  categoryId = Number(categoryId);
  console.log('Type of categoryId:', typeof categoryId); 

  const hasItems = Object.keys(groupedByCategory.value[categoryId]?.items || {}).length > 0;
  
  let confirmMessage = 'Are you sure you want to delete this category?';
  if (hasItems) {
    confirmMessage = 'WARNING: This category contains medicines. Deleting it will DELETE ALL MEDICINES within this category. Continue?';
  }
  
  if (confirm(confirmMessage)) {
    try {
      await inventoryService.deleteCategory(categoryId);
      console.log('Deleted category:', categoryId);
      await refreshInventory();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category: ' + (error.message || 'Unknown error'));
    }
  }
};

const addNewBatch = (medicineName, categoryId) => {
  const newBatchItem = {
    isNewBatch: true,
    medicineName: medicineName,
    categoryId: categoryId
  };
  emit('openModal', newBatchItem);
};

const handleMedicineUpdated = async () => {
  await refreshInventory();
};

onMounted(() => {
  refreshInventory();
});

// Expose refreshInventory for parent component
defineExpose({ refreshInventory });
</script>

<template>
  <div class="w-5/6 p-6 bg-white rounded-lg shadow float-end">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-2">
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="Search..."
          class="px-4 py-2 border rounded-lg"
        />
      </div>
      <div class="flex space-x-2">
        <button 
          @click="openCategoryModal()"
          class="px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600"
        >
          Add New Category
        </button>
        <button 
          @click="openModal"
          class="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
        >
          Add New Medicine
        </button>
      </div>
    </div>
    
    <div class="overflow-x-auto">
      <table class="min-w-full table-auto">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-2 text-sm font-medium text-left text-gray-700">Category / Medicine</th>
            <th class="px-6 py-2 text-sm font-medium text-left text-gray-700">Total Count</th>
            <th class="px-6 py-2 text-sm font-medium text-left text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <!-- Category Level -->
          <template v-for="(category, categoryId) in filteredCategories" :key="categoryId">
            <tr class="bg-white">
              <td class="px-6 py-4 text-sm font-bold text-gray-900">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <button @click="toggleExpandCategory(categoryId)" class="mr-2">
                      <Icon :icon="expandedCategories.has(categoryId) ? 'mdi:chevron-down' : 'mdi:chevron-right'" />
                    </button>
                    {{ category.name }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ Object.values(category.items).flat().reduce((sum, med) => sum + med.count, 0) }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                <div class="flex space-x-2">
                  <button 
                    @click="editCategory(category)"
                    class="px-3 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                </div>
              </td>
            </tr>
            
            <!-- Medicine Level (only shown when category is expanded) -->
            <template v-if="expandedCategories.has(Number(categoryId))">
              <template v-for="(medicines, name) in category.items" :key="`${categoryId}-${name}`">
                <tr class="bg-gray-50">
                  <td class="px-6 py-3 text-sm text-gray-900">
                    <div class="flex items-center ml-6">
                      <button @click="toggleExpandItem(name)" class="mr-2">
                        <Icon :icon="expandedItems.has(name) ? 'mdi:chevron-down' : 'mdi:chevron-right'" />
                      </button>
                      {{ name }}
                    </div>
                  </td>
                  <td class="px-6 py-3 text-sm text-gray-900">
                    {{ medicines.reduce((sum, med) => sum + med.count, 0) }}
                  </td>
                  <td class="px-6 py-3 text-sm text-gray-900">
                    <div class="flex space-x-2">
                      <button 
                        @click="addNewBatch(name, categoryId)"
                        class="px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600"
                      >
                        Add Batch
                      </button>
                      <button 
                        @click="openModal({ isEditMedicine: true, isEditNameOnly: true, medicineName: name, categoryId })"
                        class="px-3 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
                
                <!-- Batch Level (only shown when medicine is expanded) -->
                <template v-if="expandedItems.has(name)">
                  <tr 
                    v-for="med in medicines" 
                    :key="`${categoryId}-${name}-${med.med_id}`" 
                    class="bg-gray-100"
                    :class="{'expired-row': isExpired(med.expiration)}"
                  >
                    <td class="px-6 py-2 text-sm text-gray-900">
                      <div class="flex items-center ml-12">
                        <!-- Display expiration date instead of batch number -->
                        <span :class="{'text-red-600 font-bold': isExpired(med.expiration)}">
                          {{ med.expiration ? formatDate(med.expiration) : 'No expiration date' }}
                        </span>
                        <!-- Add warning icon for expired items -->
                        <span v-if="isExpired(med.expiration)" class="ml-2 text-red-600">
                          <Icon icon="mdi:alert-circle" class="w-5 h-5" />
                        </span>
                      </div>
                    </td>
                    <td class="px-6 py-2 text-sm text-gray-900">{{ med.count }}</td>
                    <td class="px-6 py-2 text-sm text-gray-900">
                      <!-- Removed Edit and Delete buttons for batches -->
                    </td>
                  </tr>
                </template>
              </template>
            </template>
          </template>
        </tbody>
      </table>
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
.expiring-soon {
  background-color: #fff3cd;
}

.expired {
  background-color: #f8d7da;
  border-color: #f5c2c7;
}

.expired-row {
  background-color: #fee2e2; /* Light red background */
}
</style>