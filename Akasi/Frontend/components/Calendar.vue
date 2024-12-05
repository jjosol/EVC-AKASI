<script setup>
import moment from 'moment-timezone';
const selectedYear = ref(moment().tz("Asia/Manila").year());
const selectedMonth = ref(moment().tz("Asia/Manila").month());
const selectedDate = ref(moment().tz("Asia/Manila").toDate());
const years = Array.from({ length: 7 }, (_, i) => moment().tz("Asia/Manila").year() - 6 + i);
const months = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];
const calendar = ref([]);
const confinedCount = ref(0);

const emit = defineEmits(['day-selected', 'update-date']);
defineProps({
  updateConfined: {
    type: Number,
    default: 0
  }
});

const updateCalendar = () => {
  const firstDayOfMonth = moment.tz({ year: selectedYear.value, month: selectedMonth.value, day: 1 }, "Asia/Manila");
  const lastDayOfMonth = firstDayOfMonth.clone().endOf('month');
  const firstDayOfWeek = firstDayOfMonth.day();
  const daysInMonth = lastDayOfMonth.date();

  let daysArray = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysArray.push({ date: null });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push({ date: moment.tz({ year: selectedYear.value, month: selectedMonth.value, day: i }, "Asia/Manila").toDate(), notes: "" });
  }
  while (daysArray.length % 7 !== 0) {
    daysArray.push({ date: null });
  }
  calendar.value = [];
  for (let i = 0; i < daysArray.length; i += 7) {
    calendar.value.push(daysArray.slice(i, i + 7));
  }

  // Emit the selected year and month to update the count
  emit('update-date', { year: selectedYear.value, month: selectedMonth.value });
};

const openAddingList = (day) => {
  if (day.date) {
    selectedDate.value = day.date;
    emit('day-selected', day);
  }
};

const isToday = (date) => {
  if (!date) return false;
  const today = moment.tz("Asia/Manila");
  const dayDate = moment(date).tz("Asia/Manila");
  return (
    dayDate.date() === today.date() && dayDate.month() === today.month() && dayDate.year() === today.year()
  );
};

const isSelected = (date) => {
  if (!date || !selectedDate.value) return false;
  const selected = moment(selectedDate.value).tz("Asia/Manila");
  const dayDate = moment(date).tz("Asia/Manila");
  return (
    dayDate.date() === selected.date() && dayDate.month() === selected.month() && dayDate.year() === selected.year()
  );
};

onMounted(() => {
  updateCalendar();
});
</script>

<template>
  <div class="w-7/12 p-8 ml-72 rounded-3xl">
    <h1 class="text-5xl text-[#2f4a71] border-[#2f4a71] border-b-2">Confinement Calendar</h1>
    <br>
    <div class="flex items-center gap-16 mb-8 justify-left text-[#2f4a71] font-bold">
      <div class="flex">
        <select id="month" v-model="selectedMonth" @change="updateCalendar" class="p-2 text-3xl rounded">
          <option v-for="(month, index) in months" :key="index" :value="index" class="text-xl">{{ month }}</option>
        </select>
      </div>
      <div class="flex ml-8">
        <select id="year" v-model="selectedYear" @change="updateCalendar" class="p-2 text-3xl rounded">
          <option v-for="year in years" :key="year" :value="year" class="text-xl">{{ year }}</option>
        </select>
      </div>
    </div>
    <table class="w-full text-lg text-[#2f4a71] font-bold text-center border border-collapse border-gray-300">
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
            'relative border border-gray-300 calendar-cell': true
          }">
            <div @click="openAddingList(day)" class="flex items-center justify-center w-full cursor-pointer">
              <span :class="{
                'border-b-4 border-[#2f4a71]': isToday(day.date)
              }">
                {{ day.date ? day.date.getDate() : '' }}
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="text-[#2f4a71] text-xl">
      <h1 class="font-bold">Total Confined in {{ months[selectedMonth] }} {{ selectedYear }}: {{ updateConfined }}</h1>
    </div>
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
  height: 300rem;
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
.calendar-cell {
  width: 90px;
  height: 90px;
}
</style>