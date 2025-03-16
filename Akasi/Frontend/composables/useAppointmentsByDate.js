// composables/useAppointmentsByDate.js

import { ref } from 'vue';
import moment from 'moment-timezone';

export function useAppointmentsByDate() {
    const appointments = ref([]);
    const loadingAppointments = ref(false);
    const appointmentsError = ref(null);

    /**
     * Format time from hour and minute
     * @param {number} hour Hour in 24hr format
     * @param {number} minute Minute
     * @returns {string} Formatted time string
     */
    const formatTime = (hour, minute) => {
        const formattedMinute = minute < 10 ? `0${minute}` : `${minute}`;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return `${displayHour}:${formattedMinute} ${period}`;
    };

    /**
     * Formats a date for API consumption
     * @param {Date} date Date object
     * @returns {string} Formatted date string (YYYY-MM-DD)
     */
    const formatDateForApi = (date) => {
        return moment(date).format('YYYY-MM-DD');
    };

    /**
     * Fetch appointments for a specific date
     * @param {Date} date Selected date
     */
    const fetchAppointmentsByDate = async (date) => {
        loadingAppointments.value = true;
        appointmentsError.value = null;

        try {
            const formattedDate = formatDateForApi(date);
            const response = await fetch(`http://localhost:3001/admin-fetch-appointments/by-date?date=${formattedDate}`);

            if (!response.ok) {
                throw new Error('Failed to fetch appointments');
            }

            const data = await response.json();
            appointments.value = data;
        } catch (error) {
            console.error('Error fetching appointments:', error);
            appointmentsError.value = error.message || 'Failed to load appointments';
        } finally {
            loadingAppointments.value = false;
        }
    };

    return {
        appointments,
        loadingAppointments,
        appointmentsError,
        formatTime,
        formatDateForApi,
        fetchAppointmentsByDate
    };
}