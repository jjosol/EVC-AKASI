<template>
  <div v-if="show" class="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-60 z-[100]">
    <div class="w-full max-w-3xl p-8 bg-white rounded-2xl shadow-lg">
      <h2 class="mb-6 text-2xl font-bold text-gray-800">Add Medicine to Administration</h2>
      <div class="flex items-center mb-6 gap-2">
        <input
          v-model="searchQuery"
          placeholder="Search medicine..."
          class="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-300 focus:outline-none"
          @input="$emit('update:searchQuery', searchQuery)"
        />
        <button class="p-2 bg-gray-100 border-t border-b border-r rounded-r-md">
          <Icon icon="mdi:magnify" />
        </button>
      </div>
      <table class="w-full table-auto rounded overflow-hidden shadow-sm">
        <thead class="bg-gray-50 border-b-2 border-gray-200">
          <tr class="text-left text-gray-600 text-sm">
            <th class="p-3">Name</th>
            <th class="p-3">Expiry Date</th>
            <th class="p-3">Available</th>
            <th class="p-3">Type</th>
            <th class="p-3">Qty</th>
            <th class="p-3">Actions</th>
          </tr>
        </thead>
        <tbody class="text-gray-800">
          <template v-for="(medicines, name) in groupedMedicines" :key="name">
            <tr :class="{'bg-blue-50': isExpanded(name)}">
              <td class="p-3 font-semibold">
                <div class="flex items-center gap-2">
                  <button @click="toggleExpand(name)" class="mr-1 text-gray-500 hover:text-blue-600">
                    <Icon :icon="isExpanded(name) ? 'mdi:chevron-down' : 'mdi:chevron-right'" />
                  </button>
                  <span>{{ name }}</span>
                </div>
              </td>
              <td class="p-3"></td>
              <td class="p-3"></td>
              <td class="p-3"></td>
              <td class="p-3"></td>
              <td class="p-3"></td>
            </tr>
            <template v-if="isExpanded(name)">
              <tr v-for="(medicine, idx) in medicines" :key="`${name}-${idx}`" :class="[medicine.expired ? 'bg-red-50 text-red-600' : 'bg-white', 'transition']">
                <td class="p-3 pl-10">{{ medicine.name }}</td>
                <td class="p-3">
                  <span :class="medicine.expired ? 'font-bold text-red-600' : ''">
                    {{ medicine.expiry_date }}
                  </span>
                </td>
                <td class="p-3">{{ medicine.displayCount }}</td>
                <td class="p-3">
                  <span :class="medicine.otc === true ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold' : 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold'">
                    {{ medicine.otc === true ? 'OTC' : 'RX' }}
                  </span>
                </td>
                <td class="p-3 w-24">
                  <input
                    type="number"
                    v-model.number="medicine.requestedQuantity"
                    class="w-16 p-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-300 focus:outline-none"
                    min="1"
                    :max="medicine.displayCount"
                    :disabled="medicine.expired || medicine.displayCount <= 0"
                  />
                </td>
                <td class="p-3">
                  <div class="flex flex-col items-center justify-center gap-1">
                    <button
                      @click="handleAddMedicine(medicine)"
                      :disabled="!canAddMedicine(medicine) || medicine.expired"
                      :class="[canAddMedicine(medicine) && !medicine.expired ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500', 'px-4 py-1 rounded font-semibold transition']"
                    >
                      Add
                    </button>
                    <span v-if="medicine.otc === false && !medicine.prescriptionFile && !medicine.sentToDoctor" class="text-xs text-red-600 font-medium">Prescription required</span>
                    <span v-if="medicine.expired" class="text-xs text-red-500 font-medium">Expired</span>
                    <span v-if="!canAddMedicine(medicine) && !medicine.expired" class="text-xs text-orange-500 font-medium">
                      Debug: med_id={{medicine.med_id}}, qty={{medicine.requestedQuantity}}, displayCount={{medicine.displayCount}}
                    </span>
                    <div v-if="medicine.otc === false && medicine.showPrescriptionUpload" class="mt-2 flex flex-col items-center gap-1">
                      <input type="file" @change="e => handlePrescriptionUpload(e, medicine)" accept=".pdf,.jpg,.jpeg,.png" class="text-xs" />
                      <button @click="() => handleSendToDoctor(medicine)" class="text-xs text-blue-600 underline">Send to Doctor</button>
                      <span v-if="medicine.prescriptionFile" class="text-xs text-green-600">File attached</span>
                      <span v-if="medicine.sentToDoctor" class="text-xs text-blue-600">Sent to doctor</span>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
      <div class="flex justify-end mt-8">
        <button @click="$emit('cancel')" class="px-4 py-2 text-white bg-gray-500 rounded-md hover:bg-gray-600 font-semibold">Cancel</button>
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

const handleAddMedicine = (medicine) => {
  if (medicine.otc === false && !medicine.prescriptionFile && !medicine.sentToDoctor) {
    medicine.showPrescriptionUpload = true;
    return;
  }
  // Decrease only the display value, not DB
  if (medicine.displayCount >= medicine.requestedQuantity) {
    medicine.displayCount -= medicine.requestedQuantity;
  }
  emit('add-medicine', medicine);
  medicine.showPrescriptionUpload = false;
};

const handlePrescriptionUpload = (event, medicine) => {
  const file = event.target.files[0];
  if (file) {
    medicine.prescriptionFile = file;
    medicine.sentToDoctor = false;
  }
};

const handleSendToDoctor = (medicine) => {
  medicine.sentToDoctor = true;
  medicine.prescriptionFile = null;
};
</script>

<style scoped>
/* Add specific styles to ensure modal appears on top */
.fixed {
  position: fixed;
  z-index: 100;
}
</style>