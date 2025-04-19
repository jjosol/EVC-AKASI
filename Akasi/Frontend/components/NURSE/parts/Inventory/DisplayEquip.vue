<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import * as inventoryService from '~/services/inventoryService';

// Refs
const equipment = ref([]);
const searchQuery = ref('');
const editingItem = ref(null);

// Equipment modal refs
const showEquipmentModal = ref(false);
const currentEquipment = ref(null);

// Increase/Decrease modal refs
const showAdjustModal = ref(false);
const adjustmentType = ref('increase'); // 'increase' or 'decrease'
const adjustmentQuantity = ref(1);
const adjustmentCause = ref('');
const selectedEquipment = ref(null);

const fetchEquipment = async () => {
  try {
    const data = await inventoryService.fetchEquipmentItems();
    equipment.value = data || [];
    console.log('Equipment data loaded successfully:', data);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    equipment.value = []; // Set to empty array on error to avoid UI issues
    
    // You may want to show a user-friendly error message
    // useToast().error('Could not load equipment data. Please try again later.');
  }
};

// Refresh equipment data
const refreshEquipment = async () => {
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

// Filter equipment based on search query
const filteredEquipment = computed(() => {
  if (!searchQuery.value) return equipment.value;
  
  const query = searchQuery.value.toLowerCase();
  return equipment.value.filter(item => 
    item.equipName.toLowerCase().includes(query) || 
    item.unit.toLowerCase().includes(query)
  );
});

// Open equipment modal for adding new equipment
const addEquipment = () => {
  currentEquipment.value = null;
  showEquipmentModal.value = true;
};

// Open equipment modal for editing equipment
const editEquipment = (item) => {
  currentEquipment.value = {
    equip_id: item.equip_id,
    name: item.equipName,
    count: item.count,
    unit: item.unit,
    expirationDate: item.expiration ? formatDate(item.expiration) : ''
  };
  showEquipmentModal.value = true;
};

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
      await inventoryService.increaseEquipment(selectedEquipment.value.equip_id, data);
    } else {
      await inventoryService.decreaseEquipment(selectedEquipment.value.equip_id, data);
    }
    
    showAdjustModal.value = false;
    await refreshEquipment();
  } catch (error) {
    console.error(`Error ${adjustmentType.value}ing equipment:`, error);
    alert(error.message || `Failed to ${adjustmentType.value} equipment`);
  }
};

// Quick increment equipment
const quickIncrementEquipment = async (item) => {
  try {
    await inventoryService.increaseEquipment(
      item.equip_id,
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
      item.equip_id,
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
          @click="addEquipment"
          class="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
        >
          Add New Equipment
        </button>
      </div>
    </div>
    
    <!-- Equipment List -->
    <div class="overflow-hidden border rounded-lg">
      <div class="grid grid-cols-12 gap-2 p-4 font-semibold text-gray-700 bg-gray-50">
        <div class="col-span-4">Equipment Name</div>
        <div class="col-span-2">Quantity</div>
        <div class="col-span-2">Unit</div>
        <div class="col-span-2">Expiration</div>
        <div class="col-span-2 text-right">Actions</div>
      </div>
      
      <div class="divide-y divide-gray-200">
        <div v-for="item in filteredEquipment" :key="item.equip_id" 
             class="grid items-center grid-cols-12 gap-2 p-4 hover:bg-gray-50"
             :class="{'bg-red-50': isExpired(item.expiration)}">
          <div class="col-span-4 font-medium">{{ item.equipName }}</div>
          <div class="col-span-2 text-center">
            {{ item.count }}
          </div>
          <div class="col-span-2">{{ item.unit }}</div>
          <div class="col-span-2" :class="{'text-red-600': isExpired(item.expiration)}">
            {{ formatDate(item.expiration) }}
            <span v-if="isExpired(item.expiration)" class="text-xs font-bold text-red-600">(EXPIRED)</span>
          </div>
          <div class="flex justify-end col-span-2 space-x-1">
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
          </div>
        </div>
        
        <!-- Empty state -->
        <div v-if="filteredEquipment.length === 0" class="p-8 text-center text-gray-500">
          <div class="mb-4">
            <Icon icon="mdi:tools" class="w-12 h-12 mx-auto text-gray-400" />
          </div>
          <p v-if="searchQuery" class="mb-2">No equipment found matching "{{ searchQuery }}"</p>
          <p v-else class="mb-2">No equipment found</p>
          <p class="text-sm">Get started by adding equipment using the button above</p>
        </div>
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