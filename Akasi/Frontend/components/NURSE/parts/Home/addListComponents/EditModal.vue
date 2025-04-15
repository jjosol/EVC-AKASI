<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-75">
    <div class="flex flex-col justify-center w-3/6 h-screen p-8 bg-white rounded-2xl">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl text-[#2f4a71] font-bold">{{ isViewOnly ? 'Consultation Record' : 'Edit Consultation Record' }}</h2>
        <div class="flex items-center">
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500">Page {{ currentPage }} of {{ totalPages }}</span>
          </div>
        </div>
      </div>
      
      <div class="flex-grow overflow-y-auto">
        <slot></slot>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex justify-between mt-6">
        <div>
          <button @click="$emit('cancel')" class="text-purple-600 underline">Cancel</button>
        </div>
        <div class="flex space-x-3">
          <button
            v-if="currentPage > 1"
            @click="$emit('prev-page')"
            class="px-4 py-2 text-[#2f4a71] border border-[#2f4a71] rounded-md hover:bg-[#2f4a71] hover:text-white"
          >
            Previous
          </button>
          <button
            v-if="currentPage < totalPages"
            @click="$emit('next-page')"
            class="px-4 py-2 text-white bg-[#2f4a71] rounded-md hover:bg-[#8b67db]"
          >
            Next
          </button>
          <button
            v-if="currentPage === totalPages && !isViewOnly"
            @click="$emit('save')"
            class="px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  show: Boolean,
  isViewOnly: {
    type: Boolean,
    default: false
  },
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 2
  }
});

const emit = defineEmits(['cancel', 'save', 'next-page', 'prev-page']);
</script>