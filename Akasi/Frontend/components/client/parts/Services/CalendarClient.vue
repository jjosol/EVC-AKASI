<script setup>
import moment from 'moment-timezone';

const findEarliestAvailableDate = () => {
  const now = moment().tz("Asia/Manila");
  let candidate = now.clone(); // Start with today
  
  // If it's afternoon or evening, start with tomorrow
  if (now.hour() >= 12) {
    candidate.add(1, 'day').startOf('day');
  }
  
  // Check up to 60 days ahead to ensure we find a date
  for (let i = 0; i < 60; i++) {
    // Only allow Monday (1), Wednesday (3), and Friday (5)
    const dayOfWeek = candidate.day();
    if (dayOfWeek !== 1 && dayOfWeek !== 3 && dayOfWeek !== 5) {
      candidate.add(1, 'day');
      continue;
    }
    
    // Found a valid date (MWF and either not today or today morning)
    return candidate.toDate();
  }
  
  // Fallback - should never reach here
  return now.clone().add(1, 'day').toDate();
};

// Initialize with current date in Manila timezone
const earliestDate = findEarliestAvailableDate();
const today = moment().tz("Asia/Manila");
const selectedYear = ref(moment(earliestDate).year());
const selectedMonth = ref(moment(earliestDate).month());
const selectedDate = ref(findEarliestAvailableDate());

const calendar = ref([]);

const years = Array.from({ length: 2 }, (_, i) => moment().tz("Asia/Manila").year() + i);
const months = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

// Props and emits definition
const props = defineProps({
  currentDay: {
    type: Object,
    default: () => ({ date: moment().tz("Asia/Manila").toDate() })
  },
  updateConfined: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['day-selected', 'update-date']);

// Define updateCalendar function first
const updateCalendar = async () => {
  const firstDayOfMonth = moment.tz({ 
    year: selectedYear.value, 
    month: selectedMonth.value, 
    day: 1 
  }, "Asia/Manila");
  const lastDayOfMonth = firstDayOfMonth.clone().endOf('month');
  const firstDayOfWeek = firstDayOfMonth.day();
  const daysInMonth = lastDayOfMonth.date();

  let daysArray = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysArray.push({ date: null });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push({ 
      date: moment.tz({ 
        year: selectedYear.value, 
        month: selectedMonth.value, 
        day: i 
      }, "Asia/Manila").toDate(), 
      notes: "" 
    });
  }
  while (daysArray.length % 7 !== 0) {
    daysArray.push({ date: null });
  }
  calendar.value = [];
  for (let i = 0; i < daysArray.length; i += 7) {
    calendar.value.push(daysArray.slice(i, i + 7));
  }

  emit('update-date', { 
    year: selectedYear.value, 
    month: selectedMonth.value 
  });

};

// Now we can watch for changes
watch([selectedYear, selectedMonth], () => {
  updateCalendar();
}, { immediate: true });

// Replace the existing openAddingList function
const openAddingList = (day) => {
  if (day.date && isDayClickable(day.date)) {
    selectedDate.value = day.date;
    // Emit the full date object
    emit('day-selected', {
      date: day.date
    });
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

// Replace the existing isDayClickable function with this updated version
const isDayClickable = (date) => {
  if (!date) return false; // null dates are not clickable
  
  // Convert to moment objects for comparison
  const dateToCheck = moment(date).tz("Asia/Manila").startOf('day');
  const currentDate = moment().tz("Asia/Manila").startOf('day');
  const currentTime = moment().tz("Asia/Manila");
  const currentHour = currentTime.hour();
  
  // Check if it's a valid day (1 = Monday, 3 = Wednesday, 5 = Friday)
  const dayOfWeek = dateToCheck.day();
  const isValidDay = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
  
  // Check if date is in the past
  const isPastDay = dateToCheck.isBefore(currentDate);
  
  // Check if it's today but after morning (noon or later)
  const isToday = dateToCheck.isSame(currentDate);
  const isMorning = currentHour < 12;
  
  return isValidDay && !isPastDay && (!isToday || (isToday && isMorning));
};

onMounted(() => {
  // Make sure calendar shows correct month
  selectedYear.value = moment(selectedDate.value).year();
  selectedMonth.value = moment(selectedDate.value).month();
  updateCalendar();
  
  // Emit the selected date so parent components know about it
  emit('day-selected', { date: selectedDate.value });
});

defineExpose({
  updateCalendar
});
</script>

<template>
  <div class= "w-7/12 p-20 rounded-3xl bg-white">
    <br>
    <div class="flex items-center border-t gap-16 mb-8 justify-left text-[#2f4a71]">
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
          <td @click="openAddingList(day)" v-for="day in week" :key="day.date" :class="{
            'bg-green-200': isSelected(day.date),
            'relative border border-gray-300 calendar-cell': true,
            'hover:bg-blue-100': day.date && isDayClickable(day.date)
          }">
            <div 
              class="flex items-center justify-center w-full"
              :class="{ 
                'cursor-pointer': day.date && isDayClickable(day.date),
                'cursor-not-allowed': day.date && !isDayClickable(day.date),
              }"
            >
              <span :class="{
                'border-b-4 border-[#2f4a71]': isToday(day.date),
                'opacity-50': day.date && !isDayClickable(day.date)
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