<template>
  <div v-if="show" class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-60">
    <div class="w-2/3 p-6 bg-white rounded-2xl">
      <h2 class="mb-4 text-2xl font-semibold">Add Product</h2>
      <div class="flex items-center mb-4">
        <input
          v-model="searchQuery"
          placeholder="Search Product"
          class="w-full p-2 border border-gray-300 rounded-l-md"
          @input="$emit('update:searchQuery', searchQuery)"
        />
        <button class="p-2 bg-gray-100 border-t border-b border-r rounded-r-md">
          <Icon icon="mdi:magnify" />
        </button>
        <button class="p-2 ml-2 bg-gray-100 border rounded-md">
          <Icon icon="mdi:filter-variant" />
        </button>
        <button class="p-2 ml-2 bg-gray-100 border rounded-md">
          <Icon icon="mdi:sort-ascending" />
        </button>
      </div>
      <table class="w-full table-auto">
        <thead class="border-b-2 border-gray-300">
          <tr class="text-left text-gray-600">
            <th class="p-2">Name</th>
            <th class="p-2">Batch #</th>
            <th class="p-2">Expiry Date</th>
            <th class="p-2">Available</th>
            <th class="p-2">Qty</th>
            <th class="p-2">Actions</th>
          </tr>
        </thead>
        <tbody class="text-gray-700">
          <template v-for="(medicines, name) in groupedMedicines" :key="name">
            <tr :class="{'bg-gray-50': isExpanded(name)}">
              <td class="p-2">
                <div class="flex items-center">
                  <button @click="toggleExpand(name)" class="mr-2">
                    <Icon :icon="isExpanded(name) ? 'mdi:chevron-down' : 'mdi:chevron-right'" />
                  </button>
                  <span>{{ name }}</span>
                </div>
              </td>
              <td class="p-2"></td>
              <td class="p-2"></td>
              <td class="p-2">{{ getTotalCount(medicines) }}</td>
              <td class="p-2"></td>
              <td class="p-2"></td>
            </tr>
            <template v-if="isExpanded(name)">
              <tr v-for="(medicine, idx) in medicines" :key="`${name}-${idx}`" :class="{'text-red-500': medicine.expired}">
                <td class="p-2 pl-8">{{ medicine.name }}</td>
                <td class="p-2">{{ medicine.batch_number || 'N/A' }}</td>
                <td class="p-2">{{ medicine.expiry_date }}</td>
                <td class="p-2">{{ medicine.displayCount }}</td>
                <td class="w-24 p-2">
                  <input
                    type="number"
                    v-model.number="medicine.requestedQuantity"
                    class="w-16 p-1 border border-gray-300 rounded"
                    min="1"
                    :max="medicine.count"
                    :disabled="medicine.expired || medicine.displayCount <= 0"
                  />
                </td>
                <td class="p-2">
                  <div class="flex items-center justify-center">
                    <button
                      @click="$emit('add-medicine', medicine)"
                      :disabled="!canAddMedicine(medicine)"
                      :class="canAddMedicine(medicine) ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'"
                      class="p-1 rounded-md"
                    >
                      Add
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
      <div class="flex justify-end mt-6">
        <button @click="$emit('cancel')" class="p-2 ml-2 text-white bg-gray-500 rounded-md">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
  show: Boolean,
  groupedMedicines: Object,
  expandedMedicines: Object
});

const emit = defineEmits(['cancel', 'add-medicine', 'toggle-expand', 'update:searchQuery']);

const searchQuery = ref('');

const isExpanded = (name) => {
  return props.expandedMedicines.has(name);
};

const toggleExpand = (name) => {
  emit('toggle-expand', name);
};

const getTotalCount = (items) => {
  return items.reduce((sum, item) => sum + (item.displayCount || 0), 0);
};

const canAddMedicine = (medicine) => {
  if (!medicine || !medicine.med_id) return false;
  const requestedQty = Number(medicine.requestedQuantity);
  return !isNaN(requestedQty) && requestedQty > 0 && requestedQty <= medicine.displayCount;
};
</script>