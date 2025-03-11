<script setup>
import { ref, computed, onMounted } from 'vue'
import { formatAMPM } from '~/composables/useTimeFormatter';
import moment from 'moment-timezone';
import { useProfile } from '~/composables/useProfile';

const { profile, loading, error, fetchProfile } = useProfile()
await fetchProfile();
   
//prop
const props = defineProps({
  currentDay: {
    type: Object,
    default: () => ({ 
      date: moment().tz("Asia/Manila").toDate() 
    })
  }
});

/**
 * Formats a date string to localized date format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string or 'N/A' if invalid
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Selected record
const selectedAppointmentRecord = ref(null);

// Selected date/time
const selectedDate = computed(() => {
  // Use the currentDay prop or fallback to current Manila time
  const date = props.currentDay.date instanceof Date ? props.currentDay.date : moment().tz("Asia/Manila").toDate();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dayOptions = { weekday: 'long' };
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return {
    day: new Intl.DateTimeFormat('en-US', dayOptions).format(date),
    monthYear: new Intl.DateTimeFormat('en-US', dateOptions).format(date),
    date: new Intl.DateTimeFormat('en-US', options).format(date)
  };
});

const confinedCount = ref(0);
const selectedTime = ref(formatAMPM(new Date()));
const selectedHour = ref(null);
const selectedMinute = ref(null);
const complaint = ref('');
/**
 * Creates a new appointment
 * @param {Object} person - Patient information
 * @returns {Promise<Object>} Newly created consultation record
 */
const createAppointment = async (person) => {
    console.log(selectedDate.value);
    console.log(selectedHour.value); 
    console.log(selectedMinute.value);
    console.log(complaint.value);
    console.log(person.id);
  try {
    // Validate required fields()
    if (selectedHour.value === null || selectedMinute.value === null || complaint.value === null) {
      throw new Error('Please fill missing requirements');
    }
    
    const response = await fetch('http://localhost:3001/add-appointment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: person.id,
        date: selectedDate.value.monthYear,
        hour: selectedHour.value,
        minute: selectedMinute.value,
        complaint: complaint.value,
        
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create consultation record');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating consultation record:', error);
    throw error;
  }
};


/**
 * Fetches a specific consultation record
 * @param {number} appointment_id - ID of consultation to fetch
 * @returns {Promise<Object>} Consultation record data
 */
const fetchConsultationRecord = async (consultation_id) => {
  try {
    const response = await fetch(`http://localhost:3001/appointment/${appointment_id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch consultation record`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching consultation record:', error);
    throw error;
  }
};

</script>

<script>
export default {
  data() {
    return {
      selectedHour: 0, // default hour
      selectedMinute: 0, // default minute
      hours: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16], 
      minutes: [0, 15, 30, 45]
    };

  },
  watch: {
    selectedHour(newHour) {
      this.$emit("update-hour", newHour); // Emit selected hour
    },
    selectedMinute(newMinute) {
      this.$emit("update-minute", newMinute); // Emit selected minute
    }
  }
};
</script>

<template>
  <div class="fixed w-4/6">
    <div class="fixed top-0 right-0 w-1/4 h-screen p-5 bg-gray-100 border-[#2f4a71]">
      <div class="h-full p-5 overflow-y-auto l">

        <h2 class="mb-4 text-3xl font-bold text-[#2f4a71] border-b-2 border-[#2f4a71]">Book Appointment</h2>
        <span class="text-2xl text-[#2f4a71] font-semibold">{{ selectedDate.monthYear }}</span>
        <span class="text-2xl text-[#2f4a71] float-right">{{ selectedDate.day }}</span>
        

        <div class="time-picker">
          <p>Select Time</p>
          <select v-model="selectedHour" class="time-picker-select">
            <option v-for="hour in hours" :key="hour" :value="hour">{{ hour < 10 ? '0' + hour : hour }}</option>
          </select>
          <span>:</span>
          <select v-model="selectedMinute" class="time-picker-select">
            <option v-for="minute in minutes" :key="minute" :value="minute">{{ minute < 10 ? '0' + minute : minute }}</option>
          </select>
        </div>

          <!-- Complaint -->
          <div class="mb-4">
            <label for="complaint" class="block text-sm font-semibold text-gray-600">Complaint</label>
            <textarea v-model="complaint" placeholder="General Complaint" class="w-full h-32 px-4 py-2 mt-1 border border-gray-300 rounded-lg"></textarea>
          </div>
          
          <button @click="createAppointment(profile)">Submit</button>
      </div>
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
  height: 1.5em;
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
.confinement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.confinement-details {
  flex-grow: 1;
  margin-right: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>