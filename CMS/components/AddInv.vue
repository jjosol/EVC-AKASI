<script setup>
import { ref } from 'vue';

const isOpen = ref(false);
const newItem = ref({
  name: '',
  expirationDate: '',
  count: 0,
});

const closeModal = () => {
  isOpen.value = false;
};

const addItem = () => {
  // Emit the new item to the parent component
  closeModal();
  emit('addItem', { ...newItem.value });
  newItem.value = { name: '', expirationDate: '', count: 0 }; // Reset the form
};
</script>
<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black opacity-50"></div>
      <div class="z-10 w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 class="mb-4 text-lg font-semibold">Add New Item</h2>
        <form @submit.prevent="addItem">
          <div class="mb-4">
            <label class="block mb-1 text-sm font-medium">Name</label>
            <input type="text" v-model="newItem.name" class="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div class="mb-4">
            <label class="block mb-1 text-sm font-medium">Expiration Date</label>
            <input type="date" v-model="newItem.expirationDate" class="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div class="mb-4">
            <label class="block mb-1 text-sm font-medium">Count</label>
            <input type="number" v-model="newItem.count" class="w-full px-3 py-2 border rounded-lg" required />
          </div>
          <div class="flex justify-end">
            <button type="button" @click="closeModal" class="px-4 py-2 mr-2 bg-gray-200 rounded-lg">Cancel</button>
            <button type="submit" class="px-4 py-2 text-white bg-blue-600 rounded-lg">Add</button>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <style scoped>
  /* Add any additional styling here if necessary */
  </style>
  