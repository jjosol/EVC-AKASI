<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="w-full max-w-md p-6 bg-white rounded-lg">
      <h3 class="text-xl font-bold text-[#2f4a71] mb-4">Update Appointment Status</h3>
      
      <div class="mb-4">
        <label class="block mb-2 text-sm font-medium text-gray-700">Appointment Status</label>
        <div class="flex flex-wrap gap-3">
          <button 
            v-for="status in ['pending', 'approved', 'rejected']" 
            :key="status"
            @click="$emit('update:status', status)"
            :class="[
              'px-3 py-1 text-sm font-medium rounded-md', 
              selectedStatus === status 
                ? (status === 'approved' ? 'bg-green-500 text-white' : 
                   status === 'rejected' ? 'bg-red-500 text-white' : 
                   'bg-blue-500 text-white')
                : 'bg-gray-100 text-gray-700'
            ]"
          >
            {{ status.charAt(0).toUpperCase() + status.slice(1) }}
          </button>
        </div>
      </div>
      
      <div class="mb-4">
        <label class="block mb-2 text-sm font-medium text-gray-700">Notes</label>
        <textarea 
          :value="notes" 
          @input="$emit('update:notes', $event.target.value)"
          class="w-full p-2 text-gray-700 border border-gray-300 rounded min-h-[100px]"
          placeholder="Add notes about this appointment..."
        ></textarea>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button 
          @click="$emit('cancel')" 
          class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button 
          @click="$emit('save')"
          class="px-4 py-2 text-white bg-[#2f4a71] rounded-md hover:bg-[#8b67db]"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Saving...</span>
          <span v-else>Save</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  show: Boolean,
  selectedStatus: {
    type: String,
    default: 'pending'
  },
  notes: String,
  isLoading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['cancel', 'save', 'update:status', 'update:notes']);
</script>