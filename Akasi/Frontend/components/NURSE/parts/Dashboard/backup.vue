<template>
  <div class="p-6 bg-white rounded-lg shadow">
    <h2 class="mb-6 text-2xl font-bold text-[#2f4a71]">Database Backup & Restore</h2>

    <!-- Network Status Banner -->
    <div v-if="!isOnline" class="flex items-center p-3 mb-4 border rounded text-amber-700 bg-amber-100 border-amber-400">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>You are currently offline. Some features are unavailable until you reconnect.</span>
    </div>

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
        <p class="mb-4 text-gray-600">Create a backup of your entire database or selected patient groups.</p>
        
        <div class="flex flex-col space-y-4">
          <!-- Backup Options -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div class="flex items-center mb-3">
                <input 
                  type="checkbox" 
                  id="includeUploads" 
                  v-model="backupOptions.includeUploads" 
                  class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label for="includeUploads" class="ml-2 text-sm font-medium text-gray-700">
                  Include uploaded files
                </label>
              </div>
              
              <div class="mt-3">
                <label class="block mb-2 text-sm font-medium text-gray-700" for="customDestination">
                  Custom Backup Location (optional)
                </label>
                <div class="flex gap-2">
                  <input
                    type="text"
                    id="customDestination"
                    v-model="backupOptions.customDestination"
                    placeholder="C:/Backups"
                    class="w-full px-3 py-2 text-sm leading-tight text-gray-700 border rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    @click="openDirectoryDialog"
                    class="px-3 py-1 text-white bg-gray-500 rounded hover:bg-gray-600"
                    title="Browse for folder"
                  >
                    <Icon icon="mdi:folder-open" />
                  </button>
                </div>
                <p class="mt-1 text-xs text-gray-500">
                  Leave empty to use the default server backup location
                </p>
              </div>
            </div>
            
            <div class="flex flex-col justify-end">
              <div class="flex gap-2">
                <button 
                  @click="createFullBackupHandler" 
                  class="px-4 py-2 text-white transition-colors rounded bg-[#2f4a71] hover:bg-[#1d3050] disabled:bg-gray-400 disabled:cursor-not-allowed"
                  :disabled="isBackingUp || !isOnline"
                >
                  <span v-if="isBackingUp">Creating Backup...</span>
                  <span v-else>Create Full Backup</span>
                </button>
                
                <button 
                  @click="showSelectiveBackupModal = true"
                  class="px-4 py-2 text-white transition-colors rounded bg-[#4a71a0] hover:bg-[#3a5175] disabled:bg-gray-400 disabled:cursor-not-allowed"
                  :disabled="isBackingUp || !isOnline"
                >
                  Selective Backup
                </button>
              </div>
            </div>
          </div>
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
            accept=".zip"
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
          :disabled="!canRestore || isRestoring || !isOnline"
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
        </div>
        
        <div class="flex justify-between col-span-2 mt-2">
          <button
            type="button"
            @click="saveAutoConfig"
            class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            :disabled="!isOnline"
          >
            Save Settings
          </button>
          <button
            type="button"
            @click="toggleBackupState"
            class="px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
            :class="isBackupRunning ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'"
            :disabled="!isOnline"
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
                  :disabled="!isOnline"
                >
                  Download
                </button>
                <button 
                  @click="exportToGoogleDrive(backup)" 
                  class="px-2 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                  :disabled="!isOnline"
                >
                  To Drive
                </button>
                <button 
                  @click="selectBackupForRestore(backup)" 
                  class="px-2 py-1 text-xs text-white rounded bg-amber-500 hover:bg-amber-600"
                  :disabled="!isOnline"
                >
                  Restore
                </button>
                <button 
                  @click="deleteBackup(backup)" 
                  class="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                  :disabled="!isOnline"
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
            :disabled="isLoadingDrive || !autoConfig.driveFolderId || !isOnline"
          >
            Export
          </button>
        </div>
      </div>
    </div>

    <!-- Selective Backup Modal -->
    <div v-if="showSelectiveBackupModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="w-full max-w-lg p-6 bg-white rounded-lg shadow-xl">
        <h3 class="mb-4 text-xl font-bold">Selective Backup</h3>
        
        <div v-if="isSelectiveBackupLoading" class="flex flex-col items-center my-4">
          <div class="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-[#2f4a71]"></div>
          <p class="mt-3 text-gray-600">Creating backup...</p>
        </div>
        
        <div v-else>
          <p class="mb-4">Select which patient data you want to include in the backup:</p>
          
          <div class="grid grid-cols-1 gap-4 mb-5">
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">Backup Type</label>
              <div class="flex flex-col space-y-3">
                <label class="flex items-center">
                  <input type="radio" v-model="selectiveBackupType" value="grade" class="mr-2">
                  Specific Grade Level
                </label>
                <label class="flex items-center">
                  <input type="radio" v-model="selectiveBackupType" value="division" class="mr-2">
                  Specific Division
                </label>
                <label class="flex items-center">
                  <input type="radio" v-model="selectiveBackupType" value="schoolyear" class="mr-2">
                  Specific School Year
                </label>
              </div>
            </div>
            
            <!-- Grade Level Selection -->
            <div v-if="selectiveBackupType === 'grade'" class="mb-4">
              <label class="block mb-2 text-sm font-medium text-gray-700">Select Grade Level</label>
              <select 
                v-model="selectedGradeLevel"
                class="w-full p-2 border rounded"
              >
                <option value="">-- Select a grade level --</option>
                <option v-for="grade in availableGrades" :key="grade" :value="grade">
                  Grade {{ grade }}
                </option>
              </select>
            </div>
            
            <!-- Division Selection -->
            <div v-if="selectiveBackupType === 'division'" class="mb-4">
              <label class="block mb-2 text-sm font-medium text-gray-700">Enter Division Name</label>
              <input
                type="text"
                v-model="selectedDivision"
                placeholder="Enter division name exactly"
                class="w-full p-2 border rounded"
              />
            </div>

            <!-- School Year Selection -->
            <div v-if="selectiveBackupType === 'schoolyear'" class="mb-4">
              <label class="block mb-2 text-sm font-medium text-gray-700">Select School Year</label>
              <select 
                v-model="selectedSchoolYear"
                class="w-full p-2 border rounded"
              >
                <option value="">-- Select a school year --</option>
                <option v-for="year in availableSchoolYears" :key="year" :value="year">
                  {{ year }}
                </option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <button 
            @click="closeSelectiveBackupModal"
            class="px-4 py-2 text-gray-700 transition-colors bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button 
            @click="createSelectiveBackup"
            class="px-4 py-2 text-white transition-colors rounded bg-[#2f4a71] hover:bg-[#1d3050]"
            :disabled="isSelectiveBackupLoading || 
                     (selectiveBackupType === 'grade' && !selectedGradeLevel) || 
                     (selectiveBackupType === 'division' && !selectedDivision) || 
                     (selectiveBackupType === 'schoolyear' && !selectedSchoolYear) || 
                     !isOnline"
          >
            Create Backup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
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
  createFullBackup,
  getAutoBackupConfig,
  updateAutoBackupConfig as updateAutoBackupConfigService,
  runBackupNow as runBackupNowService
} from '../../../../services/dashboardServices';
import { useBackupEvents } from '../../../../composables/useBackupEvents';

// Network status tracking
const isOnline = ref(navigator.onLine);
const wasOffline = ref(false);
const hasCachedData = ref(false);

// Track if initial load has completed
const isInitialLoadComplete = ref(false);

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
const isBackupRunning = ref(false);

// Backup options
const backupOptions = ref({
  includeUploads: true,
  customDestination: ''
});

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
  driveFolderId: '11b0xQ1To345xbGr6saObsC4FmevhpfJD',
  retention: 7
});
const driveFolders = ref([]);

// Update network status handler
const updateOnlineStatus = () => {
  wasOffline.value = !isOnline.value && wasOffline.value;
  isOnline.value = navigator.onLine;
  
  // If we're back online and were previously offline, refresh data
  if (isOnline.value && wasOffline.value) {
    loadPageData();
    wasOffline.value = false;
  }
};

// Load data with offline fallback
const loadPageData = async () => {
  // Reset error state
  errorMessage.value = '';
  
  if (!isOnline.value) {
    // If offline but we have cached data, don't show error
    if (!hasCachedData.value) {
      errorMessage.value = "You're offline. Limited functionality is available. Connect to the internet for full access.";
    }
    return;
  }
  
  try {
    isLoading.value = true;
    loadingMessage.value = 'Loading backup information...';
    
    // Load backups first (most important)
    await fetchBackups();
    hasCachedData.value = backups.value.length > 0;
    
    // Then load config (second priority)
    await loadAutoConfig();
    
    // Load drive folders only when needed
    isInitialLoadComplete.value = true;
  } catch (error) {
    console.error('Error loading page data:', error);
    errorMessage.value = `Failed to load data: ${error.message}`;
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
};

// Fetch backups with offline caching support
const fetchBackups = async () => {
  try {
    if (!isOnline.value) {
      // If offline, use cached backups from localStorage if available
      const cachedBackups = localStorage.getItem('cachedBackups');
      if (cachedBackups) {
        backups.value = JSON.parse(cachedBackups).filter(b => b.filename.endsWith('.zip'));
        return;
      }
      throw new Error('No cached backup data available while offline');
    }
    isLoading.value = true;
    loadingMessage.value = 'Loading backups...';
    backups.value = (await listBackupsService()).filter(b => b.filename.endsWith('.zip'));
    // Cache the backups in localStorage
    localStorage.setItem('cachedBackups', JSON.stringify(backups.value));
  } catch (error) {
    if (!isOnline.value) {
      errorMessage.value = 'You are currently offline. Backup list is unavailable.';
    } else {
      errorMessage.value = `Error: ${error.message}`;
      console.error('Error fetching backups:', error);
    }
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
};

// Modified loadAutoConfig with caching
const loadAutoConfig = async () => {
  try {
    if (!isOnline.value) {
      // If offline, use cached config from localStorage if available
      const cachedConfig = localStorage.getItem('cachedBackupConfig');
      if (cachedConfig) {
        autoConfig.value = JSON.parse(cachedConfig);
        return;
      }
      return; // Just use default config if no cached version exists
    }
    
    isLoading.value = true;
    const config = await getAutoBackupConfig();
    autoConfig.value = config;
    
    // Cache the config in localStorage
    localStorage.setItem('cachedBackupConfig', JSON.stringify(config));
    
  } catch (error) {
    console.error('Error loading auto config:', error);
    // Don't show errors for config loading - it's not critical
  } finally {
    isLoading.value = false;
  }
};

// Directory dialog handler for custom backup location
const openDirectoryDialog = async () => {
  try {
    // Using Electron's dialog if available (in desktop environment)
    if (window.electron) {
      const result = await window.electron.showDirectoryPicker();
      if (result) {
        backupOptions.value.customDestination = result;
      }
    } else {
      // Fallback for browser environment - show a guide message
      alert("To select a custom backup location, please enter the full path manually. Example: C:/Backups");
    }
  } catch (error) {
    console.error('Error opening directory dialog:', error);
  }
};

// Methods for manual backup
const createFullBackupHandler = async () => {
  if (!isOnline.value) {
    errorMessage.value = "Can't create backups while offline. Please reconnect to the internet.";
    return;
  }
  
  try {
    isBackingUp.value = true;
    loadingMessage.value = 'Creating full system backup...';
    
    // Pass the backup options to the service
    const result = await createFullBackup({
      includeUploads: backupOptions.value.includeUploads,
      customDestination: backupOptions.value.customDestination || undefined
    });
    
    let successMsg = `Backup created successfully! Filename: ${result.filename}`;
    
    // If uploads were backed up, add that information
    if (result.uploadsBackup && result.uploadsBackup.success) {
      successMsg += ` and uploads backup: ${result.uploadsBackup.filename}`;
    }
    
    // If using custom destination, mention it
    if (backupOptions.value.customDestination) {
      successMsg += ` (saved to ${backupOptions.value.customDestination})`;
    }
    
    successMessage.value = successMsg;
    await fetchBackups();
  } catch (error) {
    console.error('Error creating backup:', error);
    errorMessage.value = `Failed to create backup: ${error.message}`;
  } finally {
    isBackingUp.value = false;
    loadingMessage.value = '';
  }
};

// Methods for auto backup configuration
const saveAutoConfig = async () => {
  if (!isOnline.value) {
    errorMessage.value = "Can't save settings while offline. Please reconnect to the internet.";
    return;
  }
  
  try {
    isLoading.value = true;
    loadingMessage.value = 'Saving backup configuration...';
    
    const result = await updateAutoBackupConfigService(autoConfig.value);
    successMessage.value = 'Backup configuration saved successfully!';
    
    autoConfig.value = result;
  } catch (error) {
    errorMessage.value = `Error: ${error.message}`;
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
};

const toggleBackupState = async () => {
  if (!isOnline.value) {
    errorMessage.value = "Can't run backups while offline. Please reconnect to the internet.";
    return;
  }
  
  try {
    isBackupRunning.value = true;
    loadingMessage.value = 'Running backup now...';
    
    const result = await runBackupNowService();
    
    if (result.success) {
      successMessage.value = 'Backup completed successfully!';
      await fetchBackups();
    } else {
      errorMessage.value = result.message || 'Backup failed';
    }
  } catch (error) {
    console.error('Error running backup:', error);
    errorMessage.value = `Failed to run backup: ${error.message}`;
  } finally {
    isBackupRunning.value = false;
    loadingMessage.value = '';
  }
};

// Methods for Google Drive
const loadDriveFolders = async () => {
  try {
    isLoadingDrive.value = true;
    const folders = await listDriveFolders();
    driveFolders.value = folders;
  } catch (error) {
    errorMessage.value = `Failed to load Google Drive folders: ${error.message}`;
  } finally {
    isLoadingDrive.value = false;
  }
};

// Add the existing methods
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
  if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
    errorMessage.value = 'Please upload a valid ZIP backup file';
    uploadedFile.value = null;
    event.target.value = '';
    return;
  }
  uploadedFile.value = file;
  errorMessage.value = '';
};

const downloadBackup = async (backup) => {
  if (!isOnline.value) {
    errorMessage.value = "This feature requires an internet connection. Please reconnect and try again.";
    return;
  }
  
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
  if (!isOnline.value) {
    errorMessage.value = "Can't restore backups while offline. Please reconnect to the internet.";
    return;
  }
  
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
  if (!isOnline.value) {
    errorMessage.value = "Can't delete backups while offline. Please reconnect to the internet.";
    return;
  }
  
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
  if (!isOnline.value) {
    errorMessage.value = "This feature requires an internet connection. Please reconnect and try again.";
    return;
  }
  
  selectedBackup.value = backup;
  showDriveModal.value = true;
  
  if (driveFolders.value.length === 0) {
    try {
      isLoadingDrive.value = true;
      await loadDriveFolders();
    } catch (error) {
      errorMessage.value = `Failed to load Google Drive folders: ${error.message}`;
    } finally {
      isLoadingDrive.value = false;
    }
  }
  
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

// Selective backup state variables
const showSelectiveBackupModal = ref(false);
const selectiveBackupType = ref('grade');
const selectedGradeLevel = ref('');
const selectedDivision = ref('');
const selectedSchoolYear = ref('');
const isSelectiveBackupLoading = ref(false);
const availableGrades = ref([7, 8, 9, 10, 11, 12]);
const availableSchoolYears = ref(['2024-2025']);

const closeSelectiveBackupModal = () => {
  showSelectiveBackupModal.value = false;
  selectiveBackupType.value = 'grade';
  selectedGradeLevel.value = '';
  selectedDivision.value = '';
  selectedSchoolYear.value = '';
};

const createSelectiveBackup = async () => {
  if (!isOnline.value) {
    errorMessage.value = "Can't create backups while offline. Please reconnect to the internet.";
    return;
  }
  try {
    isSelectiveBackupLoading.value = true;
    loadingMessage.value = 'Creating selective backup...';
    let result;
    if (selectiveBackupType.value === 'grade') {
      if (!selectedGradeLevel.value) {
        errorMessage.value = 'Please select a grade level';
        return;
      }
      result = await createGradeBackup(Number(selectedGradeLevel.value));
    } else if (selectiveBackupType.value === 'division') {
      if (!selectedDivision.value) {
        errorMessage.value = 'Please enter a division name';
        return;
      }
      result = await createDivisionBackup(selectedDivision.value);
    } else if (selectiveBackupType.value === 'schoolyear') {
      if (!selectedSchoolYear.value) {
        errorMessage.value = 'Please select a school year';
        return;
      }
      result = await createSchoolYearBackup(selectedSchoolYear.value);
    }
    successMessage.value = `Selective backup created successfully! Filename: ${result.filename}`;
    await fetchBackups();
    closeSelectiveBackupModal();
  } catch (error) {
    console.error('Error creating selective backup:', error);
    errorMessage.value = `Failed to create selective backup: ${error.message}`;
  } finally {
    isSelectiveBackupLoading.value = false;
    loadingMessage.value = '';
  }
};

// Lifecycle hooks
onMounted(() => {
  // Add network status event listeners
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Initial check if we're online
  updateOnlineStatus();
  
  // Load data
  loadPageData();
});

onUnmounted(() => {
  // Remove event listeners
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
});

// Watch for online status changes to update UI
watch(isOnline, (newValue) => {
  if (newValue) {
    // We're back online - clear offline error messages
    if (errorMessage.value && errorMessage.value.includes('offline')) {
      errorMessage.value = '';
    }
  } else {
    // We're offline - set wasOffline flag for refresh when back online
    wasOffline.value = true;
  }
});

</script>