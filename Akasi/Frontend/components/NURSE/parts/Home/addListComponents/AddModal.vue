<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-75">
    <div class="w-1/2 p-6 bg-white rounded-2xl">
      <div class="flex items-center mb-4">
        <div class="relative w-full">
          <input
            v-model="searchQuery"
            placeholder="Search"
            class="w-full p-1 pl-10 border border-[#2f4a71] rounded-full focus:outline-none"
          />
          <Icon icon="fluent:search-12-regular" class="absolute top-2 left-3 text-[#2f4a71]" />
        </div>
        <button @click="$emit('cancel')" class="ml-4 text-[#2f4a71] hover:underline">Cancel</button>
      </div>
      <ul class="overflow-y-auto max-h-60 text-[#2f4a71] border-b-2 border-[#2f4a71]">
        <li
          v-for="person in filteredPeople"
          :key="person.clientId || person.name"
          class="flex items-center justify-between p-2 mb-2 text-lg rounded-lg hover:bg-indigo-100"
        >
          <span>{{ person.name }}</span>
          <button @click="$emit('add-person', person)" class="p-2 text-[#2f4a71] hover:text-white bg-transparent hover:bg-[#2f4a71] rounded-full">
            <Icon icon="subway:add-1" />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps({
  show: Boolean,
  people: {
    type: Array,
    default: () => []
  },
  searchQuery: String
});

const emit = defineEmits(['cancel', 'add-person', 'update:searchQuery']);

const filteredPeople = computed(() => {
  if (!props.searchQuery) {
    return props.people;
  }
  return props.people.filter(person =>
    person.name.toLowerCase().includes(props.searchQuery.toLowerCase())
  );
});
</script>