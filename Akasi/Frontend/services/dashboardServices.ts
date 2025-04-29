import { get, post, put, del, uploadFile } from './apiService.js';

// Base URLs for API endpoints
const DOCTOR_URL = '/doctor';
const PATIENT_URL = '/patients';  // Changed from '/patient' to '/patients' to match backend controller
const NURSE_URL = '/nurse'; 
const BACKUP_URL = '/backup'; 

// Doctor account management
export const fetchDoctorAccounts = async () => {
  return await get(DOCTOR_URL);
};

export const createDoctorAccount = async (doctorData: {
  username: string;
  password: string;
  gmail: string;
  name: string;
}) => {
  try {
    console.log('Creating doctor with data:', JSON.stringify(doctorData, null, 2));
    return await post(DOCTOR_URL, doctorData);
  } catch (error) {
    console.error('Doctor creation failed with details:', error);
    throw error;
  }
};

export const updateDoctorAccount = async (
  doctorId: number,
  doctorData: {
    username: string;
    password?: string; // Optional for updates
    gmail: string;
    name: string;
  }
) => {
  return await put(`${DOCTOR_URL}/${doctorId}`, doctorData);
};

export const deleteDoctorAccount = async (doctorId: number) => {
  return await del(`${DOCTOR_URL}/${doctorId}`);
};

// Patient account management
export const fetchPatientAccounts = async () => {
  return await get(PATIENT_URL);
};

export const createPatientAccount = async (patientData: {
  username: string;
  password: string;
  name: string;
  gmail: string;
  age: number;
  gender: string;
  type: string; // 'student', 'faculty', 'staff', 'other'
  civil_status: string; // 'single', 'married', 'widowed', 'separated'
  address: string;
  division?: string;
  position?: string;
  grade?: number;
  section?: string;
  category?: string; // Additional category info (Intern, Extern)
  status?: string; // 'pending', 'complete', 'ongoing', 'rejected'
}) => {
  try {
    console.log('Creating patient with data:', JSON.stringify(patientData, null, 2));
    return await post(PATIENT_URL, patientData);
  } catch (error) {
    console.error('Patient creation failed with details:', error);
    // Check if age is being sent as a string instead of a number
    if (typeof patientData.age === 'string') {
      patientData.age = parseInt(patientData.age, 10);
      console.log('Converting age to number and retrying...');
      return await post(PATIENT_URL, patientData);
    }
    throw error;
  }
};

export const updatePatientAccount = async (
  patientId: number,
  patientData: {
    username: string;
    password?: string; // Optional for updates
    name: string;
    gmail: string;
    age: number;
    gender: string;
    type: string;
    civil_status: string;
    address: string;
    division?: string;
    position?: string;
    grade?: number;
    section?: string;
    category?: string;
  }
) => {
  return await put(`${PATIENT_URL}/${patientId}`, patientData);
};

export const deletePatientAccount = async (patientId: number) => {
  return await del(`${PATIENT_URL}/${patientId}`);
};

// Nurse account management
export const fetchNurseAccounts = async () => {
  return await get(NURSE_URL);
};

export const createNurseAccount = async (nurseData: {
  username: string;
  password: string;
  gmail: string;
  name: string;
}) => {
  return await post(NURSE_URL, nurseData);
};

export const updateNurseAccount = async (
  nurseId: number,
  nurseData: {
    username: string;
    password?: string; // Optional for updates
    gmail: string;
    name: string;
  }
) => {
  return await put(`${NURSE_URL}/${nurseId}`, nurseData);
};

export const deleteNurseAccount = async (nurseId: number) => {
  return await del(`${NURSE_URL}/${nurseId}`);
};

// Password hashing functionality
export const hashAllPasswords = async () => {
  return await post('/auth/hash-passwords', {});
};

// Backup management functions
export const createBackup = async (models: string[]) => {
  return await post(`${BACKUP_URL}/create`, { models });
};

export const listBackups = async () => {
  return await get(`${BACKUP_URL}/list`);
};

export const downloadBackup = async (filename: string) => {
  try {
    // Get auth token for authorization
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    
    // Build full URL with base
    const url = `${baseUrl}${BACKUP_URL}/download/${filename}`;
    
    console.log('Downloading backup from:', url);
    
    // Open the download in a new tab/window to allow save dialog
    window.open(url, '_blank');
    
    return true;
  } catch (error) {
    console.error(`Error downloading backup:`, error);
    throw error;
  }
};

export const deleteBackup = async (filename: string) => {
  return await del(`${BACKUP_URL}/delete/${filename}`);
};

export const restoreFromServer = async (filename: string) => {
  return await post(`${BACKUP_URL}/restore/server`, { filename });
};

export const restoreFromUpload = async (backupFile: File) => {
  const formData = new FormData();
  formData.append('backupFile', backupFile);
  
  try {
    return await uploadFile(`${BACKUP_URL}/restore/upload`, formData);
  } catch (error) {
    console.error(`Error restoring from upload:`, error);
    throw error;
  }
};

export const exportBackupToDrive = async (filename: string, folderId?: string) => {
  try {
    return await post(`${BACKUP_URL}/export-to-drive/${filename}`, { driveFolder: folderId });
  } catch (error) {
    console.error(`Error exporting backup to Google Drive:`, error);
    throw error;
  }
};

export const listDriveFolders = async () => {
  try {
    return await get(`${BACKUP_URL}/drive-folders`);
  } catch (error) {
    console.error(`Error listing Google Drive folders:`, error);
    throw error;
  }
};

export const createDriveFolder = async (folderName: string) => {
  try {
    return await post(`${BACKUP_URL}/drive-folders`, { name: folderName });
  } catch (error) {
    console.error(`Error creating Google Drive folder:`, error);
    throw error;
  }
};

// Full backup functionality
export const createFullBackup = async (options?: { 
  includeUploads?: boolean,
  customDestination?: string 
}) => {
  return await post(`${BACKUP_URL}/create-all`, options || {});
};

export const getAutoBackupConfig = async () => {
  return await get(`${BACKUP_URL}/auto-config`);
};

// Interface for auto backup configuration
export interface AutoBackupConfig {
  enabled: boolean;
  frequency: string;
  time?: string;
  retentionDays?: number;
  backupToCloud?: boolean;
  driveFolderId?: string;
  includedModels?: string[];
}

export const updateAutoBackupConfig = async (config: AutoBackupConfig): Promise<any> => {
  return await put(`${BACKUP_URL}/auto-config`, config);
};

export const runBackupNow = async () => {
  return await post(`${BACKUP_URL}/run-now`, {});
};

export const createGradeBackup = async (gradeLevel: number) => {
  return await post(`${BACKUP_URL}/create-grade`, { gradeLevel });
};

export const createDivisionBackup = async (division: string) => {
  return await post(`${BACKUP_URL}/create-division`, { division });
};