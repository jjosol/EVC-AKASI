// composables/useAppointments.js
// Note: Using .js instead of .ts to avoid TypeScript issues

export function useAppointments() {
    const appointments = ref([]);
    const loading = ref(false);
    const error = ref(null);

    // Format time from hour and minute
    const formatTime = (hour, minute) => {
        const formattedMinute = minute < 10 ? `0${minute}` : `${minute}`;
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${formattedMinute} ${period}`;
    };

    // Format date to display format
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    // Fetch upcoming appointments
    const fetchUpcomingAppointments = async () => {
        loading.value = true;
        error.value = null;

        try {
            const response = await fetch('http://localhost:3001/fetch-appointments-client/upcoming');

            if (!response.ok) {
                throw new Error('Failed to fetch appointments');
            }

            const data = await response.json();
            appointments.value = data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            error.value = errorMessage;
            console.error('Error fetching upcoming appointments:', errorMessage);
        } finally {
            loading.value = false;
        }
    };

    // Group appointments by date
    const groupedAppointments = computed(() => {
        const groups = {};

        appointments.value.forEach(appointment => {
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

    return {
        appointments,
        loading,
        error,
        formatTime,
        formatDate,
        fetchUpcomingAppointments,
        groupedAppointments
    };
}