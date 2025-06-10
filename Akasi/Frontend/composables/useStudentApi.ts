// composables/useApi.ts
import { ref } from 'vue';

interface Student {
    patient_id: number;
    name: string;
    grade: number | null;
    section: string;
    gmail: string;
    type: string;
    status: string;
    hasPendingFiles?: boolean;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
}

export function useStudentApi() {
    const students = ref<Student[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Get API base URL from environment variable
    const apiBaseUrl = process.env.NODE_ENV === 'production'
        ? '/api'
        : import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

    // Fetch all students
    const fetchStudents = async () => {
        loading.value = true;
        error.value = null;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const response = await fetch(`${apiBaseUrl}/get-patients/students`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch students: ${response.status} ${response.statusText}`);
            }

            const result: ApiResponse<Student[]> = await response.json();
            
            if (!result.success) {
                throw new Error('Failed to fetch students data');
            }
            
            // Fetch students with pending files - use the correct patient-files endpoint
            const pendingResponse = await fetch(`${apiBaseUrl}/patient-files/patients-with-pending-files`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (pendingResponse.ok) {
                const pendingResult = await pendingResponse.json();
                const pendingStudentIds = new Set(pendingResult.data.map((s: Student) => s.patient_id));
                
                // Mark students with pending files
                result.data.forEach(student => {
                    student.hasPendingFiles = pendingStudentIds.has(student.patient_id);
                });
            }
            
            students.value = result.data;
            return result.data;
        } catch (err) {
            console.error('Error fetching students:', err);
            error.value = err instanceof Error ? err.message : 'Unknown error';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Fetch student by ID
    const fetchStudentById = async (id: number) => {
        loading.value = true;
        error.value = null;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const response = await fetch(`${apiBaseUrl}/get-patient/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch student: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error('Failed to fetch student data');
            }
            
            return result.data;
        } catch (err) {
            console.error(`Error fetching student ${id}:`, err);
            error.value = err instanceof Error ? err.message : 'Unknown error';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Fetch student files
    const fetchStudentFiles = async (patientId: number, grade: number) => {
        loading.value = true;
        error.value = null;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const response = await fetch(`${apiBaseUrl}/get-patient-files/${patientId}?grade=${grade}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch student files: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error('Failed to fetch student files');
            }
            
            return result.data;
        } catch (err) {
            console.error(`Error fetching student files for ${patientId}:`, err);
            error.value = err instanceof Error ? err.message : 'Unknown error';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    return {
        students,
        loading,
        error,
        fetchStudents,
        fetchStudentById,
        fetchStudentFiles
    };
}