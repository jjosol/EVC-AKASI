<template>
  <div class="fixed w-4/6">
    <div class="fixed top-0 right-0 w-1/4 h-screen p-5 bg-gray-100 border-[#2f4a71]">
      <div class="h-full p-5 overflow-y-auto l">

        <div class="text-4xl text-[#2f4a71] font-bold border-b-2 border-[#2f4a71] mb-2" >Appointments</div>
        <div class="date-display mb-4">
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
                  <div class="date-display mb-4">
                    <span class="text-2xl text-[#2f4a71] font-semibold">{{ selectedDate.monthYear }}</span>
                    <span class="text-2xl text-[#2f4a71] float-right">{{ selectedDate.day }}</span>
                  </div>

                  <div class="time-picker mb-4">
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
        <div v-if="loadingAppointments" class="text-center py-4">
          <p class="text-gray-600">Loading appointments...</p>
        </div>
        
        <!-- Error state -->
        <div v-else-if="appointmentsError" class="bg-red-100 text-red-700 p-3 rounded mb-4">
          <p>{{ appointmentsError }}</p>
          <button @click="fetchUpcomingAppointments" class="text-sm underline mt-1">
            Try again
          </button>
        </div>
        
        <!-- No appointments -->
        <div v-else-if="upcomingAppointments.length === 0" class="text-center py-4">
          <p class="text-gray-600">No upcoming appointments</p>
        </div>
        
        <!-- Appointments list -->
        <div v-else class="appointments-list space-y-4">
          <div 
            v-for="(group, date) in groupedAppointments" 
            :key="date" 
            class="appointment-group mb-4"
          >
            <h3 class="text-lg font-semibold mb-2 p-1 bg-[#f0f4f9] text-[#2f4a71] rounded">
              {{ formatFullDate(date) }}
            </h3>
          
            <!-- Update the appointment card in the template section to include delete button -->
            <div 
              v-for="appointment in group" 
              :key="appointment.appointment_id" 
              class="appointment-card p-3 border border-gray-200 rounded-lg bg-white mb-2 hover:shadow-md transition-shadow"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="font-bold">
                    {{ appointment.client?.name || 'Client #' + appointment.client_id }}
                  </h4>
                  <p class="text-xs text-gray-500">
                    {{ appointment.client?.category || 'Unknown' }} 
                    <span v-if="appointment.client?.grade">
                      Grade {{ appointment.client.grade }}-{{ appointment.client.section }}
                    </span>
                  </p>
                </div>
                <div class="text-right">
                  <span class="block text-[#2f4a71] font-semibold">
                    {{ formatTime(appointment.hour, appointment.minute) }}
                  </span>
                  <span 
                    v-if="appointment.status"
                    class="inline-block px-2 py-1 text-xs rounded-full mt-1"
                    :class="getStatusClass(appointment.status)"
                  >
                    {{ appointment.status || 'pending' }}
                  </span>
                </div>
              </div>
              
              <div class="mt-2 p-2 bg-gray-50 rounded text-sm">
                <p class="text-gray-700">{{ appointment.complaint }}</p>
              </div>
              
              <!-- Notes (if any) -->
              <div v-if="appointment.notes" class="mt-2 p-2 bg-yellow-50 rounded text-sm">
                <p class="text-gray-700"><span class="font-medium">Notes:</span> {{ appointment.notes }}</p>
              </div>
              
              <!-- Add delete button - only show for appointments that can be canceled -->
              <div v-if="canCancelAppointment(appointment)" class="mt-2 flex justify-end">
                <button 
                  @click.stop="confirmDeleteAppointment(appointment)"
                  class="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                >
                  Cancel Appointment
                </button>
              </div>
            </div>

            <!-- Add Delete Confirmation Modal -->
            <Teleport to="body">
              <Transition name="modal">
                <div v-if="showDeleteConfirmModal" class="modal-overlay" @click.self="closeDeleteConfirmModal">
                  <div class="modal-container max-w-md">
                    <div class="modal-header">
                      <h3 class="text-xl font-bold text-red-600 mb-4">Cancel Appointment</h3>
                      <button class="modal-close" @click="closeDeleteConfirmModal">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                      <p class="mb-4">Are you sure you want to cancel this appointment?</p>
                      
                      <div v-if="appointmentToDelete" class="bg-gray-50 p-3 rounded mb-4">
                        <div class="text-sm text-gray-500">
                          {{ formatFullDate(appointmentToDelete.date) }} at 
                          {{ formatTime(appointmentToDelete.hour, appointmentToDelete.minute) }}
                        </div>
                        <div class="font-medium">{{ appointmentToDelete.complaint }}</div>
                      </div>
                      
                      <div v-if="deleteStatusMessage" class="p-2 bg-red-100 text-red-700 rounded mb-4">
                        {{ deleteStatusMessage }}
                      </div>
                    </div>
                    
                    <div class="modal-footer flex justify-end space-x-3">
                      <button 
                        @click="closeDeleteConfirmModal"
                        class="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button 
                        @click="deleteAppointment"
                        :disabled="isDeleting"
                        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
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
import { ref, computed, onMounted, watch } from 'vue';
import moment from 'moment-timezone';
import { useProfile } from '~/composables/useProfile';

// Modal state
const showModal = ref(false);
const showCloseButton = ref(true);
const closeOnOverlayClick = ref(true);

// Define emits
const emit = defineEmits(['update-hour', 'update-minute', 'modal-closed', 'modal-opened']);

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
const selectedHour = ref(9); // Default hour
const selectedMinute = ref(0); // Default minute
const complaint = ref('');
const statusMessage = ref('');
const statusType = ref('');
const isSubmitting = ref(false);

// Available options
const hours = ref([7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
const minutes = ref([0, 15, 30, 45]);

// Watch for changes and emit
watch(selectedHour, (newHour) => {
  emit("update-hour", newHour);
});

watch(selectedMinute, (newMinute) => {
  emit("update-minute", newMinute);
});

// Modal controls
const openModal = () => {
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
  if (!profile.value || !profile.value.client_id) {
    statusMessage.value = 'Profile not loaded properly. Please refresh.';
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
  
  if (!complaint.value || complaint.value.trim() === '') {
    statusMessage.value = 'Please enter a complaint';
    statusType.value = 'error';
    return false;
  }
  
  return true;
};

// Update the submitAppointment function
const submitAppointment = async () => {
  console.log(selectedDate.value.rawDate);
  try {
    // Reset status
    statusMessage.value = '';
    
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
        client_id: profile.value.client_id,
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
    
    // Call parent callbacks
    if (props.onConsultationSaved) {
      props.onConsultationSaved();
    }
    
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
    // Get the client ID from profile
    const clientId = profile.value?.client_id;
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // Add client_id to the URL if available
    const url = `http://localhost:3001/fetch-appointments-client/upcoming`;
    
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

// Function to delete appointment
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

// Initialize with default values
onMounted(() => {
  if (selectedHour.value !== null) {
    emit("update-hour", selectedHour.value);
  }
  if (selectedMinute.value !== null) {
    emit("update-minute", selectedMinute.value);
  }
  
  // Fetch upcoming appointments
  fetchUpcomingAppointments();
});

// Expose methods for parent components
defineExpose({
  openModal,
  closeModal,
  fetchUpcomingAppointments
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