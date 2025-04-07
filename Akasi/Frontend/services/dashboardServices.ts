import { get, post, put, del, uploadFile } from './apiService.js';

// Base URLs for API endpoints
const ADMIN_URL = '/admins';
const CLIENT_URL = '/clients';
const MANAGER_URL = '/managers'; 
const BACKUP_URL = '/backup'; 

// Admin account management
export const fetchAdminAccounts = async () => {
  return await get(ADMIN_URL);
};

export const createAdminAccount = async (adminData: {
  username: string;
  password: string;
  gmail: string;
}) => {
  return await post(ADMIN_URL, adminData);
};

export const updateAdminAccount = async (
  adminId: number,
  adminData: {
    username: string;
    password?: string; // Optional for updates
    gmail: string;
  }
) => {
  return await put(`${ADMIN_URL}/${adminId}`, adminData);
};

export const deleteAdminAccount = async (adminId: number) => {
  return await del(`${ADMIN_URL}/${adminId}`);
};

// Client account management
export const fetchClientAccounts = async () => {
  return await get(CLIENT_URL);
};

export const createClientAccount = async (clientData: {
  username: string;
  password: string;
  name: string;
  gmail: string;
  age: number;
  gender: string;
  category: string;
  grade?: number;
  section: string;
  type?: string; // Add the type field
}) => {
  try {
    // Add default type if not provided
    if (!clientData.type) {
      clientData.type = 'Intern';
    }
    
    console.log('Creating client with data:', JSON.stringify(clientData, null, 2));
    return await post(CLIENT_URL, clientData);
  } catch (error) {
    console.error('Client creation failed with details:', error);
    // Check if age is being sent as a string instead of a number
    if (typeof clientData.age === 'string') {
      clientData.age = parseInt(clientData.age, 10);
      console.log('Converting age to number and retrying...');
      return await post(CLIENT_URL, clientData);
    }
    throw error;
  }
};

export const updateClientAccount = async (
  clientId: number,
  clientData: {
    username: string;
    password?: string; // Optional for updates
    name: string;
    gmail: string;
    age: number;
    gender: string;
    category: string;
    grade?: number;
    section: string;
    type?: string; // Add the type field
  }
) => {
  return await put(`${CLIENT_URL}/${clientId}`, clientData);
};

export const deleteClientAccount = async (clientId: number) => {
  return await del(`${CLIENT_URL}/${clientId}`);
};

// Manager account management
export const fetchManagerAccounts = async () => {
  return await get(MANAGER_URL);
};

export const createManagerAccount = async (managerData: {
  username: string;
  password: string;
  gmail: string;
}) => {
  return await post(MANAGER_URL, managerData);
};

export const updateManagerAccount = async (
  managerId: number,
  managerData: {
    username: string;
    password?: string; // Optional for updates
    gmail: string;
  }
) => {
  return await put(`${MANAGER_URL}/${managerId}`, managerData);
};

export const deleteManagerAccount = async (managerId: number) => {
  return await del(`${MANAGER_URL}/${managerId}`);
};

// Password hashing functionality
export const hashAllPasswords = async () => {
  return await post('/auth/hash-passwords', {});
}; // Fixed: Added missing closing brace

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
    const token = localStorage.getItem('authToken');
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

// Add these new functions
export const createFullBackup = async () => {
  return await post(`${BACKUP_URL}/create-all`, {});
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