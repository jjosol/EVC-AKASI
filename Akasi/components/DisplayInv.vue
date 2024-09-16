<script setup>
const items = ref([
  { id: 1, name: 'Lorem ipsum', expirationDate: 'April 18, 2024', count: 100 },
  { id: 2, name: 'Lorem ipsum', expirationDate: 'April 18, 2024', count: 100 },
  { id: 3, name: 'Lorem ipsum', expirationDate: 'April 18, 2024', count: 100 },
  { id: 4, name: 'Lorem ipsum', expirationDate: 'May 23, 2024', count: 100 },
  { id: 5, name: 'Lorem ipsum', expirationDate: 'May 23, 2024', count: 100 },
  { id: 6, name: 'Lorem ipsum', expirationDate: 'May 23, 2024', count: 100 },
  { id: 7, name: 'Lorem ipsum', expirationDate: 'September 2, 2024', count: 100 },
  { id: 8, name: 'Lorem ipsum', expirationDate: 'September 2, 2024', count: 100 },
  { id: 9, name: 'Lorem ipsum', expirationDate: 'September 2, 2024', count: 100 },
]);

const searchQuery = ref('');
const isModalOpen = ref(false);

const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value;
  return items.value.filter(item =>
    item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const openModal = () => {
  isModalOpen.value = true;
};

const handleAddItem = (newItem) => {
  items.value.push({
    id: items.value.length + 1,
    ...newItem
  });
  isModalOpen.value = false;
};
</script>

<template>
    <div class="p-6 bg-white rounded-lg shadow">
      <div class="flex items-center justify-between mb-4">
        <div class="relative">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search..."
            class="py-2 pl-8 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            class="absolute w-4 h-4 text-gray-500 left-2 top-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2a4 4 0 111-8 4 4 0 011-4m-6 8a4 4 0 014-4m-4 4a4 4 0 004 4m0 0l-2 2m-2-2l-2-2"
            />
          </svg>
        </div>
        <div class="flex items-center space-x-2">
          <button @click="openModal" class="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            ADD NEW +
          </button>
        </div>
      </div>
  
      <div class="overflow-x-auto">
        <table class="min-w-full table-auto">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-2 text-sm font-medium text-left text-gray-700">Name</th>
              <th class="px-6 py-2 text-sm font-medium text-left text-gray-700">Expiration Date</th>
              <th class="px-6 py-2 text-sm font-medium text-left text-gray-700">Count</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="item in filteredItems" :key="item.id">
              <td class="px-6 py-4 text-sm text-gray-900">{{ item.name }}</td>
              <td class="px-6 py-4 text-sm text-gray-900">{{ item.expirationDate }}</td>
              <td class="px-6 py-4 text-sm text-gray-900">{{ item.count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <AddNewItemModal :isOpen="isModalOpen" @addItem="handleAddItem" />
    </div>
  </template>
