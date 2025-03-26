<script setup>
import { ref } from 'vue'
import moment from 'moment-timezone'

const currentDay = ref({ 
    date: moment().tz("Asia/Manila").toDate()
})
const confinedCount = ref(0)
const calendarRef = ref(null);

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

const refreshCalendar = () => {
    if (calendarRef.value) {
        calendarRef.value.updateCalendar();
    }
};

definePageMeta({
    middleware: 'auth', // Reference your middleware here
    layout: 'main',
});
</script>

<template>
<NuxtLayout>
    <div class="service-container">
        <!-- Content area -->
        <div class="service-content">
            <CalendarClient @day-selected="handleDaySelected" @update-date="handleUpdateDate" :updateConfined="confinedCount" ref="calendarRef" />
            <AddAppointment :current-day="currentDay" @update-confined="updateConfinedCount" @consultation-saved="refreshCalendar" @consultation-deleted="refreshCalendar" />
        </div>
    </div>
</NuxtLayout>
</template>

<style scoped>
.service-container {
    display: flex;
    width: 100%;
    min-height: 100vh;
}

.service-content {
    flex: 1;
    padding-left: 20rem;
    /* The sidebar should be handled by the main layout */
}
</style>