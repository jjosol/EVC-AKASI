<template>
  <div class="p-6 bg-white rounded-lg shadow">
    <h2 class="mb-6 text-2xl font-bold text-[#2f4a71]">Database Backup & Restore</h2>

    <!-- Status Messages -->
    <div v-if="successMessage" class="p-3 mb-4 text-green-700 bg-green-100 border border-green-400 rounded">
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="p-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
      {{ errorMessage }}
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-8">
      <div class="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#2f4a71]"></div>
      <p class="mt-4 text-gray-600">{{ loadingMessage }}</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-8 md:grid-cols-2">
      <!-- Manual Backup Section -->
      <div class="p-5 border rounded-lg shadow-sm">
        <h3 class="mb-4 text-xl font-semibold text-[#2f4a71]">Manual Backup</h3>
        <p class="mb-4 text-gray-600">Create a backup of your entire database with one click.</p>
        
        <div class="flex flex-col space-y-4">
          <button 
            @click="createFullBackupHandler" 
            class="px-4 py-2 text-white transition-colors rounded bg-[#2f4a71] hover:bg-[#1d3050] disabled:bg-gray-400 disabled:cursor-not-allowed"
            :disabled="isBackingUp"
          >
            <span v-if="isBackingUp">Creating Backup...</span>
            <span v-else>Create Full Backup</span>
          </button>
        </div>
      </div>

      <!-- Restore Section -->
      <div class="p-5 border rounded-lg shadow-sm">
        <h3 class="mb-4 text-xl font-semibold text-[#2f4a71]">Restore Database</h3>
        
        <div class="mb-4">
          <label class="block mb-2 text-sm font-medium text-gray-700">Restore Method</label>
          <div class="flex gap-4">
            <label class="flex items-center">
              <input type="radio" v-model="restoreMethod" value="server" class="mr-2">
              From Server Backup
            </label>
            <label class="flex items-center">
              <input type="radio" v-model="restoreMethod" value="file" class="mr-2">
              Upload Backup File
            </label>
          </div>
        </div>

        <!-- Restore from server backup -->
        <div v-if="restoreMethod === 'server'" class="mb-4">
          <label class="block mb-2 text-sm font-medium text-gray-700">Select Backup</label>
          <select 
            v-model="selectedServerBackup" 
            class="w-full p-2 border rounded"
            id="restoreFromServer"
          >
            <option value="">-- Select a backup --</option>
            <option v-for="backup in backups" :key="backup.filename" :value="backup.filename">
              {{ backup.filename }} ({{ formatDate(backup.date) }})
            </option>
          </select>
        </div>

        <!-- Restore from uploaded file -->
        <div v-else class="mb-4">
          <label class="block mb-2 text-sm font-medium text-gray-700">Upload Backup File</label>
          <input 
            type="file"
            id="backupFile"
            @change="handleFileUpload"
            accept=".json"
            class="w-full p-2 border rounded"
          >
        </div>

        <!-- Confirm warning -->
        <div class="mb-4">
          <label class="flex items-center text-sm text-red-600">
            <input type="checkbox" v-model="confirmRestore" class="mr-2">
            I understand this will replace existing data
          </label>
        </div>

        <button 
          @click="restoreBackup" 
          class="px-4 py-2 text-white transition-colors rounded bg-[#2f4a71] hover:bg-[#1d3050] disabled:bg-gray-400 disabled:cursor-not-allowed"
          :disabled="!canRestore || isRestoring"
        >
          <span v-if="isRestoring">Restoring...</span>
          <span v-else>Restore Database</span>
        </button>
      </div>
    </div>

    <!-- Automatic Backup Settings -->
    <div class="p-5 mt-8 border rounded-lg shadow-sm">
      <h3 class="mb-4 text-xl font-semibold">Automatic Backup Settings</h3>
      
      <!-- Settings form -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="col-span-2">
          <div class="flex items-center mb-4">
            <input 
              type="checkbox" 
              id="enableBackup" 
              v-model="autoConfig.enabled" 
              class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label for="enableBackup" class="ml-2 text-sm font-medium text-gray-700">Enable automatic backups</label>
          </div>
        </div>
        
        <div>
          <label for="frequency" class="block text-sm font-medium text-gray-700">Frequency</label>
          <select 
            id="frequency" 
            v-model="autoConfig.frequency" 
            class="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            :disabled="!autoConfig.enabled"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        
        <div>
          <label for="backupTime" class="block text-sm font-medium text-gray-700">Time (24h format)</label>
          <input 
            type="time" 
            id="backupTime" 
            v-model="autoConfig.time" 
            class="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            :disabled="!autoConfig.enabled"
          />
        </div>
        
        <div>
          <label for="retention" class="block text-sm font-medium text-gray-700">Keep backups for (days)</label>
          <input 
            type="number" 
            id="retention" 
            v-model="autoConfig.retention" 
            min="1" 
            max="90" 
            class="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            :disabled="!autoConfig.enabled"
          />
        </div>
        
        <!-- Google Drive Integration -->
        <div class="col-span-2 p-4 mt-2 border border-gray-200 rounded-md bg-gray-50">
          <!-- <div class="flex items-center mb-3">
            <h4 class="font-medium text-gray-700 text-md">Google Drive Integration</h4>
            <span class="px-2 py-1 ml-2 text-xs font-medium text-white bg-blue-500 rounded-full">Recommended</span>
          </div> -->
<!--           
          <p class="mb-3 text-sm text-gray-600">
            Store your backups securely in Google Drive. 
            <strong class="font-medium">How to setup:</strong>
          </p> -->
          
          <!-- <ol class="mb-4 ml-5 text-sm text-gray-600 list-decimal">
            <li class="mb-1">Go to <a href="https://drive.google.com" target="_blank" class="text-blue-600 underline">Google Drive</a></li>
            <li class="mb-1">Create a folder for your backups</li>
            <li class="mb-1">Right-click on the folder and select "Get link"</li>
            <li class="mb-1">Copy the ID from the URL (the long string between /folders/ and ?)</li>
            <li class="mb-1">Paste that ID in the field below</li>
          </ol>
           -->
          <div class="mb-4">
            <label for="driveFolderId" class="block mb-1 text-sm font-medium text-gray-700">Google Drive Folder ID</label>
            <input 
              type="text" 
              id="driveFolderId" 
              v-model="autoConfig.driveFolderId" 
              class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="1AbCdEfGhIjKlMnOpQrStUvWxYz"
              :disabled="!autoConfig.enabled"
            />
          </div>
          
          <!-- <p class="text-xs italic text-gray-500">
            Example folder URL: https://drive.google.com/drive/folders/<strong>1AbCdEfGhIjKlMnOpQrStUvWxYz</strong>?usp=sharing
          </p> -->
        </div>
        
        <div class="flex justify-between col-span-2 mt-2">
          <button
            type="button"
            @click="saveAutoConfig"
            class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Settings
          </button>
          <button
            type="button"
            @click="toggleBackupState"
            class="px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
            :class="isBackupRunning ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'"
          >
            {{ isBackupRunning ? 'Pause Backup' : 'Run Backup Now' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Previous Backups -->
    <div v-if="backups.length > 0" class="mt-8">
      <h3 class="mb-4 text-xl font-semibold text-[#2f4a71]">Previous Backups</h3>
      
      <div class="overflow-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="text-left text-gray-700 bg-gray-100">
              <th class="p-2">Filename</th>
              <th class="p-2">Date</th>
              <th class="p-2">Size</th>
              <th class="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="backup in backups" :key="backup.filename" class="border-b hover:bg-gray-50">
              <td class="p-2">
                <div>{{ backup.filename }}</div>
                <button 
                  @click="toggleModelsList(backup)" 
                  class="text-xs text-blue-500 underline hover:text-blue-700"
                >
                  {{ expandedBackups.has(backup.filename) ? 'Hide Models' : 'Show Models' }}
                </button>
                <div v-if="expandedBackups.has(backup.filename)" class="pl-4 mt-1 text-xs text-gray-500">
                  <div v-for="(model, index) in backup.models" :key="index">
                    • {{ model }}
                  </div>
                </div>
              </td>
              <td class="p-2">{{ formatDate(backup.date) }}</td>
              <td class="p-2">{{ formatSize(backup.size) }}</td>
              <td class="flex justify-end gap-2 p-2">
                <button 
                  @click="downloadBackup(backup)" 
                  class="px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                  Download
                </button>
                <button 
                  @click="exportToGoogleDrive(backup)" 
                  class="px-2 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                >
                  To Drive
                </button>
                <button 
                  @click="selectBackupForRestore(backup)" 
                  class="px-2 py-1 text-xs text-white rounded bg-amber-500 hover:bg-amber-600"
                >
                  Restore
                </button>
                <button 
                  @click="deleteBackup(backup)" 
                  class="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Google Drive Modal -->
    <div v-if="showDriveModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <h3 class="mb-4 text-xl font-bold">Export to Google Drive</h3>
        
        <div v-if="isLoadingDrive" class="flex justify-center my-4">
          <div class="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-[#2f4a71]"></div>
        </div>
        
        <div v-else>
          <p class="mb-4">Export <strong>{{ selectedBackup?.filename }}</strong> to your configured Google Drive folder</p>
          
          <div v-if="!autoConfig.driveFolderId" class="p-3 mb-3 border rounded text-amber-700 bg-amber-100 border-amber-400">
            <strong>No Google Drive folder configured.</strong> Please set up a Google Drive folder ID in the Automatic Backup Settings section.
          </div>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <button 
            @click="closeDriveModal" 
            class="px-4 py-2 text-gray-700 transition-colors bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button 
            @click="confirmExportToDrive" 
            class="px-4 py-2 text-white transition-colors rounded bg-[#2f4a71] hover:bg-[#1d3050]"
            :disabled="isLoadingDrive || !autoConfig.driveFolderId"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  createBackup as createBackupService, 
  listBackups as listBackupsService,
  downloadBackup as downloadBackupService,
  deleteBackup as deleteBackupService,
  restoreFromServer as restoreFromServerService,
  restoreFromUpload as restoreFromUploadService,
  exportBackupToDrive,
  listDriveFolders,
  createDriveFolder,
  // Import the new functions
  createFullBackup,
  getAutoBackupConfig,
  updateAutoBackupConfig as updateAutoBackupConfigService,
  runBackupNow as runBackupNowService
} from '../../../../services/dashboardServices';
import { useBackupEvents } from '../../../../composables/useBackupEvents';

// State
const isLoading = ref(false);
const isBackingUp = ref(false);
const isRestoring = ref(false);
const loadingMessage = ref('');
const successMessage = ref('');
const errorMessage = ref('');
const backups = ref([]);
const expandedBackups = ref(new Set());
const uploadedFile = ref(null);
const restoreMethod = ref('server');
const selectedServerBackup = ref('');
const confirmRestore = ref(false);
const isBackupRunning = ref(false); // Add this state

// Computed properties
const canRestore = computed(() => {
  if (!confirmRestore.value) return false;
  
  if (restoreMethod.value === 'file') {
    return !!uploadedFile.value;
  } else {
    return !!selectedServerBackup.value;
  }
});

// New auto backup config state
const autoConfig = ref({
  enabled: false,
  frequency: 'daily',
  time: '03:00',
  driveFolderId: '11b0xQ1To345xbGr6saObsC4FmevhpfJD',  // ← REPLACE THIS WITH YOUR FOLDER ID
  retention: 7
});
const driveFolders = ref([]);

// Methods for manual backup
const createFullBackupHandler = async () => {
  try {
    isLoading.value = true;
    isBackingUp.value = true;
    loadingMessage.value = 'Creating full backup...';
    errorMessage.value = '';
    successMessage.value = '';
    
    const data = await createFullBackup();
    successMessage.value = 'Full backup created successfully';
    
    // Refresh backup list
    await fetchBackups();
    
    // Auto-clear the success message after 5 seconds
    setTimeout(() => {
      successMessage.value = '';
    }, 5000);
    
  } catch (error) {
    errorMessage.value = `Error: ${error.message}`;
    console.error('Error creating backup:', error);
  } finally {
    isLoading.value = false;
    isBackingUp.value = false;
    loadingMessage.value = '';
  }
};

// Methods for auto backup configuration
const loadAutoConfig = async () => {
  try {
    isLoading.value = true;
    loadingMessage.value = 'Loading auto backup settings...';
    
    const config = await getAutoBackupConfig();
    autoConfig.value = config;
    
  } catch (error) {
    console.error('Error loading auto backup settings:', error);
    errorMessage.value = `Error: ${error.message}`;
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
};

const saveAutoConfig = async () => {
  try {
    isLoading.value = true;
    loadingMessage.value = 'Saving auto backup settings...';
    errorMessage.value = '';
    
    const updatedConfig = await updateAutoBackupConfigService(autoConfig.value);
    autoConfig.value = updatedConfig;
    successMessage.value = 'Auto backup settings saved successfully';
    
    // Auto-clear the success message after 5 seconds
    setTimeout(() => {
      successMessage.value = '';
    }, 5000);
    
  } catch (error) {
    console.error('Error saving auto backup settings:', error);
    errorMessage.value = `Error: ${error.message}`;
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
};

const runBackupNow = async () => {
  await toggleBackupState();
};

// Methods for Google Drive
const loadDriveFolders = async () => {
  try {
    isLoading.value = true;
    loadingMessage.value = 'Loading Google Drive folders...';
    
    driveFolders.value = await listDriveFolders();
    
  } catch (error) {
    console.error('Error loading Google Drive folders:', error);
    errorMessage.value = `Error: ${error.message}`;
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
};

// Add the existing methods back
const toggleModelsList = (backup) => {
  if (expandedBackups.value.has(backup.filename)) {
    expandedBackups.value.delete(backup.filename);
  } else {
    expandedBackups.value.add(backup.filename);
  }
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) {
    uploadedFile.value = null;
    return;
  }
  
  // Validate file type
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    errorMessage.value = 'Please upload a valid JSON backup file';
    uploadedFile.value = null;
    event.target.value = '';
    return;
  }
  
  uploadedFile.value = file;
  errorMessage.value = '';
};

const fetchBackups = async () => {
  try {
    isLoading.value = true;
    loadingMessage.value = 'Loading backups...';
    
    backups.value = await listBackupsService();
    
  } catch (error) {
    errorMessage.value = `Error: ${error.message}`;
    console.error('Error fetching backups:', error);
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
};

const downloadBackup = async (backup) => {
  try {
    isLoading.value = true;
    loadingMessage.value = 'Preparing download...';
    
    const filename = backup.filename;
    console.log('Attempting to download backup:', filename);
    
    await downloadBackupService(filename);
    
    successMessage.value = 'Download initiated. If prompted, choose where to save the file.';
    
    setTimeout(() => {
      successMessage.value = '';
    }, 5000);
    
  } catch (error) {
    errorMessage.value = `Error downloading backup: ${error.message}`;
    console.error('Error downloading backup:', error);
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
};

const selectBackupForRestore = (backup) => {
  restoreMethod.value = 'server';
  selectedServerBackup.value = backup.filename;
  
  document.getElementById('restoreFromServer').scrollIntoView({ behavior: 'smooth' });
};

const { emitBackupRestored } = useBackupEvents();

const restoreBackup = async () => {
  if (!confirmRestore.value) {
    errorMessage.value = 'Please confirm that you understand the risks of restoring data';
    return;
  }
  
  try {
    isLoading.value = true;
    isRestoring.value = true;
    loadingMessage.value = 'Restoring database...';
    errorMessage.value = '';
    successMessage.value = '';
    
    let result;
    
    if (restoreMethod.value === 'file') {
      result = await restoreFromUploadService(uploadedFile.value);
    } else {
      result = await restoreFromServerService(selectedServerBackup.value);
    }
    
    successMessage.value = 'Database restored successfully';
    emitBackupRestored();
    
    uploadedFile.value = null;
    selectedServerBackup.value = '';
    confirmRestore.value = false;
    
    if (document.getElementById('backupFile')) {
      document.getElementById('backupFile').value = '';
    }
    
    setTimeout(() => {
      successMessage.value = '';
    }, 5000);
    
  } catch (error) {
    errorMessage.value = `Error: ${error.message}`;
    console.error('Error restoring backup:', error);
  } finally {
    isLoading.value = false;
    isRestoring.value = false;
    loadingMessage.value = '';
  }
};

const deleteBackup = async (backup) => {
  if (!confirm(`Are you sure you want to delete the backup "${backup.filename}"?`)) {
    return;
  }
  
  try {
    isLoading.value = true;
    loadingMessage.value = 'Deleting backup...';
    
    await deleteBackupService(backup.filename);
    
    successMessage.value = 'Backup deleted successfully';
    
    if (selectedServerBackup.value === backup.filename) {
      selectedServerBackup.value = '';
    }
    
    // Additionally delete from Google Drive
    if (autoConfig.value.driveFolderId) {
      try {
        // Get file ID from Drive (you'd need to store this when uploading)
        const driveFileId = getBackupDriveFileId(backup.filename);
        if (driveFileId) {
          await googleDriveService.deleteFile(driveFileId);
          console.log(`Deleted old backup from Google Drive: ${backup.filename}`);
        }
      } catch (error) {
        console.error(`Failed to delete backup from Drive: ${backup.filename}`, error);
      }
    }
    
    await fetchBackups();
    
    setTimeout(() => {
      successMessage.value = '';
    }, 5000);
    
  } catch (error) {
    errorMessage.value = `Error: ${error.message}`;
    console.error('Error deleting backup:', error);
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
};

// Google Drive modal functions
const showDriveModal = ref(false);
const selectedBackup = ref(null);
const selectedDriveFolder = ref('');
const isLoadingDrive = ref(false);
const showNewFolderInput = ref(false);
const newFolderName = ref('');

const exportToGoogleDrive = async (backup) => {
  selectedBackup.value = backup;
  showDriveModal.value = true;
  
  if (!autoConfig.value.driveFolderId) {
    errorMessage.value = "Please configure a Google Drive Folder ID in settings first";
  }
};

const closeDriveModal = () => {
  showDriveModal.value = false;
  selectedBackup.value = null;
  selectedDriveFolder.value = '';
  showNewFolderInput.value = false;
  newFolderName.value = '';
};

const confirmExportToDrive = async () => {
  if (!selectedBackup.value || !autoConfig.value.driveFolderId) return;
  
  try {
    isLoadingDrive.value = true;
    
    const result = await exportBackupToDrive(
      selectedBackup.value.filename, 
      autoConfig.value.driveFolderId
    );
    
    closeDriveModal();
    successMessage.value = `Backup exported to Google Drive successfully`;
    
    setTimeout(() => {
      successMessage.value = '';
    }, 5000);
    
  } catch (error) {
    errorMessage.value = `Error exporting to Google Drive: ${error.message}`;
  } finally {
    isLoadingDrive.value = false;
  }
};

// Add toggle function for the backup state
const toggleBackupState = async () => {
  if (isBackupRunning.value) {
    // If running, pause it
    isBackupRunning.value = false;
    successMessage.value = "Backup system paused";
  } else {
    // If not running, start it
    try {
      isLoading.value = true;
      loadingMessage.value = 'Running backup now...';
      errorMessage.value = '';
      
      const data = await runBackupNowService();
      isBackupRunning.value = true;
      successMessage.value = 'Backup started successfully';
      
      // Refresh backup list
      await fetchBackups();
      
      // Auto-clear the success message after 5 seconds
      setTimeout(() => {
        successMessage.value = '';
      }, 5000);
      
    } catch (error) {
      console.error('Error running backup:', error);
      errorMessage.value = `Error: ${error.message}`;
    } finally {
      isLoading.value = false;
      loadingMessage.value = '';
    }
  }
};

// Helper functions
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

const formatSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Lifecycle hooks
onMounted(() => {
  fetchBackups();
  loadDriveFolders();
  loadAutoConfig();
});

</script>