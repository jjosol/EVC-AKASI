<script setup>
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  message: {
    type: String,
    default: 'Are you sure you want to proceed?'
  },
  confirmButtonText: {
    type: String,
    default: 'Confirm'
  },
  cancelButtonText: {
    type: String,
    default: 'Cancel'
  }
});

const emit = defineEmits(['confirm', 'cancel']);

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-75">
    <div class="w-full max-w-md p-6 mx-4 bg-white rounded-lg">
      <h3 class="mb-4 text-lg font-medium text-gray-900">Confirm</h3>
      <p class="mb-6 text-gray-700">{{ message }}</p>
      <div class="flex items-center justify-end space-x-4">
        <button 
          @click="handleCancel"
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          {{ cancelButtonText }}
        </button>
        <button 
          @click="handleConfirm"
          class="px-4 py-2 text-white bg-[#2f4a71] rounded-md hover:bg-[#8b67db]"
        >
          {{ confirmButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>