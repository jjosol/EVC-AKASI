import { get, post, put, del } from './apiService.js';

const BASE_URL = '/consultation-records';
const MED_ADMIN_URL = '/med-administration';
const PATIENT_URL = '/patients'; // Updated to use patients (plural) instead of patient
const INVENTORY_URL = '/medicine'; // Updated to use medicine instead of inventory
const DIAGNOSIS_URL = '/diagnoses'; // Updated to use diagnoses (plural) instead of diagnosis
const APPOINTMENT_URL = '/add-appointment'; // Added appointment URL
const CHIEF_COMPLAINT_URL = '/chief-complaint'; // Added chief complaint URL

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

interface ChiefComplaint {
  chiefcomplaint_id?: number;
  consultation_id: number;
  complaint: string;
}

/**
 * Fetches all consultation records
 * @returns {Promise<ConsultationRecord[]>} List of consultations
 */
export const fetchConsultationRecords = async () => {
  return get(BASE_URL);
};

/**
 * Fetches a specific consultation record
 * @param {number} consultation_id - ID of the consultation to fetch
 * @returns {Promise<ConsultationRecord>} Consultation record
 */
export const fetchConsultationRecord = async (consultation_id: number) => {
  return get(`${BASE_URL}/${consultation_id}`);
};

/**
 * Fetches count of consultation records for specific month/year
 * @param {number} year - Year to count
 * @param {number} month - Month to count (0-11)
 * @returns {Promise<number>} Count of consultations
 */
export const fetchConsultationRecordsCount = async (year: number, month: number) => {
  return get(`${BASE_URL}/count?year=${year}&month=${month}`);
};

/**
 * Fetches count of confined consultation records for specific month/year
 * @param {number} year - Year to count
 * @param {number} month - Month to count (0-11)
 * @returns {Promise<number>} Count of consultations
 */
export const fetchConfinedConsultationRecordsCount = async (year: number, month: number) => {
  return get(`${BASE_URL}/count?year=${year}&month=${month}&confined=true`);
};

/**
 * Fetches count of yearly consultation records
 * @param {number} year - Year to count
 * @returns {Promise<number>} Count of consultations for the year
 */
export const fetchYearlyConsultationCount = async (year: number) => {
  return get(`${BASE_URL}/year-count?year=${year}`);
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
  return del(`${BASE_URL}/${consultation_id}/delete`);
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
 * @returns {Promise<ConsultationRecord>} Updated consultation record
 */
export const updateDoctorShow = async (consultation_id: number, doctorShow: boolean = true) => {
  return put(`${BASE_URL}/${consultation_id}`, { doctorShow });
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
