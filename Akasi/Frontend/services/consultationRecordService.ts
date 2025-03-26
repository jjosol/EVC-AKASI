import { get, post, put, del } from './apiService';

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

export const fetchMedAdministrationRecords = async (consultation_id: number) => {
  return get(`${MED_ADMIN_URL}/consultation/${consultation_id}`);
};

export const createMedAdministrationRecord = async (data: any) => {
  return post(MED_ADMIN_URL, data);
};

export const deleteMedAdministrationRecord = async (consultation_id: number) => {
  return del(`${MED_ADMIN_URL}/${consultation_id}`);
};

export const updateMedAdministrationRecord = async (consultation_id: number, data: any) => {
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
