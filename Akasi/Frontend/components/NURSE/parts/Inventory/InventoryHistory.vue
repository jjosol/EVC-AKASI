<script setup>
import { ref, computed, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import * as inventoryService from '~/services/inventoryService';

// Data
const inventoryEdits = ref([]);
const equipmentEdits = ref([]);
const searchQuery = ref('');
const filterType = ref('all');
const activeTab = ref('medicine'); // 'medicine' or 'equipment'

// Add alias for the originally named function
const fetchMedicineEdits = async () => {
  try {
    const response = await inventoryService.fetchMedicineEdits(); 
    if (response && response.edits) {
      inventoryEdits.value = response.edits;
    }
  } catch (error) {
    console.error('Error fetching inventory edits:', error);
  }
};

// Keep original function as wrapper for backward compatibility
const fetchInventoryEdits = fetchMedicineEdits;

// Fetch equipment edits
const fetchEquipmentEdits = async () => {
  try {
    const response = await inventoryService.fetchEquipmentEdits();
    if (response && response.edits) {
      equipmentEdits.value = response.edits;
    }
  } catch (error) {
    console.error('Error fetching equipment edits:', error);
  }
};

// Computed
const filteredInventoryEdits = computed(() => {
  let filtered = inventoryEdits.value;
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(edit => 
      edit.medName.toLowerCase().includes(query) ||
      edit.cause.toLowerCase().includes(query) ||
      edit.categoryName.toLowerCase().includes(query) ||
      (edit.adminInfo && edit.adminInfo.toLowerCase().includes(query))
    );
  }
  
  // Apply type filter
  if (filterType.value !== 'all') {
    switch (filterType.value) {
      case 'addition':
        filtered = filtered.filter(edit => edit.addSubCount > 0);
        break;
      case 'reduction':
        filtered = filtered.filter(edit => edit.addSubCount < 0);
        break;
      case 'category-change':
        filtered = filtered.filter(edit => isCategoryEdit(edit));
        break;
    }
  }
  
  return filtered;
});

// Computed property for filtered equipment edits
const filteredEquipmentEdits = computed(() => {
  let filtered = equipmentEdits.value;
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(edit => 
      edit.equipName.toLowerCase().includes(query) ||
      edit.cause.toLowerCase().includes(query) ||
      (edit.adminInfo && edit.adminInfo.toLowerCase().includes(query))
    );
  }
  
  // Apply type filter
  if (filterType.value !== 'all') {
    switch (filterType.value) {
      case 'addition':
        filtered = filtered.filter(edit => edit.addSubCount > 0);
        break;
      case 'reduction':
        filtered = filtered.filter(edit => edit.addSubCount < 0);
        break;
      // Equipment only has category-change option
      case 'category-change':
        filtered = [];
        break;
    }
  }
  
  return filtered;
});

// Add this computed property to filter medication-related events
const medicationAdminEvents = computed(() => {
  return inventoryEdits.value.filter(edit => 
    edit.cause.includes('Dispensed to') || 
    edit.cause.includes('consultation') ||
    edit.cause.includes('administration')
  );
});

// Format date and time
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

// Check if edit is addition
const isAddition = (count) => {
  return count > 0;
};

// Check if edit is a name change
const isNameChangeEdit = (edit) => {
  return edit.cause.includes('renamed from');
};

// Check if edit is a category-related edit
const isCategoryEdit = (edit) => {
  return edit.medName?.startsWith('[Category]') || 
         edit.cause.includes('category') ||
         edit.cause.includes('Category');
};

// Add this function to highlight medication events differently
const isMedicationEvent = (edit) => {
  return edit.cause.includes('Dispensed to') || 
         edit.cause.includes('consultation') ||
         edit.cause.includes('administration');
};

onMounted(() => {
  fetchInventoryEdits();
  fetchEquipmentEdits();
});

// Expose both function names
defineExpose({ fetchInventoryEdits, fetchMedicineEdits, fetchEquipmentEdits });
</script>

<template>
  <div class="w-full max-w-none p-4 sm:p-6 mt-6 bg-white rounded-lg shadow lg:w-5/6 lg:float-end">
    <h2 class="mb-4 text-xl font-semibold">Inventory History</h2>

    <!-- Tab Selection -->
    <div class="flex mb-4 border-b overflow-x-auto">
      <button 
        class="px-4 py-2 mr-2 transition-colors whitespace-nowrap"
        :class="activeTab === 'medicine' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-600'"
        @click="activeTab = 'medicine'"
      >
        Medicine Inventory
      </button>
      <button 
        class="px-4 py-2 transition-colors whitespace-nowrap"
        :class="activeTab === 'equipment' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-600'"
        @click="activeTab = 'equipment'"
      >
        Equipment Inventory
      </button>
    </div>

    <!-- Filter Controls -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center mb-4 space-y-2 sm:space-y-0 sm:space-x-4">
      <input 
        type="text" 
        v-model="searchQuery"
        :placeholder="activeTab === 'medicine' ? 'Search by medicine, category, or cause...' : 'Search by equipment or cause...'"
        class="flex-grow px-4 py-2 border rounded-lg"
      />
      
      <select 
        v-model="filterType"
        class="px-4 py-2 border rounded-lg"
      >
        <option value="all">All Changes</option>
        <option value="addition">Additions</option>
        <option value="reduction">Reductions</option>
        <option v-if="activeTab === 'medicine'" value="category-change">Category Changes</option>
      </select>
    </div>
      <!-- Medicine Inventory Log Table -->
    <div v-if="activeTab === 'medicine'" class="mt-6">
      <h3 class="mb-2 text-lg font-medium">Medicine Inventory Log</h3>
      
      <!-- Desktop table view -->
      <div class="hidden lg:block overflow-x-auto">
        <table class="min-w-full border table-auto">
          <thead>
            <tr class="bg-gray-100">
              <th class="px-4 py-2 text-left">Medicine</th>
              <th class="px-4 py-2 text-left">Batch Info</th>
              <th class="px-4 py-2 text-left">Category</th>
              <th class="px-4 py-2 text-left">Cause</th>
              <th class="px-4 py-2 text-left">Admin</th>
              <th class="px-4 py-2 text-left">Date & Time</th>
              <th class="px-4 py-2 text-right">Change</th>
              <th class="px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="edit in filteredInventoryEdits" :key="edit.edit_id" 
                class="border-t" 
                :class="{
                  'bg-purple-50': isNameChangeEdit(edit), 
                  'bg-blue-50': isCategoryEdit(edit),
                  'bg-yellow-50': isMedicationEvent(edit)
                }">
              <td class="px-4 py-2">{{ edit.medName }}</td>
              <td class="px-4 py-2">{{ edit.batchInfo }}</td>
              <td class="px-4 py-2">{{ edit.categoryName }}</td>
              <td class="px-4 py-2">{{ edit.cause }}</td>
              <td class="px-4 py-2">{{ edit.adminInfo }}</td>
              <td class="px-4 py-2">{{ formatDateTime(edit.date) }}</td>
              <td class="px-4 py-2 text-right" :class="isAddition(edit.addSubCount) ? 'addition' : 'subtraction'">
                {{ edit.addSubCount === 0 ? '—' : (isAddition(edit.addSubCount) ? '+' : '') + edit.addSubCount }}
              </td>
              <td class="px-4 py-2 font-medium text-right">
                {{ isNameChangeEdit(edit) || isCategoryEdit(edit) ? '—' : edit.runningTotal }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile/Tablet card view -->
      <div class="space-y-4 lg:hidden">
        <div v-if="filteredInventoryEdits.length === 0" class="p-8 text-center text-gray-500">
          <p>No medicine inventory changes found</p>
        </div>
        <div 
          v-for="edit in filteredInventoryEdits" 
          :key="edit.edit_id"
          class="p-4 border rounded-lg"
          :class="{
            'bg-purple-50 border-purple-200': isNameChangeEdit(edit), 
            'bg-blue-50 border-blue-200': isCategoryEdit(edit),
            'bg-yellow-50 border-yellow-200': isMedicationEvent(edit),
            'bg-white': !isNameChangeEdit(edit) && !isCategoryEdit(edit) && !isMedicationEvent(edit)
          }"
        >
          <div class="flex justify-between items-start mb-3">
            <h4 class="font-medium text-lg text-gray-900">{{ edit.medName }}</h4>
            <span 
              class="px-2 py-1 rounded-full text-sm font-medium"
              :class="isAddition(edit.addSubCount) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
            >
              {{ edit.addSubCount === 0 ? 'No Change' : (isAddition(edit.addSubCount) ? '+' : '') + edit.addSubCount }}
            </span>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-gray-500">Batch Info:</span>
              <span class="ml-1 font-medium">{{ edit.batchInfo }}</span>
            </div>
            <div>
              <span class="text-gray-500">Category:</span>
              <span class="ml-1 font-medium">{{ edit.categoryName }}</span>
            </div>
            <div>
              <span class="text-gray-500">Cause:</span>
              <span class="ml-1 font-medium">{{ edit.cause }}</span>
            </div>
            <div>
              <span class="text-gray-500">Admin:</span>
              <span class="ml-1 font-medium">{{ edit.adminInfo }}</span>
            </div>
            <div class="sm:col-span-2">
              <span class="text-gray-500">Date & Time:</span>
              <span class="ml-1 font-medium">{{ formatDateTime(edit.date) }}</span>
            </div>
            <div v-if="!isNameChangeEdit(edit) && !isCategoryEdit(edit)">
              <span class="text-gray-500">Running Total:</span>
              <span class="ml-1 font-medium">{{ edit.runningTotal }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>    <!-- Equipment Inventory Log Table -->
    <div v-if="activeTab === 'equipment'" class="mt-6">
      <h3 class="mb-2 text-lg font-medium">Equipment Inventory Log</h3>
      
      <!-- Desktop table view -->
      <div class="hidden lg:block overflow-x-auto">
        <table class="min-w-full border table-auto">
          <thead>
            <tr class="bg-gray-100">
              <th class="px-4 py-2 text-left">Equipment</th>
              <th class="px-4 py-2 text-left">Unit</th>
              <th class="px-4 py-2 text-left">Cause</th>
              <th class="px-4 py-2 text-left">Admin</th>
              <th class="px-4 py-2 text-left">Date & Time</th>
              <th class="px-4 py-2 text-right">Change</th>
              <th class="px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="edit in filteredEquipmentEdits" :key="edit.edit_id" class="border-t">
              <td class="px-4 py-2">{{ edit.equipName }}</td>
              <td class="px-4 py-2">{{ edit.unit }}</td>
              <td class="px-4 py-2">{{ edit.cause }}</td>
              <td class="px-4 py-2">{{ edit.adminInfo }}</td>
              <td class="px-4 py-2">{{ formatDateTime(edit.date) }}</td>
              <td class="px-4 py-2 text-right" :class="isAddition(edit.addSubCount) ? 'addition' : 'subtraction'">
                {{ isAddition(edit.addSubCount) ? '+' : '' }}{{ edit.addSubCount }}
              </td>
              <td class="px-4 py-2 font-medium text-right">
                {{ edit.runningTotal }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile/Tablet card view -->
      <div class="space-y-4 lg:hidden">
        <div v-if="filteredEquipmentEdits.length === 0" class="p-8 text-center text-gray-500">
          <p>No equipment inventory changes found</p>
        </div>
        <div 
          v-for="edit in filteredEquipmentEdits" 
          :key="edit.edit_id"
          class="p-4 bg-white border rounded-lg"
        >
          <div class="flex justify-between items-start mb-3">
            <h4 class="font-medium text-lg text-gray-900">{{ edit.equipName }}</h4>
            <span 
              class="px-2 py-1 rounded-full text-sm font-medium"
              :class="isAddition(edit.addSubCount) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
            >
              {{ isAddition(edit.addSubCount) ? '+' : '' }}{{ edit.addSubCount }}
            </span>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-gray-500">Unit:</span>
              <span class="ml-1 font-medium">{{ edit.unit }}</span>
            </div>
            <div>
              <span class="text-gray-500">Running Total:</span>
              <span class="ml-1 font-medium">{{ edit.runningTotal }}</span>
            </div>
            <div>
              <span class="text-gray-500">Cause:</span>
              <span class="ml-1 font-medium">{{ edit.cause }}</span>
            </div>
            <div>
              <span class="text-gray-500">Admin:</span>
              <span class="ml-1 font-medium">{{ edit.adminInfo }}</span>
            </div>
            <div class="sm:col-span-2">
              <span class="text-gray-500">Date & Time:</span>
              <span class="ml-1 font-medium">{{ formatDateTime(edit.date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.addition {
  color: green;
}
.subtraction {
  color: red;
}
</style>