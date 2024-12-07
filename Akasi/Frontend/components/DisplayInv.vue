<script setup>
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

const items = ref([]);
const expandedItems = ref(new Set());
const searchQuery = ref('');

const fetchInventory = async () => {
  try {
    const response = await fetch('http://localhost:3001/inventory');
    if (response.ok) {
      const data = await response.json();
      items.value = data.map(item => ({
        ...item,
        name: item.medName, // Map medName to name
        expirationDate: formatDate(item.expiration)
      }));
    }
  } catch (error) {
    console.error('Error fetching inventory:', error);
  }
};

const refreshInventory = async () => {
  await fetchInventory();
};

// Format date helper
const formatDate = (dateString) => {
  return dateString ? new Date(dateString).toISOString().split('T')[0] : '';
};

// Group items by medicine name and sort by expiration date
const groupedItems = computed(() => {
  const groups = {};
  items.value.forEach(item => {
    if (!groups[item.name]) {
      groups[item.name] = [];
    }
    groups[item.name].push(item);
  });

  // Sort each group by expiration date (nearest first)
  Object.keys(groups).forEach(name => {
    groups[name].sort((a, b) => 
      new Date(a.expirationDate) - new Date(b.expirationDate)
    );
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

const deleteGroup = async (name, medicines) => {
  if (confirm(`Are you sure you want to delete all batches of ${name}?`)) {
    try {
      await fetch(
        `http://localhost:3001/inventory/group/${name}`, 
        { method: 'DELETE' }
      );
      await refreshInventory(); // Use refreshInventory instead of fetchInventory
    } catch (error) {
      console.error('Error deleting medicine group:', error);
      alert('Failed to delete medicine group');
    }
  }
};

const deleteItem = async (item) => {
  if (confirm('Are you sure you want to delete this batch?')) {
    try {
      await fetch(
        `http://localhost:3001/inventory/${item.med_id}/${item.name}`, 
        { method: 'DELETE' }
      );
      await fetchInventory(); // Refresh immediately after deletion
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  }
};

onMounted(() => {
  fetchInventory();
});

// Expose refreshInventory for parent component
defineExpose({ refreshInventory })
</script>

<template>
  <div class="w-5/6 p-6 bg-white rounded-lg shadow float-end">
    <div class="flex items-center justify-between mb-4">
      <input 
        type="text" 
        v-model="searchQuery"
        placeholder="Search..."
        class="px-4 py-2 border rounded-lg"
      />
      <button 
        @click="openModal"
        class="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
      >
        Add New Medicine
      </button>
    </div>
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
            <tr class="bg-white">
              <td class="px-6 py-4 text-sm text-gray-900">
                <div class="flex items-center justify-between">
                  <button @click="toggleExpand(name)" class="flex items-center">
                    <Icon 
                      :icon="expandedItems.has(name) ? 'mdi:chevron-down' : 'mdi:chevron-right'" 
                      class="mr-2"
                    />
                    {{ name }}
                  </button>
                  <button 
                    @click="deleteGroup(name, medicines)"
                    class="px-2 py-1 ml-2 text-white bg-red-500 rounded hover:bg-red-600"
                  >
                    <Icon icon="fluent:delete-28-regular" />
                  </button>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ medicines.reduce((sum, med) => sum + med.count, 0) }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                <button 
                  @click="emit('openModal', { isNewBatch: true, medicineName: name })"
                  class="px-3 py-1 text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                  Add New Batch
                </button>
              </td>
            </tr>
            <tr v-if="expandedItems.has(name)" v-for="item in medicines" :key="item.med_id">
              <td colspan="3" class="px-6 py-2 bg-gray-50">
                <div class="flex items-center justify-between pl-6">
                  <div>
                    <span class="mr-4">Exp: {{ item.expirationDate || 'None' }}</span>
                    <span>Count: {{ item.count }}</span>
                  </div>
                  <div class="flex gap-2">
                    <button 
                      @click="emit('editModal', item)"
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