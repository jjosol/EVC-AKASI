<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import * as inventoryService from '~/services/inventoryService';

// Refs
const equipment = ref([]);
const categories = ref([]);
const expandedCategories = ref(new Set());
const searchQuery = ref('');
const editingItem = ref(null);

// Equipment modal refs
const showEquipmentModal = ref(false);
const currentEquipment = ref(null);

// Category modal refs
const showCategoryModal = ref(false);
const currentCategory = ref(null);

// Increase/Decrease modal refs
const showAdjustModal = ref(false);
const adjustmentType = ref('increase'); // 'increase' or 'decrease'
const adjustmentQuantity = ref(1);
const adjustmentCause = ref('');
const selectedEquipment = ref(null);

const fetchEquipmentCategories = async () => {
  try {
    const data = await inventoryService.fetchEquipmentCategories();
    categories.value = data || [];
    console.log('Equipment categories loaded successfully:', data);
  } catch (error) {
    console.error('Error fetching equipment categories:', error);
    categories.value = []; // Set to empty array on error
  }
};

const fetchEquipment = async () => {
  try {
    const data = await inventoryService.fetchEquipmentItems();
    equipment.value = data || [];
    console.log('Equipment data loaded successfully:', data);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    equipment.value = []; // Set to empty array on error
  }
};

// Refresh equipment data
const refreshEquipment = async () => {
  await fetchEquipmentCategories();
  await fetchEquipment();
};

// Format date helper
const formatDate = (dateString) => {
  return dateString ? new Date(dateString).toISOString().split('T')[0] : 'No expiration';
};

// Check if date is expired
const isExpired = (expirationDate) => {
  if (!expirationDate) return false;
  
  const expDate = new Date(expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of day for fair comparison
  
  return expDate < today;
};

// Group equipment by category
const groupedByCategory = computed(() => {
  const groups = {};
  
  // Initialize with all categories (even empty ones)
  categories.value.forEach(category => {
    groups[category.equipCategory_id] = {
      ...category,
      items: []
    };
  });
  
  // Group items by category_id
  equipment.value.forEach(item => {
    const categoryId = item.equipCategory_id;
    
    // If category doesn't exist in our groups (should not happen, but just in case)
    if (!groups[categoryId]) {
      groups[categoryId] = {
        equipCategory_id: categoryId,
        name: item.category?.name || 'Uncategorized',
        items: []
      };
    }
    
    groups[categoryId].items.push(item);
  });
  
  return groups;
});

// Filter based on search query
const filteredCategories = computed(() => {
  if (!searchQuery.value) return groupedByCategory.value;
  
  const filtered = {};
  const query = searchQuery.value.toLowerCase();
  
  Object.entries(groupedByCategory.value).forEach(([categoryId, category]) => {
    const matchingItems = category.items.filter(item => 
      item.equipName.toLowerCase().includes(query) || 
      item.unit.toLowerCase().includes(query)
    );
    
    if (matchingItems.length > 0 || 
        category.name.toLowerCase().includes(query)) {
      filtered[categoryId] = {
        ...category,
        items: matchingItems
      };
    }
  });
  
  return filtered;
});

const toggleExpandCategory = (categoryId) => {
  categoryId = Number(categoryId);
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId);
  } else {
    expandedCategories.value.add(categoryId);
  }
};

// Open equipment modal for adding new equipment
const addEquipment = (categoryId) => {
  currentEquipment.value = {
    categoryId: categoryId
  };
  showEquipmentModal.value = true;
};

// Open equipment modal for editing equipment
const editEquipment = (item) => {
  currentEquipment.value = {
    equip_id: item.equipment_id,
    name: item.equipName,
    count: item.count,
    unit: item.unit,
    expirationDate: item.expiration ? formatDate(item.expiration) : '',
    categoryId: item.equipCategory_id,
    nameEditOnly: true // Add this flag to indicate we only want to edit the name
  };
  showEquipmentModal.value = true;
};

// Open category modal
const openCategoryModal = (category = null) => {
  currentCategory.value = category;
  showCategoryModal.value = true;
};

// Handle category added/updated
const handleCategoryAction = async () => {
  await refreshEquipment();
  showCategoryModal.value = false;
}

// Open adjustment modal
const openAdjustModal = (item, type) => {
  selectedEquipment.value = item;
  adjustmentType.value = type;
  adjustmentQuantity.value = 1;
  adjustmentCause.value = type === 'increase' ? 'Manual addition' : 'Manual reduction';
  showAdjustModal.value = true;
};

// Handle equipment adjustment (increase or decrease)
const handleAdjustment = async () => {
  try {
    const data = {
      quantity: adjustmentQuantity.value,
      cause: adjustmentCause.value
    };
    
    if (adjustmentType.value === 'increase') {
      await inventoryService.increaseEquipment(selectedEquipment.value.equipment_id, data);
    } else {
      await inventoryService.decreaseEquipment(selectedEquipment.value.equipment_id, data);
    }
    
    showAdjustModal.value = false;
    await refreshEquipment();
    // Notify parent component that a refresh is needed
    emit('refreshNeeded');
  } catch (error) {
    console.error(`Error ${adjustmentType.value}ing equipment:`, error);
    alert(error.message || `Failed to ${adjustmentType.value} equipment`);
  }
};

// Quick increment equipment
const quickIncrementEquipment = async (item) => {
  try {
    await inventoryService.increaseEquipment(
      item.equipment_id,
      { 
        quantity: 1,
        cause: `Quick increase`
      }
    );
    
    // Refresh data
    emit('refreshNeeded');
    await refreshEquipment();
    
  } catch (error) {
    console.error('Error increasing equipment:', error);
    alert(error.message || 'Failed to increase equipment');
  }
};

// Quick decrement equipment
const quickDecrementEquipment = async (item) => {
  // Don't allow decreasing below 0
  if (item.count <= 0) {
    return;
  }
  
  try {
    await inventoryService.decreaseEquipment(
      item.equipment_id,
      { 
        quantity: 1,
        cause: `Quick decrease`
      }
    );
    
    // Refresh data
    emit('refreshNeeded');
    await refreshEquipment();
    
  } catch (error) {
    console.error('Error decreasing equipment:', error);
    alert(error.message || 'Failed to decrease equipment');
  }
};

// Close equipment modal
const closeEquipmentModal = () => {
  showEquipmentModal.value = false;
  currentEquipment.value = null;
};

// Handle add/update equipment
const handleEquipmentSaved = async () => {
  await refreshEquipment();
  closeEquipmentModal();
};

onMounted(() => {
  refreshEquipment();
});

// Expose refreshEquipment for parent component
defineExpose({ refreshEquipment });

// Add emit for component events 
const emit = defineEmits(['refreshNeeded']);
</script>

<template>
  <div class="w-5/6 p-6 bg-white rounded-lg shadow float-end">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-2">
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="Search equipment..."
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
          @click="addEquipment()"
          class="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
        >
          Add New Equipment
        </button>
      </div>
    </div>
    
    <!-- Categories and Equipment with Dropdown Design -->
    <div class="space-y-4">
      <div v-for="(category, categoryId) in filteredCategories" :key="categoryId" class="overflow-hidden border rounded-lg">
        <!-- Category Header -->
        <div 
          class="flex items-center justify-between p-4 border-b cursor-pointer bg-gray-50"
          @click="toggleExpandCategory(categoryId)"
        >
          <div class="flex items-center">
            <Icon 
              :icon="expandedCategories.has(Number(categoryId)) ? 'mdi:chevron-down' : 'mdi:chevron-right'" 
              class="mr-2 text-gray-600" 
              width="20"
            />
            <h3 class="font-semibold text-gray-800">{{ category.name }}</h3>
            <span class="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded-full">
              {{ category.items.length }} items
            </span>
          </div>
          
          <div class="flex space-x-2">
            <button 
              @click.stop="addEquipment(categoryId)"
              class="p-1 text-white bg-blue-500 rounded hover:bg-blue-600" 
              title="Add Equipment to Category"
            >
              <Icon icon="mdi:tools" width="16" />
            </button>
            <button 
              @click.stop="openCategoryModal(category)"
              class="p-1 text-white bg-yellow-500 rounded hover:bg-yellow-600" 
              title="Edit Category"
            >
              <Icon icon="mdi:pencil" width="16" />
            </button>
          </div>
        </div>
        
        <!-- Equipment List (visible when category is expanded) -->
        <div v-if="expandedCategories.has(Number(categoryId))">
          <div v-if="category.items.length === 0" class="p-4 text-center text-gray-500">
            No equipment in this category
          </div>
          
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th class="px-4 py-3">Equipment Name</th>
                  <th class="px-4 py-3">Quantity</th>
                  <th class="px-4 py-3">Unit</th>
                  <th class="px-4 py-3">Expiration</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="item in category.items" :key="item.equipment_id" 
                    class="bg-white hover:bg-gray-50"
                    :class="{'bg-red-50': isExpired(item.expiration)}">
                  <td class="px-4 py-3 font-medium">{{ item.equipName }}</td>
                  <td class="px-4 py-3 text-center">{{ item.count }}</td>
                  <td class="px-4 py-3">{{ item.unit }}</td>
                  <td class="px-4 py-3" :class="{'text-red-600': isExpired(item.expiration)}">
                    {{ formatDate(item.expiration) }}
                    <span v-if="isExpired(item.expiration)" class="text-xs font-bold text-red-600">(EXPIRED)</span>
                  </td>
                  <td class="flex justify-end px-4 py-3 space-x-1">
                    <button 
                      @click="quickIncrementEquipment(item)"
                      class="p-1 text-white bg-green-500 rounded hover:bg-green-600" 
                      title="Quick Add"
                    >
                      <Icon icon="mdi:plus" width="16" /> 
                    </button>
                    <button 
                      @click="quickDecrementEquipment(item)"
                      class="p-1 text-white bg-red-500 rounded hover:bg-red-600" 
                      title="Quick Remove"
                      :disabled="item.count <= 0"
                      :class="{'opacity-50 cursor-not-allowed': item.count <= 0}"
                    >
                      <Icon icon="mdi:minus" width="16" />
                    </button>
                    <button 
                      @click="editEquipment(item)"
                      class="p-1 text-white bg-blue-500 rounded hover:bg-blue-600" 
                      title="Edit Equipment"
                    >
                      <Icon icon="mdi:pencil" width="16" />
                    </button>
                    <button 
                      @click="openAdjustModal(item, 'increase')"
                      class="p-1 text-white bg-indigo-500 rounded hover:bg-indigo-600" 
                      title="Adjust Quantity"
                    >
                      <Icon icon="mdi:tune" width="16" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- No Categories Message -->
      <div v-if="Object.keys(filteredCategories).length === 0" class="p-8 text-center text-gray-500">
        <div class="mb-4">
          <Icon icon="mdi:tools" class="w-12 h-12 mx-auto text-gray-400" />
        </div>
        <p v-if="searchQuery" class="mb-2">No equipment found matching "{{ searchQuery }}"</p>
        <p v-else class="mb-2">No equipment or categories found</p>
        <p class="text-sm">Get started by adding a category or equipment using the buttons above</p>
      </div>
    </div>
    
    <!-- Equipment Modal -->
    <EquipmentModal
      :isOpen="showEquipmentModal"
      :editData="currentEquipment"
      @closeModal="closeEquipmentModal"
      @equipmentSaved="handleEquipmentSaved"
      @refreshEquipment="refreshEquipment"
    />
    
    <!-- Category Modal -->
    <EquipmentCategoryModal
      :isOpen="showCategoryModal"
      :editItem="currentCategory"
      @closeModal="showCategoryModal = false"
      @addCategory="handleCategoryAction"
    />
    
    <!-- Adjustment Modal -->
    <div v-if="showAdjustModal" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black opacity-50" @click="showAdjustModal = false"></div>
      <div class="z-10 w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 class="mb-4 text-lg font-semibold">
          {{ adjustmentType === 'increase' ? 'Add to' : 'Remove from' }} Inventory
        </h2>
        <form @submit.prevent="handleAdjustment">
          <div class="mb-4">
            <label class="block mb-1 text-sm font-medium">Equipment</label>
            <input 
              type="text" 
              :value="selectedEquipment?.equipName"
              class="w-full px-3 py-2 border rounded-lg bg-gray-50" 
              disabled
            />
          </div>
          <div class="mb-4">
            <label class="block mb-1 text-sm font-medium">Current Quantity</label>
            <input 
              type="text" 
              :value="`${selectedEquipment?.count} ${selectedEquipment?.unit}`"
              class="w-full px-3 py-2 border rounded-lg bg-gray-50" 
              disabled
            />
          </div>
          <div class="mb-4">
            <label class="block mb-1 text-sm font-medium">
              {{ adjustmentType === 'increase' ? 'Add' : 'Remove' }} Quantity
            </label>
            <input 
              type="number" 
              v-model="adjustmentQuantity"
              class="w-full px-3 py-2 border rounded-lg" 
              min="1"
              :max="adjustmentType === 'decrease' ? selectedEquipment?.count : undefined"
              required 
            />
            <span v-if="adjustmentType === 'decrease' && adjustmentQuantity > selectedEquipment?.count" 
                 class="text-sm text-red-500">
              Cannot remove more than available quantity
            </span>
          </div>
          <div class="mb-4">
            <label class="block mb-1 text-sm font-medium">Reason</label>
            <input 
              type="text" 
              v-model="adjustmentCause"
              class="w-full px-3 py-2 border rounded-lg" 
              required
            />
          </div>
          <div class="flex justify-end space-x-2">
            <button 
              type="button"
              @click="showAdjustModal = false"
              class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg"
            >
              Cancel
            </button>
            <button 
              type="submit"
              class="px-4 py-2 text-sm text-white rounded-lg"
              :class="adjustmentType === 'increase' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'"
              :disabled="adjustmentType === 'decrease' && adjustmentQuantity > selectedEquipment?.count"
            >
              {{ adjustmentType === 'increase' ? 'Add to' : 'Remove from' }} Inventory
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any equipment-specific styles here */
</style>