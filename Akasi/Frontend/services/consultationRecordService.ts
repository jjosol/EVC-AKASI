import { get, post, put, del } from './apiService.js';

const BASE_URL = '/consultation-records';
const MED_ADMIN_URL = '/med-administration';
const CLIENT_URL = '/clients';
const INVENTORY_URL = '/inventory';
const DIAGNOSIS_URL = '/diagnosis';

export const fetchConsultationRecords = async () => {
  return get(BASE_URL);
};

export const fetchConsultationRecord = async (consultation_id: number) => {
  return get(`${BASE_URL}/${consultation_id}`);
};

export const fetchConsultationRecordsCount = async (year: number, month: number) => {
  return get(`${BASE_URL}/count?year=${year}&month=${month}`);
};

// These functions should automatically pass all properties in the data object,
// including your new action and disposition fields

export const updateConsultationRecord = async (consultation_id: number, data: any) => {
  return put(`${BASE_URL}/${consultation_id}`, data);
};

export const createConsultationRecord = async (data: any) => {
  return post(BASE_URL, data);
};

export const deleteConsultationRecord = async (consultation_id: number) => {
  return del(`${BASE_URL}/${consultation_id}/delete`);
};

export const updateConsultationWithMedication = async (consultation_id: number) => {
  return put(`${BASE_URL}/${consultation_id}`, { medAdministration: true });
};

// Utility function to validate medication dates
export const validateMedicationDates = (startDate: string | Date, endDate: string | Date): { valid: boolean; message: string } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time part for date comparison
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  // Check if start date is before today
  if (start < today) {
    return { valid: false, message: 'Start date cannot be before today' };
  }
  
  // Check if end date is before today
  if (end < today) {
    return { valid: false, message: 'End date cannot be before today' };
  }
  
  // Check if start and end dates are the same
  if (start.getTime() === end.getTime()) {
    return { valid: false, message: 'Start date and end date cannot be the same' };
  }
  
  // Check if start date is after end date
  if (start > end) {
    return { valid: false, message: 'Start date must be before end date' };
  }
  
  return { valid: true, message: '' };
};

export const fetchMedAdministrationRecords = async (consultation_id: number) => {
  return get(`${MED_ADMIN_URL}/consultation/${consultation_id}`);
};

export const createMedAdministrationRecord = async (data: any) => {
  // Validate dates if they exist in the data
  if (data.startDate && data.endDate) {
    const validation = validateMedicationDates(data.startDate, data.endDate);
    if (!validation.valid) {
      throw new Error(validation.message);
    }
  }
  
  return post(MED_ADMIN_URL, data);
};

export const deleteMedAdministrationRecord = async (consultation_id: number) => {
  return del(`${MED_ADMIN_URL}/${consultation_id}`);
};

export const updateMedAdministrationRecord = async (consultation_id: number, data: any) => {
  // Validate dates if they exist in the data
  if (data.startDate && data.endDate) {
    const validation = validateMedicationDates(data.startDate, data.endDate);
    if (!validation.valid) {
      throw new Error(validation.message);
    }
  }
  
  return put(`${MED_ADMIN_URL}/${consultation_id}`, data);
};

export const fetchPeople = async () => {
  return get(CLIENT_URL);
};

export const fetchInventory = async () => {
  return get(INVENTORY_URL);
};

// Diagnosis-related endpoints
export const fetchDiseases = async () => {
  return get(DIAGNOSIS_URL);
};

export const fetchDiseaseCategories = async () => {
  return get(`${DIAGNOSIS_URL}/categories`);
};

export const createDisease = async (data: any) => {
  return post(DIAGNOSIS_URL, data);
};

export const updateDisease = async (diagnosis_id: number, data: any) => {
  return put(`${DIAGNOSIS_URL}/${diagnosis_id}`, data);
};

export const deleteDisease = async (diagnosis_id: number) => {
  return del(`${DIAGNOSIS_URL}/${diagnosis_id}`);
};

export const linkDiagnosisToConsultation = async (consultation_id: number, diagnosis_id: number) => {
  return post(`${BASE_URL}/${consultation_id}/diagnoses`, { diagnosis_id });
};

export const removeDiagnosisFromConsultation = async (consultation_id: number, diagnosis_id: number) => {
  return del(`${BASE_URL}/${consultation_id}/diagnoses/${diagnosis_id}`);
};

export const createDiseaseCategory = async (data: any) => {
  return post(`${DIAGNOSIS_URL}/categories`, data);
};

// Add the deleteDiseaseCategory function
export const deleteDiseaseCategory = async (category_id: number) => {
  return del(`${DIAGNOSIS_URL}/categories/${category_id}`);
};
