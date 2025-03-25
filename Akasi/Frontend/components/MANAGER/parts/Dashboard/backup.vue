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
      <div class="w-16 h-16 mb-4 border-b-2 border-[#2f4a71] rounded-full animate-spin"></div>
      <p class="text-[#2f4a71]">{{ loadingMessage }}</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-8 md:grid-cols-2">
      <!-- Backup Section -->
      <div class="p-6 border rounded-lg shadow-sm">
        <h3 class="mb-4 text-xl font-semibold">Create Backup</h3>
        
        <!-- Model Selection -->
        <div>
          <h4 class="mb-2 font-medium">Select database models to backup:</h4>
          
          <div class="mb-4 overflow-y-auto max-h-60">
            <div v-for="model in availableModels" :key="model.name" class="flex items-center mb-2">
              <input 
                type="checkbox" 
                :id="`backup-${model.name}`" 
                v-model="model.selected"
                @change="handleModelSelection(model.name)"
                class="w-5 h-5 text-[#2f4a71] rounded border-gray-300 focus:ring-[#2f4a71]"
              >
              <label :for="`backup-${model.name}`" class="ml-2 text-gray-700">
                {{ model.name }}
              </label>
            </div>
          </div>
          <div class="flex items-center mb-6">
            <input 
              type="checkbox" 
              id="selectAllBackup" 
              v-model="selectAll"
              class="w-5 h-5 text-[#2f4a71] rounded border-gray-300 focus:ring-[#2f4a71]"
              @change="toggleSelectAll"
            >
            <label for="selectAllBackup" class="ml-2 text-sm font-medium text-gray-700">Select All</label>
          </div>
          <button 
            @click="createBackup" 
            :disabled="isLoading || !hasSelectedModels"
            :class="[
              'w-full px-4 py-2 text-white rounded-md',
              hasSelectedModels ? 'bg-[#2f4a71] hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
            ]"
          >
            <Icon v-if="!isBackingUp" icon="mdi:database-export" class="mr-2" />
            <span v-else class="inline-block w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></span>
            Create Backup
          </button>
        </div>
      </div>

      <!-- Restore Section -->
      <div class="p-6 border rounded-lg shadow-sm">
        <h3 class="mb-4 text-xl font-semibold">Restore Database</h3>
        <!-- Restoration Options -->
        <div>
          <h4 class="mb-2 font-medium">Select restore method:</h4>
          
          <div class="mb-6 space-y-3">
            <div class="flex items-center">
              <input 
                type="radio" 
                id="restoreFromFile" 
                v-model="restoreMethod" 
                value="file"
                class="w-5 h-5 text-[#2f4a71] border-gray-300 focus:ring-[#2f4a71]"
              >
              <label for="restoreFromFile" class="ml-2 text-sm font-medium text-gray-700">
                Upload backup file
              </label>
            </div>
            <div class="flex items-center">
              <input 
                type="radio" 
                id="restoreFromServer" 
                v-model="restoreMethod" 
                value="server"
                class="w-5 h-5 text-[#2f4a71] border-gray-300 focus:ring-[#2f4a71]">
              <label for="restoreFromServer" class="ml-2 text-sm font-medium text-gray-700">
                Restore from existing backup
              </label>
            </div>
          </div>

          <!-- File Upload -->
          <div v-if="restoreMethod === 'file'" class="mb-6">
            <label for="backupFile" class="block mb-2 text-sm font-medium text-gray-700">
              Select backup file (.json)
            </label>
            <input
              type="file"
              id="backupFile"
              accept=".json"
              @change="handleFileUpload"
              class="block w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-[#2f4a71] focus:border-[#2f4a71]"
            />
          </div>

          <!-- Server Backup Selection -->
          <div v-if="restoreMethod === 'server'" class="mb-6">
            <label for="serverBackup" class="block mb-2 text-sm font-medium text-gray-700">
              Select backup from server
            </label>
            <select
              id="serverBackup"
              v-model="selectedServerBackup"
              class="block w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-[#2f4a71] focus:border-[#2f4a71]"
              :disabled="!backups.length"
            >
              <option value="" disabled selected>Select a backup</option>
              <option 
                v-for="backup in backups" 
                :key="backup.filename" 
                :value="backup.filename"
              >
                {{ backup.filename }} ({{ formatDate(backup.date) }})
              </option>
            </select>
          </div>
          <!-- Warning and Confirmation -->
          <div class="p-3 mb-4 text-yellow-800 bg-yellow-100 border border-yellow-400 rounded">
            <p class="font-medium">Warning:</p>
            <p class="text-sm">Restoring will replace all current data in the selected models. This action cannot be undone.</p>
          </div>
          <div class="mb-4">
            <div class="flex items-center">
              <input 
                type="checkbox" 
                id="confirmRestore" 
                v-model="confirmRestore"
                class="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
              >
              <label for="confirmRestore" class="ml-2 text-sm font-medium text-gray-700">
                I understand this will overwrite existing data
              </label>
            </div>
          </div>
          <button 
            @click="restoreBackup" 
            :disabled="isLoading || !canRestore"
            :class="[
              'w-full px-4 py-2 text-white rounded-md',
              canRestore ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'
            ]"
          >
            <Icon v-if="!isRestoring" icon="mdi:database-import" class="mr-2" />
            <span v-else class="inline-block w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></span>
            Restore Database
          </button>
        </div>
      </div>
    </div>
    <!-- Previous Backups -->
    <div v-if="backups.length > 0" class="mt-8">
      <h3 class="mb-4 text-xl font-semibold">Previous Backups</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Filename</th>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Size</th>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Models</th>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="backup in backups" :key="backup.filename">
              <td class="px-6 py-4 whitespace-nowrap">{{ backup.filename }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ formatDate(backup.date) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ formatSize(backup.size) }}</td>
              <td class="px-6 py-4">
                <button 
                  @click="toggleModelsList(backup)"
                  class="text-blue-600 hover:text-blue-800"
                >
                  {{ expandedBackups.has(backup.filename) ? 'Hide Models' : 'Show Models' }}
                </button>
                <div v-if="expandedBackups.has(backup.filename)" class="mt-2 text-sm">
                  <span v-for="(model, index) in backup.models" :key="model">
                    {{ model }}{{ index < backup.models.length - 1 ? ', ' : '' }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm font-medium whitespace-nowrap">
                <button 
                  @click="downloadBackup(backup)" 
                  class="p-1 mr-2 text-indigo-600 hover:text-indigo-900"
                  title="Download backup file"
                >
                  <Icon icon="mdi:download" class="w-5 h-5" />
                </button>
                <button 
                  @click="exportToGoogleDrive(backup)"
                  class="mr-2 text-green-600 hover:text-green-900"
                  title="Export to Google Drive"
                >
                  <Icon icon="mdi:google-drive" class="w-5 h-5" />
                </button>
                <button
                  @click="deleteBackup(backup)"
                  class="text-red-600 hover:text-red-900"
                  title="Delete backup"
                >
                  <Icon icon="mdi:delete" class="w-5 h-5" />
                </button>
                <button
                  @click="selectBackupForRestore(backup)"
                  class="ml-2 text-blue-600 hover:text-blue-800"
                  title="Restore this backup"
                >
                  <Icon icon="mdi:database-import" class="w-5 h-5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Add this somewhere near your backup list -->
      <div class="mt-2 text-xs text-gray-500">
        <p><Icon icon="mdi:information-outline" class="inline w-4 h-4" /> Tip: To choose where to save backup files, right-click the download button and select "Save link as..."</p>
      </div>
      
      <!-- Google Drive Export Modal -->
      <div v-if="showDriveModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="p-6 bg-white rounded-lg shadow-lg w-96">
          <h3 class="mb-4 text-lg font-bold">Export to Google Drive</h3>
          
          <div v-if="isLoadingDrive" class="flex justify-center my-4">
            <div class="w-8 h-8 border-b-2 border-gray-600 rounded-full animate-spin"></div>
          </div>
          
          <div v-else>
            <div class="mb-4">
              <label class="block mb-1 text-sm font-medium text-gray-700">Select Folder</label>
              <select 
                v-model="selectedDriveFolder" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Root folder</option>
                <option v-for="folder in driveFolders" :key="folder.id" :value="folder.id">
                  {{ folder.name }}
                </option>
              </select>
            </div>
            
            <div class="mb-4">
              <button 
                @click="createNewFolder"
                class="text-sm text-blue-600 hover:text-blue-800"
              >
                Create new folder
              </button>
            </div>
            
            <div v-if="showNewFolderInput" class="mb-4">
              <label class="block mb-1 text-sm font-medium text-gray-700">New Folder Name</label>
              <input 
                v-model="newFolderName" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div class="flex mt-2 space-x-2">
                <button 
                  @click="confirmCreateFolder"
                  class="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Create
                </button>
                <button 
                  @click="showNewFolderInput = false"
                  class="px-3 py-1 text-sm text-gray-800 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end mt-4 space-x-3">
            <button 
              @click="confirmExportToDrive"
              class="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
              :disabled="isLoadingDrive"
            >
              Export
            </button>
            <button 
              @click="closeDriveModal"
              class="px-4 py-2 text-gray-800 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
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
  createDriveFolder
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
const selectAll = ref(false);
const expandedBackups = ref(new Set());
const uploadedFile = ref(null);
const restoreMethod = ref('server');
const selectedServerBackup = ref('');
const confirmRestore = ref(false);

// Available models based on your Prisma schema
const availableModels = ref([
  { name: 'manager', selected: false },
  { name: 'admin', selected: false },
  { name: 'client', selected: false },
  { name: 'consultation_records', selected: false },
  { name: 'diagnosis', selected: false },
  { name: 'diagnosis_category', selected: false },
  { name: 'consultation_diagnosis', selected: false },
  { name: 'inventory', selected: false },
  { name: 'medicineCategory', selected: false },
  { name: 'equipment', selected: false },
  { name: 'EditsInverntory', selected: false },
  { name: 'medAdministration', selected: false },
  { name: 'dental_certificates', selected: false },
  { name: 'medical_certificates', selected: false },
  { name: 'opthal_certificates', selected: false },
  { name: 'physical_exam', selected: false },
  { name: 'appointment', selected: false },
  { name: 'HSU_bulletin', selected: false },
  { name: 'HSU_bulletin_files', selected: false },
]);

// Add this to your script setup section, after the availableModels definition
const modelDependencies = {
  admin: [
    'consultation_records', 
    'consultation_diagnosis',
    'HSU_bulletin', 
    'HSU_bulletin_files', 
    'medAdministration', 
    'diagnosis'
  ],
  client: [
    'consultation_records', 
    'consultation_diagnosis',
    'medAdministration', 
    'dental_certificates', 
    'medical_certificates', 
    'opthal_certificates', 
    'physical_exam', 
    'appointment'
  ],
  manager: []
};

// Computed properties
const hasSelectedModels = computed(() => {
  return availableModels.value.some(model => model.selected);
});

const canRestore = computed(() => {
  if (!confirmRestore.value) return false;
  
  if (restoreMethod.value === 'file') {
    return !!uploadedFile.value;
  } else {
    return !!selectedServerBackup.value;
  }
});

// Methods
const toggleSelectAll = () => {
  availableModels.value.forEach(model => {
    model.selected = selectAll.value;
  });
};

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

const createBackup = async () => {
  try {
    isLoading.value = true;
    isBackingUp.value = true;
    loadingMessage.value = 'Creating backup...';
    errorMessage.value = '';
    successMessage.value = '';
    
    const selectedModels = availableModels.value
      .filter(model => model.selected)
      .map(model => model.name);
    
    if (selectedModels.length === 0) {
      errorMessage.value = 'Please select at least one model to backup';
      return;
    }
    
    // Use the service instead of direct fetch
    const result = await createBackupService(selectedModels);
    successMessage.value = 'Backup created successfully';
    
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

const fetchBackups = async () => {
  try {
    isLoading.value = true;
    loadingMessage.value = 'Loading backups...';
    
    // Use the service instead of direct fetch
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
    
    // Use the updated service
    await downloadBackupService(filename);
    
    successMessage.value = 'Download initiated. If prompted, choose where to save the file.';
    
    // Auto-clear the success message after 5 seconds
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
  
  // Scroll to restore section
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
      // Upload file and restore from it
      if (!uploadedFile.value) {
        throw new Error('Please select a backup file');
      }
      
      result = await restoreFromUploadService(uploadedFile.value);
    } else {
      // Restore from existing backup on server
      if (!selectedServerBackup.value) {
        throw new Error('Please select a backup to restore');
      }
      
      result = await restoreFromServerService(selectedServerBackup.value);
    }
    
    successMessage.value = 'Database restored successfully';
    // Notify other components that restoration is complete
    emitBackupRestored();
    
    // Reset form
    uploadedFile.value = null;
    selectedServerBackup.value = '';
    confirmRestore.value = false;
    
    if (document.getElementById('backupFile')) {
      document.getElementById('backupFile').value = '';
    }
    
    // Auto-clear the success message after 5 seconds
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
    
    // Use the service instead of direct fetch
    await deleteBackupService(backup.filename);
    
    successMessage.value = 'Backup deleted successfully';
    
    // If the deleted backup was selected for restore, reset selection
    if (selectedServerBackup.value === backup.filename) {
      selectedServerBackup.value = '';
    }
    
    // Refresh backup list
    await fetchBackups();
    
    // Auto-clear the success message after 5 seconds
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

// Add this method to handle model selection with dependencies
const handleModelSelection = (modelName) => {
  const model = availableModels.value.find(m => m.name === modelName);
  
  // If this is admin, client, or manager and it's being selected
  if (['admin', 'client', 'manager'].includes(modelName) && model.selected) {
    // Auto-select dependent models
    if (modelDependencies[modelName]) {
      modelDependencies[modelName].forEach(dependentModel => {
        const dependent = availableModels.value.find(m => m.name === dependentModel);
        if (dependent) dependent.selected = true;
      });
    }
  }
  
  // Update selectAll status
  selectAll.value = availableModels.value.every(model => model.selected);
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

// Google Drive integration
const showDriveModal = ref(false);
const selectedBackup = ref(null);
const selectedDriveFolder = ref('');
const driveFolders = ref([]);
const isLoadingDrive = ref(false);
const showNewFolderInput = ref(false);
const newFolderName = ref('');

const exportToGoogleDrive = async (backup) => {
  selectedBackup.value = backup;
  showDriveModal.value = true;
  
  // Load folders from Google Drive
  try {
    isLoadingDrive.value = true;
    driveFolders.value = await listDriveFolders();
  } catch (error) {
    errorMessage.value = `Error loading Google Drive folders: ${error.message}`;
  } finally {
    isLoadingDrive.value = false;
  }
};

const closeDriveModal = () => {
  showDriveModal.value = false;
  selectedBackup.value = null;
  selectedDriveFolder.value = '';
  showNewFolderInput.value = false;
  newFolderName.value = '';
};

const createNewFolder = () => {
  showNewFolderInput.value = true;
};

const confirmCreateFolder = async () => {
  if (!newFolderName.value.trim()) {
    errorMessage.value = "Please enter a folder name";
    return;
  }
  
  try {
    isLoadingDrive.value = true;
    const folder = await createDriveFolder(newFolderName.value);
    
    // Add new folder to the list and select it
    driveFolders.value.push(folder);
    selectedDriveFolder.value = folder.id;
    
    // Reset UI
    showNewFolderInput.value = false;
    newFolderName.value = '';
    
  } catch (error) {
    errorMessage.value = `Error creating folder: ${error.message}`;
  } finally {
    isLoadingDrive.value = false;
  }
};

const confirmExportToDrive = async () => {
  if (!selectedBackup.value) return;
  
  try {
    isLoadingDrive.value = true;
    errorMessage.value = '';
    successMessage.value = '';
    
    const result = await exportBackupToDrive(
      selectedBackup.value.filename, 
      selectedDriveFolder.value || undefined
    );
    
    successMessage.value = `Backup exported to Google Drive successfully. View at: ${result.driveLink}`;
    closeDriveModal();
    
  } catch (error) {
    errorMessage.value = `Error exporting to Google Drive: ${error.message}`;
  } finally {
    isLoadingDrive.value = false;
  }
};

// Lifecycle hooks
onMounted(() => {
  fetchBackups();
});
</script>