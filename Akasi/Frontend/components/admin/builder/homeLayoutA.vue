<script setup>
import { ref } from 'vue'
import moment from 'moment-timezone'

const currentDay = ref({ 
  date: moment().tz("Asia/Manila").toDate()
})
const confinedCount = ref(0)

// Handlers
const handleDaySelected = (day) => {
  currentDay.value = day;
};

const updateConfinedCount = (value) => {
  confinedCount.value = value;
};

const handleUpdateDate = ({ year, month }) => {
  // Only update if the current date is not in the selected month and year
  const currentMonth = currentDay.value.date.getMonth();
  const currentYear = currentDay.value.date.getFullYear();

  if (currentMonth !== month || currentYear !== year) {
    // Optionally, set the date to the first of the selected month
    // Or keep the current date if you prefer
    currentDay.value.date = new Date(year, month, 1);
  }

  console.log('Updated date:', currentDay.value);
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