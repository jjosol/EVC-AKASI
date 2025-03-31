<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import * as inventoryService from '~/services/inventoryService';
import EditMedicineNameModal from './EditMedicineNameModal.vue';

// Existing refs
const items = ref([]);
const categories = ref([]);
const expandedCategories = ref(new Set());
const expandedItems = ref(new Set());
const searchQuery = ref('');

// Add refs for inventory edits
const inventoryEdits = ref([]);
const showEditLogs = ref(false);
const editsSearchQuery = ref('');
const dateFilter = ref('all'); // 'all', 'today', 'week', 'month'

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

// Add function to fetch inventory edits
const fetchInventoryEdits = async () => {
  try {
    const data = await inventoryService.fetchInventoryEdits();
    
    // Check if we have the new response format
    if (data && data.edits) {
      inventoryEdits.value = data.edits;
    } else {
      // Handle old format
      inventoryEdits.value = data;
    }
  } catch (error) {
    console.error('Error fetching inventory edits:', error);
  }
};

const refreshInventory = async () => {
  await fetchCategories();
  await fetchInventory();
  await fetchInventoryEdits();
};

// Format date helper
const formatDate = (dateString) => {
  return dateString ? new Date(dateString).toISOString().split('T')[0] : '';
};

// Format timestamp for better display
const formatTimestamp = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Add function to check if date is expired
const isExpired = (expirationDate) => {
  if (!expirationDate) return false;
  
  const expDate = new Date(expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of day for fair comparison
  
  return expDate < today;
};

// Determine if change was addition or subtraction
const isAddition = (count) => {
  return count > 0;
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

// Add a computed property to filter edits
const filteredEdits = computed(() => {
  let filtered = inventoryEdits.value;
  
  // Apply date filter
  if (dateFilter.value !== 'all') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    filtered = filtered.filter(edit => {
      const editDate = new Date(edit.date);
      if (dateFilter.value === 'today') {
        return editDate >= today;
      } else if (dateFilter.value === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return editDate >= weekAgo;
      } else if (dateFilter.value === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return editDate >= monthAgo;
      }
      return true;
    });
  }
  
  // Apply search query
  if (editsSearchQuery.value) {
    const query = editsSearchQuery.value.toLowerCase();
    filtered = filtered.filter(edit => 
      edit.medName.toLowerCase().includes(query) || 
      edit.cause.toLowerCase().includes(query)
    );
  }
  
  // Sort by date (newest first)
  return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
});

// Add this computed property
const medicineChangeTotals = computed(() => {
  const totals = {};
  
  if (Array.isArray(inventoryEdits.value)) {
    // Handle array response (old format)
    inventoryEdits.value.forEach(edit => {
      // Create batch-specific key
      const batchKey = edit.batchInfo 
        ? `${edit.medName} (Exp: ${edit.batchInfo})`
        : edit.medName;
        
      if (!totals[batchKey]) {
        totals[batchKey] = 0;
      }
      totals[batchKey] += edit.addSubCount;
    });
  } else if (inventoryEdits.value && inventoryEdits.value.medicineTotals) {
    // Handle object response with pre-calculated totals
    return inventoryEdits.value.medicineTotals;
  }
  
  return totals;
});

// You can also create a computed property for just the filtered edits
const filteredMedicineTotals = computed(() => {
  const totals = {};
  
  filteredEdits.value.forEach(edit => {
    // Create batch-specific key
    const batchKey = edit.batchInfo 
      ? `${edit.medName} (Exp: ${edit.batchInfo})`
      : edit.medName;
      
    if (!totals[batchKey]) {
      totals[batchKey] = 0;
    }
    totals[batchKey] += edit.addSubCount;
  });
  
  return totals;
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
    
    <!-- Inventory Change Log Section -->
    <div class="pt-6 mt-8 border-t">
      <div class="flex items-center justify-between mb-4">
        <button 
          @click="showEditLogs = !showEditLogs" 
          class="flex items-center text-lg font-semibold text-gray-800"
        >
          <Icon :icon="showEditLogs ? 'mdi:chevron-down' : 'mdi:chevron-right'" class="mr-2" />
          Inventory Change Log
        </button>
        
        <div v-if="showEditLogs" class="flex items-center space-x-4">
          <!-- Search input -->
          <div class="relative">
            <input 
              type="text" 
              v-model="editsSearchQuery"
              placeholder="Search logs..."
              class="py-2 pl-8 pr-4 border rounded-lg"
            />
            <Icon icon="mdi:magnify" class="absolute left-2 top-2.5 text-gray-400" />
          </div>
          
          <!-- Date filter -->
          <select 
            v-model="dateFilter"
            class="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>
      
      <!-- Medicine Change Totals Section -->
      <!-- <div v-if="showEditLogs" class="p-4 mb-6 rounded-lg bg-gray-50">
        <h3 class="mb-3 font-semibold text-md">Medicine Change Totals by Batch</h3>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div v-for="(total, key) in filteredMedicineTotals" :key="key"
               class="flex items-center justify-between p-3 border rounded-lg"
               :class="total > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
            <span class="text-sm font-medium">{{ key }}</span>
            <span :class="total >= 0 ? 'text-green-600' : 'text-red-600'" class="font-bold">
              {{ total >= 0 ? '+' : '' }}{{ total }}
            </span>
          </div>
          <div v-if="Object.keys(filteredMedicineTotals).length === 0" 
               class="p-3 text-center text-gray-500 col-span-full">
            No inventory changes found
          </div>
        </div>
      </div> -->
      
      <!-- Log table (only shown when expanded) -->
      <div v-if="showEditLogs" class="mt-2">
        <table class="min-w-full border table-auto">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-sm font-medium text-left text-gray-700">Date & Time</th>
              <th class="px-4 py-2 text-sm font-medium text-left text-gray-700">Medicine Name</th>
              <th class="px-4 py-2 text-sm font-medium text-left text-gray-700">Cause</th>
              <th class="px-4 py-2 text-sm font-medium text-right text-gray-700">Quantity</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="edit in filteredEdits" :key="edit.edit_id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-900">{{ formatTimestamp(edit.date) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900">
                {{ edit.medName }}
                <span v-if="edit.batchInfo" class="block text-xs text-gray-500">
                  Batch: Exp {{ edit.batchInfo }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ edit.cause }}</td>
              <td class="px-4 py-3 text-sm font-medium" :class="isAddition(edit.addSubCount) ? 'text-green-600' : 'text-red-600'">
                <div class="flex items-center justify-end">
                  <Icon :icon="isAddition(edit.addSubCount) ? 'mdi:plus' : 'mdi:minus'" class="mr-1" />
                  {{ Math.abs(edit.addSubCount) }}
                </div>
              </td>
            </tr>
            <tr v-if="filteredEdits.length === 0">
              <td colspan="4" class="px-4 py-3 text-sm text-center text-gray-500">
                No inventory changes found
              </td>
            </tr>
          </tbody>
        </table>
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

/* Add styles for the change logs */
.addition {
  color: #10b981;
}

.subtraction {
  color: #ef4444;
}
</style>