<script setup>
const items = ref([]);
const expandedItems = ref(new Set());
const searchQuery = ref('');
const isModalOpen = ref(false);

// Group items by medicine name
const groupedItems = computed(() => {
  const groups = {};
  items.value.forEach(item => {
    if (!groups[item.name]) {
      groups[item.name] = [];
    }
    groups[item.name].push(item);
  });
  return groups;
});

const filteredItems = computed(() => {
  if (!searchQuery.value) return groupedItems.value;
  const filtered = {};
  Object.entries(groupedItems.value).forEach(([name, items]) => {
    if (name.toLowerCase().includes(searchQuery.value.toLowerCase())) {
      filtered[name] = items;
    }
  });
  return filtered;
});

const emit = defineEmits(['openModal', 'editModal'])

const openModal = () => {
  emit('openModal')
}

const toggleExpand = (name) => {
  if (expandedItems.value.has(name)) {
    expandedItems.value.delete(name);
  } else {
    expandedItems.value.add(name);
  }
};

const handleAddItem = (newItem) => {
  items.value.push({
    id: items.value.length + 1,
    ...newItem
  });
  isModalOpen.value = false;
};

// Format the date to YYYY-MM-DD
const formatDate = (dateString) => {
  return new Date(dateString).toISOString().split('T')[0];
};

// Update the fetch function
const fetchInventory = async () => {
  const response = await fetch('http://localhost:3001/inventory');
  if (response.ok) {
    const data = await response.json();
    items.value = data.map(item => ({
      med_id: item.med_id,
      name: item.medName,
      expirationDate: formatDate(item.expiration),
      count: item.count
    }));
  }
};

const refreshInventory = async () => {
  await fetchInventory();
};

const deleteItem = async (item) => {
  if (confirm('Are you sure you want to delete this item?')) {
    try {
      const response = await fetch(
        `http://localhost:3001/inventory/${item.med_id}/${item.name}`, 
        {
          method: 'DELETE'
        }
      );
      
      if (response.ok) {
        await refreshInventory();
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  }
};

const deleteMedicineBatches = async (medName) => {
  if (confirm(`Are you sure you want to delete all batches of ${medName}?`)) {
    try {
      // Get all batches for this medicine
      const batches = groupedItems.value[medName];
      
      // Delete each batch
      for (const batch of batches) {
        await fetch(
          `http://localhost:3001/inventory/${batch.med_id}/${batch.name}`,
          {
            method: 'DELETE'
          }
        );
      }
      
      await refreshInventory();
    } catch (error) {
      console.error('Error deleting medicine batches:', error);
      alert('Failed to delete medicine batches');
    }
  }
};

defineExpose({ refreshInventory });

onMounted(() => {
  fetchInventory();
});
</script>

<template>
  <div class="w-5/6 p-6 bg-white rounded-lg shadow float-end">
    <!-- Search and Add Button -->
    <div class="flex items-center justify-between mb-4">
      <div class="relative">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search..."
          class="py-2 pl-8 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <!-- Search Icon -->
        <svg class="absolute w-4 h-4 text-gray-500 left-2 top-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2a4 4 0 111-8 4 4 0 011-4m-6 8a4 4 0 014-4m-4 4a4 4 0 004 4m0 0l-2 2m-2-2l-2-2" />
        </svg>
      </div>
      <!-- Add New Button -->
      <button @click="openModal" class="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
        ADD NEW +
      </button>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full table-auto">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-2 text-sm font-medium text-left text-gray-700">Medicine Name</th>
            <th class="px-6 py-2 text-sm font-medium text-left text-gray-700">Total Count</th>
            <th class="px-6 py-2 text-sm font-medium text-left text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <template v-for="(medicines, name) in filteredItems" :key="name">
            <!-- Main row -->
            <tr class="bg-white">
              <td class="px-6 py-4 text-sm text-gray-900">
                <button @click="toggleExpand(name)" class="flex items-center">
                  <Icon 
                    :icon="expandedItems.has(name) ? 'mdi:chevron-down' : 'mdi:chevron-right'" 
                    class="mr-2"
                  />
                  {{ name }}
                </button>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ medicines.reduce((sum, med) => sum + med.count, 0) }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                <div class="flex gap-2">
                  <button 
                    @click="$emit('openModal', { name })"
                    class="px-3 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                  >
                    Add New Batch
                  </button>
                  <button 
                    @click="deleteMedicineBatches(name)"
                    class="px-3 py-1 text-white bg-red-500 rounded hover:bg-red-600"
                  >
                    Delete All
                  </button>
                </div>
              </td>
            </tr>
            <!-- Expanded details -->
            <tr v-if="expandedItems.has(name)" v-for="item in medicines" :key="item.med_id">
              <td colspan="3" class="px-6 py-2 bg-gray-50">
                <div class="flex items-center justify-between pl-6">
                  <div>
                    <span class="mr-4">Exp: {{ item.expirationDate }}</span>
                    <span>Count: {{ item.count }}</span>
                  </div>
                  <div class="flex gap-2">
                    <button 
                      @click="$emit('editModal', item)"
                      class="px-2 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button 
                      @click="deleteItem(item)"
                      class="px-2 py-1 text-white bg-red-500 rounded hover:bg-red-600"
                    >
                      <Icon icon="fluent:delete-28-regular" />
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>