// composables/useApi.ts
import { ref } from 'vue';

interface Student {
    patient_id: number;
    name: string;
    grade: number | null;
    section: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export const useStudentApi = () => {
    const students = ref<Student[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const apiBaseUrl = process.env.NODE_ENV === 'production'
        ? '/api'
        : 'http://localhost:3001';

    const fetchStudents = async () => {
        loading.value = true;
        error.value = null;

        try {
            // Use correct variable destructuring
            const { data: responseData, error: fetchError } = await useFetch(`${apiBaseUrl}/get-patient/students`, {
                key: 'students',
                server: false // Get fresh data on client side
            });

            if (fetchError.value) {
                throw new Error(fetchError.value.message || 'Failed to fetch data');
            }

            if (responseData.value && (responseData.value as ApiResponse<Student[]>).success) {
                students.value = (responseData.value as ApiResponse<Student[]>).data;
            } else {
                error.value = 'Failed to fetch students';
            }
        } catch (err) {
            console.error('Error fetching students:', err);
            error.value = err instanceof Error ? err.message : 'An unknown error occurred';
        } finally {
            loading.value = false;
        }
    };

    return {
        students,
        loading,
        error,
        fetchStudents,
    };
};