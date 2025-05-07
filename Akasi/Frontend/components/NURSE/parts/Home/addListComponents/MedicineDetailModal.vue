<style scoped>
.medicine-detail-modal {
  z-index: 99999 !important;
}
</style>

<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 medicine-detail-modal">
    <div class="w-1/3 p-6 bg-white rounded-2xl">
      <h2 class="mb-4 text-xl font-semibold">{{ isViewOnly ? 'Medicine Details' : (medicine.index !== undefined ? 'Edit Medicine' : 'Add Medicine') }}</h2>
      
      <div class="space-y-4">
        <!-- Medicine Name -->
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">Medicine Name</label>
          <input 
            type="text" 
            v-model="medicine.name" 
            class="w-full p-2 border border-gray-300 rounded" 
            disabled
          />
        </div>
        
        <!-- Quantity (OTC only) -->
        <div v-if="medicine.otc !== false">
          <label class="block mb-1 text-sm font-medium text-gray-700">Quantity</label>
          <input 
            type="number" 
            v-model.number="medicine.quantity" 
            class="w-full p-2 border border-gray-300 rounded"
            :disabled="isViewOnly"
            min="1"
          />
        </div>
        
        <!-- Schedule -->
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">Schedule</label>
          <select 
            v-model="medicine.schedule" 
            class="w-full p-2 border border-gray-300 rounded"
            :disabled="isViewOnly"
          >
            <option value="Once daily">Once daily</option>
            <option value="Twice daily">Twice daily</option>
            <option value="Three times daily">Three times daily</option>
            <option value="Four times daily">Four times daily</option>
            <option value="Every 4 hours">Every 4 hours</option>
            <option value="Every 6 hours">Every 6 hours</option>
            <option value="Every 8 hours">Every 8 hours</option>
            <option value="Every 12 hours">Every 12 hours</option>
            <option value="As needed">As needed</option>
            <option value="Before meals">Before meals</option>
            <option value="After meals">After meals</option>
            <option value="At bedtime">At bedtime</option>
          </select>
        </div>
        
        <!-- Date Range -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Start Date</label>
            <input 
              type="date" 
              v-model="medicine.startDate" 
              class="w-full p-2 border border-gray-300 rounded"
              :disabled="isViewOnly"
            />
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">End Date</label>
            <input 
              type="date" 
              v-model="medicine.endDate" 
              class="w-full p-2 border border-gray-300 rounded"
              :disabled="isViewOnly"
            />
          </div>
        </div>
        
        <!-- Remarks -->
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">Remarks</label>
          <textarea 
            v-model="medicine.remarks" 
            class="w-full h-24 p-2 border border-gray-300 rounded"
            :disabled="isViewOnly"
          ></textarea>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="flex justify-end mt-6 space-x-3">
        <button 
          @click="$emit('cancel')" 
          class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Close
        </button>
        <button 
          v-if="!isViewOnly && !doctorReviewed"
          @click="handleSave"
          class="px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600"
        >
          Add
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  show: Boolean,
  medicine: {
    type: Object,
    default: () => ({
      med_id: null,
      name: '',
      quantity: 1,
      schedule: 'As needed',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
      remarks: '',
      index: null,
      originalQuantity: 1,
      otc: true
    })
  },
  isViewOnly: {
    type: Boolean,
    default: false
  },
  doctorReviewed: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['cancel', 'save']);

const handleSave = () => {
  emit('save', props.medicine);
};

// If editing, show existing file name if present (no longer needed, but keep for future use)
watch(() => props.medicine.prescriptionFile, (file) => {}, { immediate: true });
</script>