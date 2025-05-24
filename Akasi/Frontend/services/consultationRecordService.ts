import { get, post, put, del } from './apiService.js';

const BASE_URL = '/consultation-records';
const MED_ADMIN_URL = '/med-administration';
const PATIENT_URL = '/patients'; // Updated to use patients (plural) instead of patient
const INVENTORY_URL = '/medicine'; // Updated to use medicine instead of inventory
const DIAGNOSIS_URL = '/diagnoses'; // Updated to use diagnoses (plural) instead of diagnosis
const APPOINTMENT_URL = '/add-appointment'; // Added appointment URL
const CHIEF_COMPLAINT_URL = '/chief-complaint'; // Added chief complaint URL

// Define types for patient data
interface PatientData {
  type: string;
  division?: string;
  category?: string;
  grade?: number;
  section?: string;
}

// Define interfaces for type safety
interface ConsultationRecord {
  consultation_id?: number;
  patient_id: number;
  nurse_id: number;
  doctor_id?: number;
  date: string | Date;
  patient_name: string;
  patient_occupation: string;
  nurse_name: string;
  doctor_name?: string;
  complaint: string;
  remarks: string;
  intervention: string;
  action: string;
  confined: boolean;
  medAdministration: boolean;
  disposition: string;
  patient?: PatientData;  // Add patient data to include type, division, and category
  medical_data?: {
    patientType?: string;
    patientCategory?: string;
    patientGrade?: number;
    patientSection?: string;
  };
}

interface MedicationAdministration {
  med_administration_id?: number;
  consultation_id: number;
  patient_id: number;
  nurse_id: number;
  doctor_id?: number;
  med_id: number;
  medName: string;
  date: string | Date;
  patient_name: string;
  count: number;
  schedule: string;
  start_date: string | Date;
  end_date: string | Date;
  remarks?: string;
  intervention?: string;
}

interface MedicalData {
  temperature?: string;
  weight?: string;
  height?: string;
  blood_pressure?: string;
  heart_rate?: string;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  age?: string | number;
  gender?: string;
}

interface ChiefComplaint {
  chiefcomplaint_id?: number;
  consultation_id: number;
  complaint: string;
}

/**
 * Formats patient category based on type
 * @param {PatientData | undefined} patient - Patient data
 * @returns {string} Formatted category
 */
const formatPatientCategory = (patient: PatientData | undefined): string => {
  if (!patient || !patient.type) return 'N/A';
  return patient.type.toLowerCase() === 'student'
    ? patient.category || 'N/A'
    : patient.division || 'N/A';
};

/**
 * Fetches all consultation records
 * @returns {Promise<ConsultationRecord[]>} List of consultations
 */
export const fetchConsultationRecords = async () => {
  const records = await get(BASE_URL);
  return records.map((record: ConsultationRecord) => ({
    ...record,
    patient_occupation: record.patient?.type || 'N/A',
    category: formatPatientCategory(record.patient)
  }));
};

/**
 * Fetches a specific consultation record
 * @param {number} consultation_id - ID of the consultation to fetch
 * @returns {Promise<ConsultationRecord>} Consultation record
 */
export const fetchConsultationRecord = async (consultation_id: number) => {
  return get(`${BASE_URL}/${consultation_id}`);
};

// Simple cache to avoid repeated API calls
const countCache = {
  consultation: new Map(),
  confined: new Map(),
  yearly: new Map(),
  expirationTime: 5 * 60 * 1000, // 5 minutes cache
  getKey: (year: number, month: number) => `${year}-${month}`,
  isValid: (timestamp: number) => Date.now() - timestamp < countCache.expirationTime
};

/**
 * Fetches count of consultation records for specific month/year
 * @param {number} year - Year to count
 * @param {number} month - Month to count (0-11)
 * @returns {Promise<number>} Count of consultations
 */
export const fetchConsultationRecordsCount = async (year: number, month: number) => {
  try {
    // Check cache first
    const cacheKey = countCache.getKey(year, month);
    const cachedData = countCache.consultation.get(cacheKey);
    
    if (cachedData && countCache.isValid(cachedData.timestamp)) {
      console.log(`Using cached consultation count for ${year}-${month}`);
      return cachedData.value;
    }
    
    const result = await get(`${BASE_URL}/count?year=${year}&month=${month}`);
    const count = typeof result === 'number' ? result : 0;
    
    // Cache the result
    countCache.consultation.set(cacheKey, {
      value: count,
      timestamp: Date.now()
    });
    
    return count;
  } catch (error) {
    console.error(`Error fetching consultation count for ${year}-${month}:`, error);
    
    // Check if we have a cached value to use as fallback
    const cacheKey = countCache.getKey(year, month);
    const cachedData = countCache.consultation.get(cacheKey);
    if (cachedData) {
      console.log(`Using cached value due to error: ${cachedData.value}`);
      return cachedData.value;
    }
    
    return 0; // Return 0 as a fallback value
  }
};

/**
 * Fetches count of confined consultation records for specific month/year
 * @param {number} year - Year to count
 * @param {number} month - Month to count (0-11)
 * @returns {Promise<number>} Count of consultations
 */
export const fetchConfinedConsultationRecordsCount = async (year: number, month: number) => {
  try {
    // Check cache first
    const cacheKey = countCache.getKey(year, month);
    const cachedData = countCache.confined.get(cacheKey);
    
    if (cachedData && countCache.isValid(cachedData.timestamp)) {
      console.log(`Using cached confined count for ${year}-${month}`);
      return cachedData.value;
    }
    
    const result = await get(`${BASE_URL}/count?year=${year}&month=${month}&confined=true`);
    const count = typeof result === 'number' ? result : 0;
    
    // Cache the result
    countCache.confined.set(cacheKey, {
      value: count,
      timestamp: Date.now()
    });
    
    return count;
  } catch (error) {
    console.error(`Error fetching confined count for ${year}-${month}:`, error);
    
    // Check if we have a cached value to use as fallback
    const cacheKey = countCache.getKey(year, month);
    const cachedData = countCache.confined.get(cacheKey);
    if (cachedData) {
      console.log(`Using cached value due to error: ${cachedData.value}`);
      return cachedData.value;
    }
    
    return 0; // Return 0 as a fallback value
  }
};

/**
 * Fetches count of yearly consultation records
 * @param {number} year - Year to count
 * @returns {Promise<number>} Count of consultations for the year
 */
export const fetchYearlyConsultationCount = async (year: number) => {
  try {
    // Check cache first
    const cachedData = countCache.yearly.get(year);
    
    if (cachedData && countCache.isValid(cachedData.timestamp)) {
      console.log(`Using cached yearly count for ${year}`);
      return cachedData.value;
    }
    
    const result = await get(`${BASE_URL}/year-count?year=${year}`);
    const count = typeof result === 'number' ? result : 0;
    
    // Cache the result
    countCache.yearly.set(year, {
      value: count,
      timestamp: Date.now()
    });
    
    return count;
  } catch (error) {
    console.error(`Error fetching yearly consultation count for ${year}:`, error);
    
    // Check if we have a cached value to use as fallback
    const cachedData = countCache.yearly.get(year);
    if (cachedData) {
      console.log(`Using cached value due to error: ${cachedData.value}`);
      return cachedData.value;
    }
    
    return 0; // Return 0 as a fallback value
  }
};

/**
 * Updates an existing consultation record
 * @param {number} consultation_id - ID of consultation to update
 * @param {Partial<ConsultationRecord>} data - Fields to update
 * @returns {Promise<ConsultationRecord>} Updated consultation record
 */
export const updateConsultationRecord = async (consultation_id: number, data: Partial<ConsultationRecord>) => {
  return put(`${BASE_URL}/${consultation_id}`, data);
};

/**
 * Creates a new consultation record
 * @param {ConsultationRecord} data - Consultation data
 * @returns {Promise<ConsultationRecord>} Created consultation record
 */
export const createConsultationRecord = async (data: ConsultationRecord) => {
  return post(BASE_URL, data);
};

/**
 * Deletes a consultation record
 * @param {number} consultation_id - ID of consultation to delete
 * @returns {Promise<any>} Result of deletion operation
 */
export const deleteConsultationRecord = async (consultation_id: number) => {
  try {
    const result = await del(`${BASE_URL}/${consultation_id}`);
    console.log('Delete consultation result:', result);
    return result;
  } catch (error) {
    console.error('Error deleting consultation:', error);
    throw error;
  }
};

/**
 * Updates a consultation to indicate medication was administered
 * @param {number} consultation_id - ID of consultation
 * @returns {Promise<ConsultationRecord>} Updated consultation
 */
export const updateConsultationWithMedication = async (consultation_id: number) => {
  return put(`${BASE_URL}/${consultation_id}`, { medAdministration: true });
};

/**
 * Updates the doctorShow field for a consultation record
 * @param {number} consultation_id - ID of the consultation to update
 * @param {boolean} doctorShow - Whether to show the consultation to the doctor
 * @param {Object} patientData - Patient data required by the API
 * @returns {Promise<ConsultationRecord>} Updated consultation record
 */
export const updateDoctorShow = async (consultation_id: number, doctorShow: boolean = true, patientData = {}) => {
  return put(`${BASE_URL}/${consultation_id}`, { 
    doctorShow,
    ...patientData // Spread the patient data which should include patient_id and patient_name
  });
};

/**
 * Validates medication start and end dates
 * @param {string|Date} startDate - Medication start date
 * @param {string|Date} endDate - Medication end date
 * @returns {{valid: boolean, message: string}} Validation result
 */
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

/**
 * Fetches medication administration records for a consultation
 * @param {number} consultation_id - ID of the consultation
 * @returns {Promise<MedicationAdministration[]>} List of medication administrations
 */
export const fetchMedAdministrationRecords = async (consultation_id: number) => {
  return get(`${MED_ADMIN_URL}/consultation/${consultation_id}`);
};

/**
 * Creates a new medication administration record
 * @param {MedicationAdministration} data - Medication administration data
 * @returns {Promise<MedicationAdministration>} Created med administration
 */
export const createMedAdministrationRecord = async (data: MedicationAdministration) => {
  // Validate dates if they exist in the data
  if (data.start_date && data.end_date) {
    const validation = validateMedicationDates(data.start_date, data.end_date);
    if (!validation.valid) {
      throw new Error(validation.message);
    }
  }

  return post(MED_ADMIN_URL, data);
};

/**
 * Deletes a medication administration record
 * @param {number} med_administration_id - ID of the med administration to delete
 * @returns {Promise<any>} Result of deletion operation
 */
export const deleteMedAdministrationRecord = async (med_administration_id: number) => {
  return del(`${MED_ADMIN_URL}/${med_administration_id}`);
};

/**
 * Updates a medication administration record
 * @param {number} med_administration_id - ID of the med administration to update
 * @param {Partial<MedicationAdministration>} data - Data to update
 * @returns {Promise<MedicationAdministration>} Updated med administration
 */
export const updateMedAdministrationRecord = async (med_administration_id: number, data: Partial<MedicationAdministration>) => {
  // Validate dates if they exist in the data
  if (data.start_date && data.end_date) {
    const validation = validateMedicationDates(data.start_date, data.end_date);
    if (!validation.valid) {
      throw new Error(validation.message);
    }
  }

  return put(`${MED_ADMIN_URL}/${med_administration_id}`, data);
};

/**
 * Fetches all patients (formerly clients)
 * @returns {Promise<any>} List of patients
 */
export const fetchPeople = async () => {
  return get(PATIENT_URL);
};

/**
 * Fetches a specific patient by ID
 * @param {number} patientId - ID of the patient to fetch
 * @returns {Promise<any>} Patient data
 */
export const fetchPatientById = async (patientId: number) => {
  return get(`${PATIENT_URL}/${patientId}`);
};

/**
 * Fetches all medications from inventory
 * @returns {Promise<any>} List of medications
 */
export const fetchInventory = async () => {
  return get(INVENTORY_URL);
};

// Diagnosis-related endpoints

/**
 * Fetches all diseases/diagnoses
 * @returns {Promise<any>} List of diseases
 */
export const fetchDiseases = async () => {
  return get(DIAGNOSIS_URL);
};

/**
 * Fetches all disease categories
 * @returns {Promise<any>} List of disease categories
 */
export const fetchDiseaseCategories = async () => {
  return get(`${DIAGNOSIS_URL}/categories/all`);
};

/**
 * Creates a new disease
 * @param {any} data - Disease data
 * @returns {Promise<any>} Created disease
 */
export const createDisease = async (data: any) => {
  return post(DIAGNOSIS_URL, data);
};

/**
 * Updates an existing disease
 * @param {number} diagnosis_id - ID of the diagnosis to update
 * @param {any} data - Updated disease data
 * @returns {Promise<any>} Updated disease
 */
export const updateDisease = async (diagnosis_id: number, data: any) => {
  return put(`${DIAGNOSIS_URL}/${diagnosis_id}`, data);
};

/**
 * Deletes a disease
 * @param {number} diagnosis_id - ID of the diagnosis to delete
 * @returns {Promise<any>} Result of deletion operation
 */
export const deleteDisease = async (diagnosis_id: number) => {
  return del(`${DIAGNOSIS_URL}/${diagnosis_id}`);
};

/**
 * Links a diagnosis to a consultation
 * @param {number} consultation_id - ID of the consultation
 * @param {number} diagnosis_id - ID of the diagnosis to link
 * @returns {Promise<any>} Result of linking operation
 */
export const linkDiagnosisToConsultation = async (consultation_id: number, diagnosis_id: number) => {
  return post(`${BASE_URL}/${consultation_id}/diagnoses`, { diagnosis_id });
};

/**
 * Removes a diagnosis from a consultation
 * @param {number} consultation_id - ID of the consultation
 * @param {number} diagnosis_id - ID of the diagnosis to remove
 * @returns {Promise<any>} Result of removal operation
 */
export const removeDiagnosisFromConsultation = async (consultation_id: number, diagnosis_id: number) => {
  return del(`${BASE_URL}/${consultation_id}/diagnoses/${diagnosis_id}`);
};

/**
 * Creates a new disease category
 * @param {any} data - Category data
 * @returns {Promise<any>} Created category
 */
export const createDiseaseCategory = async (data: any) => {
  return post(`${DIAGNOSIS_URL}/categories`, data);
};

/**
 * Deletes a disease category
 * @param {number} category_id - ID of the category to delete
 * @returns {Promise<any>} Result of deletion operation
 */
export const deleteDiseaseCategory = async (category_id: number) => {
  return del(`${DIAGNOSIS_URL}/categories/${category_id}`);
};

/**
 * Toggles the active status of a diagnosis
 * @param {number} diagnosis_id - ID of the diagnosis to toggle
 * @returns {Promise<any>} Updated diagnosis with toggled status
 */
export const toggleDiagnosisStatus = async (diagnosis_id: number) => {
  return put(`${DIAGNOSIS_URL}/${diagnosis_id}/toggle-status`, {});
};

/**
 * Updates a disease category
 * @param {number} category_id - ID of the category to update
 * @param {any} data - Updated category data
 * @returns {Promise<any>} Updated category
 */
export const updateDiseaseCategory = async (category_id: number, data: any) => {
  return put(`${DIAGNOSIS_URL}/categories/${category_id}`, data);
};

// Appointment-related functions

/**
 * Fetches booked slots for a specific date
 * @param {Date} date - Date to check for booked slots
 * @returns {Promise<any>} List of booked time slots
 */
export const getBookedTimeSlots = async (date: Date) => {
  const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  return get(`${APPOINTMENT_URL}/booked-slots?date=${dateString}`);
};

/**
 * Updates the status of an appointment
 * @param {number} appointmentId - ID of the appointment to update
 * @param {string} status - New status ('pending', 'approved', 'rejected')
 * @param {string} notes - Optional notes about the status change
 * @returns {Promise<any>} Updated appointment data
 */
export const updateAppointmentStatus = async (appointmentId: number, status: string, notes?: string) => {
  try {
    // Validate status value
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      throw new Error('Invalid status value. Status must be pending, approved, or rejected.');
    }

    const result = await put(`${APPOINTMENT_URL}/${appointmentId}/status`, { status, notes });

    return result;
  } catch (error) {
    console.error(`Error updating appointment status:`, error);
    throw error;
  }
};

/**
 * Checks if a time slot is available
 * @param {Date} date - Date to check
 * @param {number} hour - Hour to check
 * @param {number} minute - Minute to check
 * @returns {Promise<boolean>} True if the slot is available
 */
interface TimeSlot {
  hour: number;
  minute: number;
}

export const isTimeSlotAvailable = async (date: Date, hour: number, minute: number) => {
  const bookedSlots = await getBookedTimeSlots(date);
  return !bookedSlots.some((slot: TimeSlot) => slot.hour === hour && slot.minute === minute);
};

/**
 * Creates a new appointment
 * @param {Object} appointmentData - Appointment data
 * @returns {Promise<any>} Created appointment
 */
export const createAppointment = async (appointmentData: any) => {
  return post(APPOINTMENT_URL, appointmentData);
};

/**
 * Deletes an appointment
 * @param {number} appointmentId - ID of the appointment to delete
 * @returns {Promise<any>} Result of deletion operation
 */
export const deleteAppointment = async (appointmentId: number) => {
  return del(`${APPOINTMENT_URL}/${appointmentId}`);
};

// Chief Complaint functions

/**
 * Fetches all chief complaints for a consultation
 * @param {number} consultation_id - ID of the consultation
 * @returns {Promise<ChiefComplaint[]>} List of chief complaints
 */
export const fetchChiefComplaints = async (consultation_id: number) => {
  return get(`${CHIEF_COMPLAINT_URL}/consultation/${consultation_id}`);
};

/**
 * Creates a new chief complaint
 * @param {ChiefComplaint} data - Chief complaint data
 * @returns {Promise<ChiefComplaint>} Created chief complaint
 */
export const createChiefComplaint = async (data: ChiefComplaint) => {
  return post(CHIEF_COMPLAINT_URL, data);
};

/**
 * Creates multiple chief complaints at once
 * @param {ChiefComplaint[]} data - Array of chief complaint data
 * @returns {Promise<ChiefComplaint[]>} Created chief complaints
 */
export const createManyChiefComplaints = async (data: ChiefComplaint[]) => {
  return post(`${CHIEF_COMPLAINT_URL}/bulk`, data);
};

/**
 * Updates a chief complaint
 * @param {number} chiefcomplaint_id - ID of the chief complaint to update
 * @param {Partial<ChiefComplaint>} data - Updated chief complaint data
 * @returns {Promise<ChiefComplaint>} Updated chief complaint
 */
export const updateChiefComplaint = async (chiefcomplaint_id: number, data: Partial<ChiefComplaint>) => {
  return put(`${CHIEF_COMPLAINT_URL}/${chiefcomplaint_id}`, { complaint: data.complaint });
};

/**
 * Deletes a chief complaint
 * @param {number} chiefcomplaint_id - ID of the chief complaint to delete
 * @returns {Promise<void>} No content
 */
export const deleteChiefComplaint = async (chiefcomplaint_id: number) => {
  return del(`${CHIEF_COMPLAINT_URL}/${chiefcomplaint_id}`);
};

/**
 * Deletes all chief complaints for a consultation
 * @param {number} consultation_id - ID of the consultation
 * @returns {Promise<void>} No content
 */
export const deleteAllChiefComplaints = async (consultation_id: number) => {
  return del(`${CHIEF_COMPLAINT_URL}/consultation/${consultation_id}`);
};

/**
 * Updates the medical data for a consultation record (doctor's evaluation)
 * @param {number} consultation_id - ID of the consultation to update
 * @param {MedicalData} medicalData - Medical data to save
 * @returns {Promise<any>} Updated consultation record with medical data
 */
export const updateConsultationMedicalData = async (consultation_id: number, medicalData: MedicalData) => {
  try {
    // Format the data payload for the API
    const payload = {
      medical_data: {
        ...medicalData,
        // Make sure patient demographic data is stored in the correct structure
        patientAge: medicalData.age,
        patientGender: medicalData.gender,
        updated_at: new Date().toISOString()
      },
      doctor_reviewed: true
    };
    
    // Call the API to update the consultation record
    return put(`${BASE_URL}/${consultation_id}/medical-data`, payload);
  } catch (error) {
    console.error('Error updating medical data:', error);
    throw error;
  }
};

/**
 * Notifies the nurse about a new medical record from the doctor
 * @param {number} consultation_id - ID of the consultation that was updated
 * @returns {Promise<any>} Notification result
 */
export const notifyNurseAboutMedicalRecord = async (consultation_id: number) => {
  try {
    // This endpoint would notify the nurse about the updated record
    return post(`${BASE_URL}/${consultation_id}/notify-nurse`, {
      message: 'New medical record available',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Even if notification fails, we don't want to block the UI flow
    console.warn('Failed to notify nurse, but medical record was saved:', error);
    // Return a resolved promise so the UI flow continues
    return Promise.resolve({ success: false, message: 'Notification failed but record was saved' });
  }
};

/**
 * Extracts medical data from a consultation record
 * This function provides a consistent way to access medical data that may be stored
 * in different formats or locations within the consultation record
 * @param {any} consultationRecord - Consultation record object
 * @returns {Object} Object containing all available medical data
 */
export const extractMedicalData = (consultationRecord: any) => {  // Default empty values
  const defaultData = {
    temperature: null,
    weight: null,
    height: null,
    blood_pressure: null,
    heart_rate: null,
    diagnosis: null,
    treatment: null,
    prescription: null,
    patientType: null,
    patientGrade: null,
    patientSection: null, 
    patientAge: null,
    patientGender: null
  };

  // If no record, return defaults
  if (!consultationRecord) {
    return defaultData;
  }
  // First try to get data from direct fields (from merged HealthRecord)
  const directData = {
    temperature: consultationRecord.temperature,
    weight: consultationRecord.weight,
    height: consultationRecord.height,
    blood_pressure: consultationRecord.blood_pressure,
    heart_rate: consultationRecord.heart_rate,
    treatment: consultationRecord.instructions,
    prescription: consultationRecord.doctor_prescription,
  };

  // Then check if we need to supplement with data from medical_data JSON
  if (consultationRecord.medical_data) {
    try {
      // If it's already a parsed object, use it directly
      const medicalData = typeof consultationRecord.medical_data === 'object' 
        ? consultationRecord.medical_data
        : JSON.parse(consultationRecord.medical_data);
          return {
        // Start with direct fields
        ...directData,
        // Fill in any missing values from JSON
        temperature: directData.temperature ?? medicalData.temperature ?? null,
        weight: directData.weight ?? medicalData.weight ?? null,
        height: directData.height ?? medicalData.height ?? null,
        blood_pressure: directData.blood_pressure ?? medicalData.blood_pressure ?? null,
        heart_rate: directData.heart_rate ?? medicalData.heart_rate ?? null,
        diagnosis: medicalData.diagnosis ?? consultationRecord.complaint ?? null,
        treatment: directData.treatment ?? medicalData.treatment ?? null,
        prescription: directData.prescription ?? medicalData.prescription ?? null,
        // Add patient details from medical_data
        patientType: medicalData.patientType ?? null,
        patientGrade: medicalData.patientGrade ?? null,
        patientSection: medicalData.patientSection ?? null, 
        patientAge: medicalData.patientAge ?? null,
        patientGender: medicalData.patientGender ?? null
      };
    } catch (error) {
      console.error('Error parsing medical_data:', error);
    }
  }
  
  // If medical_data JSON is not available or parsing failed,
  // return data from direct fields with defaults for missing fields
  return {
    ...defaultData,
    ...directData,
    diagnosis: consultationRecord.complaint || null,
  };
};

/**
 * Fetches prescription file data for a consultation
 * @param {number} consultation_id - ID of the consultation
 * @returns {Promise<any>} Prescription file data
 */
export const fetchPrescriptionFile = async (consultation_id: number) => {
  try {
    console.log(`Fetching prescription for consultation ID: ${consultation_id}`);
    // Use our new endpoint that looks up by consultation_id
    return await get(`/patient-files/prescription/by-consultation/${consultation_id}`);
  } catch (error) {
    console.error('Error fetching prescription file:', error);
    throw error;
  }
};

/**
 * Fetches prescription by consultation ID (alias for fetchPrescriptionFile)
 * @param {number} consultation_id - ID of the consultation
 * @returns {Promise<any>} Prescription file data
 */
// Removed fetchPrescriptionByConsultation - prescription data comes from consultation record doctor_prescription field

/**
 * Downloads prescription file content
 * @param {number} prescription_id - ID of the prescription
 * @returns {Promise<Blob>} Prescription file as blob
 */
export const downloadPrescriptionFile = async (prescription_id: number) => {
  try {
    // This endpoint returns the actual file content
    const response = await fetch(`${getBaseUrl()}/patient-files/prescription/${prescription_id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download prescription file: ${response.statusText}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Error downloading prescription file:', error);
    throw error;
  }
};

/**
 * Opens the prescription file in a new browser tab
 * @param {number} consultation_id - ID of the consultation to view prescription for
 * @returns {Promise<void>}
 */
export const viewPrescriptionFile = async (consultation_id: number) => {
  try {
    // First get the prescription info by consultation ID
    const prescriptionInfo = await fetchPrescriptionFile(consultation_id);
    
    if (!prescriptionInfo || !prescriptionInfo.prescription_id) {
      throw new Error('No prescription file found for this consultation');
    }
    
    console.log('Found prescription file:', prescriptionInfo);
    
    // Instead of directly opening a URL that would lose our auth token,
    // create a temporary anchor element with a download attribute
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('You must be logged in to view prescription files');
    }
    
    // Method 1: Create a proxy endpoint that generates a URL with embedded token
    // Create a hidden iframe to load the file with proper authentication
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Create a form inside the iframe that will POST to the prescription endpoint
    const form = document.createElement('form');
    form.method = 'POST';
    form.target = '_blank';
    form.action = `${getBaseUrl()}/patient-files/view-prescription/${prescriptionInfo.prescription_id}`;
    
    // Add token as a hidden field
    const tokenField = document.createElement('input');
    tokenField.type = 'hidden';
    tokenField.name = 'token';
    tokenField.value = token;
    form.appendChild(tokenField);
    
    // Append the form to the iframe's document and submit it
    iframe.onload = () => {
      if (iframe.contentDocument && iframe.contentDocument.body) {
        iframe.contentDocument.body.appendChild(form);
        form.submit();
        
        // Clean up after a short delay
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      } else {
        console.error('Cannot access iframe document or body');
        alert('Error displaying prescription file: Cannot access document');
      }
    };
    
    return prescriptionInfo;
  } catch (error: any) {
    console.error('Error viewing prescription file:', error);
    alert('Could not view prescription file: ' + (error.message || 'Unknown error'));
    throw error;
  }
}

// Helper function to get base URL (copy from apiService to avoid circular dependencies)
const getBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    if (currentHost === 'localhost') {
      return 'http://localhost:3001';
    }
    return `http://${currentHost}:3001`;
  }
  
  return 'http://10.35.133.169:3001';
};
