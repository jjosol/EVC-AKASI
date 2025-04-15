<template>
  <div v-if="show" class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-[70]">
    <div class="w-1/3 p-6 bg-white rounded-2xl">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-gray-800">{{ title }}</h2>
        <button @click="$emit('cancel')" class="text-gray-500 hover:text-gray-700">
          <Icon icon="mdi:close" />
        </button>
      </div>
      
      <slot></slot>
      
      <div class="flex justify-end mt-6 space-x-3">
        <button 
          @click="$emit('cancel')" 
          class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          {{ cancelText }}
        </button>
        <button 
          @click="$emit('save')" 
          class="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700"
          :disabled="saveDisabled"
        >
          {{ saveText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';

const props = defineProps({
  show: Boolean,
  title: {
    type: String,
    default: 'Add Category'
  },
  saveText: {
    type: String,
    default: 'Save'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  saveDisabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['cancel', 'save']);
</script>