<script setup>
import moment from 'moment-timezone';
import { ref, watch, onMounted } from 'vue';

const daysWithAvailableSlots = ref({});
const isLoadingAvailability = ref(false);

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
    
    // Check if this day has available slots
    const dateStr = candidate.format('YYYY-MM-DD');
    if (daysWithAvailableSlots.value[dateStr] === true) {
      return candidate.toDate();
    }
    
    // If we don't have availability data yet or first pass, add this as a candidate
    if (Object.keys(daysWithAvailableSlots.value).length === 0 || daysWithAvailableSlots.value[dateStr] === undefined) {
      // We'll keep this as a potential candidate but continue searching if we have data
      if (Object.keys(daysWithAvailableSlots.value).length === 0) {
        return candidate.toDate();
      }
    }
    
    candidate.add(1, 'day');
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

// Add this function to update the selected date after availability data is loaded
const updateSelectedDateBasedOnAvailability = () => {
  // Only run if we have availability data
  if (Object.keys(daysWithAvailableSlots.value).length === 0) {
    return;
  }
  
  const currentSelectedDate = moment(selectedDate.value).tz("Asia/Manila");
  
  // If current selection has available slots, keep it
  const currentDateStr = currentSelectedDate.format('YYYY-MM-DD');
  if (daysWithAvailableSlots.value[currentDateStr] === true) {
    return;
  }
  
  // Otherwise find the earliest date with available slots
  const newDate = findEarliestAvailableDate();
  selectedDate.value = newDate;
  
  // Emit the updated date
  emit('day-selected', { date: newDate });
};

const fetchAvailableSlotsForDate = async (date) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    const formattedDate = moment(date).format('YYYY-MM-DD');
    const response = await fetch(`http://localhost:3001/add-appointment/booked-slots?date=${formattedDate}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    
    // Check if there are any available slots (3 possible slots per hour, 2 hours)
    const allPossibleSlots = 6; // 2 hours (15-16) x 3 slots per hour (0, 20, 40)
    const bookedSlots = Array.isArray(data) ? data.length : 0;
    
    return bookedSlots < allPossibleSlots;
  } catch (error) {
    console.error(`Error checking availability for ${date}:`, error);
    return false;
  }
};

// NEW: Function to fetch availability for the entire month
const fetchMonthAvailability = async () => {
  isLoadingAvailability.value = true;
  
  const firstDayOfMonth = moment.tz({ 
    year: selectedYear.value, 
    month: selectedMonth.value, 
    day: 1 
  }, "Asia/Manila");
  
  const daysInMonth = firstDayOfMonth.daysInMonth();
  
  // Clear previous data for this month
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = moment.tz({ 
      year: selectedYear.value, 
      month: selectedMonth.value, 
      day: i 
    }, "Asia/Manila").format('YYYY-MM-DD');
    
    daysWithAvailableSlots.value[dateStr] = null;
  }
  
  // Check availability only for MWF days
  for (let i = 1; i <= daysInMonth; i++) {
    const currentDate = moment.tz({ 
      year: selectedYear.value, 
      month: selectedMonth.value, 
      day: i 
    }, "Asia/Manila");
    
    // Only check MWF (1, 3, 5)
    const dayOfWeek = currentDate.day();
    if (dayOfWeek !== 1 && dayOfWeek !== 3 && dayOfWeek !== 5) {
      continue;
    }
    
    // Skip past dates
    if (currentDate.isBefore(moment().tz("Asia/Manila").startOf('day'))) {
      continue;
    }
    
    // Skip today afternoon
    if (currentDate.isSame(moment().tz("Asia/Manila").startOf('day')) && 
        moment().tz("Asia/Manila").hour() >= 12) {
      continue;
    }
    
    const dateStr = currentDate.format('YYYY-MM-DD');
    const hasAvailableSlots = await fetchAvailableSlotsForDate(currentDate.toDate());
    daysWithAvailableSlots.value[dateStr] = hasAvailableSlots;
  }
  
  isLoadingAvailability.value = false;

  // At the end of the fetchMonthAvailability function, add:
  isLoadingAvailability.value = false;

  // Update selected date if needed
  updateSelectedDateBasedOnAvailability();
};

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
  
  // Fetch availability data for this month
  fetchMonthAvailability();
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

// UPDATED: Check if day has available slots
const hasSlotsAvailable = (date) => {
  if (!date) return false;
  const dateStr = moment(date).tz("Asia/Manila").format('YYYY-MM-DD');
  return daysWithAvailableSlots.value[dateStr] === true;
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
  
  // Date string for checking availability
  const dateStr = dateToCheck.format('YYYY-MM-DD');
  
  // Basic checks (same as before)
  const basicChecks = isValidDay && !isPastDay && (!isToday || (isToday && isMorning));
  
  // No availability data yet means we should allow selection
  if (basicChecks && daysWithAvailableSlots.value[dateStr] === undefined) {
    return true;
  }
  
  // If we have availability data, check if this date has slots
  return basicChecks && (daysWithAvailableSlots.value[dateStr] === true);
};

// Add this helper method to safely check if a date has no available slots
const hasNoAvailableSlots = (date) => {
  if (!date) return false;
  
  // Format date consistently with timezone like in AddAppointment.vue
  const dateStr = moment(date).tz("Asia/Manila").format('YYYY-MM-DD');
  
  // Only return true if the date exists in our map and is explicitly set to false
  return dateStr in daysWithAvailableSlots.value && 
         daysWithAvailableSlots.value[dateStr] === false;
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
  <div class="w-full p-4 sm:p-8 md:p-12 lg:p-16 rounded-3xl bg-white">
    <div class="flex flex-wrap items-center border-t gap-4 mb-4 sm:mb-8 justify-between sm:justify-start text-[#2f4a71]">
      <div class="flex w-full sm:w-auto">
        <select id="month" v-model="selectedMonth" @change="updateCalendar" 
          class="w-full sm:w-auto p-1 sm:p-2 text-lg sm:text-xl md:text-2xl lg:text-3xl rounded">
          <option v-for="(month, index) in months" :key="index" :value="index" class="text-base sm:text-lg">{{ month }}</option>
        </select>
      </div>
      <div class="flex w-full sm:w-auto sm:ml-4">
        <select id="year" v-model="selectedYear" @change="updateCalendar" 
          class="w-full sm:w-auto p-1 sm:p-2 text-lg sm:text-xl md:text-2xl lg:text-3xl rounded">
          <option v-for="year in years" :key="year" :value="year" class="text-base sm:text-lg">{{ year }}</option>
        </select>
      </div>
      <div v-if="isLoadingAvailability" class="w-full sm:w-auto sm:ml-auto text-xs sm:text-sm text-gray-500 flex items-center justify-end sm:justify-start mt-2 sm:mt-0">
        <svg class="animate-spin h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Checking availability...
      </div>
    </div>
    
    <div class="overflow-x-auto">
      <table class="w-full text-xs sm:text-sm md:text-base lg:text-lg text-[#2f4a71] font-bold text-center border border-collapse border-gray-300">
        <thead>
          <tr>
            <th class="p-1 sm:p-2 md:p-3 lg:p-4 border border-gray-300">Sun</th>
            <th class="p-1 sm:p-2 md:p-3 lg:p-4 border border-gray-300">Mon</th>
            <th class="p-1 sm:p-2 md:p-3 lg:p-4 border border-gray-300">Tue</th>
            <th class="p-1 sm:p-2 md:p-3 lg:p-4 border border-gray-300">Wed</th>
            <th class="p-1 sm:p-2 md:p-3 lg:p-4 border border-gray-300">Thu</th>
            <th class="p-1 sm:p-2 md:p-3 lg:p-4 border border-gray-300">Fri</th>
            <th class="p-1 sm:p-2 md:p-3 lg:p-4 border border-gray-300">Sat</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="week in calendar" :key="week[0].date">
            <td @click="openAddingList(day)" v-for="day in week" :key="day.date" :class="{
              'bg-green-200': isSelected(day.date),
              'relative border border-gray-300 calendar-cell': true,
              'hover:bg-blue-100': day.date && isDayClickable(day.date),
              'bg-gray-100': day.date && !isDayClickable(day.date) && hasSlotsAvailable(day.date) === false
            }">
              <div 
                class="flex items-center justify-center w-full h-full"
                :class="{ 
                  'cursor-pointer': day.date && isDayClickable(day.date),
                  'cursor-not-allowed': day.date && !isDayClickable(day.date),
                }"
              >
                <span :class="{
                  'border-b-2 sm:border-b-4 border-[#2f4a71]': isToday(day.date),
                  'opacity-50': day.date && !isDayClickable(day.date),
                }">
                  {{ day.date ? day.date.getDate() : '' }}
                  <span v-if="day.date && hasNoAvailableSlots(day.date)" 
                    class="block text-[8px] sm:text-[10px] md:text-xs text-red-500 font-normal">No slots</span>
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-if="Object.values(daysWithAvailableSlots).filter(Boolean).length === 0" class="mt-3 sm:mt-4 p-2 sm:p-3 text-xs sm:text-sm text-center bg-yellow-50 rounded-lg border border-yellow-100">
      <p class="text-yellow-700">No available appointment slots found for this month. Please try a different month.</p>
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

/* Responsive calendar cell sizes */
.calendar-cell {
  width: 40px;
  height: 40px;
}

/* Responsive breakpoints */
@media (min-width: 640px) {
  .calendar-cell {
    width: 60px;
    height: 60px;
  }
}

@media (min-width: 768px) {
  .calendar-cell {
    width: 75px;
    height: 75px;
  }
}

@media (min-width: 1024px) {
  .calendar-cell {
    width: 90px;
    height: 90px;
  }
}
</style>