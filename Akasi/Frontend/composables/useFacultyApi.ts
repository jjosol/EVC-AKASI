// composables/useApi.ts
import { ref } from 'vue';

interface Faculty {
    patient_id: number;
    name: string;
    section: string;
    type: string;
    hasPendingFiles?: boolean;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export const useFacultyApi = () => {
    const faculty = ref<Faculty[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const apiBaseUrl = process.env.NODE_ENV === 'production'
        ? '/api'
        : 'http://localhost:3001';

    const fetchFaculty = async () => {
        loading.value = true;
        error.value = null;

        try {
            // Use correct variable destructuring
            const { data: responseData, error: fetchError } = await useFetch(`${apiBaseUrl}/get-patient/faculty`, {
                key: 'faculty',
                server: false // Get fresh data on client side
            });

            if (fetchError.value) {
                throw new Error(fetchError.value.message || 'Failed to fetch data');
            }

            if (responseData.value && (responseData.value as ApiResponse<Faculty[]>).success) {
                faculty.value = (responseData.value as ApiResponse<Faculty[]>).data;
            } else {
                error.value = 'Failed to fetch faculty';
            }
        } catch (err) {
            console.error('Error fetching faculty:', err);
            error.value = err instanceof Error ? err.message : 'An unknown error occurred';
        } finally {
            loading.value = false;
        }
    };

    // Function to get faculty with pending files
    const fetchFacultyWithPendingFiles = async () => {
        loading.value = true;
        error.value = null;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const response = await fetch(`${apiBaseUrl}/patients-with-pending-files?type=faculty`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch faculty with pending files: ${response.status}`);
            }

            const result = await response.json();
            
            if (result && result.success) {
                // Update existing faculty with pending file status
                const pendingPatientIds = new Set(result.data.map((f: Faculty) => f.patient_id));
                
                faculty.value.forEach(member => {
                    member.hasPendingFiles = pendingPatientIds.has(member.patient_id);
                });
                
                return result.data;
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('Error fetching faculty with pending files:', err);
            error.value = err instanceof Error ? err.message : 'An unknown error occurred';
            return [];
        } finally {
            loading.value = false;
        }
    };

    return {
        faculty,
        loading,
        error,
        fetchFaculty,
        fetchFacultyWithPendingFiles
    };
};