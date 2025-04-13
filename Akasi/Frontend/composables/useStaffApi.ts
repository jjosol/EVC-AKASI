// composables/useApi.ts
import { ref } from 'vue';

interface Staff {
    patient_id: number;
    name: string;
    division: string;
    type: string;
    hasPendingFiles?: boolean;
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

    // Function to get staff with pending files
    const fetchStaffWithPendingFiles = async () => {
        loading.value = true;
        error.value = null;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const response = await fetch(`${apiBaseUrl}/patients-with-pending-files?type=staff`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch staff with pending files: ${response.status}`);
            }

            const result = await response.json();
            
            if (result && result.success) {
                // Update existing staff with pending file status
                const pendingPatientIds = new Set(result.data.map((s: Staff) => s.patient_id));
                
                staff.value.forEach(member => {
                    member.hasPendingFiles = pendingPatientIds.has(member.patient_id);
                });
                
                return result.data;
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('Error fetching staff with pending files:', err);
            error.value = err instanceof Error ? err.message : 'An unknown error occurred';
            return [];
        } finally {
            loading.value = false;
        }
    };

    return {
        staff,
        loading,
        error,
        fetchStaff,
        fetchStaffWithPendingFiles
    };
};