<script setup>
// Reactive properties
const currentDay = ref({ date: new Date() });
const confinedCount = ref(0);

// Handlers
const handleDaySelected = (day) => {
  currentDay.value = day;
};

const updateConfinedCount = (value) => {
  confinedCount.value = value;
};

const handleUpdateDate = ({ year, month }) => {
  currentDay.value.date = new Date(year, month, 1);
  console.log(currentDay.value);
};

definePageMeta({
  middleware: 'auth', // Reference your middleware here
});
</script>

<template>
  <NuxtLayout>
    <Calendar @day-selected="handleDaySelected" @update-date="handleUpdateDate" :updateConfined="confinedCount" />
    <AddList :current-day="currentDay" @update-confined="updateConfinedCount" />
  </NuxtLayout>
</template>