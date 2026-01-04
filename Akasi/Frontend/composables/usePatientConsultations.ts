// composables/usePatientConsultations.ts
import { ref } from 'vue';

interface Medication {
  id: number;
  name: string;
  count: number;
  schedule: string;
  startDate: Date;
  endDate: Date;
  remarks?: string;
}

interface Consultation {
  id: number;
  date: Date;
  nurse_name: string;
  doctor_name?: string;
  complaint: string;
  remarks: string;
  action: string;
  disposition: string;
  intervention: string;
  confined: boolean;
  medAdministration: boolean;
  diagnoses: string;
  medications?: Medication[];
  nurseName?: string;
  doctorName?: string;
  patient_type: string;
  patient_occupation: string;
  category: string;
}

export function usePatientConsultations() {
  const consultations = ref<Consultation[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const apiBaseUrl = process.env.NODE_ENV === 'production'
    ? '/api'
    : 'http://localhost:3001';

  const fetchConsultations = async (patientId: number) => {
    if (!patientId) {
      error.value = 'Patient ID is required';
      return;
    }

    try {
      loading.value = true;
      error.value = null;

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${apiBaseUrl}/get-patient-consultations/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch consultations: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Backend currently returns a plain array of consultation records,
      // but also handle the { success, data } envelope if it is added later.
      const records = Array.isArray(data)
        ? data
        : Array.isArray((data as any).data)
          ? (data as any).data
          : null;

      if (!records) {
        throw new Error((data as any).message || 'Failed to fetch consultations');
      }

      consultations.value = records.map((record: any) => {
        return {
          id: record.consultation_id,
          date: record.date,
          complaint: record.complaint,
          doctor: record.doctor_name,
          nurse: record.nurse_name,
          confined: record.confined,
          medAdministration: record.medAdministration,
          action: record.action,
          remarks: record.remarks,
          disposition: record.disposition,
          diagnoses: record.diagnoses?.map((d: any) => d.name).join(', ') || null,
          medications: record.medications || [],
          patient_type: record.patient_type || 'Unknown',
          patient_occupation: record.patient_occupation || 'Unknown',
          category: record.category || ''  // This will contain division for faculty/staff or category for students
        };
      });

      console.log('Received consultations:', consultations.value.length);
    } catch (err) {
      console.error('Error fetching consultations:', err);
      error.value = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      loading.value = false;
    }
  };

  return {
    consultations,
    loading,
    error,
    fetchConsultations
  };
}