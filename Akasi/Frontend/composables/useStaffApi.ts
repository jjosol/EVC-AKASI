// composables/useApi.ts
import { ref } from 'vue';

interface Staff {
    patient_id: number;
    name: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export const useStaffApi = () => {
    const staff = ref<Staff[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const apiBaseUrl = process.env.NODE_ENV === 'production'
        ? '/api'
        : 'http://localhost:3001';

    const fetchStaff = async () => {
        loading.value = true;
        error.value = null;

        try {
            // Use correct variable destructuring
            const { data: responseData, error: fetchError } = await useFetch(`${apiBaseUrl}/get-patient/staff`, {
                key: 'staff',
                server: false // Get fresh data on client side
            });

            if (fetchError.value) {
                throw new Error(fetchError.value.message || 'Failed to fetch data');
            }

            if (responseData.value && (responseData.value as ApiResponse<Staff[]>).success) {
                staff.value = (responseData.value as ApiResponse<Staff[]>).data;
            } else {
                error.value = 'Failed to fetch staff';
            }
        } catch (err) {
            console.error('Error fetching staff:', err);
            error.value = err instanceof Error ? err.message : 'An unknown error occurred';
        } finally {
            loading.value = false;
        }
    };

    return {
        staff,
        loading,
        error,
        fetchStaff,
    };
};