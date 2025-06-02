<script setup>
import { ref } from 'vue'
import moment from 'moment-timezone'
import CalendarClient from '../parts/Services/CalendarClient.vue';
import AddAppointment from '../parts/Services/AddAppointment.vue';

const currentDay = ref({ 
    date: moment().tz("Asia/Manila").toDate()
})
const confinedCount = ref(0)
const calendarRef = ref(null);
const appointmentRef = ref(null);

// Enhanced day selection handler that communicates directly with the appointment component
const handleDaySelected = (day) => {
    currentDay.value = day;
    
    // Directly call the appointment component's handler method
    if (appointmentRef.value) {
        appointmentRef.value.handleDateSelected(day);
    }
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
        currentDay.value.date = new Date(year, month, 1);
    }

    console.log('Updated date:', currentDay.value);
};

// Enhanced refresh function - reload calendar data and fetch slots again
const refreshCalendar = async () => {
    console.log('Refreshing calendar after appointment changes');
    
    // First update the calendar UI and availability data
    if (calendarRef.value) {
        await calendarRef.value.updateCalendar();
    }
    
    // Then reload the slots for the current day
    if (appointmentRef.value && currentDay.value && currentDay.value.date) {
        console.log('Reloading time slots for current day');
        appointmentRef.value.fetchAvailableTimeSlots(currentDay.value.date);
    }
};

definePageMeta({
    middleware: 'auth',
    layout: 'main',
});
</script>

<template>
    <NuxtLayout>
        <div class="flex flex-col lg:flex-row w-full gap-4">
            <!-- Calendar component - Full width on mobile, 3/4 width on desktop -->
            <div class="w-full lg:w-3/4 mb-4 lg:mb-0">
                <CalendarClient 
                    @day-selected="handleDaySelected" 
                    @update-date="handleUpdateDate" 
                    :updateConfined="confinedCount" 
                    ref="calendarRef" 
                    class="w-full"
                />
            </div>
            
            <!-- Appointment component - Full width on mobile, 1/4 width on desktop -->
            <div class="w-full lg:w-1/4">
                <AddAppointment 
                    ref="appointmentRef"
                    :current-day="currentDay" 
                    @update-confined="updateConfinedCount" 
                    @consultation-saved="refreshCalendar" 
                    @consultation-deleted="refreshCalendar" 
                    class="h-full"
                />
            </div>
        </div>
    </NuxtLayout>
</template>

<style scoped>
/* Responsive styles */
@media (max-width: 1023px) {
    :deep(.fixed) {
        position: relative !important;
        width: 100% !important;
    }
}
</style>