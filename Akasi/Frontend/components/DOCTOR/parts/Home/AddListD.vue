<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { formatAMPM } from '~/composables/useTimeFormatter';
import moment from 'moment-timezone';
import { useProfile } from '~/composables/useProfile'
import { useAppointmentsByDate } from '~/composables/useAppointmentsByDate';
import * as consultationRecordService from '~/services/consultationRecordService';
import { Icon } from '@iconify/vue';

// Import all the components
// import ConfirmationModal from '~/components/SHARED/parts/confirmationModal.vue';
import EditModal from './addListComponents/EditModalD.vue';
import MedicineModal from './addListComponents/MedicineModalD.vue';
import MedicineDetailModal from './addListComponents/MedicineDetailModalD.vue';
import AddDiagnosisModal from './addListComponents/AddDiagnosisModalD.vue';
import AddCategoryModal from './addListComponents/AddCategoryModalD.vue';
import StatusModal from './addListComponents/StatusModalD.vue';

// Properly initialize the profile composable
const { profile, loading: profileLoading, fetchProfile } = useProfile();

// Create a computed property for the current user that handles multiple role types
const currentUser = computed(() => {
  if (!profile.value) return { name: 'School Physician', admin_id: 1 };
  
  // Handle different profile types
  if (profile.value.type === 'doctor') {
    return {
      admin_id: profile.value.doctor_id,
      name: profile.value.name,
      role: 'doctor'
    };
  } else if (profile.value.type === 'nurse') {
    return {
      admin_id: profile.value.nurse_id,
      name: profile.value.name,
      role: 'nurse'
    };
  } else {
    // Default fallback
    return { name: 'School Physician', admin_id: 1 };
  }
});

// Determine if the selected person is a student
const isStudent = computed(() => {
  return selectedPerson.value?.category?.toLowerCase() === 'student';
});

const activeTab = ref('tab1');

// Appointments
const { 
  appointments, 
  loadingAppointments, 
  appointmentsError, 
  formatTime, 
  fetchAppointmentsByDate 
} = useAppointmentsByDate();

//prop
const props = defineProps({
  currentDay: {
    type: Object,
    default: () => ({ 
      date: moment().tz("Asia/Manila").toDate() 
    })
  }
});

/**
 * Formats a date string to localized date format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string or 'N/A' if invalid
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Modal states
const showEditModal = ref(false);
const showMedicineModal = ref(false);
const showMedicineDetailModal = ref(false);
const medicinesVisible = ref(true);
const showConfirmationModal = ref(false);
const confirmationMessage = ref('');
const pendingSaveAction = ref(null);
// Selected person and record
const selectedPerson = ref(null);
const selectedConsultationRecord = ref(null);
// Selected date/time
const selectedDate = computed(() => {
  // Use the currentDay prop or fallback to current Manila time
  const date = props.currentDay.date instanceof Date ? props.currentDay.date : moment().tz("Asia/Manila").toDate();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dayOptions = { weekday: 'long' };
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return {
    day: new Intl.DateTimeFormat('en-US', dayOptions).format(date),
    monthYear: new Intl.DateTimeFormat('en-US', dateOptions).format(date),
    date: new Intl.DateTimeFormat('en-US', options).format(date)
  };
});

const confinedCount = ref(0);
const selectedTime = ref(formatAMPM(new Date()));

// Search queries
const searchQuery = ref('');
const medicineSearchQuery = ref('');

// To contain all that is part of the list
const people = ref([]);//search-filtered people
const allPeople = ref([]);//general masterlist of people/clients
const patients = ref([]);//records of patients basicaaly

/**
 * Updates an existing consultation record
 * @param {number} consultation_id - ID of consultation to update
 * @param {Object} person - Patient information
 * @returns {Promise<Object>} Updated consultation record
 */
const updateConsultationRecord = async (consultation_id, person) => {
  try {
    // First, fetch the existing record to get the original date
    const existingRecord = await fetchConsultationRecord(consultation_id);

    return await consultationRecordService.updateConsultationRecord(consultation_id, {
      patient_id: person.clientId,
      nurse_id: currentUser.value.admin_id,
      date: existingRecord.date, // Use the original date and time
      patient_name: person.name,
      patient_occupation: person.occupation || `${person.grade}-${person.section}`,
      nurse_name: currentUser.value.name,
      complaint: person.generalComplaint || '',
      remarks: person.remarks || '',
      confined: person.confined || false,
      medAdministration: person.medicationAdministration || false,
    });
  } catch (error) {
    console.error('Error updating consultation record:', error);
    throw error;
  }
};

/**
 * Updates medication administration status of a consultation
 * @param {number} consultation_id - ID of consultation to update
 * @returns {Promise<void>}
 */
const updateConsultationWithMedication = async (consultation_id) => {
  try {
    await consultationRecordService.updateConsultationWithMedication(consultation_id);
  } catch (error) {
    console.error('Error updating medication status:', error);
    throw error;
  }
};

/**
 * Creates a new consultation record
 * @param {Object} person - Patient information
 * @returns {Promise<Object>} Newly created consultation record
 */
const createConsultationRecord = async (person) => {
  try {
    // Validate required fields
    if (!person.clientId) {
      throw new Error('Patient ID is required');
    }
    const selectedDateTime = new Date(props.currentDay.date);
    const now = new Date();
    selectedDateTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    
    const formattedDateTime = selectedDateTime.toISOString();

    // Prepare the data object for the service call
    const consultationData = {
      patient_id: person.clientId, // Updated from client_id to patient_id
      nurse_id: currentUser.value.admin_id, // Updated from admin_id to nurse_id
      date: formattedDateTime,
      patient_name: person.name,
      patient_occupation: person.occupation || `${person.grade}-${person.section}`,
      nurse_name: currentUser.value.name,
      complaint: selectedConsultationRecord.value?.complaint || '',
      remarks: selectedConsultationRecord.value?.remarks || '',
      confined: selectedConsultationRecord.value?.confined || false,
      medAdministration: true,
      intervention: selectedConsultationRecord.value?.intervention || '',
      action: '',
      disposition: '',
      doctor_id: currentUser.value.role === 'doctor' ? currentUser.value.admin_id : undefined,
      doctor_name: currentUser.value.role === 'doctor' ? currentUser.value.name : undefined
    };

    // Use the service function instead of direct fetch
    return await consultationRecordService.createConsultationRecord(consultationData);
  } catch (error) {
    console.error('Error creating consultation record:', error);
    throw error;
  }
};

/**
 * Fetches all clients/people from the API
 * @returns {Promise<void>}
 */
const fetchPeople = async () => {
  try {
    const data = await consultationRecordService.fetchPeople();
    allPeople.value = data.map((patient) => ({
      clientId: patient.patient_id, // Keep clientId for backward compatibility
      name: patient.name,
      section: patient.section || 'N/A',
      grade: patient.grade || 'N/A',
      age: patient.age || 0,
      sex: patient.gender || 'N/A',
      type: patient.type || 'N/A',
      category: patient.category || 'N/A',
      occupation: patient.position || 'N/A',
    }));
  } catch (error) {
    console.error('Error fetching people:', error.message);
  }
};

/**
 * Fetches consultation records for current day
 * @returns {Promise<void>}
 */
const fetchPatients = async () => {
  try {
    const data = await consultationRecordService.fetchConsultationRecords();
    
    // Use moment.js for consistent timezone handling
    const currentDate = moment(props.currentDay.date).tz("Asia/Manila");
    
    patients.value = data
      .filter(record => {
        const recordDate = moment(record.date).tz("Asia/Manila");
        // Only show records marked for doctor's view
        return recordDate.isSame(currentDate, 'day') && record.doctorShow === true;
      })
      .map((record) => ({
        id: record.patient_id,
        consultation_id: record.consultation_id,
        name: record.patient_name,
        grade: record.grade || 'N/A',
        section: record.section || 'N/A',
        category: record.category || 'N/A',
        time: moment(record.date).tz("Asia/Manila").format('hh:mm A'),
        complaint: record.complaint,
        remarks: record.remarks,
        confined: record.confined,
        medAdministration: record.medAdministration,
        intervention: record.intervention,
        action: record.action,
        disposition: record.disposition
      }));
  } catch (error) {
    console.error('Error fetching patients:', error.message);
  }
};

/**
 * Fetches count of confined records for current month
 * @returns {Promise<void>}
 */
const fetchRecordCount = async () => {
  try {
    const year = props.currentDay.date.getFullYear();
    const month = props.currentDay.date.getMonth();
    const count = await consultationRecordService.fetchConfinedConsultationRecordsCount(year, month);
    confinedCount.value = count;
    emit('update-confined', confinedCount.value);
    console.log(confinedCount.value); // Update the confined count
  } catch (error) {
    console.error('Failed to fetch confined count:', error);
  }
};
// Watch for changes in the currentDay prop
watch(() => props.currentDay, () => {
  fetchPatients();
}, { immediate: true });

watch(
  () => [
    props.currentDay.date?.getFullYear(),
    props.currentDay.date?.getMonth()
  ],
  () => {
    fetchRecordCount();
  },
  { immediate: true }
);

/**
 * Saves/updates person and consultation record
 * Handles both new records and updates
 * @returns {Promise<void>}
 */

// Watch for date changes when on appointments tab
watch(() => props.currentDay, () => {
  if (activeTab.value === 'tab2') {
    fetchAppointmentsForSelectedDate();
  }
}, { deep: true });

// Watch for tab changes
watch(() => activeTab.value, (newTab) => {
  if (newTab === 'tab2') {
    fetchAppointmentsForSelectedDate();
  }
});

// fetch data when mounted
onMounted(() => {
  fetchPeople();
  fetchPatients();
  fetchRecordCount();
  fetchInventory();
  fetchProfile(); 

  if (activeTab.value === 'tab2') {
    fetchAppointmentsForSelectedDate();
  }
});
console.log(patients)
////////////////
/**
 * Saves/updates person and consultation record
 * Handles both new records and updates
 * @returns {Promise<void>}
 */
const savePerson = async () => {
  try {
    if (!selectedPerson.value?.clientId) {
      throw new Error('Client ID is required');
    }

    // Filter out any empty complaints before saving
    if (selectedPerson.value.complaints) {
      selectedPerson.value.complaints = selectedPerson.value.complaints.filter(
        complaint => complaint.text && complaint.text.trim() !== ''
      );
    }

    // Ensure complaints is defined as an array and not empty
    if (
      !Array.isArray(selectedPerson.value.complaints) ||
      !selectedPerson.value.complaints.length
    ) {
      throw new Error('At least one diagnosis is required');
    }

    // Prepare consultation data
    const selectedDateTime = new Date(props.currentDay.date);
    const now = new Date();
    selectedDateTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const consultationData = {
      client_id: selectedPerson.value.clientId,
      admin_id: currentUser.value.admin_id, // Remove the optional chaining
      date: selectedDateTime.toISOString(),
      patient_name: selectedPerson.value.name,
      patient_occupation:
        selectedPerson.value.occupation ||
        `${selectedPerson.value.grade}-${selectedPerson.value.section}`,
      doctor: currentUser.value.name, // Remove the optional chaining
      complaint: selectedPerson.value.complaints.length > 0 ? selectedPerson.value.complaints.map(c => c.text).join(', ') : null,
      remarks: selectedPerson.value.remarks || '',
      confined: Boolean(selectedPerson.value.confined),
      medAdministration: Boolean(selectedPerson.value.medicationAdministration),
      fatality: Boolean(selectedPerson.value.fatality),
      intervention: selectedPerson.value.intervention || '',
      // Include diagnosis_ids array if present
      diagnosis_ids: selectedPerson.value.complaints
        .filter(c => c.disease_id)
        .map(c => c.disease_id),
      action: selectedPerson.value.action || '',
      disposition: selectedPerson.value.disposition || ''
    };

    let consultationId;

    // Check if updating an existing consultation record
    if (selectedConsultationRecord.value?.consultation_id) {
      try {
        // First, fetch the existing record to check if it exists
        await consultationRecordService.fetchConsultationRecord(selectedConsultationRecord.value.consultation_id);

        // Update the existing consultation record
        await consultationRecordService.updateConsultationRecord(selectedConsultationRecord.value.consultation_id, consultationData);
        consultationId = selectedConsultationRecord.value.consultation_id;
      } catch (fetchError) {
        // If the record is not found, create a new one
        console.warn('Consultation record not found, creating a new one.');
        const newRecord = await consultationRecordService.createConsultationRecord(consultationData);
        consultationId = newRecord.consultation_id;
      }
    } else {
      // Create a new consultation record
      const newRecord = await consultationRecordService.createConsultationRecord(consultationData);
      consultationId = newRecord.consultation_id;
    }

    // Ensure consultationId is obtained
    if (!consultationId) {
      throw new Error('Consultation ID is not available');
    }

    // Handle individual diagnoses via the specialized endpoints if they have disease_id
    // This step allows us to maintain the proper relationships in the database
    for (const complaint of selectedPerson.value.complaints) {
      if (complaint.disease_id) {
        try {
          await consultationRecordService.linkDiagnosisToConsultation(
            consultationId,
            complaint.disease_id
          );
        } catch (error) {
          console.warn(`Failed to link diagnosis ${complaint.disease_id} to consultation: ${error.message}`);
        }
      }
    }

    // Handle medicines if medication administration is enabled
  if (
    selectedPerson.value.medicationAdministration &&
    selectedPerson.value.medicines?.length > 0
  ) {
    // Process each medicine in the array
    for (const medicine of selectedPerson.value.medicines) {
      if (medicine.markedForDeletion) {
        // Delete the medicine if it has an ID (existing record)
        if (medicine.med_administration_id) {
          await consultationRecordService.deleteMedAdministrationRecord(medicine.med_administration_id);
        }
        continue; // Skip to next medicine
      }
      
      // Create new medicine record with tracking information
      const medAdminData = {
        consultation_id: consultationId,
        client_id: selectedPerson.value.clientId,
        admin_id: currentUser.value.admin_id, // Replace with actual admin ID from auth
        med_id: medicine.med_id,
        medName: medicine.name,
        count: Number(medicine.quantity),
        schedule: medicine.schedule || 'As needed',
        start_date: medicine.startDate || new Date().toISOString().split('T')[0],
        end_date: medicine.endDate || new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
        remarks: medicine.remarks || '',
        date: new Date().toISOString(),
        patient: selectedPerson.value.name,
        cause: `Dispensed to ${selectedPerson.value.name} in consultation #${consultationId}`
      };

      try {
        await consultationRecordService.createMedAdministrationRecord(medAdminData);
        console.log(`Medication ${medicine.name} saved successfully`);
      } catch (medicineError) {
        console.error(`Error saving medication ${medicine.name}:`, medicineError);
        // Continue with other medicines instead of failing completely
      }
    }
  }

    // After processing medicines, update the selectedPerson.medicines array
    // to trigger reactivity
    const medAdminRecords = await consultationRecordService.fetchMedAdministrationRecords(consultationId);

    // Map the med admin records to match the expected format
    const mappedMedicines = medAdminRecords.map(record => ({
      med_id: record.med_id,
      consultation_id: record.consultation_id,
      name: record.medName,
      quantity: record.count,
      schedule: record.schedule,
      startDate: new Date(record.start_date).toISOString().split('T')[0],
      endDate: new Date(record.end_date).toISOString().split('T')[0],
      remarks: record.remarks
    }));

    selectedPerson.value.medicines = mappedMedicines;

    // Reset form and refresh data
    selectedPerson.value = null;
    showEditModal.value = false;
    await fetchPatients();
    emit('consultation-saved');
  } catch (error) {
    console.error('Error saving data:', error);
    alert('Failed to save data: ' + error.message);
  }
};

/**
 * Fetches medicine inventory from API
 * @returns {Promise<void>}
 */
/**
 * Fetches inventory items using the inventoryService
 */
/**
 * Fetches inventory items using the consultationRecordService
 */
 const fetchInventory = async () => {
  try {
    // Use the correct service function
    const data = await consultationRecordService.fetchInventory();
    console.log("Fetched inventory data:", data);
    allMedicines.value = data || [];
  } catch (error) {
    console.error('Error fetching inventory:', error);
    allMedicines.value = [];
  }
};

// Add this function to prepare a medicine for the detail modal
const prepareAddMedicine = (medicine) => {
  // Set up the medicine to be added in the detail modal
  selectedMedicine.value = {
    med_id: medicine.med_id,
    name: medicine.name,
    quantity: medicine.requestedQuantity,
    schedule: '',
    startDate: todayFormatted.value,
    endDate: todayFormatted.value,
    remarks: '',
    originalQuantity: medicine.requestedQuantity
  };
  
  // Clear view-only mode and open the modal
  isViewOnly.value = false;
  showMedicineDetailModal.value = true;
};

//Appointments
// Add new function to fetch appointments for selected date
const fetchAppointmentsForSelectedDate = async () => {
  if (props.currentDay && props.currentDay.date) {
    await fetchAppointmentsByDate(props.currentDay.date);
  }
};

// Watch for date changes when on appointments tab
watch(() => props.currentDay, () => {
  if (activeTab.value === 'tab2') {
    fetchAppointmentsForSelectedDate();
  }
}, { deep: true });

// Watch for tab changes
watch(() => activeTab.value, (newTab) => {
  if (newTab === 'tab2') {
    fetchAppointmentsForSelectedDate();
  }
});

// fetch data when mounted
onMounted(() => {
  fetchPeople();
  fetchPatients();
  fetchRecordCount();
  fetchInventory(); 

  if (activeTab.value === 'tab2') {
    fetchAppointmentsForSelectedDate();
  }
});
console.log(patients)

// fetch data when mounted
onMounted(() => {
  fetchPeople();
  fetchPatients();
  fetchRecordCount();
  fetchInventory(); // This should be called
  fetchDiseases();
  fetchDiseaseCategories();
});
console.log(patients)
// Initialize values for meds list
const allMedicines = ref([]);

// Add these with your other refs
const expandedMedicines = ref(new Set());

// Add these computed properties
// Add these computed properties
// Add these computed properties
// Add these computed properties
const groupedMedicines = computed(() => {
  const groups = {};
  // Get today's date for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
  
  allMedicines.value.forEach(item => {
    // Use medName property (from backend API) instead of name
    const name = item.medName;
    if (!groups[name]) {
      groups[name] = [];
    }
    
    // Add expiration status check
    const expired = item.expiration && new Date(item.expiration) < today;
    
    // Handle count properly - ensure it's a valid number
    let itemCount = 0;
    if (item.count !== undefined && item.count !== null) {
      const parsedCount = parseInt(item.count, 10);
      if (!isNaN(parsedCount)) {
        itemCount = parsedCount;
      }
    }
    
    groups[name].push({
      med_id: item.med_id,
      name: item.medName,
      batch_number: item.batch_number || null,
      expiry_date: item.expiration ? new Date(item.expiration).toLocaleDateString() : 'N/A',
      count: itemCount,
      displayCount: itemCount,
      requestedQuantity: 1, // Initialize with default value of 1
      category_id: item.category_id,
      expired
    });
  });

  // Sort each group by expiration date
  Object.keys(groups).forEach(name => {
    groups[name].sort((a, b) => {
      return new Date(a.expiration || 0).getTime() - new Date(b.expiration || 0).getTime();
    });
  });

  return groups;
});

/**
 * Toggles expansion state of medicine group
 * @param {string} name - Medicine name to toggle
 */
const toggleMedicineExpand = (name) => {
  if (expandedMedicines.value.has(name)) {
    expandedMedicines.value.delete(name);
  } else {
    expandedMedicines.value.add(name);
  }
};


// Search functionality
const filteredPeople = computed(() => {
  if (!searchQuery.value) {
    return allPeople.value;
  }
  return allPeople.value.filter(person =>
    person.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const filteredMedicines = computed(() => {
  return selectedPerson.value?.medicines?.filter(medicine => !medicine.markedForDeletion) || [];
});

/**
 * Fetches a specific consultation record
 * @param {number} consultation_id - ID of consultation to fetch
 * @returns {Promise<Object>} Consultation record data
 */
const fetchConsultationRecord = async (consultation_id) => {
  try {
    return await consultationRecordService.fetchConsultationRecord(consultation_id);
  } catch (error) {
    console.error('Error fetching consultation record:', error);
    throw error;
  }
};

/**
 * Opens edit modal with consultation record data
 * @param {Object} patient - Patient to edit
 * @returns {Promise<void>}
 */
const openEditModal = async (patient) => {
  try {
    // Set view-only mode when opening an existing record
    isViewOnly.value = true;
    
    const consultationRecord = await fetchConsultationRecord(patient.consultation_id);
    selectedConsultationRecord.value = consultationRecord;

    let clientCategory = 'N/A';
    let clientGrade = 'N/A';
    let clientSection = 'N/A';
    let clientOccupation = 'N/A';

    try {
      const clientData = await consultationRecordService.fetchPatientById(patient.id);
      if (clientData) {
        clientCategory = clientData.category || 'N/A';
        clientGrade = clientData.grade || 'N/A';
        clientSection = clientData.section || 'N/A';
        clientOccupation = clientData.position || 'N/A';
      }
    } catch (clientError) {
      console.error('Error fetching patient details:', clientError);
    }

    // Fetch medication administration records
    const medAdminRecords = await consultationRecordService.fetchMedAdministrationRecords(patient.consultation_id);

    // Map the med admin records to match the expected format
    const mappedMedicines = medAdminRecords.map(record => ({
      med_id: record.med_id,
      med_administration_id: record.med_administration_id, // Use the new PK
      consultation_id: record.consultation_id,
      name: record.medName,
      quantity: record.count,
      schedule: record.schedule,
      startDate: new Date(record.start_date).toISOString().split('T')[0],
      endDate: new Date(record.end_date).toISOString().split('T')[0],
      remarks: record.remarks
    }));

    // Handle existing diagnoses if available in the consultationRecord
    let diagnosisComplaints = [];
    if (consultationRecord.diagnoses && consultationRecord.diagnoses.length > 0) {
      diagnosisComplaints = consultationRecord.diagnoses.map(diag => ({
        id: generateId(),
        text: diag.diagnosis.name,
        disease_id: diag.diagnosis_id,
        category: diag.diagnosis.category?.name || ''
      }));
    } else if (consultationRecord.complaint) {
      // Fallback to the old way of splitting complaint text
      diagnosisComplaints = consultationRecord.complaint.split(', ').map(text => ({
        id: generateId(),
        text: text.trim()
      }));
    }

    selectedPerson.value = {
      ...patient,
      clientId: patient.id,
      category: clientCategory, // Add category
      grade: clientGrade, // Add grade
      section: clientSection, // Add section
      occupation: clientOccupation, // Add occupation
      complaints: diagnosisComplaints,
      remarks: consultationRecord.remarks,
      confined: consultationRecord.confined,
      medicationAdministration: consultationRecord.medAdministration,
      fatality: consultationRecord.fatality,
      intervention: consultationRecord.intervention,
      medicines: mappedMedicines, // Add the medicines array
      action: consultationRecord.action || '',
      disposition: consultationRecord.disposition || ''
    };

    currentModalPage.value = 1; // Reset to first page when opening
    showEditModal.value = true;
  } catch (error) {
    console.error('Error opening edit modal:', error);
    alert('Failed to load consultation record');
  }
};

/**
 * Deletes a consultation record
 * @param {number} consultation_id - ID of consultation to delete
 * @returns {Promise<void>}
 */
const deleteConsultationRecord = async (consultation_id) => {
  try {
    await consultationRecordService.deleteConsultationRecord(consultation_id);
    await fetchPatients();
    emit('consultation-deleted');
  } catch (error) {
    console.error('Error deleting consultation record:', error);
    alert('Failed to delete consultation record');
  }
};

/**
 * Adds a new person to selected state
 * @param {Object} person - Person to add
 */
const addPerson = (person) => {
  const now = new Date();
  if (person.name && person.section) {
    // Set isViewOnly to false when adding a new person
    isViewOnly.value = false;
    
    selectedPerson.value = {
      ...person,
      addedAt: now,
      medicines: [],
      complaints: selectedPerson.value?.complaints !== undefined ? selectedPerson.value.complaints : [],
      action: '',
      disposition: ''
    };
    selectedTime.value = formatAMPM(now);
    showEditModal.value = true;
  }
};

// Cancel edit
/**
 * Closes edit modal and resets state
 */
const cancelEdit = () => {
  showEditModal.value = false;
  currentModalPage.value = 1; // Reset to first page
  // Reset pending quantities when cancelling
  pendingMedicineQuantities.value = {};
};

/**
 * Closes add modal and resets state
 */
const cancelAdd = () => {
  showAddModal.value = false;
  // Reset pending quantities when cancelling
  pendingMedicineQuantities.value = {};
}
// Medicine modal
/**
 * Opens medicine selection modal
 */
const openMedicineModal = () => {
  showMedicineModal.value = true;
};

// Add medicine

const quantity = ref(1); // Add a ref for quantity


// In AddList.vue
/**
 * Adds medicine to current consultation
 * @param {Object} medicine - Medicine to add
 * @returns {Promise<void>}
 */
 const addMedicine = async (medicine) => {
  try {
    // Create a copy to avoid reference issues
    const medicineToAdd = {
      med_id: medicine.med_id,
      name: medicine.name,
      quantity: Number(medicine.requestedQuantity),
      startDate: todayFormatted.value,
      endDate: todayFormatted.value,
      schedule: '',
      remarks: ''
    };
    
    // Initialize medicines array if it doesn't exist
    if (!selectedPerson.value.medicines) {
      selectedPerson.value.medicines = [];
    }
    
    // Add the medicine to the selected person
    selectedPerson.value.medicines.push(medicineToAdd);
    
    // Update display count to reflect the pending change
    medicine.displayCount -= medicine.requestedQuantity;
    
    // Reset requested quantity
    medicine.requestedQuantity = 1;
    
    console.log('Medicine added:', medicineToAdd);
  } catch (error) {
    console.error('Error adding medicine:', error);
  }
};

// Add validation helper
/**
 * Validates medicine quantity
 * @param {Object} medicine - Medicine to validate
 * @returns {boolean} True if valid quantity
 */
const validateQuantity = (medicine) => {
  const qty = Number(medicine.requestedQuantity);
  return !isNaN(qty) && qty > 0 && qty <= medicine.count;
};

// Helper function to validate medicine data
/**
 * Validates complete medicine data
 * @param {Object} medicine - Medicine data to validate
 * @returns {boolean} True if valid
 */
const validateMedicineData = (medicine) => {
  if (!medicine?.med_id) return false;
  if (!medicine?.requestedQuantity || medicine.requestedQuantity <= 0) return false;
  if (medicine.requestedQuantity > medicine.count) return false;
  return true;
};

// Computed property for medicine addition validation
const canAddMedicine = (medicine) => {
  if (!medicine || !medicine.med_id) return false;
  const requestedQty = Number(medicine.requestedQuantity);
  return !isNaN(requestedQty) && requestedQty > 0 && requestedQty <= medicine.count;
};

/**
 * Opens medicine detail modal for editing
 * @param {Object} medicine - Medicine to edit
 * @param {number} index - Index in medicines array
 */
const editMedicine = (medicine, index) => {
  selectedMedicine.value = {
    med_id: medicine.med_id,
    consultation_id: medicine.consultation_id,
    name: medicine.name,
    quantity: medicine.quantity,
    schedule: medicine.schedule,
    startDate: medicine.startDate,
    endDate: medicine.endDate,
    remarks: medicine.remarks,
    index,
    originalQuantity: medicine.quantity
  };
  isViewOnly.value = false;
  showMedicineDetailModal.value = true;
};

/**
 * Removes medicine from current consultation
 * @param {number} index - Index of medicine to remove
 */
const removeMedicine = (index) => {
  const medicine = selectedPerson.value.medicines[index];
  if (medicine && medicine.med_id && !medicine.markedForDeletion) {
    // Release the pending quantity when removing medicine
    if (pendingMedicineQuantities.value[medicine.med_id]) {
      pendingMedicineQuantities.value[medicine.med_id] -= medicine.quantity || 0;
      if (pendingMedicineQuantities.value[medicine.med_id] <= 0) {
        delete pendingMedicineQuantities.value[medicine.med_id];
      }
    }
  }
  
  selectedPerson.value.medicines[index].markedForDeletion = true;
  console.log(index);
};

/**
 * Cancels medicine selection modal
 */
const cancelMedicine = () => {
  showMedicineModal.value = false;
};

/**
 * Cancels medicine detail modal
 */
const cancelMedicineDetails = () => {
  // If adding a new medicine, release its pending quantity
  if (selectedMedicine.value && selectedMedicine.value.med_id && selectedMedicine.value.index === undefined) {
    const medId = selectedMedicine.value.med_id;
    if (pendingMedicineQuantities.value[medId]) {
      pendingMedicineQuantities.value[medId] -= selectedMedicine.value.quantity || 0;
      if (pendingMedicineQuantities.value[medId] <= 0) {
        delete pendingMedicineQuantities.value[medId];
      }
    }
  }
  
  showMedicineDetailModal.value = false;
  showMedicineModal.value = false;
};

// Selected medicine for detail modal
const selectedMedicine = ref({
  med_id: null,
  name: '',
  quantity: 1,
  schedule: '',
  startDate: '',
  endDate: '',
  remarks: '',
  index: null,
  originalQuantity: 1
});
const emit = defineEmits([
  'confined',
  'update-confined',
  'consultation-saved',
  'consultation-deleted'
]);


// To make sure that if meds is false all meds in list would be removed

watch(
  () => selectedPerson.value?.medicationAdministration,
  (newValue) => {
    if (selectedPerson.value) {
      // Hide the medicines instead of deleting them
      medicinesVisible.value = !!newValue;
    }
  }
);

const isViewOnly = ref(false); // Add this ref to control the editable state

const openViewMedicineModal = (medicine) => {
  selectedMedicine.value = { ...medicine };
  isViewOnly.value = true; // Set the modal to view-only mode
  showMedicineDetailModal.value = true;
};

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

const addComplaint = () => {
  if (!selectedPerson.value.complaints) {
    selectedPerson.value.complaints = [];
  }
  selectedPerson.value.complaints.push({
    id: generateId(),
    text: '' // or any initial text
  });
};

const removeComplaint = (complaintId) => {
  const index = selectedPerson.value.complaints.findIndex(c => c.id === complaintId);
  if (index !== -1) {
    // Immediately remove the complaint
    selectedPerson.value.complaints.splice(index, 1);
  }
};

///// Diseases

// Add new refs for diseases functionality
const diseases = ref([]);
const diseaseCategories = ref([]);
const showAddDiseaseModal = ref(false);
const showAddCategoryModal = ref(false); // New ref for category modal
const newDisease = ref({ name: '', category_id: null, created_by: 1 }); // Removed description
const newCategory = ref({ name: '' }); // New ref for category data
const diagnosisSearchQuery = ref('');

// Add these to your existing refs
const showAddNewDiseaseForm = ref(false);
const showAddNewCategoryForm = ref(false);

// Fetch diseases and categories
const fetchDiseases = async () => {
  try {
    const data = await consultationRecordService.fetchDiseases();
    diseases.value = data;
    console.log('Fetched diseases:', diseases.value.length);

    // Group diseases by category for easier management
    const groupedByCategory = {};
    diseases.value.forEach(disease => {
      const categoryId = disease.category_id;
      if (!groupedByCategory[categoryId]) {
        groupedByCategory[categoryId] = [];
      }
      groupedByCategory[categoryId].push(disease);
    });

  } catch (error) {
    console.error('Error fetching diseases:', error);
    alert('Failed to load diagnoses. Please try refreshing the page.');
  }
};

const fetchDiseaseCategories = async () => {
  try {
    const data = await consultationRecordService.fetchDiseaseCategories();
    diseaseCategories.value = data;
    console.log('Fetched categories:', diseaseCategories.value.length);
  } catch (error) {
    console.error('Error fetching disease categories:', error);
    alert('Failed to load diagnosis categories. Please try refreshing the page.');
  }
};

// Add disease filtering
const filteredDiseases = computed(() => {
  if (!diagnosisSearchQuery.value) {
    return diseases.value.slice(0, 15); // Return a limited number of most recent diagnoses
  }

  const query = diagnosisSearchQuery.value.toLowerCase();
  return diseases.value.filter(disease =>
    disease.name.toLowerCase().includes(query) ||
    (disease.category && disease.category.name.toLowerCase().includes(query))
  );
});

// Method to add a new disease
const addNewDisease = async () => {
  try {
    if (!newDisease.value.name || !newDisease.value.category_id) {
      throw new Error('Disease name and category are required');
    }

    // Add the current admin ID to the disease data
    newDisease.value.created_by = 1; // Replace with actual admin ID from auth

    const response = await consultationRecordService.createDisease(newDisease.value);

    // Add the new disease to the local list
    diseases.value.push(response);

    // Select the newly created disease
    selectDisease(response);

    // Reset the form
    newDisease.value = { name: '', category_id: null, created_by: 1 }; // Removed description

    // Close the modal
    showAddDiseaseModal.value = false;

    // Show success message
    alert('Diagnosis added successfully!');
  } catch (error) {
    console.error('Error adding disease:', error);
    alert('Failed to add disease: ' + error.message);
  }
};

// Method to select a disease for the complaint
const selectDisease = (disease) => {
  if (!selectedPerson.value) {
    console.error('No patient selected');
    return;
  }

  if (!selectedPerson.value.complaints) {
    selectedPerson.value.complaints = [];
  }

  // Check if this disease is already selected to avoid duplicates
  const alreadySelected = selectedPerson.value.complaints.some(
    complaint => complaint.disease_id === disease.diagnosis_id
  );

  if (!alreadySelected) {
    selectedPerson.value.complaints.push({
      id: generateId(),
      text: disease.name,
      disease_id: disease.diagnosis_id,
      category: disease.category?.name || ''
    });
  } else {
    alert('This diagnosis is already selected.');
  }

  diagnosisSearchQuery.value = '';
};

// Method to add a new category
const addNewCategory = async () => {
  try {
    if (!newCategory.value.name) {
      throw new Error('Category name is required');
    }

    const response = await consultationRecordService.createDiseaseCategory(newCategory.value);

    // Add the new category to the local list
    diseaseCategories.value.push(response);

    // Reset the form
    newCategory.value = { name: '' };

    // Close the modal
    showAddCategoryModal.value = false;

    // Show success message
    alert('Category added successfully!');
  } catch (error) {
    console.error('Error adding category:', error);
    alert('Failed to add category: ' + error.message);
  }
};

// Add these new refs for improved UI/UX
const showCategoryInput = ref(false);

// Toggle the category input field
const toggleCategoryInput = () => {
  showCategoryInput.value = !showCategoryInput.value;
  if (!showCategoryInput.value) {
    newCategory.value = { name: '' }; // Reset when hiding
  }
};

// Add a new category inline and select it
const addNewCategoryInline = async () => {
  try {
    if (!newCategory.value.name) {
      alert('Please enter a category name');
      return;
    }

    const response = await consultationRecordService.createDiseaseCategory(newCategory.value);

    // Add the new category to the local list
    diseaseCategories.value.push(response);

    // Select the newly created category
    newDisease.value.category_id = response.category_id;

    // Reset and hide the input
    newCategory.value = { name: '' };
    showCategoryInput.value = false;

    // Show success message
    alert('Category added successfully!');
  } catch (error) {
    console.error('Error adding category:', error);
    alert('Failed to add category: ' + error.message);
  }
};

// Add delete functionality for diagnoses
const deleteDisease = async (diagnosisId) => {
  try {
    if (confirm('Are you sure you want to delete this diagnosis? This cannot be undone.')) {
      await consultationRecordService.deleteDisease(diagnosisId);

      // Remove from local list
      diseases.value = diseases.value.filter(d => d.diagnosis_id !== diagnosisId);

      alert('Diagnosis deleted successfully!');
    }
  } catch (error) {
    console.error('Error deleting diagnosis:', error);
    alert('Failed to delete diagnosis: ' + error.message);
  }
};

// Make sure to include these in onMounted


// Add these refs
const diagnosisManageSearchQuery = ref('');

// Computed property to organize diseases by category
const diseasesByCategory = computed(() => {
  const grouped = {};

  // Group by category_id
  diseases.value.forEach(disease => {
    const categoryId = disease.category_id || 'uncategorized';
    if (!grouped[categoryId]) {
      grouped[categoryId] = [];
    }
    grouped[categoryId].push(disease);
  });

  // Sort categories by name
  const sortedGrouped = {};
  Object.keys(grouped).sort((a, b) => {
    const catA = getCategoryName(a);
    const catB = getCategoryName(b);
    return catA.localeCompare(catB);
  }).forEach(key => {
    sortedGrouped[key] = grouped[key];
  });

  return sortedGrouped;
});

// Helper to get category name by ID
const getCategoryName = (categoryId) => {
  if (categoryId === 'uncategorized') return 'Uncategorized';
  const category = diseaseCategories.value.find(c => c.category_id == categoryId);
  return category ? category.name : 'Unknown';
};

// Filter diagnoses by category with search
const filteredDiagnosesByCategory = (categoryId, customSearchQuery) => {
  // Use the provided search query or fall back to the global one
  const searchToUse = customSearchQuery !== undefined ? customSearchQuery : diagnosisManageSearchQuery.value;

  if (!searchToUse) {
    return diseasesByCategory.value[categoryId] || [];
  }

  const query = searchToUse.toLowerCase();
  return (diseasesByCategory.value[categoryId] || []).filter(disease =>
    disease.name.toLowerCase().includes(query)
  );
};

// Add category deletion function
const deleteCategory = async (categoryId) => {
  try {
    if (!confirm('Are you sure you want to delete this category? This will also delete ALL diagnoses under this category. This action cannot be undone.')) {
      return;
    }

    // Delete all diseases in the category first
    const diseasesToDelete = diseases.value.filter(d => d.category_id === categoryId);
    for (const disease of diseasesToDelete) {
      await consultationRecordService.deleteDisease(diagnosis_id);
    }

    // Then delete the category itself
    await consultationRecordService.deleteDiseaseCategory(categoryId);

    // Update local state
    diseases.value = diseases.value.filter(d => d.category_id !== categoryId);
    diseaseCategories.value = diseaseCategories.value.filter(c => c.category_id !== categoryId);

    // Show success message
    alert('Category and associated diagnoses deleted successfully!');
  } catch (error) {
    console.error('Error deleting category:', error);
    alert('Failed to delete category: ' + error.message);
  }
};

// Add this to your onMounted or in a method that resets the form state
const resetFormStates = () => {
  showAddNewDiseaseForm.value = false;
  showAddNewCategoryForm.value = false;
  newDisease.value = { name: '', category_id: null, created_by: 1 };
  newCategory.value = { name: '' };
};

// Add these new refs for managing the modals
const showAddDiagnosisModal = ref(false);
const showManageModal = ref(false);
const activeManageTab = ref('diagnoses');

/**
 * Opens the add diagnosis modal
 */
const openAddDiagnosisModal = () => {
  // Reset the form
  newDisease.value = { name: '', category_id: null, created_by: 1 };
  showAddDiagnosisModal.value = true;
};

/**
 * Cancels adding a diagnosis and closes the modal
 */
const cancelAddDiagnosis = () => {
  showAddDiagnosisModal.value = false;
};

/**
 * Opens the add category modal
 */
const openAddCategoryModal = () => {
  // Reset the form
  newCategory.value = { name: '' };
  showAddCategoryModal.value = true;
};

/**
 * Cancels adding a category and closes the modal
 */
const cancelAddCategory = () => {
  showAddCategoryModal.value = false;
};

/**
 * Opens the management modal
 */
const openManageModal = () => {
  showManageModal.value = true;
  activeManageTab.value = 'diagnoses';
};

/**
 * Closes the management modal
 */
const closeManageModal = () => {
  showManageModal.value = false;
};

/**
 * Saves a new diagnosis
 * @returns {Promise<void>}
 */
const saveDiagnosis = async () => {
  try {
    if (!newDisease.value.name || !newDisease.value.category_id) {
      throw new Error('Disease name and category are required');
    }

    newDisease.value.created_by = 1; // Replace with actual admin ID

    const response = await consultationRecordService.createDisease(newDisease.value);

    // Add to local list
    diseases.value.push(response);

    // Close the modal
    showAddDiagnosisModal.value = false;

    // Show success message
    alert('Diagnosis added successfully!');

    // Optionally, select the new diagnosis if we're in the consultation form
    if (selectedPerson.value) {
      selectDisease(response);
    }

  } catch (error) {
    console.error('Error adding diagnosis:', error);
    alert('Failed to add diagnosis: ' + error.message);
  }
};

/**
 * Saves a new category
 * @returns {Promise<void>}
 */
const saveCategory = async () => {
  try {
    if (!newCategory.value.name) {
      throw new Error('Category name is required');
    }

    const response = await consultationRecordService.createDiseaseCategory(newCategory.value);

    // Add to local list
    diseaseCategories.value.push(response);

    // If we're adding from the diagnosis modal, select this new category
    if (showAddDiagnosisModal.value) {
      newDisease.value.category_id = response.category_id;
    }

    // Close the category modal
    showAddCategoryModal.value = false;

    // Show success message
    alert('Category added successfully!');

  } catch (error) {
    console.error('Error adding category:', error);
    alert('Failed to add category: ' + error.message);
  }
};

// Function to switch tabs
const switchTab = (tab) => {
  activeTab.value = tab;
};

// Add this new ref to control dropdown visibility
const showDiagnosisDropdown = ref(false);

// Note: We already have filteredDiseases computed property defined earlier in the code

// Function to toggle the diagnosis dropdown
const toggleDiagnosisDropdown = () => {
  showDiagnosisDropdown.value = !showDiagnosisDropdown.value;
};

// Close dropdown when clicking outside
const closeDiagnosisDropdown = () => {
  showDiagnosisDropdown.value = false;
};

const currentModalPage = ref(1);

// Add these refs
const showStatusModal = ref(false);
const selectedAppointment = ref(null);
const appointmentStatus = ref('pending');
const appointmentNotes = ref('');
const isUpdatingStatus = ref(false);

// Function to open status modal
const openStatusModal = (appointment) => {
  selectedAppointment.value = appointment;
  appointmentStatus.value = appointment.status || 'pending';
  appointmentNotes.value = appointment.notes || '';
  showStatusModal.value = true;
};

// Function to close status modal
const closeStatusModal = () => {
  showStatusModal.value = false;
  selectedAppointment.value = null;
  appointmentStatus.value = 'pending';
  appointmentNotes.value = '';
};

// Function to update appointment status
const updateAppointmentStatus = async () => {
  if (!selectedAppointment.value) return;
  
  try {
    isUpdatingStatus.value = true;
    
    // Use the service function instead of direct fetch
    const data = await consultationRecordService.updateAppointmentStatus(
      selectedAppointment.value.appointment_id,
      appointmentStatus.value,
      appointmentNotes.value
    );
    
    // Update the appointment in the list
    const index = appointments.value.findIndex(a => a.appointment_id === selectedAppointment.value.appointment_id);
    if (index !== -1) {
      appointments.value[index].status = appointmentStatus.value;
      appointments.value[index].notes = appointmentNotes.value;
    }
    
    // Close the modal
    closeStatusModal();
    
    // Show success message
    alert('Appointment status updated successfully');
  } catch (error) {
    console.error('Error updating appointment status:', error);
    alert('Error updating appointment status: ' + error.message);
  } finally {
    isUpdatingStatus.value = false;
  }
};

// Function to get status class
const getStatusClass = (status) => {
  switch (status) {
    case 'approved': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-blue-100 text-blue-800';
  }
};

// Add this after the other refs at the top level of your script
const pendingMedicineQuantities = ref({}); // Track quantities that are "reserved" but not yet committed to DB

/**
 * Shows confirmation modal for actions that need confirmation
 */
const confirmAction = (action) => {
  pendingSaveAction.value = action;
  
  if (action === 'consultation') {
    confirmationMessage.value = 'Are you sure you want to save this consultation record? This action cannot be undone once saved.';
  } else {
    confirmationMessage.value = 'Are you sure you want to proceed with this action?';
  }
  
  showConfirmationModal.value = true;
};

/**
 * Handle confirmation from the modal
 */
const handleConfirm = async () => {
  try {
    if (pendingSaveAction.value === 'consultation') {
      await savePerson();
    } else if (pendingSaveAction.value === 'medicine') {
      await saveMedicineDetails();
    } else if (pendingSaveAction.value === 'delete' && selectedConsultationRecord.value) {
      await deleteConsultationRecord(selectedConsultationRecord.value.consultation_id);
    }
  } catch (error) {
    console.error('Error processing confirmed action:', error);
  } finally {
    // Always clean up the modal state
    showConfirmationModal.value = false;
    pendingSaveAction.value = null;
  }
};

/**
 * Handle cancellation from the modal
 */
const handleCancel = () => {
  showConfirmationModal.value = false;
  pendingSaveAction.value = null;
};

// Add this computed property after your other computed properties
const todayFormatted = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
});

// Update the saveMedicineDetails function to include date validation
const saveMedicineDetails = async () => {
  try {
    const medicine = selectedMedicine.value;
    if (!medicine || !medicine.med_id) {
      throw new Error('Invalid medicine details');
    }

    // Additional validation
    if (!medicine.startDate || !medicine.endDate) {
      throw new Error('Start date and end date are required');
    }

    // Validate that start date is not before today
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
    const startDate = new Date(medicine.startDate);
    if (startDate < today) {
      throw new Error('Start date cannot be before today');
    }

    // Validate that end date is not before start date
    const endDate = new Date(medicine.endDate);
    if (endDate < startDate) {
      throw new Error('End date cannot be before start date');
    }
    
    // Validate quantity
    if (!medicine.quantity || medicine.quantity <= 0) {
      throw new Error('Valid quantity is required');
    }

    // If editing an existing medicine
    if (medicine.index !== undefined) {
      const oldQty = selectedPerson.value.medicines[medicine.index].quantity || 0;
      const newQty = medicine.quantity;
      const qtyDiff = newQty - oldQty;
      
      if (qtyDiff !== 0) {
        pendingMedicineQuantities.value[medicine.med_id] = 
          (pendingMedicineQuantities.value[medicine.med_id] || 0) + qtyDiff;
      }
      
      selectedPerson.value.medicines[medicine.index] = { ...medicine };
    } else {
      // For new medicine, find the original medicine in allMedicines to update the display count
      const medicineGroups = Object.values(groupedMedicines.value).flat();
      const originalMedicine = medicineGroups.find(m => m.med_id === medicine.med_id);
      
      if (originalMedicine) {
        originalMedicine.displayCount -= medicine.quantity;
        
        // Create the medicine object to add
        const medicineToAdd = {
          med_id: medicine.med_id,
          name: medicine.name,
          quantity: Number(medicine.quantity),
          startDate: medicine.startDate,
          endDate: medicine.endDate,
          schedule: medicine.schedule || '',
          remarks: medicine.remarks || ''
        };
        
        // Add to selected person's medicines
        if (!selectedPerson.value.medicines) {
          selectedPerson.value.medicines = [];
        }
        selectedPerson.value.medicines.push(medicineToAdd);
      }
    }

    showMedicineDetailModal.value = false;
  } catch (error) {
    console.error('Error saving medicine details:', error);
    alert(error.message);
  }
};

// Add this helper function to handle delayed actions (fixes setTimeout issue)
const delayedAction = (callback, delay) => {
  window.setTimeout(() => {
    callback();
  }, delay);
};
</script>

<template>
  <div class="fixed w-4/6">
    <div class="fixed top-0 right-0 w-1/4 h-screen p-5 bg-gray-100">
      <div class="h-full p-5 overflow-y-auto">
        <!-- Tabs navigation -->
        <div class="flex border-b border-[#a6a6a6] mb-4">
          <button 
            @click="activeTab = 'tab1'" 
            :class="[
              'text-2xl font-semibold',
              activeTab === 'tab1' 
                ? 'text-[#2f4a71] border-b-2 border-[#2f4a71]' 
                : 'text-gray-500 hover:text-[#2f4a71]'
            ]"
          >
            Consultations
          </button>
        </div>

        <!-- Consultation Records -->
        <div v-if="activeTab === 'tab1'">
          <div class="mt-5 mb-5">
            <span class="text-2xl font-bold text-[#2f4a71]">{{ selectedDate.monthYear }}</span>
            <span class="text-2xl text-[#2f4a71] float-right">{{ selectedDate.day }}</span>
          </div>

          <!-- Consultation Records List -->
          <div v-if="patients.length > 0" class="space-y-4">
            <div 
              v-for="patient in patients" 
              :key="patient.consultation_id" 
              class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md"
            >
              <h4 class="text-lg font-bold text-[#2f4a71]">{{ patient.name }}</h4>
              <p class="text-sm text-gray-600">Grade {{ patient.grade }}-{{ patient.section }}</p>
              <p class="text-sm text-gray-600">Category: {{ patient.category }}</p>
            </div>
          </div>

          <!-- No Records Message -->
          <div v-else class="py-6 text-center">
            <p class="text-gray-600">No consultation records for this date.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
textarea {
  resize: none;
}

.time-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 15px 0;
}

.time-picker-select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  color: #999;
  height: 30px;
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.modal-close:hover {
  background-color: #f0f0f0;
  color: #333;
}

.modal-body {
  margin-bottom: 20px;
}

.modal-footer {
  margin-top: 15px;
}

/* Animation */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.appointments-list {
  max-height: calc(100vh - 350px);
  overflow-y: auto;
}

/* Existing AddList styles */
.marquee {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  height: 1.5em;
}
.marquee:hover {
  animation: scroll-left 10s linear infinite;
}
@keyframes scroll-left {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(-100%);
  }
}
.confinement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.confinement-details {
  flex-grow: 1;
  margin-right: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.text-gray-600 {
  color: #718096;
}
</style>