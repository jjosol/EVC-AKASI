<template>
  <div class="fixed w-4/6">
    <div class="fixed top-0 right-0 w-1/4 h-screen p-5 bg-gray-100 border-[#2f4a71]">
      <div class="h-full p-5 overflow-y-auto l">

        <div class="text-4xl text-[#2f4a71] font-bold border-b-2 border-[#2f4a71] mb-2" >Appointments</div>
        <div class="mb-4 date-display">
          <span class="text-2xl text-[#2f4a71] font-semibold">{{ selectedDate.monthYear }}</span>
          <span class="text-2xl text-[#2f4a71] float-right">{{ selectedDate.day }}</span>
        </div>

        <button @click="openModal" class="w-full p-2 font-bold text-white bg-[#2f4a71] rounded hover:bg-[#8b67db]">Book Appointment</button>
        <!--Add appointment modal-->
        <Teleport to="body">
          <Transition name="modal">
            <div v-if="showModal" class="modal-overlay" @click="closeOnOverlayClick && closeModal()">
              <div class="modal-container" @click.stop>
                <div class="modal-header">
                  <h2 class="mb-4 text-3xl font-bold text-[#2f4a71] border-b-2 border-[#2f4a71]">Book Appointment</h2>
                  <button v-if="showCloseButton" class="modal-close" @click="closeModal()">&times;</button>
                </div>
                
                <div class="modal-body">
                  <div class="mb-4 date-display">
                    <span class="text-2xl text-[#2f4a71] font-semibold">{{ selectedDate.monthYear }}</span>
                    <span class="text-2xl text-[#2f4a71] float-right">{{ selectedDate.day }}</span>
                  </div>

                  <div class="mb-4 time-picker">
                    <div class="flex flex-col space-y-4">
                      <span class="flex items-center space-x-4">
                        <label for="hour-select" class="block mb-1 text-sm font-medium text-gray-700">Select Hour:</label>
                        <select 
                          id="hour-select"
                          v-model="selectedHour" 
                          class="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#2f4a71] focus:border-[#2f4a71]"
                          @change="selectHour(selectedHour)"
                        >
                          <!-- <option value="">Select Hour</option> -->
                          <option 
                            v-for="hour in availableHours" 
                            :key="hour" 
                            :value="hour"
                          >
                            {{ hour > 12 ? hour - 12 : hour }} {{ hour >= 12 ? 'PM' : 'AM' }}
                          </option>
                        </select>
                      </span> 
                      
                      <span v-if="selectedHour !== null" class="flex items-center space-x-4">
                        <label for="minute-select" class="block mb-1 text-sm font-medium text-gray-700">Select Minute:</label>
                        <select 
                          id="minute-select"
                          v-model="selectedMinute" 
                          class="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#2f4a71] focus:border-[#2f4a71]"
                          @change="checkTimeSlotAvailability()"
                        >
                          <option value="">Select Minute</option>
                          <option 
                            v-for="minute in availableMinutes" 
                            :key="minute" 
                            :value="minute"
                          >
                            {{ minute < 10 ? '0' + minute : minute }}
                          </option>
                        </select>
                      </span>
                    </div>
                  </div>
                  
                  <!-- Show message when no time slots are available -->
                  <div v-if="availableHours.length === 0 && !isWeekend(selectedDate.rawDate)" 
                      class="p-2 mb-4 text-yellow-800 bg-yellow-100 rounded">
                    No time slots available for this date. Please select another date.
                  </div>
                  <!-- Add a warning message if the selected time is already booked -->
                  <div v-if="!isSelectedTimeAvailable && selectedHour !== null && selectedMinute !== null" 
                      class="p-2 mb-4 text-red-700 bg-red-100 rounded">
                    This time slot is already booked. Please select a different time.
                  </div>

                  <div v-if="isWeekend(selectedDate.rawDate)" class="p-2 mb-4 text-yellow-800 bg-yellow-100 rounded">
                    Note: Appointments cannot be scheduled on weekends.
                  </div>
                  
                  <!-- Complaint -->
                  <div class="mb-4">
                    <label for="complaint" class="block text-sm font-semibold text-gray-600">Complaint</label>
                    <textarea 
                      v-model="complaint" 
                      id="complaint"
                      placeholder="General Complaint" 
                      class="w-full h-32 px-4 py-2 mt-1 border border-gray-300 rounded-lg"
                    ></textarea>
                  </div>
                  
                  <!-- Status message -->
                  <div v-if="statusMessage" :class="['p-2 rounded mb-4', statusType === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700']">
                    {{ statusMessage }}
                  </div>
                </div>
                
                <div class="modal-footer">
                  <button 
                    @click="submitAppointment" 
                    class="w-full p-2 font-bold text-white bg-[#2f4a71] rounded hover:bg-[#8b67db] disabled:bg-gray-400"
                    :disabled="isSubmitting"
                  >
                    {{ isSubmitting ? 'Submitting...' : 'Submit' }}
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </Teleport>

        <!-- Fetch Appointments -->
        <div class="text-2xl text-[#2f4a71] font-semibold border-b-2 border-[#a6a6a6] mt-10 mb-4">Upcoming Appointments</div>
        
        <!-- Loading state -->
        <div v-if="loadingAppointments" class="py-4 text-center">
          <p class="text-gray-600">Loading appointments...</p>
        </div>
        
        <!-- Error state -->
        <div v-else-if="appointmentsError" class="p-3 mb-4 text-red-700 bg-red-100 rounded">
          <p>{{ appointmentsError }}</p>
          <button @click="fetchUpcomingAppointments" class="mt-1 text-sm underline">
            Try again
          </button>
        </div>
        
        <!-- No appointments -->
        <div v-else-if="upcomingAppointments.length === 0" class="py-4 text-center">
          <p class="text-gray-600">No upcoming appointments</p>
        </div>
        
        <!-- Appointments list -->
        <div v-else class="space-y-4 appointments-list">
          <div 
            v-for="(group, date) in groupedAppointments" 
            :key="date" 
            class="mb-4 appointment-group"
          >
            <h3 class="text-lg font-semibold mb-2 p-1 bg-[#f0f4f9] text-[#2f4a71] rounded">
              {{ formatFullDate(date) }}
            </h3>
          
            <!-- Update the appointment card in the template section to include delete button -->
            <div 
              v-for="appointment in group" 
              :key="appointment.appointment_id" 
              class="p-3 mb-2 transition-shadow bg-white border border-gray-200 rounded-lg appointment-card hover:shadow-md"
            >
              <div class="flex items-start justify-between">
                <div>
                  <h4 class="font-bold">
                    {{ appointment.patient?.name || 'Patient #' + appointment.patient_id }}
                  </h4>
                  <p class="text-xs text-gray-500">
                    {{ appointment.patient?.category || 'Unknown' }} 
                    <span v-if="appointment.patient?.grade">
                      Grade {{ appointment.patient.grade }}-{{ appointment.patient.section }}
                    </span>
                  </p>
                </div>
                <div class="text-right">
                  <span class="block text-[#2f4a71] font-semibold">
                    {{ formatTime(appointment.hour, appointment.minute) }}
                  </span>
                  <span 
                    v-if="appointment.status"
                    class="inline-block px-2 py-1 mt-1 text-xs rounded-full"
                    :class="getStatusClass(appointment.status)"
                  >
                    {{ appointment.status || 'pending' }}
                  </span>
                </div>
              </div>
              
              <div class="p-2 mt-2 text-sm rounded bg-gray-50">
                <p class="text-gray-700">{{ appointment.complaint }}</p>
              </div>
              
              <!-- Notes (if any) -->
              <div v-if="appointment.notes" class="p-2 mt-2 text-sm rounded bg-yellow-50">
                <p class="text-gray-700"><span class="font-medium">Notes:</span> {{ appointment.notes }}</p>
              </div>
              
              <!-- Add delete button - only show for appointments that can be canceled -->
              <div v-if="canCancelAppointment(appointment)" class="flex justify-end mt-2">
                <button 
                  @click.stop="confirmDeleteAppointment(appointment)"
                  class="px-2 py-1 text-xs text-red-600 rounded hover:bg-red-50"
                >
                  Cancel Appointment
                </button>
              </div>
            </div>

            <!-- Add Delete Confirmation Modal -->
            <Teleport to="body">
              <Transition name="modal">
                <div v-if="showDeleteConfirmModal" class="modal-overlay" @click.self="closeDeleteConfirmModal">
                  <div class="max-w-md modal-container">
                    <div class="modal-header">
                      <h3 class="mb-4 text-xl font-bold text-red-600">Cancel Appointment</h3>
                      <button class="modal-close" @click="closeDeleteConfirmModal">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                      <p class="mb-4">Are you sure you want to cancel this appointment?</p>
                      
                      <div v-if="appointmentToDelete" class="p-3 mb-4 rounded bg-gray-50">
                        <div class="text-sm text-gray-500">
                          {{ formatFullDate(appointmentToDelete.date) }} at 
                          {{ formatTime(appointmentToDelete.hour, appointmentToDelete.minute) }}
                        </div>
                        <div class="font-medium">{{ appointmentToDelete.complaint }}</div>
                      </div>
                      
                      <div v-if="deleteStatusMessage" class="p-2 mb-4 text-red-700 bg-red-100 rounded">
                        {{ deleteStatusMessage }}
                      </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3 modal-footer">
                      <button 
                        @click="closeDeleteConfirmModal"
                        class="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button 
                        @click="deleteAppointment"
                        :disabled="isDeleting"
                        class="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 disabled:bg-gray-400"
                      >
                        {{ isDeleting ? 'Deleting...' : 'Confirm Cancellation' }}
                      </button>
                    </div>
                  </div>
                </div>
              </Transition>
            </Teleport>


          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick} from 'vue';
import moment from 'moment-timezone';
import { useProfile } from '~/composables/useProfile';

// Modal state
const showModal = ref(false);
const showCloseButton = ref(true);
const closeOnOverlayClick = ref(true);

const isSelectedTimeAvailable = ref(true);

// Define emits
const emit = defineEmits([
  'update-hour', 
  'update-minute', 
  'modal-closed', 
  'modal-opened',
  'consultation-saved',
  'consultation-deleted',
  'update-confined'
]);

const formatBookedTime = (timeSlot) => {
  const [hour, minute] = timeSlot.split(':').map(Number);
  return formatTime(hour, minute);
};

// Component props
const props = defineProps({
  currentDay: {
    type: Object,
    default: () => ({ 
      date: moment().tz("Asia/Manila").toDate() 
    })
  },
  onUpdateConfined: {
    type: Function,
    default: () => {}
  },
  onConsultationSaved: {
    type: Function,
    default: () => {}
  }
});

// Load profile
const { profile, loading, error, fetchProfile } = useProfile();
onMounted(async () => {
  await fetchProfile();
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

// Form state
const selectedMinute = ref(0); // Default minute
const complaint = ref('');
const statusMessage = ref('');
const statusType = ref('');
const isSubmitting = ref(false);
// With this ref
const selectedHour = ref(null);

// And add a selectHour function
const selectHour = (hour) => {
  selectedHour.value = hour;
  emit("update-hour", hour);
  
  // Get available minutes for this hour
  const hourIndex = hourToIndex(hour);
  
  // If there are available minutes, select the first one
  if (hourIndex !== -1 && minutesMap.value[hourIndex].length > 0) {
    selectedMinute.value = minutesMap.value[hourIndex][0];
    emit("update-minute", selectedMinute.value);
  } else {
    selectedMinute.value = null;
  }
  
  checkTimeSlotAvailability();
};

// Available options
const hours = ref([15, 16]);

// Create a 2D array for minutes where each index corresponds to an hour
// Initialize with all minutes available for each hour
const minutesMap = ref([
  [0, 20, 40], // Hour 15
  [0, 20, 40] 

]);

// Map hour value to index in the minutesMap array
const hourToIndex = (hour) => {
  // Map from hour value (7-16) to array index (0-9)
  // This ensures 7:00 is at index 0, 8:00 is at index 1, etc.
  return hours.value.findIndex(h => h === Number(hour));
};

const bookedTimeSlots = ref([]); 

const checkTimeSlotAvailability = () => {
  if (selectedHour.value !== null && selectedMinute.value !== null) {
    const available = isTimeSlotAvailable(selectedHour.value, selectedMinute.value);
    isSelectedTimeAvailable.value = available;
    
    console.log(
      `Time ${selectedHour.value}:${selectedMinute.value} availability check:`, 
      available ? 'AVAILABLE' : 'BOOKED'
    );
    
    // If the selected time is not available, reset the minute selection
    if (!available) {
      selectedMinute.value = null;
      
      // If no minutes are available for this hour, reset the hour too
      if (availableMinutes.value.length === 0) {
        selectedHour.value = null;
      }
    }
  }
};

const isWeekend = (date) => {
  if (!date) return false;
  const day = moment(date).day();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

watch([selectedHour, selectedMinute], () => {
  checkTimeSlotAvailability();
});

// Watch for changes and emit
watch(selectedHour, (newHour) => {
  emit("update-hour", newHour);
});

watch(selectedMinute, (newMinute) => {
  emit("update-minute", newMinute);
});

// Modal controls
const openModal = () => {
  // Check if selected date is a weekend and show warning
  if (selectedDate.value  && isWeekend(selectedDate.value.rawDate)) {
    statusMessage.value = 'Appointments cannot be scheduled on weekends';
    statusType.value = 'error';
  } else {
    statusMessage.value = '';
  }
  
  showModal.value = true;
  emit('modal-opened');
  document.body.classList.add('overflow-hidden');
};


const closeModal = () => {
  showModal.value = false;
  emit('modal-closed');
  document.body.classList.remove('overflow-hidden');
};

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
    date: new Intl.DateTimeFormat('en-US', options).format(date),
    rawDate: date
  };
});

// Form validation
const validateForm = () => {
  if (!profile.value || !profile.value.patient_id) {
    statusMessage.value = 'Profile not loaded properly. Please refresh.';
    statusType.value = 'error';
    return false;
  }
  
  // Check if selected date is a weekend
  if (isWeekend(selectedDate.value.rawDate)) {
    statusMessage.value = 'Appointments cannot be scheduled on weekends';
    statusType.value = 'error';
    return false;
  }
  
  if (selectedHour.value === null || selectedHour.value === undefined) {
    statusMessage.value = 'Please select an hour';
    statusType.value = 'error';
    return false;
  }
  
  if (selectedMinute.value === null || selectedMinute.value === undefined) {
    statusMessage.value = 'Please select a minute';
    statusType.value = 'error';
    return false;
  }
  
  // Check if time slot is already booked
  if (!isSelectedTimeAvailable.value) {
    statusMessage.value = 'This time slot is already booked';
    statusType.value = 'error';
    return false;
  }
  
  if (!complaint.value || complaint.value.trim() === '') {
    statusMessage.value = 'Please enter a complaint';
    statusType.value = 'error';
    return false;
  }
  
  return true;
};

const fetchAvailableTimeSlots = async (date) => {
  if (!date) {
    console.error('No date provided to fetchAvailableTimeSlots');
    return;
  }
  
  // If it's a weekend, reset everything and return
  if (isWeekend(date)) {
    console.log('Weekend date, clearing booked slots');
    bookedTimeSlots.value = [];
    
    // Reset all minutes to be available
    minutesMap.value = [
      [0, 20, 40], // Hour 15
      [0, 20, 40]  // Hour 16
    ];
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // Ensure consistent date formatting using ISO format
    const formattedDate = new Date(date).toISOString().split('T')[0]; // Ensure YYYY-MM-DD format
    console.log(`Fetching booked slots for ${formattedDate}`);
    
    const response = await fetch(`http://localhost:3001/add-appointment/booked-slots?date=${formattedDate}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch booked time slots: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Received booked slots:', data);
    
    // FIRST: Reset all minutes to be available
    // Create a fresh copy of the minutes array for each hour
    minutesMap.value = [
      [0, 20, 40], // Hour 15
      [0, 20, 40]  // Hour 16
    ];
    
    // SECOND: Process the booked slots and remove them from available minutes
    if (Array.isArray(data)) {
      // Store booked slots for display
      bookedTimeSlots.value = data.map(slot => `${slot.hour}:${slot.minute}`);
      console.log('Formatted booked slots:', bookedTimeSlots.value);
      
      // Now remove booked minutes from the minutesMap
      data.forEach(slot => {
        // Ensure values are numbers
        const hour = Number(slot.hour);
        const minute = Number(slot.minute);
        
        const hourIndex = hourToIndex(hour);
        console.log(`Removing slot ${hour}:${minute}, hour index: ${hourIndex}`);
        
        if (hourIndex !== -1) {
          // Remove the booked minute from the array using direct array manipulation
          const currentMinutes = [...minutesMap.value[hourIndex]];
          const minuteIndex = currentMinutes.indexOf(minute);
          
          if (minuteIndex !== -1) {
            currentMinutes.splice(minuteIndex, 1);
            // Replace the entire array for reactivity
            minutesMap.value[hourIndex] = currentMinutes;
            console.log(`Removed minute ${minute} from hour ${hour}, remaining: ${currentMinutes}`);
          }
        }
      });
    } else {
      console.error('Received invalid data format from API:', data);
      bookedTimeSlots.value = [];
    }
    
    console.log('Updated minutes map:', minutesMap.value);
    
    // Reset selections if they're no longer available
    if (selectedHour.value !== null && selectedMinute.value !== null) {
      const hourIndex = hourToIndex(selectedHour.value);
      
      if (hourIndex === -1 || !minutesMap.value[hourIndex].includes(selectedMinute.value)) {
        console.log(`Selected time ${selectedHour.value}:${selectedMinute.value} is no longer available`);
        selectedMinute.value = null;
        
        // If hour has no available minutes, reset hour too
        if (hourIndex !== -1 && minutesMap.value[hourIndex].length === 0) {
          selectedHour.value = null;
        }
      }
    }
    
    // Auto-select first available slot if nothing is selected
    await nextTick();
    if (selectedHour.value === null) {
      // Find first hour with available minutes
      const firstAvailableHourIndex = minutesMap.value.findIndex(minutes => minutes.length > 0);
      
      if (firstAvailableHourIndex !== -1) {
        const hour = hours.value[firstAvailableHourIndex];
        console.log(`Auto-selecting hour ${hour}`);
        selectedHour.value = hour;
        
        // Select the first available minute for this hour
        if (minutesMap.value[firstAvailableHourIndex].length > 0) {
          const minute = minutesMap.value[firstAvailableHourIndex][0];
          console.log(`Auto-selecting minute ${minute}`);
          selectedMinute.value = minute;
        }
      }
    }
    
  } catch (error) {
    console.error('Error fetching booked time slots:', error);
    statusMessage.value = 'Error loading available time slots';
    statusType.value = 'error';
  }
};

// Check if a specific hour-minute combination is available
const isTimeSlotAvailable = (hour, minute) => {
  if (hour === null || minute === null) return false;
  
  // Get the index for the hour in our hours array
  const hourIndex = hourToIndex(hour);
  if (hourIndex === -1) return false;
  
  // Check if this minute exists in the available minutes for this hour
  return minutesMap.value[hourIndex].includes(minute);
};


watch(() => props.currentDay.date, (newDate) => {
  if (newDate) {
    fetchAvailableTimeSlots(newDate);
  }
}, { immediate: true });

// Make sure we update the available slots whenever the date changes
watch(() => selectedDate.value.rawDate, (newDate) => {
  if (newDate) {
    fetchAvailableTimeSlots(newDate);
  }
}, { immediate: true });


// Update the submitAppointment function
// In AddAppointment.vue, update the submitAppointment function
const submitAppointment = async () => {
  console.log(selectedDate.value.rawDate);
  try {
    // Reset status
    statusMessage.value = '';
    
    await fetchAvailableTimeSlots(selectedDate.value.rawDate);
    
    // Recheck time slot availability
    checkTimeSlotAvailability();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    isSubmitting.value = true;
    
    // Extract the date from the selected date
    const dateObj = selectedDate.value.rawDate || new Date();
    
    // Get token for authentication
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // Call the API
    const response = await fetch('http://localhost:3001/add-appointment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        patient_id: profile.value.patient_id || profile.value.client_id, // Use patient_id, fallback to client_id for backwards compatibility
        date: moment(dateObj).tz("Asia/Manila").format('YYYY-MM-DD'), // Format as YYYY-MM-DD
        hour: selectedHour.value,
        minute: selectedMinute.value,
        complaint: complaint.value,
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create appointment');
    }

    // Show success message
    statusMessage.value = 'Appointment booked successfully!';
    statusType.value = 'success';
    
    // Reset form
    complaint.value = '';
    
    // Immediately refresh available time slots for the current date
    await fetchAvailableTimeSlots(selectedDate.value.rawDate);
    
    // Call parent callbacks - this will trigger refreshCalendar in ServicesLayout
    if (props.onConsultationSaved) {
      props.onConsultationSaved();
    }
    
    // Emit event for parent components to handle
    emit('consultation-saved');
    
    // Refresh the appointments list
    fetchUpcomingAppointments();
    
    // Auto close modal after success
    setTimeout(() => {
      closeModal();
    }, 2000);
    
  } catch (error) {
    console.error('Error creating appointment:', error);
    statusMessage.value = error.message || 'Failed to book appointment';
    statusType.value = 'error';
  } finally {
    isSubmitting.value = false;
  }
};

const handleDateSelected = (dateInfo) => {
  if (dateInfo && dateInfo.date) {
    console.log('Date selected:', dateInfo.date);
    selectedDate.value = {
      day: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dateInfo.date),
      monthYear: new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(dateInfo.date),
      date: new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(dateInfo.date),
      rawDate: dateInfo.date
    };
    
    // Fetch available slots immediately when date is selected
    fetchAvailableTimeSlots(dateInfo.date);
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-blue-100 text-blue-800';
  }
};

// Upcoming appointments - Add this section directly to the component
const upcomingAppointments = ref([]);
const loadingAppointments = ref(false);
const appointmentsError = ref(null);

// Format time for display
const formatTime = (hour, minute) => {
  const formattedMinute = minute < 10 ? `0${minute}` : `${minute}`;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${formattedMinute} ${period}`;
};

// Format full date for display
const formatFullDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

// Group appointments by date
const groupedAppointments = computed(() => {
  const groups = {};
  
  upcomingAppointments.value.forEach(appointment => {
    const date = appointment.date.split('T')[0]; // YYYY-MM-DD format
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(appointment);
  });
  
  // Sort dates in ascending order
  return Object.keys(groups)
    .sort()
    .reduce((sorted, date) => {
      sorted[date] = groups[date];
      return sorted;
    }, {});
});

// Update the fetchUpcomingAppointments function
const fetchUpcomingAppointments = async () => {
  loadingAppointments.value = true;
  appointmentsError.value = null;
  
  try {
    await fetchProfile();
    // Get the patient ID from profile
    const patientId = profile.value?.patient_id;
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // Add patient_id to the URL if available
    const url = `http://localhost:3001/fetch-appointments-patient/upcoming`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch appointments');
    }
    
    const data = await response.json();
    upcomingAppointments.value = data;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    appointmentsError.value = error.message || 'Failed to load appointments';
  } finally {
    loadingAppointments.value = false;
  }
};

// Add these new refs for deletion functionality
const showDeleteConfirmModal = ref(false);
const appointmentToDelete = ref(null);
const isDeleting = ref(false);
const deleteStatusMessage = ref('');

// Function to open delete confirmation modal
const confirmDeleteAppointment = (appointment) => {
  appointmentToDelete.value = appointment;
  showDeleteConfirmModal.value = true;
};

// Function to close delete confirmation modal
const closeDeleteConfirmModal = () => {
  showDeleteConfirmModal.value = false;
  appointmentToDelete.value = null;
  deleteStatusMessage.value = '';
};

// Function to delete appointment - update around line 850
const deleteAppointment = async () => {
  if (!appointmentToDelete.value) return;
  
  try {
    isDeleting.value = true;
    deleteStatusMessage.value = '';
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`http://localhost:3001/add-appointment/${appointmentToDelete.value.appointment_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete appointment');
    }
    
    // Remove the appointment from the list
    upcomingAppointments.value = upcomingAppointments.value.filter(
      a => a.appointment_id !== appointmentToDelete.value.appointment_id
    );
    
    // Close the modal
    closeDeleteConfirmModal();
    
    // Show success message as a temporary notification
    statusMessage.value = 'Appointment deleted successfully!';
    statusType.value = 'success';
    
    // Immediately refresh available time slots for the current date
    await fetchAvailableTimeSlots(selectedDate.value.rawDate);
    
    // Call parent callbacks
    if (props.onConsultationSaved) {
      props.onConsultationSaved();
    }
    
    // Emit event for parent components to handle
    emit('consultation-deleted');
    
    // Refresh the calendar in ServicesLayout
    if (appointmentToDelete.value.date) {
      // If the canceled appointment was on the current day, refresh the slots
      const appointmentDate = new Date(appointmentToDelete.value.date);
      const currentDate = selectedDate.value.rawDate;
      
      if (
        appointmentDate.getFullYear() === currentDate.getFullYear() &&
        appointmentDate.getMonth() === currentDate.getMonth() &&
        appointmentDate.getDate() === currentDate.getDate()
      ) {
        await fetchAvailableTimeSlots(currentDate);
      }
    }
    
    // Clear the success message after a few seconds
    setTimeout(() => {
      if (statusType.value === 'success') {
        statusMessage.value = '';
      }
    }, 3000);
    
  } catch (error) {
    console.error('Error deleting appointment:', error);
    deleteStatusMessage.value = error.message || 'Failed to delete appointment';
  } finally {
    isDeleting.value = false;
  }
};

// Check if the appointment can be canceled (only pending appointments or within 24 hours)
const canCancelAppointment = (appointment) => {
  return true;
};

// Return available minutes for the selected hour
const availableMinutes = computed(() => {
  if (selectedHour.value === null || isWeekend(selectedDate.value.rawDate)) {
    return [];
  }
  
  const hourIndex = hourToIndex(selectedHour.value);
  if (hourIndex === -1) return [];
  
  return minutesMap.value[hourIndex];
});

// Return only hours that have at least one available minute
const availableHours = computed(() => {
  if (!selectedDate.value || isWeekend(selectedDate.value.rawDate)) {
    return [];
  }
  
  return hours.value.filter(hour => {
    const hourIndex = hourToIndex(hour);
    return hourIndex !== -1 && minutesMap.value[hourIndex].length > 0;
  });
});

// Initialize with default values
onMounted(() => {
  if (selectedHour.value !== null) {
    emit("update-hour", selectedHour.value);
  }
  if (selectedMinute.value !== null) {
    emit("update-minute", selectedMinute.value);
  }
  
  // Fetch upcoming appointments and available time slots
  fetchUpcomingAppointments();
  fetchAvailableTimeSlots(selectedDate.value.rawDate);
});

// Expose methods for parent components
defineExpose({
  openModal,
  closeModal,
  fetchUpcomingAppointments,
  handleDateSelected,
  fetchAvailableTimeSlots
});
</script>

<style scoped>
textarea {
  resize: none;
}

.time-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 15px 0;
}

.time-picker-select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  color: #999;
  height: 30px;
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.modal-close:hover {
  background-color: #f0f0f0;
  color: #333;
}

.modal-body {
  margin-bottom: 20px;
}

.modal-footer {
  margin-top: 15px;
}

/* Animation */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.appointments-list {
  max-height: calc(100vh - 350px);
  overflow-y: auto;
}
</style>