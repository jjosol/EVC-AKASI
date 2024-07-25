<script setup>
import { ref, onMounted } from 'vue';
import moment from 'moment-timezone';

const selectedYear = ref(moment().tz("Asia/Manila").year());
const selectedMonth = ref(moment().tz("Asia/Manila").month());
const selectedDate = ref(null); // New reactive property for selected date
const years = Array.from({ length: 50 }, (_, i) => moment().tz("Asia/Manila").year() - 25 + i);
const months = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];
const calendar = ref([]);

// Creates calendar
const updateCalendar = () => {
  const firstDayOfMonth = moment.tz({ year: selectedYear.value, month: selectedMonth.value, day: 1 }, "Asia/Manila");
  const lastDayOfMonth = firstDayOfMonth.clone().endOf('month');
  const firstDayOfWeek = firstDayOfMonth.day();
  const daysInMonth = lastDayOfMonth.date();

  let daysArray = [];
  // Put blank dates before the first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysArray.push({ date: null });
  }
  // Put the dates 
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push({ date: moment.tz({ year: selectedYear.value, month: selectedMonth.value, day: i }, "Asia/Manila").toDate(), notes: "" });
  }
  // Put blank dates after the last day
  while (daysArray.length % 7 !== 0) {
    daysArray.push({ date: null });
  }
  // Put the dates from daysArray in by 7 
  calendar.value = [];
  for (let i = 0; i < daysArray.length; i += 7) {
    calendar.value.push(daysArray.slice(i, i + 7));
  }
};

// For connecting the list and calendar
const emit = defineEmits(['day-selected']);
const openAddingList = (day) => {
  if (day.date) {
    selectedDate.value = day.date; // Update the selected date
    emit('day-selected', day);
  }
};

// Checks if selected date is today 
const isToday = (date) => {
  if (!date) return false;
  const today = moment.tz("Asia/Manila");
  const dayDate = moment(date).tz("Asia/Manila");
  return (
    dayDate.date() === today.date() && dayDate.month() === today.month() && dayDate.year() === today.year()
  );
};

// Checks if a date is the selected date
const isSelected = (date) => {
  if (!date || !selectedDate.value) return false;
  const selected = moment(selectedDate.value).tz("Asia/Manila");
  const dayDate = moment(date).tz("Asia/Manila");
  return (
    dayDate.date() === selected.date() && dayDate.month() === selected.month() && dayDate.year() === selected.year()
  );
};

// To make sure that everything is rendered first before creating the calendar
onMounted(() => {
  updateCalendar();
});
</script>
Updated Template:
Add a conditional class to apply the selected color.
vue
Copy code
<template>
  <div class="w-4/6 max-w-4xl p-8 border rounded-lg">
    <div class="flex items-center justify-center gap-16 mb-8">
      <div class="flex">
        <label for="month" class="p-2 mr-4 text-lg">Month:</label>
        <select id="month" v-model="selectedMonth" @change="updateCalendar" class="p-2 text-lg border rounded">
          <option v-for="(month, index) in months" :key="index" :value="index">{{ month }}</option>
        </select>
      </div>
      <div class="flex ml-8">
        <label for="year" class="p-2 mr-4 text-lg">Year:</label>
        <select id="year" v-model="selectedYear" @change="updateCalendar" class="p-2 text-lg border rounded">
          <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
        </select>
      </div>
    </div>
    <table class="w-full text-lg text-center border border-collapse border-gray-300">
      <thead>
        <tr>
          <th class="p-4 border border-gray-300">Sun</th>
          <th class="p-4 border border-gray-300">Mon</th>
          <th class="p-4 border border-gray-300">Tue</th>
          <th class="p-4 border border-gray-300">Wed</th>
          <th class="p-4 border border-gray-300">Thu</th>
          <th class="p-4 border border-gray-300">Fri</th>
          <th class="p-4 border border-gray-300">Sat</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="week in calendar" :key="week[0].date">
          <td v-for="day in week" :key="day.date" :class="{
            'bg-green-200': isSelected(day.date),
            'relative p-4 border border-gray-300 calendar-cell': true
          }">
            <div @click="openAddingList(day)" class="flex items-center justify-center w-full h-full cursor-pointer">
              <span :class="{
                'bg-green-600 rounded-full text-white p-2 flex items-center justify-center w-10 h-10': isToday(day.date)
              }">
                {{ day.date ? day.date.getDate() : '' }}
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<style scoped>
textarea {
  resize: none;
}
.marquee {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  height: 1.5em; /* Set a fixed height */
}
.marquee:hover {
  animation: scroll-left 10s linear infinite;
}
@keyframes scroll-left {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(-100%);
  }
}
.bg-green-200 {
  background-color: #c6f6d5; /* Light green background */
}
.calendar-cell {
  width: 75px; /* Fixed width for calendar cells */
  height: 75px; /* Fixed height for calendar cells */
}
</style>