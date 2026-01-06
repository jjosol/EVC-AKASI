<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { 
  fetchNurseAccounts, 
  fetchPatientAccounts, 
  fetchDoctorAccounts,
  createNurseAccount, 
  createPatientAccount,
  createDoctorAccount,
  updateNurseAccount,
  updatePatientAccount,
  updateDoctorAccount,
  deleteNurseAccount,
  deletePatientAccount,
  deleteDoctorAccount,
  hashAllPasswords
} from '~/services/dashboardServices';
import { useBackupEvents } from '../../../../composables/useBackupEvents';
import * as XLSX from 'xlsx'; 

// Tabs state
const activeTab = ref('admins'); // 'admins' = nurses, 'clients' = patients, 'managers' = doctors

// CRUD state
const showCreateModal = ref(false);
const showEditModal = ref(false);
const selectedAccount = ref(null);
const isLoading = ref(false);
const searchQuery = ref('');

// Data lists
const adminAccounts = ref([]);  // Nurse accounts
const clientAccounts = ref([]);  // Patient accounts
const managerAccounts = ref([]);  // Doctor accounts

// New account form with all fields from the schema
const newAccount = ref({
  username: '',
  password: '',
  gmail: '',
  name: '',
  age: null,
  gender: '',
  type: '', // 'student', 'faculty', 'staff', 'other'
  civil_status: '', // 'single', 'married', 'widowed', 'separated'
  address: '',
  division: '',
  position: '',
  grade: null,
  section: '',
  category: ''
});

// Error handling
const errorMessage = ref('');
const successMessage = ref('');

// Form validation
const validateForm = (account, isClient = false) => {
  // Reset error message
  errorMessage.value = '';
  
  // Basic validation for required fields
  if (!account.username || !account.gmail) {
    errorMessage.value = 'Username and email are required';
    return false;
  }
  
  // Password is required for new accounts
  if (!selectedAccount.value && !account.password) {
    errorMessage.value = 'Password is required for new accounts';
    return false;
  }

  // Password length validation
  if (account.password && account.password.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters long';
    return false;
  }
  
  // Additional client validation
  if (isClient) {
    if (!account.name) {
      errorMessage.value = 'Name is required for client accounts';
      return false;
    }
    if (!account.age || account.age < 1) {
      errorMessage.value = 'Valid age is required for client accounts';
      return false;
    }
    if (!account.gender) {
      errorMessage.value = 'Gender is required for client accounts';
      return false;
    }
    if (!account.category) {
      errorMessage.value = 'Category is required for client accounts';
      return false;
    }
    if (!account.section) {
      errorMessage.value = 'Section is required for client accounts';
      return false;
    }
    if (!account.type) {
      errorMessage.value = 'Type is required for client accounts';
      return false;
    }
  }
  
  return true;
};

// API functions
const loadAdminAccounts = async () => {
  try {
    isLoading.value = true;
    adminAccounts.value = await fetchNurseAccounts();
  } catch (error) {
    errorMessage.value = `Error: ${error.message}`;
    console.error('Error fetching nurse accounts:', error);
  } finally {
    isLoading.value = false;
  }
};

const loadClientAccounts = async () => {
  try {
    isLoading.value = true;
    clientAccounts.value = await fetchPatientAccounts();
  } catch (error) {
    errorMessage.value = `Error: ${error.message}`;
    console.error('Error fetching patient accounts:', error);
  } finally {
    isLoading.value = false;
  }
};

// Add this function after loadClientAccounts
const loadManagerAccounts = async () => {
  try {
    isLoading.value = true;
    managerAccounts.value = await fetchDoctorAccounts();
  } catch (error) {
    errorMessage.value = `Error: ${error.message}`;
    console.error('Error fetching doctor accounts:', error);
  } finally {
    isLoading.value = false;
  }
};

const createAccount = async (isClient = false, isManager = false) => {
  if (!validateForm(newAccount.value, isClient)) return;
  
  try {
    isLoading.value = true;
    
    if (isClient) {
      await createPatientAccount(newAccount.value);
      successMessage.value = 'Patient account created successfully';
      await loadClientAccounts();
    } else if (isManager) {
      await createDoctorAccount(newAccount.value);
      successMessage.value = 'Doctor account created successfully';
      await loadManagerAccounts();
    } else {
      await createNurseAccount(newAccount.value);
      successMessage.value = 'Nurse account created successfully';
      await loadAdminAccounts();
    }
    
    showCreateModal.value = false;
    resetForm();
    
  } catch (error) {
    errorMessage.value = `Error: ${error.message}`;
    console.error(`Error creating account:`, error);
  } finally {
    isLoading.value = false;
  }
};

const updateAccount = async (isClient = false, isManager = false) => {
  if (!validateForm(selectedAccount.value, isClient)) return;
  try {
    isLoading.value = true;
    if (isClient) {
      // Only send allowed patient fields
      const {
        username, name, gmail, age, gender, type, civil_status, address, division, position, grade, section, category, password
      } = selectedAccount.value;
      const patientData = {
        username, name, gmail, age, gender, type, civil_status, address, division, position, grade, section, category
      };
      if (password && password.trim() !== '') patientData.password = password;
      await updatePatientAccount(
        selectedAccount.value.patient_id || selectedAccount.value.client_id,
        patientData
      );
      successMessage.value = 'Patient account updated successfully';
      await loadClientAccounts();
    } else if (isManager) {
      // Only send allowed doctor fields
      const { username, gmail, name, password } = selectedAccount.value;
      const doctorData = { username, gmail, name };
      if (password && password.trim() !== '') doctorData.password = password;
      await updateDoctorAccount(
        selectedAccount.value.doctor_id || selectedAccount.value.manager_id,
        doctorData
      );
      successMessage.value = 'Doctor account updated successfully';
      await loadManagerAccounts();
    } else {
      // Only send allowed nurse fields
      const { username, gmail, name, password } = selectedAccount.value;
      const nurseData = { username, gmail, name };
      if (password && password.trim() !== '') nurseData.password = password;
      await updateNurseAccount(
        selectedAccount.value.nurse_id || selectedAccount.value.admin_id,
        nurseData
      );
      successMessage.value = 'Nurse account updated successfully';
      await loadAdminAccounts();
    }
    showEditModal.value = false;
    selectedAccount.value = null;
  } catch (error) {
    errorMessage.value = `Error: ${error.message}`;
    console.error(`Error updating account:`, error);
  } finally {
    isLoading.value = false;
  }
};

const removeAccount = async (account, isClient = false, isManager = false) => {
  if (!confirm(`Are you sure you want to delete this ${isClient ? 'patient' : isManager ? 'doctor' : 'nurse'} account?`)) {
    return;
  }
  
  try {
    isLoading.value = true;
    
    if (isClient) {
      await deletePatientAccount(account.patient_id || account.client_id);
      successMessage.value = 'Patient account deleted successfully';
      await loadClientAccounts();
    } else if (isManager) {
      await deleteDoctorAccount(account.doctor_id || account.manager_id);
      successMessage.value = 'Doctor account deleted successfully';
      await loadManagerAccounts();
    } else {
      await deleteNurseAccount(account.nurse_id || account.admin_id);
      successMessage.value = 'Nurse account deleted successfully';
      await loadAdminAccounts();
    }
    
  } catch (error) {
    errorMessage.value = `Error: ${error.message}`;
    console.error(`Error deleting account:`, error);
  } finally {
    isLoading.value = false;
  }
};

// Add a new state for hash passwords operation
const isHashingPasswords = ref(false);
const hashPasswordsStatus = ref('');

// Function to hash all passwords
const hashAllAccountPasswords = async () => {
  if (!confirm('Are you sure you want to hash all unhashed passwords in the system? This operation cannot be undone.')) {
    return;
  }
  
  try {
    isHashingPasswords.value = true;
    hashPasswordsStatus.value = 'Hashing passwords...';
    
    // Get all accounts using existing dashboard services
    const allAdmins = await fetchNurseAccounts();
    const allClients = await fetchPatientAccounts();
    const allManagers = await fetchDoctorAccounts();
    
    let successCount = 0;
    let skippedCount = 0;
    
    // Process admin accounts
    for (const admin of allAdmins) {
      // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
      if (admin.password && !admin.password.startsWith('$2')) {
        // Browser-side hashing with Web Crypto API
        const encoder = new TextEncoder();
        const data = encoder.encode(admin.password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedPassword = '$2b$10$' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        // Update the admin account
        await updateNurseAccount(admin.nurse_id || admin.admin_id, { 
          ...admin, 
          password: hashedPassword 
        });
        successCount++;
      } else {
        skippedCount++;
      }
    }
    
    // Process client accounts - same pattern
    for (const client of allClients) {
      if (client.password && !client.password.startsWith('$2')) {
        const encoder = new TextEncoder();
        const data = encoder.encode(client.password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedPassword = '$2b$10$' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        await updatePatientAccount(client.patient_id || client.client_id, {
          ...client,
          password: hashedPassword
        });
        successCount++;
      } else {
        skippedCount++;
      }
    }
    
    // Process manager accounts - same pattern
    for (const manager of allManagers) {
      if (manager.password && !manager.password.startsWith('$2')) {
        const encoder = new TextEncoder();
        const data = encoder.encode(manager.password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashedPassword = '$2b$10$' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        await updateDoctorAccount(manager.doctor_id || manager.manager_id, {
          ...manager,
          password: hashedPassword
        });
        successCount++;
      } else {
        skippedCount++;
      }
    }
    
    hashPasswordsStatus.value = `Success: Hashed ${successCount} passwords, ${skippedCount} already hashed.`;
    successMessage.value = 'Password hashing complete';
    
    // Refresh the accounts lists
    await loadAdminAccounts();
    await loadClientAccounts();
    await loadManagerAccounts();
    
  } catch (error) {
    errorMessage.value = `Error: ${error.message}`;
    hashPasswordsStatus.value = 'Error occurred while hashing passwords.';
    console.error('Error hashing passwords:', error);
  } finally {
    isHashingPasswords.value = false;
    // Auto-clear the hash status after 5 seconds
    setTimeout(() => {
      hashPasswordsStatus.value = '';
    }, 5000);
  }
};

// Add these after your existing state variables

// Mass import state
const showMassImportModal = ref(false);
const massImportType = ref(''); // 'clients', 'admins', or 'managers'
const excelFile = ref(null);
const importResults = ref({
  total: 0,
  success: 0,
  failed: 0,
  inProgress: false,
  logs: []
});

// File input ref
const fileInputRef = ref(null);

// UI Handlers
const openCreateModal = () => {
  resetForm();
  showCreateModal.value = true;
};

const openEditModal = (account, isClient = false, isManager = false) => {
  selectedAccount.value = { ...account };
  showEditModal.value = true;
};

const resetForm = () => {
  newAccount.value = {
    username: '',
    password: '',
    gmail: '',
    name: '',
    age: null,
    gender: '',
    type: '', // Reset type field
    civil_status: '', // Reset civil_status field
    address: '',
    division: '',
    position: '',
    grade: null,
    section: '',
    category: ''
  };
  errorMessage.value = '';
};

const closeModals = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  selectedAccount.value = null;
  errorMessage.value = '';
};

// Auto-clear success message after 3 seconds
const clearSuccessMessage = () => {
  if (successMessage.value) {
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  }
};

// Watch for success message changes to set up auto-clear
watch(successMessage, clearSuccessMessage);

// Filtered accounts based on search
const filteredAdmins = computed(() => {
  if (!searchQuery.value) return adminAccounts.value;
  const query = searchQuery.value.toLowerCase();
  return adminAccounts.value.filter(admin => 
    (admin.username || '').toLowerCase().includes(query) || 
    (admin.gmail || '').toLowerCase().includes(query)
  );
});

const filteredClients = computed(() => {
  let clients = clientAccounts.value;
  
  // Filter by search query if any
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    clients = clients.filter(client => 
      (client.username || '').toLowerCase().includes(query) || 
      (client.name || '').toLowerCase().includes(query) || 
      (client.gmail || '').toLowerCase().includes(query)
    );
  }
  
  // Sort first by grade (numerically) and then by section (alphabetically)
  return clients.sort((a, b) => {
    // First check if both have grades - if not, put null grades at the end
    if (a.grade !== null && b.grade === null) return -1;
    if (a.grade === null && b.grade !== null) return 1;
    
    // If both have grades, compare them
    if (a.grade !== null && b.grade !== null) {
      if (a.grade !== b.grade) return a.grade - b.grade;
    }
    
    // If grades are equal or both null, sort by section
    return a.section.localeCompare(b.section);
  });
});

const filteredManagers = computed(() => {
  if (!searchQuery.value) return managerAccounts.value;
  const query = searchQuery.value.toLowerCase();
  return managerAccounts.value.filter(manager => 
    (manager.username || '').toLowerCase().includes(query) || 
    (manager.gmail || '').toLowerCase().includes(query)
  );
});

// Lifecycle hooks
onMounted(() => {
  loadAdminAccounts();
  loadClientAccounts();
  loadManagerAccounts(); // Add this line
});

// Add this inside setup()
const { lastBackupRestored } = useBackupEvents();

// Watch for changes
watch(lastBackupRestored, async (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) {
    console.log('Backup was restored, refreshing accounts...');
    // Reload all account data
    await Promise.all([
      loadAdminAccounts(),
      loadClientAccounts(),
      loadManagerAccounts()
    ]);
  }
});

// Add these functions

// Open mass import modal
const openMassImportModal = (type) => {
  massImportType.value = type;
  importResults.value = {
    total: 0,
    success: 0,
    failed: 0,
    inProgress: false,
    logs: []
  };
  showMassImportModal.value = true;
};

// Close mass import modal
const closeMassImportModal = () => {
  showMassImportModal.value = false;
  massImportType.value = '';
  excelFile.value = null;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

// Handle file selection
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    excelFile.value = file;
  }
};

// Update this function to validate Excel structure
const validateExcelStructure = (data, type) => {
  if (!data || !data.length) {
    return 'Excel file is empty';
  }
  
  const firstRow = data[0];
  const requiredCommonFields = ['username', 'gmail'];
  const clientRequiredFields = ['name', 'age', 'gender', 'category', 'section', 'type'];
  
  // Check common required fields for all account types
  for (const field of requiredCommonFields) {
    if (!(field in firstRow)) {
      return `Missing required column: ${field}`;
    }
  }
  
  // For clients, check for required client fields (including name)
  if (type === 'clients') {
    for (const field of clientRequiredFields) {
      if (!(field in firstRow)) {
        return `Missing required column for client accounts: ${field}`;
      }
    }
  } 
  // For admins and managers, ensure client fields are NOT present
  else if (type === 'admins' || type === 'managers') {
    // For nurse/doctor templates we allow an optional name column,
    // but disallow strictly client-only fields like age, gender, category, section, type.
    const clientOnlyTemplateFields = ['age', 'gender', 'category', 'section', 'type'];
    const inappropriateFields = clientOnlyTemplateFields.filter(field => field in firstRow);
    
    if (inappropriateFields.length > 0) {
      const roleLabel = type === 'admins' ? 'nurses' : 'doctors';
      return `Invalid template for ${roleLabel}. Found client-specific fields: ${inappropriateFields.join(', ')}. Please use the correct template for ${roleLabel}.`;
    }
  }
  
  return null; // No validation error
};

// Update the processExcelImport function
const processExcelImport = async () => {
  if (!excelFile.value) {
    errorMessage.value = 'Please select an Excel file first';
    return;
  }

  try {
    importResults.value.inProgress = true;
    importResults.value.logs = [];
    importResults.value.success = 0;
    importResults.value.failed = 0;

    // First fetch existing accounts for comparison
    let existingAccounts = [];
    if (massImportType.value === 'clients') {
      existingAccounts = await fetchPatientAccounts();
    } else if (massImportType.value === 'admins') {
      existingAccounts = await fetchNurseAccounts();
    } else if (massImportType.value === 'managers') {
      existingAccounts = await fetchDoctorAccounts();
    }

    // Read the Excel file
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate Excel structure first
        const structureError = validateExcelStructure(jsonData, massImportType.value);
        if (structureError) {
          throw new Error(structureError);
        }

        importResults.value.total = jsonData.length;

        // Process each row based on the type
        if (massImportType.value === 'clients') {
          // First handle existing graduated students (grade 22) - they should be removed
          const grade22Students = existingAccounts.filter(c => c.grade === 22);

          if (grade22Students.length > 0) {
            try {
              for (const student of grade22Students) {
                // Delete students at grade 22 as they should be removed on next import
                await deletePatientAccount(student.patient_id || student.client_id);
                importResults.value.logs.push(`🗑️ Removed graduated student: ${student.name} (exceeded maximum grade level)`);
              }
              importResults.value.logs.push(`✅ Removed ${grade22Students.length} students who completed grade 22`);

              // Refresh the accounts list after removals
              existingAccounts = await fetchPatientAccounts();
            } catch (error) {
              importResults.value.logs.push(`❌ Error removing grade 22 students: ${error.message}`);
            }
          }

          // Then handle existing grade 12-21 students - they should be promoted
          const graduatingStudents = existingAccounts.filter(c => c.grade >= 12 && c.grade < 22);

          if (graduatingStudents.length > 0) {
            try {
              for (const student of graduatingStudents) {
                // Move student to next grade
                const nextGrade = student.grade + 1;
                const updatedStudent = { ...student, grade: nextGrade };
                await updatePatientAccount(student.patient_id || student.client_id, updatedStudent);
                importResults.value.logs.push(`ℹ️ Graduated student: ${student.name} moved from grade ${student.grade} to grade ${nextGrade}`);
              }

              // Refresh client accounts after processing graduates
              existingAccounts = await fetchPatientAccounts();
            } catch (error) {
              importResults.value.logs.push(`❌ Error promoting students: ${error.message}`);
            }
          }

          // Now process each imported row
          for (const row of jsonData) {
            try {
              const validationError = validateExcelRow(row, massImportType.value);
              if (validationError) {
                throw new Error(validationError);
              }

              const clientData = {
                username: String(row.username || '').trim(),
                name: String(row.name || '').trim(),
                gmail: String(row.gmail || '').trim(),
                age: typeof row.age === 'number' ? row.age : parseInt(row.age) || 0,
                gender: String(row.gender || '').trim(),
                category: String(row.category || '').trim(),
                type: String(row.type || '').trim(),
                grade: row.grade ? (typeof row.grade === 'number' ? row.grade : parseInt(row.grade)) : null,
                section: String(row.section || '').trim(),
                civil_status: String(row.civil_status || 'single').trim(),
                address: String(row.address || '').trim()
              };

              // Check for existing client account (match by username and name)
              const existingClient = existingAccounts.find(c =>
                c.username === clientData.username && c.name === clientData.name
              );

              if (existingClient) {
                // Fail if password is provided for existing account
                if (row.password) {
                  throw new Error('Cannot update password for existing client account through import');
                }

                // Update existing client account - don't touch password
                await updatePatientAccount(existingClient.patient_id || existingClient.client_id, clientData);
                importResults.value.success++;
                importResults.value.logs.push(`✅ Updated client: ${clientData.name} (${clientData.username})`);
              } else {
                // Create new client account - password is required
                if (!row.password) {
                  throw new Error('Password is required for new client account');
                }
                clientData.password = String(row.password).trim();
                await createPatientAccount(clientData);
                importResults.value.success++;
                importResults.value.logs.push(`✅ Created client: ${clientData.name} (${clientData.username})`);
              }
            } catch (error) {
              importResults.value.failed++;
              importResults.value.logs.push(`❌ Error processing client: ${row.name || row.username || 'Unknown'} - ${error.message}`);
              console.error('Error processing account:', error);
            }
          }
        }
        else if (massImportType.value === 'admins') {
          for (const row of jsonData) {
            try {
              const validationError = validateExcelRow(row, massImportType.value);
              if (validationError) {
                throw new Error(validationError);
              }

              const adminData = {
                username: String(row.username || '').trim(),
                gmail: String(row.gmail || '').trim(),
                name: String(row.name || row.username || '').trim()
              };

              // Check for existing admin account (match by username)
              const existingAdmin = existingAccounts.find(a => a.username === adminData.username);

              if (existingAdmin) {
                // Fail if password is provided for existing account
                if (row.password) {
                  throw new Error('Cannot update password for existing admin account through import');
                }

                // Update existing admin (nurse) account - don't touch password
                await updateNurseAccount(existingAdmin.nurse_id || existingAdmin.admin_id, adminData);
                importResults.value.success++;
                importResults.value.logs.push(`✅ Updated admin: ${adminData.username}`);
              } else {
                // Create new admin (nurse) account - password is required
                if (!row.password) {
                  throw new Error('Password is required for new admin account');
                }
                adminData.password = String(row.password).trim();
                await createNurseAccount(adminData);
                importResults.value.success++;
                importResults.value.logs.push(`✅ Created admin: ${adminData.username}`);
              }
            } catch (error) {
              importResults.value.failed++;
              importResults.value.logs.push(`❌ Error processing admin: ${row.username || 'Unknown'} - ${error.message}`);
              console.error('Error processing account:', error);
            }
          }
        }
        else if (massImportType.value === 'managers') {
          for (const row of jsonData) {
            try {
              const validationError = validateExcelRow(row, massImportType.value);
              if (validationError) {
                throw new Error(validationError);
              }

              const managerData = {
                username: String(row.username || '').trim(),
                gmail: String(row.gmail || '').trim(),
                name: String(row.name || row.username || '').trim()
              };

              // Check for existing manager account (match by username)
              const existingManager = existingAccounts.find(m => m.username === managerData.username);

              if (existingManager) {
                // Fail if password is provided for existing account
                if (row.password) {
                  throw new Error('Cannot update password for existing manager account through import');
                }

                // Update existing manager (doctor) account - don't touch password
                await updateDoctorAccount(existingManager.doctor_id || existingManager.manager_id, managerData);
                importResults.value.success++;
                importResults.value.logs.push(`✅ Updated manager: ${managerData.username}`);
              } else {
                // Create new manager (doctor) account - password is required
                if (!row.password) {
                  throw new Error('Password is required for new manager account');
                }
                managerData.password = String(row.password).trim();
                await createDoctorAccount(managerData);
                importResults.value.success++;
                importResults.value.logs.push(`✅ Created manager: ${managerData.username}`);
              }
            } catch (error) {
              importResults.value.failed++;
              importResults.value.logs.push(`❌ Error processing manager: ${row.username || 'Unknown'} - ${error.message}`);
              console.error('Error processing account:', error);
            }
          }
        }

        // Refresh the accounts lists
        if (massImportType.value === 'clients') {
          await loadClientAccounts();
        } else if (massImportType.value === 'admins') {
          await loadAdminAccounts();
        } else if (massImportType.value === 'managers') {
          await loadManagerAccounts();
        }

        successMessage.value = `Import complete: ${importResults.value.success} accounts processed (created/updated), ${importResults.value.failed} failed`;

      } catch (error) {
        errorMessage.value = `Error processing Excel file: ${error.message}`;
        console.error('Excel processing error:', error);
      } finally {
        importResults.value.inProgress = false;
      }
    };

    reader.readAsArrayBuffer(excelFile.value);

  } catch (error) {
    errorMessage.value = `Error: ${error.message}`;
    importResults.value.inProgress = false;
    console.error('File reading error:', error);
  }
};

// Add this new validation function
const validateExcelRow = (row, type) => {
  // Common validation for all account types
  if (!row.username || String(row.username).trim() === '') {
    return 'Username is required';
  }
  
  // Password is no longer required during validation
  // We'll check for password only for new accounts during import
  
  if (!row.gmail || String(row.gmail).trim() === '') {
    return 'Email is required';
  }
  
  // Client-specific validation
  if (type === 'clients') {
    if (!row.name || String(row.name).trim() === '') {
      return 'Name is required for client accounts';
    }
    
    if (!row.age) {
      return 'Age is required for client accounts';
    }
    
    if (!row.gender || String(row.gender).trim() === '') {
      return 'Gender is required for client accounts';
    }
    
    if (!row.category || String(row.category).trim() === '') {
      return 'Category is required for client accounts';
    }
    
    if (!row.section || String(row.section).trim() === '') {
      return 'Section is required for client accounts';
    }
    
    if (!row.type || String(row.type).trim() === '') {
      return 'Type is required for client accounts';
    }
  }
  
  return null; // No validation error
};

// Complete the downloadSampleTemplate function

// Download sample template
const downloadSampleTemplate = () => {
  // Create sample data based on the type
  let sampleData = [];
  
  if (massImportType.value === 'clients') {
    sampleData = [
      {
        username: 'sample_student1', // Required
        password: 'password123 (required only for new accounts)',
        name: 'John Doe', // Required
        gmail: 'john.doe@example.com', // Required
        age: 18, // Required
        gender: 'Male', // Required
        category: 'Student', // Required
        grade: 10, // Optional
        section: 'A', // Required
        type: 'Dormer', // Required
        civil_status: 'single', // Optional in template, defaulted if missing
        address: '123 Sample Street' // Optional in template, defaulted if missing
      },
      {
        username: 'sample_faculty1', // Required
        password: 'password123 (required only for new accounts)',
        name: 'Jane Smith', // Required
        gmail: 'jane.smith@example.com', // Required
        age: 35, // Required
        gender: 'Female', // Required
        category: 'Faculty', // Required
        section: 'Science', // Required
        type: 'Extern', // Required
        civil_status: 'married', // Optional in template, defaulted if missing
        address: '456 Example Avenue' // Optional in template, defaulted if missing
      }
    ];
  } else if (massImportType.value === 'admins') {
    // Nurse accounts template
    sampleData = [
      {
        username: 'sample_nurse1', // Required
        password: 'password123 (required only for new accounts)',
        gmail: 'nurse1@example.com', // Required
        name: 'Nurse One'  // Optional for nurses
      },
      {
        username: 'sample_nurse2', // Required
        password: 'password123 (required only for new accounts)',
        gmail: 'nurse2@example.com', // Required
        name: 'Nurse Two'  // Optional for nurses
      }
    ];
  } else if (massImportType.value === 'managers') {
    // Doctor accounts template
    sampleData = [
      {
        username: 'sample_doctor1', // Required
        password: 'password123 (required only for new accounts)',
        gmail: 'doctor1@example.com', // Required
        name: 'Doctor One'  // Optional for doctors
      },
      {
        username: 'sample_doctor2', // Required
        password: 'password123 (required only for new accounts)',
        gmail: 'doctor2@example.com', // Required
        name: 'Doctor Two'  // Optional for doctors
      }
    ];
  }
  
  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Accounts');
  
  // Generate Excel file and trigger download
  const typeLabel = massImportType.value === 'admins'
    ? 'nurses'
    : massImportType.value === 'managers'
    ? 'doctors'
    : 'clients';
  XLSX.writeFile(workbook, `${typeLabel}_template.xlsx`);
};
</script>

<template>
  <div class="p-6 bg-white rounded-lg shadow">
    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="p-3 mb-4 text-green-700 bg-green-100 border border-green-400 rounded">
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="p-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
      {{ errorMessage }}
    </div>

    <div class="border-b border-gray-200">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-[#2f4a71]">Account Management</h2>
        <div class="flex gap-2">
          <!-- Mass Import Button -->
          <button
            @click="openMassImportModal(activeTab)"
            class="flex items-center px-4 py-2 mr-2 text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            <Icon icon="mdi:file-excel" class="mr-2" />
            Mass Import
          </button>
          
          <!-- Add Account Button -->
          <button
            @click="openCreateModal"
            class="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Icon icon="mdi:plus" class="mr-2" />
            Add {{ activeTab === 'nurse' ? 'Nurse' : activeTab === 'clients' ? 'Client' : 'Manager' }}
          </button>
          
          <!-- Hash Passwords Button -->
          <button
            @click="hashAllAccountPasswords"
            :disabled="isHashingPasswords"
            class="flex items-center px-4 py-2 text-white rounded-md bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300"
          >
            <Icon icon="mdi:lock" class="mr-2" />
            {{ isHashingPasswords ? 'Hashing...' : 'Hash All Passwords' }}
          </button>
        </div>
      </div>
      
      <!-- Hash Status Message -->
      <div v-if="hashPasswordsStatus" class="px-4 py-3 mb-4 text-blue-700 bg-blue-100 border border-blue-400 rounded">
        {{ hashPasswordsStatus }}
      </div>
      <!-- Tabs -->
      <div class="flex mb-6">
        <button 
          @click="activeTab = 'admins'" 
          :class="[
            'px-4 py-2 text-lg font-medium border-b-2', 
            activeTab === 'admins' 
              ? 'border-[#2f4a71] text-[#2f4a71]' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
        >
          Nurse Accounts
        </button>
        <button 
          @click="activeTab = 'clients'" 
          :class="[
            'px-4 py-2 text-lg font-medium border-b-2 ml-8',  
            activeTab === 'clients' 
              ? 'border-[#2f4a71] text-[#2f4a71]' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
        >
          Patient Accounts
        </button>
        <button 
          @click="activeTab = 'managers'" 
          :class="[
            'px-4 py-2 text-lg font-medium border-b-2 ml-8', 
            activeTab === 'managers' 
              ? 'border-[#2f4a71] text-[#2f4a71]' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          ]"
        >
          Doctor Accounts
        </button>
      </div>
      
      <!-- Search and Add -->
      <div class="flex justify-between mb-6">
        <div class="w-1/3">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search accounts..." 
            class="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <button
          @click="openCreateModal"
          class="px-4 py-2 bg-[#2f4a71] text-white rounded-md flex items-center"
        >
          <Icon icon="mdi:plus" class="mr-2" />
          Add {{ activeTab === 'nurse' ? 'Nurse' : 'Client' }}
        </button>
      </div>
      
      <!-- Success Message -->
      <div v-if="successMessage" class="px-4 py-3 mb-4 text-green-700 bg-green-100 border border-green-400 rounded">
        {{ successMessage }}
      </div>
      
      <!-- Error Message -->
      <div v-if="errorMessage" class="px-4 py-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
        {{ errorMessage }}
      </div>
      
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2f4a71]"></div>
      </div>
      
      <!-- Nurse Accounts Table -->
      <div v-else-if="activeTab === 'admins'" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">ID</th>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Username</th>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Email</th>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="admin in filteredAdmins" :key="admin.admin_id">
              <td class="px-6 py-4 whitespace-nowrap">{{ admin.admin_id }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ admin.username }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ admin.gmail }}</td>
              <td class="px-6 py-4 text-sm font-medium whitespace-nowrap">
                <button @click="openEditModal(admin)" class="mr-3 text-indigo-600 hover:text-indigo-900">
                  <Icon icon="mdi:pencil" class="w-5 h-5" />
                </button>
                <button @click="removeAccount(admin)" class="text-red-600 hover:text-red-900">
                  <Icon icon="mdi:delete" class="w-5 h-5" />
                </button>
              </td>
            </tr>
            <tr v-if="filteredAdmins.length === 0">
              <td colspan="4" class="px-6 py-4 text-center text-gray-500">No nurse accounts found</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Client Accounts Table -->
      <div v-else-if="activeTab === 'clients'" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">ID</th>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Name</th>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Username</th>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Email</th>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Category</th>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Grade-Section
                <span class="ml-1 text-blue-500" title="Sorted by grade and section">↓</span>
              </th>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Type</th>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="client in filteredClients" :key="client.client_id">
              <td class="px-6 py-4 whitespace-nowrap">{{ client.client_id }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ client.name }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ client.username }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ client.gmail }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ client.category }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ client.grade || '-' }}-{{ client.section }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ client.type }}</td>
              <td class="px-6 py-4 text-sm font-medium whitespace-nowrap">
                <button @click="openEditModal(client, true)" class="mr-3 text-indigo-600 hover:text-indigo-900">
                  <Icon icon="mdi:pencil" class="w-5 h-5" />
                </button>
                <button @click="removeAccount(client, true)" class="text-red-600 hover:text-red-900">
                  <Icon icon="mdi:delete" class="w-5 h-5" />
                </button>
              </td>
            </tr>
            <tr v-if="filteredClients.length === 0">
              <td colspan="8" class="px-6 py-4 text-center text-gray-500">No client accounts found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Manager Accounts Table -->
      <div v-else-if="activeTab === 'managers'" class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">ID</th>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Username</th>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Email</th>
              <th class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="manager in filteredManagers" :key="manager.manager_id">
              <td class="px-6 py-4 whitespace-nowrap">{{ manager.manager_id }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ manager.username }}</td>
              <td class="px-6 py-4 whitespace-nowrap">{{ manager.gmail }}</td>
              <td class="px-6 py-4 text-sm font-medium whitespace-nowrap">
                <button @click="openEditModal(manager, false, true)" class="mr-3 text-indigo-600 hover:text-indigo-900">
                  <Icon icon="mdi:pencil" class="w-5 h-5" />
                </button>
                <button @click="removeAccount(manager, false, true)" class="text-red-600 hover:text-red-900">
                  <Icon icon="mdi:delete" class="w-5 h-5" />
                </button>
              </td>
            </tr>
            <tr v-if="filteredManagers.length === 0">
              <td colspan="4" class="px-6 py-4 text-center text-gray-500">No manager accounts found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Create Account Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
      <div class="relative max-w-3xl p-5 mx-auto bg-white border rounded-md shadow-lg top-20">
        <div class="mt-3">
          <h3 class="text-lg font-medium leading-6 text-center text-gray-900">
            Create {{ activeTab === 'nurse' ? 'Nurse' : activeTab === 'clients' ? 'Client' : 'Manager' }} Account
          </h3>
          
          <!-- Error Message -->
          <div v-if="errorMessage" class="px-4 py-3 mt-2 text-left text-red-700 bg-red-100 border border-red-400 rounded">
            {{ errorMessage }}
          </div>
          
          <form class="mt-4 text-left" @submit.prevent="createAccount(activeTab === 'clients', activeTab === 'managers')">
            <!-- Common fields for all account types in 2 columns -->
            <div class="grid grid-cols-2 gap-4">
              <!-- Username -->
              <div>
                <label class="block mb-2 text-sm font-bold text-gray-700" for="username">
                  Username*
                </label>
                <input
                  id="username"
                  type="text"
                  v-model="newAccount.username"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <!-- Password -->
              <div>
                <label class="block mb-2 text-sm font-bold text-gray-700" for="password">
                  Password*
                </label>
                <input
                  id="password"
                  type="password"
                  v-model="newAccount.password"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <!-- Email -->
              <div>
                <label class="block mb-2 text-sm font-bold text-gray-700" for="gmail">
                  Email*
                </label>
                <input
                  id="gmail"
                  type="email"
                  v-model="newAccount.gmail"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <!-- Name (common but required for clients) -->
              <div>
                <label class="block mb-2 text-sm font-bold text-gray-700" for="name">
                  Full Name{{ activeTab === 'clients' ? '*' : '' }}
                </label>
                <input
                  id="name"
                  type="text"
                  v-model="newAccount.name"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  :required="activeTab === 'clients'"
                />
              </div>
            </div>
            
            <!-- Client-specific fields in 2 columns -->
            <div v-if="activeTab === 'clients'" class="grid grid-cols-2 gap-4 mt-4">
              <!-- Age -->
              <div>
                <label class="block mb-2 text-sm font-bold text-gray-700" for="age">
                  Age*
                </label>
                <input
                  id="age"
                  type="number"
                  v-model="newAccount.age"
                  min="1"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <!-- Gender -->
              <div>
                <label class="block mb-2 text-sm font-bold text-gray-700" for="gender">
                  Gender*
                </label>
                <select
                  id="gender"
                  v-model="newAccount.gender"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <!-- Civil Status -->
              <div>
                <label class="block mb-2 text-sm font-bold text-gray-700" for="civil_status">
                  Civil Status*
                </label>
                <select
                  id="civil_status"
                  v-model="newAccount.civil_status"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Civil Status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="widowed">Widowed</option>
                  <option value="separated">Separated</option>
                </select>
              </div>

              <!-- Address -->
              <div>
                <label class="block mb-2 text-sm font-bold text-gray-700" for="address">
                  Address*
                </label>
                <input
                  id="address"
                  type="text"
                  v-model="newAccount.address"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <!-- Type (Student/Faculty/Staff/Other) -->
              <div>
                <label class="block mb-2 text-sm font-bold text-gray-700" for="type">
                  Type*
                </label>
                <select
                  id="type"
                  v-model="newAccount.type"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="staff">Staff</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <!-- Category (Intern/Extern) -->
              <div>
                <label class="block mb-2 text-sm font-bold text-gray-700" for="category">
                  Category*
                </label>
                <select
                  id="category"
                  v-model="newAccount.category"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Intern">Intern</option>
                  <option value="Extern">Extern</option>
                </select>
              </div>
              
              <!-- Division (conditional based on type) -->
              <div v-if="newAccount.type === 'faculty' || newAccount.type === 'staff'">
                <label class="block mb-2 text-sm font-bold text-gray-700" for="division">
                  Division
                </label>
                <input
                  id="division"
                  type="text"
                  v-model="newAccount.division"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <!-- Position (conditional based on type) -->
              <div v-if="newAccount.type === 'faculty' || newAccount.type === 'staff'">
                <label class="block mb-2 text-sm font-bold text-gray-700" for="position">
                  Position
                </label>
                <input
                  id="position"
                  type="text"
                  v-model="newAccount.position"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <!-- Grade (conditional based on type) -->
              <div v-if="newAccount.type === 'student'">
                <label class="block mb-2 text-sm font-bold text-gray-700" for="grade">
                  Grade
                </label>
                <input
                  id="grade"
                  type="number"
                  v-model="newAccount.grade"
                  min="1"
                  max="22"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <!-- Section -->
              <div>
                <label class="block mb-2 text-sm font-bold text-gray-700" for="section">
                  Section*
                </label>
                <input
                  id="section"
                  type="text"
                  v-model="newAccount.section"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
            </div>
            
            <div class="flex items-center justify-between mt-6">
              <button
                type="button"
                @click="closeModals"
                class="px-4 py-2 text-gray-800 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-[#2f4a71] text-white rounded-md hover:bg-blue-700"
                :disabled="isLoading"
              >
                {{ isLoading ? 'Creating...' : 'Create Account' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Edit Account Modal -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
      <div class="relative p-5 mx-auto bg-white border rounded-md shadow-lg top-20 w-96">
        <div class="mt-3">
          <h3 class="text-lg font-medium leading-6 text-center text-gray-900">
            Edit {{ activeTab === 'admins' ? 'Nurse' : activeTab === 'clients' ? 'Patient' : 'Doctor' }} Account
          </h3>
          
          <!-- Error Message -->
          <div v-if="errorMessage" class="px-4 py-3 mt-2 text-left text-red-700 bg-red-100 border border-red-400 rounded">
            {{ errorMessage }}
          </div>
          
          <form v-if="selectedAccount" class="mt-4 text-left" @submit.prevent="updateAccount(activeTab === 'clients', activeTab === 'managers')">
            <!-- Username -->
            <div class="mb-4">
              <label class="block mb-2 text-sm font-bold text-gray-700" for="edit-username">
                Username*
              </label>
              <input
                id="edit-username"
                type="text"
                v-model="selectedAccount.username"
                class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <!-- Password (optional when updating) -->
            <div class="mb-4">
              <label class="block mb-2 text-sm font-bold text-gray-700" for="edit-password">
                Password (leave blank to keep unchanged)
              </label>
              <input
                id="edit-password"
                type="password"
                v-model="selectedAccount.password"
                class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
              />
            </div>
            
            <!-- Email -->
            <div class="mb-4">
              <label class="block mb-2 text-sm font-bold text-gray-700" for="edit-gmail">
                Email*
              </label>
              <input
                id="edit-gmail"
                type="email"
                v-model="selectedAccount.gmail"
                class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                required
              />
            </div>
            
            <!-- Client-specific fields -->
            <template v-if="activeTab === 'clients'">
              <!-- Name -->
              <div class="mb-4">
                <label class="block mb-2 text-sm font-bold text-gray-700" for="edit-name">
                  Full Name*
                </label>
                <input
                  id="edit-name"
                  type="text"
                  v-model="selectedAccount.name"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <!-- Age -->
              <div class="mb-4">
                <label class="block mb-2 text-sm font-bold text-gray-700" for="edit-age">
                  Age*
                </label>
                <input
                  id="edit-age"
                  type="number"
                  v-model="selectedAccount.age"
                  min="1"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <!-- Gender -->
              <div class="mb-4">
                <label class="block mb-2 text-sm font-bold text-gray-700" for="edit-gender">
                  Gender*
                </label>
                <select
                  id="edit-gender"
                  v-model="selectedAccount.gender"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              
              <!-- Civil Status -->
              <div class="mb-4">
                <label class="block mb-2 text-sm font-bold text-gray-700" for="edit-civil_status">
                  Civil Status*
                </label>
                <select
                  id="edit_civil_status"
                  v-model="selectedAccount.civil_status"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Civil Status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="widowed">Widowed</option>
                  <option value="separated">Separated</option>
                </select>
              </div>

              <!-- Address -->
              <div class="mb-4">
                <label class="block mb-2 text-sm font-bold text-gray-700" for="edit-address">
                  Address*
                </label>
                <input
                  id="edit-address"
                  type="text"
                  v-model="selectedAccount.address"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <!-- Type (Student/Faculty/Staff/Other) -->
              <div class="mb-4">
                <label class="block mb-2 text-sm font-bold text-gray-700" for="edit-type">
                  Type*
                </label>
                <select
                  id="edit-type"
                  v-model="selectedAccount.type"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="staff">Staff</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <!-- Division (conditional based on type) -->
              <div class="mb-4" v-if="selectedAccount.type === 'faculty' || selectedAccount.type === 'staff'">
                <label class="block mb-2 text-sm font-bold text-gray-700" for="edit-division">
                  Division
                </label>
                <input
                  id="edit-division"
                  type="text"
                  v-model="selectedAccount.division"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <!-- Position (conditional based on type) -->
              <div class="mb-4" v-if="selectedAccount.type === 'faculty' || selectedAccount.type === 'staff'">
                <label class="block mb-2 text-sm font-bold text-gray-700" for="edit-position">
                  Position
                </label>
                <input
                  id="edit-position"
                  type="text"
                  v-model="selectedAccount.position"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <!-- Grade (conditional based on type) -->
              <div class="mb-4" v-if="selectedAccount.type === 'student'">
                <label class="block mb-2 text-sm font-bold text-gray-700" for="edit-grade">
                  Grade
                </label>
                <input
                  id="edit-grade"
                  type="number"
                  v-model="selectedAccount.grade"
                  min="1"
                  max="22"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                />
              </div>
              
              <!-- Section -->
              <div class="mb-4">
                <label class="block mb-2 text-sm font-bold text-gray-700" for="edit-section">
                  Section*
                </label>
                <input
                  id="edit-section"
                  type="text"
                  v-model="selectedAccount.section"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <!-- Category (Intern/Extern) -->
              <div class="mb-4">
                <label class="block mb-2 text-sm font-bold text-gray-700" for="edit-category">
                  Category*
                </label>
                <select
                  id="edit-category"
                  v-model="selectedAccount.category"
                  class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Intern">Intern</option>
                  <option value="Extern">Extern</option>
                </select>
              </div>
            </template>
            
            <div class="flex items-center justify-between mt-6">
              <button
                type="button"
                @click="closeModals"
                class="px-4 py-2 text-gray-800 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-[#2f4a71] text-white rounded-md hover:bg-blue-700"
                :disabled="isLoading"
              >
                {{ isLoading ? 'Updating...' : 'Update Account' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Add the Mass Import Modal -->
    <div v-if="showMassImportModal" class="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
      <div class="relative max-w-2xl p-5 mx-auto bg-white border rounded-md shadow-lg top-20">
        <div class="mt-3">
          <h3 class="text-lg font-medium leading-6 text-center text-gray-900">
            Mass Import {{ massImportType === 'nurse' ? 'Nurse' : massImportType === 'clients' ? 'Client' : 'Manager' }} Accounts
          </h3>
          
          <!-- Error Message -->
          <div v-if="errorMessage" class="px-4 py-3 mt-2 text-left text-red-700 bg-red-100 border border-red-400 rounded">
            {{ errorMessage }}
          </div>
          
          <!-- File Upload Section -->
          <div class="mt-6" v-if="!importResults.inProgress && importResults.logs.length === 0">
            <div class="mb-6">
              <p class="mb-2 text-sm text-gray-600">
                Upload an Excel file (.xlsx) with the following columns:
                <template v-if="massImportType === 'clients'">
                  username, password, name, gmail, age, gender, category, grade (optional), section, type
                </template>
                <template v-else>
                  username, password, gmail
                </template>
              </p>
              
              <div class="flex items-center mt-4 space-x-4">
                <button 
                  @click="downloadSampleTemplate"
                  class="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
                >
                  <Icon icon="mdi:download" class="mr-1" />
                  Download Template
                </button>
                
                <label class="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md cursor-pointer hover:bg-blue-700">
                  <Icon icon="mdi:upload" class="mr-1" />
                  Choose File
                  <input 
                    ref="fileInputRef"
                    type="file" 
                    class="hidden" 
                    accept=".xlsx, .xls" 
                    @change="handleFileUpload"
                  />
                </label>
              </div>
              
              <div v-if="excelFile" class="p-3 mt-4 text-sm text-green-700 bg-green-100 border border-green-400 rounded">
                Selected file: {{ excelFile.name }}
              </div>
            </div>
            
            <div class="flex items-center justify-between mt-6">
              <button
                type="button"
                @click="closeMassImportModal"
                class="px-4 py-2 text-gray-800 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                @click="processExcelImport"
                :disabled="!excelFile"
                class="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-300"
              >
                Import Accounts
              </button>
            </div>
          </div>
          
          <!-- Progress Section -->
          <div class="my-4" v-if="importResults.inProgress">
            <div class="w-full h-4 mb-4 bg-gray-200 rounded-full">
              <div 
                class="h-4 bg-blue-600 rounded-full" 
                :style="`width: ${importResults.total ? ((importResults.success + importResults.failed) / importResults.total * 100) : 0}%`"
              ></div>
            </div>
            <p class="text-center text-gray-700">
              Processing... {{ importResults.success + importResults.failed }} of {{ importResults.total }}
            </p>
          </div>
          
          <!-- Results Section -->
          <div v-if="importResults.logs.length > 0" class="mt-4">
            <div class="flex justify-between mb-4">
              <h4 class="font-medium">Import Results:</h4>
              <div class="text-sm">
                <span class="mr-4 text-green-600">Success: {{ importResults.success }}</span>
                <span class="text-red-600">Failed: {{ importResults.failed }}</span>
              </div>
            </div>
            
            <div class="h-64 p-3 overflow-y-auto text-sm border rounded">
              <div v-for="(log, index) in importResults.logs" :key="index" class="mb-1">
                <div v-html="log"></div>
              </div>
            </div>
            
            <div class="flex items-center justify-end mt-6">
              <button
                type="button"
                @click="closeMassImportModal"
                class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add these styles to your accounts.vue component */

/* Ensure the table container doesn't overflow the page */
.overflow-x-auto {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

/* Make the component fit with sidebar */
.p-6 {
  margin-top: 1rem;
  border-radius: 0.5rem;
}

/* Improve table styles */
table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

th {
  background-color: #f3f4f6;
  position: sticky;
  top: 0;
  z-index: 10;
}

th, td {
  padding: 0.75rem 1rem;
  text-align: left;
}

tbody tr:hover {
  background-color: #f9fafb;
}

/* Improve modal positioning */
.fixed.inset-0 {
  z-index: 50;
}

/* Animation for modals */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fixed.inset-0 > div {
  animation: fadeIn 0.3s ease-out;
}

/* Add these styles to your existing styles */

/* Import logs styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>