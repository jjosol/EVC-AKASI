<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { formatAMPM } from '~/composables/useTimeFormatter';
import moment from 'moment-timezone';
import { useProfile } from '~/composables/useProfile'
import { useAppointmentsByDate } from '~/composables/useAppointmentsByDate';
import * as consultationRecordService from '~/services/consultationRecordService';
import { fetchInventory } from '~/services/medicineService';
import { Icon } from '@iconify/vue';

// Import all the components

import AddModal from './addListComponents/AddModal.vue';
import EditModal from './addListComponents/EditModal.vue';
import MedicineModal from './addListComponents/MedicineModal.vue';
import MedicineDetailModal from './addListComponents/MedicineDetailModal.vue';
import AddDiagnosisModal from './addListComponents/AddDiagnosisModal.vue';
import AddCategoryModal from './addListComponents/AddCategoryModal.vue';
import StatusModal from './addListComponents/StatusModal.vue';

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
const showAddModal = ref(false);
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
    
    const consultationData = {
      patient_id: selectedPerson.value.clientId, // FIX: use patient_id
      nurse_id: currentUser.value.admin_id,     // FIX: use nurse_id
      nurse_name: currentUser.value.name, // Ensure nurse_name is set
      date: selectedDateTime.toISOString(),
      patient_name: selectedPerson.value.name,
      patient_occupation:
        selectedPerson.value.occupation ||
        `${selectedPerson.value.grade}-${selectedPerson.value.section}`,
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
      disposition: selectedPerson.value.disposition || '',
      doctorShow: hasNonOTCMedicines.value // Automatically set doctorShow if non-OTC medicines are included
    };
    // Debug: log consultationData before sending
    console.log('Consultation data:', consultationData);

    // Use the service function instead of direct fetch
    const newConsultation = await consultationRecordService.createConsultationRecord(consultationData);
    const consultationId = newConsultation.consultation_id;

    // Save each medicine to medAdministration only after consultation is created
    if (selectedPerson.value.medicines && consultationId) {
      for (const medicine of selectedPerson.value.medicines) {
        // Prepare the payload
        const medPayload = {
          consultation_id: consultationId,
          patient_id: selectedPerson.value.clientId,
          nurse_id: currentUser.value.admin_id,
          med_id: medicine.med_id,
          medName: medicine.name,
          count: Number(medicine.quantity),
          schedule: medicine.schedule || '',
          // Convert to ISO string for backend/Prisma
          start_date: medicine.startDate ? new Date(medicine.startDate).toISOString() : undefined,
          end_date: medicine.endDate ? new Date(medicine.endDate).toISOString() : undefined,
          date: new Date().toISOString(),
          patient_name: selectedPerson.value.name,
          remarks: medicine.remarks || '',
        };
        // List of required fields
        const requiredFields = [
          'consultation_id', 'patient_id', 'nurse_id', 'med_id', 'medName', 'count', 'schedule', 'start_date', 'end_date', 'date', 'patient_name'
        ];
        // Check for missing fields
        const missingFields = requiredFields.filter(field => {
          return medPayload[field] === undefined || medPayload[field] === null || medPayload[field] === '';
        });
        // Log the payload and missing fields for debugging
        console.log('Med administration payload:', JSON.stringify(medPayload, null, 2));
        if (missingFields.length > 0) {
          console.error('Skipping med administration record due to missing fields:', missingFields, medPayload);
          continue;
        }
        try {
          await consultationRecordService.createMedAdministrationRecord(medPayload);
        } catch (err) {
          console.error('Error creating med administration:', err, medPayload);
        }
      }
    }

    // Close modal and refresh list
    showEditModal.value = false;
    await fetchPatients();
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
      clientId: patient.patient_id,
      name: patient.name,
      section: patient.section || 'N/A',
      grade: patient.grade || 'N/A',
      age: patient.age || 0,
      sex: patient.gender || 'N/A',
      type: patient.type || 'N/A',
      category: patient.type?.toLowerCase() === 'student' ? patient.category : patient.division || 'N/A',
      occupation: patient.type || 'N/A'
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
    
    const currentDate = moment(props.currentDay.date).tz("Asia/Manila");
    
    patients.value = data
      .filter(record => {
        const recordDate = moment(record.date).tz("Asia/Manila");
        return recordDate.isSame(currentDate, 'day');
      })
      .map((record) => ({
        id: record.patient_id,
        consultation_id: record.consultation_id,
        name: record.patient_name,
        occupation: record.patient?.type || 'N/A',
        category: record.patient?.type?.toLowerCase() === 'student' 
          ? record.patient?.category 
          : record.patient?.division || 'N/A',
        time: moment(record.date).tz("Asia/Manila").format('hh:mm A'),
        complaint: record.complaint,
        remarks: record.remarks,
        confined: record.confined,
        medAdministration: record.medAdministration,
        intervention: record.intervention,
        action: record.action,
        disposition: record.disposition,
        doctorShow: record.doctorShow || false,
        doctor_reviewed: record.doctor_reviewed || false,
        nurse_notified: record.nurse_notified || false
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
      throw new Error('At least one complaint is required');
    }

    // Prepare consultation data
    const selectedDateTime = new Date(props.currentDay.date);
    const now = new Date();
    selectedDateTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const consultationData = {
      patient_id: selectedPerson.value.clientId,
      nurse_id: currentUser.value.admin_id,
      nurse_name: currentUser.value.name,
      date: selectedDateTime.toISOString(),
      patient_name: selectedPerson.value.name,
      patient_occupation: selectedPerson.value.occupation || `${selectedPerson.value.grade}-${selectedPerson.value.section}`,
      complaint: selectedPerson.value.complaints.length > 0 ? selectedPerson.value.complaints.map(c => c.text).join(', ') : null,
      remarks: selectedPerson.value.remarks || '',
      confined: Boolean(selectedPerson.value.confined),
      medAdministration: Boolean(selectedPerson.value.medicationAdministration),
      fatality: Boolean(selectedPerson.value.fatality),
      intervention: selectedPerson.value.intervention || '',
      action: selectedPerson.value.action || '',
      disposition: selectedPerson.value.disposition || '',
      doctorShow: hasNonOTCMedicines.value,
      medical_data: {
        patientType: selectedPerson.value.occupation || 'Student',
        patientCategory: selectedPerson.value.category || 'N/A',
        patientGrade: selectedPerson.value.grade || null,
        patientSection: selectedPerson.value.section || null,
        patientAge: selectedPerson.value.age || null,
        patientGender: selectedPerson.value.sex || null,
        created_at: new Date().toISOString()
      }
    };

    // Debug: log consultationData before sending
    console.log('Consultation data:', consultationData);

    // Use the service function instead of direct fetch
    const newConsultation = await consultationRecordService.createConsultationRecord(consultationData);
    const consultationId = newConsultation.consultation_id;
    
    // Continue with the rest of the function...
    // ...existing code for handling medicines...
  } catch (error) {
    console.error('Error creating consultation record:', error);
    throw error;
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
      med_id: item.med_id || item.medicine_id, // Fix: ensure med_id is always set
      name: item.medName,
      batch_number: item.batch_number || null,
      expiry_date: item.expiration ? new Date(item.expiration).toLocaleDateString() : 'N/A',
      count: itemCount,
      displayCount: itemCount,
      requestedQuantity: 1, // Initialize with default value of 1
      category_id: item.category_id,
      expired,
      otc: item.otc === true // Ensure boolean, pass to modal
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

    // Fetch patient details to get the most up-to-date information
    const clientData = await consultationRecordService.fetchPatientById(patient.id);

    // Set category based on patient type
    const displayCategory = clientData.type?.toLowerCase() === 'student' 
      ? clientData.category 
      : clientData.division;

    selectedPerson.value = {
      ...patient,
      clientId: patient.id,
      category: displayCategory || 'N/A',
      grade: clientData.grade || 'N/A',
      section: clientData.section || 'N/A',
      occupation: clientData.type || 'N/A',
      complaints: consultationRecord.diagnoses?.map(diag => ({
        id: generateId(),
        text: diag.diagnosis.name,
        disease_id: diag.diagnosis_id,
        category: diag.diagnosis.category?.name || ''
      })) || [],
      remarks: consultationRecord.remarks,
      confined: consultationRecord.confined,
      medicationAdministration: consultationRecord.medAdministration,
      intervention: consultationRecord.intervention,
      action: consultationRecord.action || '',
      disposition: consultationRecord.disposition || '',
      nurse_followup: consultationRecord.nurse_followup || ''
    };

    // Check if the record has been reviewed by a doctor
    const hasBeenReviewed = patient.doctor_reviewed || 
                          (consultationRecord.doctor_diagnosis && consultationRecord.doctor_diagnosis.trim() !== '');

    // Set initial page to first page when opening
    currentModalPage.value = 1;
    
    // Open the edit modal
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
    console.log('Deleting consultation record:', consultation_id);
    await consultationRecordService.deleteConsultationRecord(consultation_id);
    await fetchPatients(); // Refresh the list
    showConfirmationModal.value = false; // Close the confirmation modal
    emit('consultation-deleted');
  } catch (error) {
    console.error('Error deleting consultation record:', error);
    alert('Failed to delete consultation record: ' + error.message);
  }
};

// Add this new method for delete confirmation
const confirmDelete = (consultation_id) => {
  selectedConsultationRecord.value = { consultation_id };
  confirmationMessage.value = 'Are you sure you want to delete this consultation record? This action cannot be undone.';
  showConfirmationModal.value = true;
  pendingSaveAction.value = 'delete';
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
      schedule: medicine.schedule || '',
      remarks: medicine.remarks || ''
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
      await consultationRecordService.deleteDisease(disease.diagnosis_id);
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



// Add this computed property after your other computed properties
const todayFormatted = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
});

// Update the saveMedicineDetails function to include date validation and debug logs
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

    // Convert dates to ISO string for consistency
    const isoStart = medicine.startDate ? new Date(medicine.startDate).toISOString() : undefined;
    const isoEnd = medicine.endDate ? new Date(medicine.endDate).toISOString() : undefined;
    console.log('Saving medicine details:', {
      ...medicine,
      startDate: isoStart,
      endDate: isoEnd
    });
    // If editing an existing medicine
    if (medicine.index !== undefined) {
      selectedPerson.value.medicines[medicine.index] = { ...medicine, startDate: isoStart, endDate: isoEnd };
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
          startDate: isoStart,
          endDate: isoEnd,
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

/**
 * Sends a consultation record to the doctor's view
 * @param {Object} patient - Patient whose record to send
 * @returns {Promise<void>}
 */
const sendToDoctor = async (patient) => {
  try {
    if (patient.doctor_reviewed) {
      // If doctor has reviewed, don't allow sending again
      return;
    }
    
    // Ensure we have the required fields for the API
    if (!patient.id) {
      throw new Error('Patient ID is required');
    }
    
    // Update the doctorShow field to true with the required fields
    await consultationRecordService.updateDoctorShow(patient.consultation_id, true, {
      patient_id: patient.id, // Add the patient_id field
      patient_name: patient.name // Add the patient_name field
    });
    
    // Update the local record
    const index = patients.value.findIndex(p => p.consultation_id === patient.consultation_id);
    if (index !== -1) {
      patients.value[index].doctorShow = true;
    }
    
    // Show success message
    alert('Record sent to doctor successfully');
  } catch (error) {
    console.error('Error sending record to doctor:', error);
    alert('Error sending record to doctor: ' + error.message);
  }
};

// Add computed property to detect if any non-OTC medicines are included
const hasNonOTCMedicines = computed(() => {
  if (!selectedPerson.value?.medicines || selectedPerson.value.medicines.length === 0) {
    return false;
  }

  // Check if any non-deleted medicine is non-OTC
  return selectedPerson.value.medicines.some(med => {
    // Skip medicines marked for deletion
    if (med.markedForDeletion) return false;
    
    // Find the medicine in the inventory to check if it's OTC
    const medicineGroups = Object.values(groupedMedicines.value).flat();
    const foundMedicine = medicineGroups.find(m => m.med_id === med.med_id);
    
    // If medicine is found and it's not OTC, return true
    return foundMedicine && foundMedicine.otc === false;
  });
});

// Chief complaint multiple values
const chiefComplaints = ref([{ id: generateId(), value: '', details: '' }]);

// Helper to get display value for chief complaint
function getChiefComplaintValue(complaint) {
  if (complaint.value === 'Injury' || complaint.value === 'Other') {
    return complaint.value + (complaint.details ? ': ' + complaint.details : '');
  }
  return complaint.value || '';
}

// Add new chief complaint
function addChiefComplaint() {
  chiefComplaints.value.push({ id: generateId(), value: '', details: '' });
}

// Remove chief complaint
function removeChiefComplaint(complaintId) {
  if (chiefComplaints.value.length > 1) {
    chiefComplaints.value = chiefComplaints.value.filter(c => c.id !== complaintId);
  }
}

// Check if a complaint value is already selected in another dropdown
function isComplaintValueSelected(value, currentId) {
  // Always allow selecting "Injury" or "Other" in any dropdown
  if (value === 'Injury' || value === 'Other') return false;
  
  // Check if the value is selected in any other dropdown
  return chiefComplaints.value.some(complaint => 
    complaint.id !== currentId && complaint.value === value
  );
}

// Actions Taken (like chiefComplaints)
const actionOptions = [
  'Student laid/sat in clinic for 20 minutes or less',
  'Student laid/sat in clinic for 20 minutes or more',
  'Temperature taken',
  'Ice pack applied to affected area',
  'Affected area cleaned',
  'Band aid applied to affected area',
  'Medication given',
  'Head checked for',
  'Parent/guardian notified at',
  'Other'
];

const actionsTaken = ref([
  { id: generateId(), value: '', details: '' }
]);

function getActionDisplayValue(action) {
  if (
    action.value === 'Head checked for' ||
    action.value === 'Parent/guardian notified at' ||
    action.value === 'Other'
  ) {
    return action.value + (action.details ? ': ' + action.details : '');
  }
  return action.value || '';
}

function addActionTaken() {
  actionsTaken.value.push({ id: generateId(), value: '', details: '' });
}

function removeActionTaken(actionId) {
  if (actionsTaken.value.length > 1) {
    actionsTaken.value = actionsTaken.value.filter(a => a.id !== actionId);
  }
}

function isActionValueSelected(value, currentId) {
  // Always allow selecting these in any dropdown
  if (
    value === 'Other' ||
    value === 'Head checked for' ||
    value === 'Parent/guardian notified at'
  )
    return false;
  return actionsTaken.value.some(action => action.id !== currentId && action.value === value);
}

// Disposition options for student
const dispositionOptions = [
  'Returned to class, feeling better',
  "Returned to class at parent's/guardian's request",
  'Returned to class, unable to contact parent/guardian',
  'Sent home',
  'Teacher notified',
  'Referral was made to health care provider',
  'Transported to hospital',
  'Copy of clinic pass sent home',
  'Other'
];

// Dispositions array (like chiefComplaints)
const dispositions = ref([{ id: generateId(), value: '', details: '' }]);

function getDispositionDisplayValue(disposition) {
  if (disposition.value === 'Other') {
    return disposition.value + (disposition.details ? ': ' + disposition.details : '');
  }
  return disposition.value || '';
}

function addDisposition() {
  dispositions.value.push({ id: generateId(), value: '', details: '' });
}

function removeDisposition(dispositionId) {
  if (dispositions.value.length > 1) {
    dispositions.value = dispositions.value.filter(d => d.id !== dispositionId);
  }
}

function isDispositionValueSelected(value, currentId) {
  if (value === 'Other') return false;
  return dispositions.value.some(disposition => disposition.id !== currentId && disposition.value === value);
}

// Sync with selectedPerson.disposition (for saving/loading)
watch(
  dispositions,
  (newVal) => {
    selectedPerson.value.disposition = newVal
      .filter(d => d.value)
      .map(d => getDispositionDisplayValue(d))
      .join(', ');
  },
  { deep: true }
)

watch(
  () => selectedPerson.value && selectedPerson.value.disposition,
  (newVal) => {
    if (!newVal) {
      dispositions.value = [{ id: generateId(), value: '', details: '' }];
    }
    // Optionally, parse string to array if needed
  }
)

</script>

<template>
  <div class="fixed w-4/6">
    <div class="fixed top-0 right-0 w-1/4 h-screen p-5 bg-gray-100">
    <div class="h-full p-5 overflow-y-auto l">
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
          <button 
            @click="activeTab = 'tab2'" 
            :class="[
              'text-2xl font-semibold ml-5',
              activeTab === 'tab2' 
                ? 'text-[#2f4a71] border-b-2 border-[#2f4a71]' 
                : 'text-gray-500 hover:text-[#2f4a71]'
            ]"
          >
            Appointments
          </button>
      </div>
      
      <!--Confinements-->
      <div v-if="activeTab === 'tab1'">

      <div class="mt-5 mb-5">
        <span class="text-2xl font-bold text-[#2f4a71]">{{ selectedDate.monthYear }}</span>
        <span class="text-2xl text-[#2f4a71] float-right">{{ selectedDate.day }}</span>
      </div>
      <button @click="showAddModal = true" v-if="!showAddModal"class="w-full p-2 font-bold text-white bg-[#2f4a71] rounded hover:bg-[#8b67db]">Add Consultation Record</button>

      
      <button @click="cancelAdd" v-if="showAddModal" class="block pl-3 pr-3 pt-1 pb-1 float-right ml-5 text-1xl active:bg-blue-700 text-white rounded-lg  bg-[#745dab] "> <Icon icon="mdi:close" class="w-5 h-5" /></button>
      <div v-if="showAddModal">
        <!-- Use the AddModal component -->
        <AddModal 
          :show="showAddModal"
          :people="filteredPeople"
          :search-query="searchQuery"
          @update:search-query="searchQuery = $event"
          @cancel="cancelAdd"
          @add-person="addPerson"
        />
      </div>
      <ul class="mt-4 overflow-y-auto max-h-60">
        <li v-for="(patient, index) in patients" :key="patient.consultation_id" class="flex items-center justify-between mb-2 text-lg confinement-item text-[#2f4a71]">
          <span @click="openEditModal(patient)" class="cursor-pointer confinement-details">
            {{ patient.name }} - {{ patient.time }} 
          </span>
          <div class="flex items-center">
            <!-- Send to Doctor Button -->
            <button 
              v-if="!patient.doctor_reviewed"
              @click="sendToDoctor(patient)" 
              class="p-1 mr-1 text-white bg-green-500 rounded hover:bg-green-600" 
              :class="{ 'opacity-50 cursor-not-allowed': patient.doctorShow }"
              :title="patient.doctorShow ? 'Already sent to doctor' : 'Send to doctor'"
              :disabled="patient.doctorShow"
            >
              <Icon icon="mdi:arrow-right" class="w-5 h-5" />
            </button>
            <!-- Doctor Reviewed Indicator -->
            <button 
              v-else 
              class="p-1 mr-1 text-white bg-blue-500 rounded cursor-not-allowed"
              title="Doctor has reviewed this record"
            >
              <Icon icon="mdi:arrow-left" class="w-5 h-5" />
            </button>
            <!-- Delete Button -->
            <button 
              @click="confirmDelete(patient.consultation_id)" 
              class="p-1 text-white bg-red-500 rounded hover:bg-red-600"
            >
              <Icon icon="fluent:delete-28-regular" class="w-5 h-5" />
            </button>
          </div>
        </li>
      </ul>
    </div>

    <!-- Appointments -->
    <div v-if="activeTab === 'tab2'">
        <div class="mt-5 mb-5">
          <span class="text-2xl font-bold text-[#2f4a71]">{{ selectedDate.monthYear }}</span>
          <span class="text-2xl text-[#2f4a71] float-right">{{ selectedDate.day }}</span>
        </div>

        <!--Display all fetched appointments here-->
<!-- Loading state -->
<div v-if="loadingAppointments" class="py-6 text-center">
            <p class="text-gray-600">Loading appointments...</p>
          </div>
          
          <!-- Error state -->
          <div v-else-if="appointmentsError" class="p-3 my-4 text-red-700 bg-red-100 rounded">
            <p>{{ appointmentsError }}</p>
            <button @click="fetchAppointmentsForSelectedDate" class="mt-1 text-sm underline">
              Try again
            </button>
          </div>
          
          <!-- No appointments -->
          <div v-else-if="appointments.length === 0" class="py-6 text-center">
            <p class="text-gray-600">No appointments scheduled for this date</p>
          </div>
          
          <!-- Appointments list -->
          <div v-else class="mt-6 space-y-4 appointment-list">
            <div 
              v-for="appointment in appointments" 
              :key="appointment.appointment_id" 
              class="p-3 transition-shadow bg-white border border-gray-200 rounded-lg hover:shadow-md"
            >
              <div class="flex items-start justify-between"> 
                <div>
                  <h4 class="font-bold">
                    {{ appointment.patient?.name || 'Patient #' + appointment.patient_id }}
                  </h4>
                  <p class="text-xs text-gray-500">
                    {{ appointment.patient?.category || 'Unknown' }} 
                    <span v-if="appointment.patient?.grade">
                      Grade {{ appointment.patient.grade }}-{{ appointment.patient.section }}
                    </span>
                  </p>
                </div>
                <div class="text-right">
                  <span class="block text-[#2f4a71] font-semibold">
                    {{ formatTime(appointment.hour, appointment.minute) }}
                  </span>
                  <span 
                    class="inline-block px-2 py-1 mt-1 text-xs rounded-full"
                    :class="getStatusClass(appointment.status || 'pending')"
                  >
                    {{ appointment.status || 'pending' }}
                  </span>
                </div>
              </div>
              
              <div class="p-2 mt-2 text-sm rounded bg-gray-50">
                <p class="text-gray-700">{{ appointment.complaint }}</p>
              </div>
              
              <!-- Notes (if any) -->
              <div v-if="appointment.notes" class="p-2 mt-2 text-sm rounded bg-yellow-50">
                <p class="text-gray-700"><span class="font-medium">Notes:</span> {{ appointment.notes }}</p>
              </div>
              
              <!-- Action buttons -->
              <div class="flex justify-end mt-2">
                <button 
                  @click="openStatusModal(appointment)" 
                  class="px-3 py-1 text-sm bg-[#2f4a71] text-white rounded hover:bg-[#8b67db]"
                >
                  Manage Status
                </button>
              </div>
            </div>
          </div>
    </div>
  </div>
    <!-- Add Modal -->
    <!-- Edit Modal -->
    <!-- Edit Modal with Pagination -->
<EditModal 
  v-if="showEditModal"
  :show="showEditModal"
  :is-view-only="isViewOnly"
  :current-page="currentModalPage"
  :total-pages="selectedPerson?.doctor_reviewed || (selectedConsultationRecord?.doctor_diagnosis && selectedConsultationRecord?.doctor_diagnosis.trim() !== '') ? 3 : 2"
  :has-non-OTC-medicines="hasNonOTCMedicines"
  @cancel="cancelEdit"
  @save="confirmAction('consultation')"
  @next-page="currentModalPage++"
  @prev-page="currentModalPage--"
>
  <!-- Content from original modal -->
  <!-- Page 1: Patient Details, Diagnosis, Remarks, Medicines -->
  <div v-if="currentModalPage === 1" class="flex-grow overflow-y-auto">
    <div class="grid grid-cols-2 gap-6">
      <!-- Left Column -->
      <div>
        <!-- Attending Physician -->
          <div class="mb-4">
            <label for="ap" class="block text-sm font-semibold text-gray-600">Attending Physician</label>
            <input 
              type="text" 
              :value="currentUser?.name || 'Current User'" 
              id="ap" 
              disabled
              class="w-full px-4 py-2 mt-1 bg-gray-200 border border-gray-300 rounded-lg"
            >
          </div>

          <!-- Name -->
          <div class="mb-4">
            <label for="name" class="block text-sm font-semibold text-gray-600">Name</label>
            <input type="text" :value="selectedPerson.name" id="name" disabled
              class="w-full px-4 py-2 mt-1 bg-gray-200 border border-gray-300 rounded-lg">
          </div>
          
          <!-- Category -->
          <div class="mb-4">
            <label for="category" class="block text-sm font-semibold text-gray-600">Category</label>
            <input 
              type="text" 
              :value="selectedPerson.category || 'N/A'" 
              id="category" 
              disabled
              class="w-full px-4 py-2 mt-1 bg-gray-200 border border-gray-300 rounded-lg"
            >
          </div>
      </div>
      
      <!-- Right Column -->
      <div>
        <!-- Date -->
          <div class="mb-4">
            <label for="date" class="block text-sm font-semibold text-gray-600">Date</label>
            <input type="text" :value="selectedDate.monthYear" id="date" disabled
              class="w-full px-4 py-2 mt-1 bg-gray-200 border border-gray-300 rounded-lg">
          </div>

          <!-- Grade Level & Section - Only shown for students -->
        <div v-if="isStudent" class="flex items-center mb-4 space-x-4">
          <div class="w-1/2">
            <label for="grade-level" class="block text-sm font-semibold text-gray-600">Grade Level</label>
            <input 
              type="text" 
              :value="selectedPerson.grade || 'N/A'" 
              id="grade-level" 
              disabled
              class="w-full px-4 py-2 mt-1 text-center bg-gray-200 border border-gray-300 rounded-full"
            >
          </div>
          <div class="w-1/2">
            <label for="section" class="block text-sm font-semibold text-gray-600">Section</label>
            <input 
              type="text" 
              :value="selectedPerson.section || 'N/A'" 
              id="section" 
              disabled
              class="w-full px-4 py-2 mt-1 text-center bg-gray-200 border border-gray-300 rounded-full"
            >
          </div>
        </div>

        <!-- Occupation - Shown for non-students -->
        <div v-else class="mb-4">
          <label for="occupation" class="block text-sm font-semibold text-gray-600">Occupation</label>
          <input 
            type="text" 
            :value="selectedPerson.occupation || 'N/A'" 
            id="occupation" 
            disabled
            class="w-full px-4 py-2 mt-1 bg-gray-200 border border-gray-300 rounded-lg"
          >
        </div>
      </div>
    </div>
    
    <!-- Complaint Section - Revised to match form in image with checkboxes -->
    <div class="mb-4">
      <label for="complaint" class="block mb-2 text-sm font-semibold text-gray-600">Nature of Complaint:</label>
      
      <div class="p-4 border border-gray-300 rounded-md bg-gray-50">
        <!-- Multiple complaint entries with + button -->
        <div class="flex flex-col space-y-4">
          <div v-for="complaint in chiefComplaints" :key="complaint.id" class="flex items-start space-x-2">
            <div class="flex-grow">
              <div class="relative">
                <select 
                  v-model="complaint.value"
                  :disabled="isViewOnly"
                  class="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled selected>Select a complaint...</option>
                  <option 
                    v-for="option in ['Not feeling well', 'Stomachache', 'Headache', 'Toothache', 'Injury', 'Other']" 
                    :key="option" 
                    :value="option" 
                    :disabled="isComplaintValueSelected(option, complaint.id)"
                  >
                    {{ option }}
                  </option>
                </select>
                <!-- Custom dropdown arrow -->
                <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg class="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                  </svg>
                </div>
              </div>
              
              <!-- Details field for Injury or Other -->
              <div v-if="complaint.value === 'Injury' || complaint.value === 'Other'" 
                   class="mt-2 transition-all duration-300 ease-in-out">
                <input 
                  type="text"
                  v-model="complaint.details"
                  :placeholder="complaint.value === 'Injury' ? 'Please describe the injury in detail...' : 'Please specify the complaint...' "
                  :disabled="isViewOnly"
                  class="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <!-- Remove button -->
            <button 
              v-if="!isViewOnly && chiefComplaints.length > 1" 
              @click="removeChiefComplaint(complaint.id)"
              class="p-2 mt-1 text-red-500 bg-white border border-red-300 rounded-md hover:bg-red-50"
              title="Remove complaint"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <!-- Add button -->
          <div class="flex justify-end">
            <button 
              v-if="!isViewOnly"
              @click="addChiefComplaint"
              class="flex items-center px-4 py-2 text-white transition-colors duration-300 bg-blue-500 rounded-md hover:bg-blue-600"
            >
              <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Add Another Complaint
            </button>
          </div>
        </div>
      </div>
      
      <!-- Display selected complaints summary -->
      <div v-if="chiefComplaints.some(c => c.value)" class="mt-2 text-sm font-medium text-blue-600">
        Selected: {{ chiefComplaints.filter(c => c.value).map(c => getChiefComplaintValue(c)).join(', ') }}
      </div>
    </div>

    <!-- Remarks -->
    <div class="mb-4">
      <label for="remarks" class="block text-sm font-semibold text-gray-600">Remarks</label>
      <textarea 
        v-model="selectedPerson.remarks" 
        placeholder="Remarks"
        :disabled="isViewOnly"
        class="w-full h-32 px-4 py-2 mt-1 border border-gray-300 rounded-lg"></textarea>
    </div>

    <!-- Confined and Medication Administration -->
    <div class="flex items-center w-full mb-6 space-x-8">
      <!-- Confined Checkbox -->
      <div class="flex items-center space-x-2">
        <input 
          type="checkbox" 
          id="confined" 
          v-model="selectedPerson.confined" 
          :disabled="isViewOnly" 
          class="text-blue-500 form-checkbox">
        <label for="confined" class="text-sm font-semibold">Confined</label>
      </div>
      <!-- Medicine Administration Checkbox -->
      <div class="flex items-center space-x-2">
        <input 
          type="checkbox" 
          id="medication-admin" 
          v-model="selectedPerson.medicationAdministration" 
          :disabled="isViewOnly" 
          class="text-blue-500 form-checkbox">
        <label for="medication-admin" class="text-sm font-semibold">Medication Administration</label>
      </div>
      <!-- Add Product Button -->
      <div class="flex justify-end w-7/12">
        <button 
          v-if="selectedPerson.medicationAdministration && !isViewOnly" 
          @click="openMedicineModal" 
          class="px-4 text-purple-800 bg-transparent rounded-lg">
          Add Product
        </button>
      </div>
    </div>

    <!-- Medicines Table -->
    <div class="overflow-x-auto" v-if="selectedPerson.medicationAdministration">
      <table class="w-full text-left border-t">
        <thead class="text-sm font-semibold text-gray-600">
          <tr>
            <th class="px-2 py-3">Name</th>
      
            <th class="px-2 py-3">Quantity</th>
            <th class="px-2 py-3">Schedule</th>
            <th class="px-2 py-3">Start - End</th>
            <th class="px-2 py-3">Remarks</th>
            <th v-if="!isViewOnly" class="px-2 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(medicine, index) in filteredMedicines" :key="index">
            <td class="px-2 py-2">
              <!-- Make medicine name clickable in view-only mode -->
              <span v-if="isViewOnly" class="text-blue-600 cursor-pointer hover:underline"
                @click="openViewMedicineModal(medicine)">
                {{ medicine.name }}
              </span>
              <span v-else>{{ medicine.name }}</span>
            </td>
            <td class="px-2 py-2">{{ medicine.quantity }}</td>
            <td class="px-2 py-2">{{ medicine.schedule }}</td>
            <td class="px-2 py-2">{{ medicine.startDate }} - {{ medicine.endDate }}</td>
            <td class="px-2 py-2">{{ medicine.remarks }}</td>
            <td class="px-2 py-2" v-if="!isViewOnly">
              <div class="flex space-x-2">
                <button @click="editMedicine(medicine, index)" class="text-blue-500 hover:text-blue-700">
                  <Icon icon="mdi:pencil" />
                </button>
                <button @click="removeMedicine(index)" class="text-red-500 hover:text-red-700">
                  <Icon icon="mdi:trash-can" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  
  <!-- Page 2: Actions Taken and Disposition -->
  <div v-else-if="currentModalPage === 2" class="flex-grow overflow-y-auto">
    <div class="pt-4 mb-4">
      <div class="mb-6">
        <label class="block text-sm font-semibold text-gray-600">Actions Taken</label>
        <div class="p-4 border border-gray-300 rounded-md bg-gray-50">
          <div class="flex flex-col space-y-4">
            <div v-for="action in actionsTaken" :key="action.id" class="flex items-start space-x-2">
              <div class="flex-grow">
                <div class="relative">
                  <select
                    v-model="action.value"
                    :disabled="isViewOnly"
                    class="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="" disabled selected>Select an action...</option>
                    <option
                      v-for="option in actionOptions"
                      :key="option"
                      :value="option"
                      :disabled="isActionValueSelected(option, action.id)"
                    >
                      {{ option }}
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg class="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                  </div>
                </div>
                <!-- Details field for Head checked for, Parent/guardian notified at, or Other -->
                <div v-if="['Head checked for', 'Parent/guardian notified at', 'Other'].includes(action.value)" class="mt-2 transition-all duration-300 ease-in-out">
                  <input
                    type="text"
                    v-model="action.details"
                    :placeholder="
                      action.value === 'Head checked for' ? 'Specify what was checked for...'
                      : action.value === 'Parent/guardian notified at' ? 'Specify time or details...'
                      : 'Please specify...'
                    "
                    :disabled="isViewOnly"
                    class="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <!-- Remove button -->
              <button
                v-if="!isViewOnly && actionsTaken.length > 1"
                @click="removeActionTaken(action.id)"
                class="p-2 mt-1 text-red-500 bg-white border border-red-300 rounded-md hover:bg-red-50"
                title="Remove action"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <!-- Add button -->
            <div class="flex justify-end">
              <button
                v-if="!isViewOnly"
                @click="addActionTaken"
                class="flex items-center px-4 py-2 text-white transition-colors duration-300 bg-blue-500 rounded-md hover:bg-blue-600"
              >
                <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Another Action
              </button>
            </div>
          </div>
        </div>
        <!-- Display selected actions summary -->
        <div v-if="actionsTaken.some(a => a.value)" class="mt-2 text-sm font-medium text-blue-600">
          Selected: {{ actionsTaken.filter(a => a.value).map(a => getActionDisplayValue(a)).join(', ') }}
        </div>
      </div>

      <div class="mb-4">
        <label for="disposition" class="block text-sm font-semibold text-gray-600">Disposition of the Student</label>
        <div class="p-4 border border-gray-300 rounded-md bg-gray-50">
          <div class="flex flex-col space-y-4">
            <div v-for="disposition in dispositions" :key="disposition.id" class="flex items-start space-x-2">
              <div class="flex-grow">
                <div class="relative">
                  <select
                    v-model="disposition.value"
                    :disabled="isViewOnly"
                    class="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="" disabled selected>Select a disposition...</option>
                    <option
                      v-for="option in dispositionOptions"
                      :key="option"
                      :value="option"
                      :disabled="isDispositionValueSelected(option, disposition.id)"
                    >
                      {{ option }}
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg class="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                  </div>
                </div>
                <!-- Details field for Other -->
                <div v-if="disposition.value === 'Other'" class="mt-2 transition-all duration-300 ease-in-out">
                  <input
                    type="text"
                    v-model="disposition.details"
                    placeholder="Please specify..."
                    :disabled="isViewOnly"
                    class="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <!-- Remove button -->
              <button
                v-if="!isViewOnly && dispositions.length > 1"
                @click="removeDisposition(disposition.id)"
                class="p-2 mt-1 text-red-500 bg-white border border-red-300 rounded-md hover:bg-red-50"
                title="Remove disposition"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <!-- Add button -->
            <div class="flex justify-end">
              <button
                v-if="!isViewOnly"
                @click="addDisposition"
                class="flex items-center px-4 py-2 text-white transition-colors duration-300 bg-blue-500 rounded-md hover:bg-blue-600"
              >
                <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Another Disposition
              </button>
            </div>
          </div>
        </div>
        <!-- Display selected dispositions summary -->
        <div v-if="dispositions.some(d => d.value)" class="mt-2 text-sm font-medium text-blue-600">
          Selected: {{ dispositions.filter(d => d.value).map(d => getDispositionDisplayValue(d)).join(', ') }}
        </div>
      </div>
    </div>
  </div>

  <!-- Page 3: Doctor's Feedback -->
  <div v-else-if="currentModalPage === 3" class="flex-grow overflow-y-auto">
    <div class="pt-4 mb-4">
      <!-- Patient Demographics Section -->
      <div class="p-4 mb-6 border border-gray-200 rounded-lg bg-gray-50">
        <h3 class="mb-3 text-lg font-semibold text-gray-700">Patient Demographics</h3>
        <div class="grid grid-cols-2 gap-4">
          <!-- Patient Information -->
          <div class="col-span-2 p-3 bg-white border rounded-md">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block mb-1 text-sm font-medium text-gray-700">Age</label>
                <div class="p-2 border rounded">{{ selectedPerson?.age || 'N/A' }}</div>
              </div>
              <div>
                <label class="block mb-1 text-sm font-medium text-gray-700">Gender</label>
                <div class="p-2 border rounded">{{ selectedPerson?.sex || 'N/A' }}</div>
              </div>
            </div>
          </div>
          
          <!-- Vital Signs -->
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Height</label>
            <div class="p-2 border rounded">{{ selectedConsultationRecord?.height || 'Not recorded' }} cm</div>
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Weight</label>
            <div class="p-2 border rounded">{{ selectedConsultationRecord?.weight || 'Not recorded' }} kg</div>
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Blood Pressure</label>
            <div class="p-2 border rounded">{{ selectedConsultationRecord?.blood_pressure || 'Notrecorded' }}</div>
          </div>
          <div>
            <label class="block mb-1 text-sm font-medium text-gray-700">Heart Rate</label>
            <div class="p-2 border rounded">{{ selectedConsultationRecord?.heart_rate || 'Not recorded' }} bpm</div>
          </div>
        </div>
      </div>
      
      <!-- Doctor's Feedback Section -->
      <div class="p-4 mb-6 border border-blue-200 rounded-lg bg-blue-50">
        <h3 class="mb-3 text-lg font-semibold text-blue-800">Doctor's Feedback</h3>
        <div class="mb-4">
          <label class="block mb-1 text-sm font-medium text-gray-700">Doctor's Diagnosis</label>
          <div class="p-3 bg-white border rounded-md">
            {{ selectedConsultationRecord?.medical_data?.diagnosis || 'No diagnosis provided' }}
          </div>
        </div>
        
        <div>
          <label class="block mb-1 text-sm font-medium text-gray-700">Treatment Plan</label>
          <div class="p-3 bg-white border rounded-md">
            {{ selectedConsultationRecord?.medical_data?.treatment || 'No treatment plan provided' }}
          </div>
        </div>
      </div>
    </div>
  </div>

</EditModal>



    <!-- Medicine Modal -->
    <MedicineModal
      v-if="showMedicineModal"
      :show="showMedicineModal"
      :grouped-medicines="groupedMedicines"
      :expanded-medicines="expandedMedicines"
      @cancel="cancelMedicine"
      @add-medicine="prepareAddMedicine"
      @toggle-expand="toggleMedicineExpand"
      @update:search-query="medicineSearchQuery = $event"
    />

    <!-- Medicine Detail Modal -->
    <MedicineDetailModal
      v-if="showMedicineDetailModal"
      :show="showMedicineDetailModal"
      :medicine="selectedMedicine"
      :is-view-only="isViewOnly"
      @cancel="cancelMedicineDetails"
      @save="saveMedicineDetails"
    />

</div>


  <!-- Add Category Modal -->
  <AddCategoryModal
    :show="showAddCategoryModal"
    title="Add New Category"
    @cancel="cancelAddCategory"
    @save="addNewCategory"
    :save-disabled="!newCategory.name"
  >
    <div class="space-y-4">
      <div>
        <label for="category-name" class="block text-sm text-gray-700 fontmedium">Category Name</label>
        <input v-model="newCategory.name" id="category-name" type="text" placeholder="Enter category name"
          class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" />
      </div>
    
      <!-- Existing Categories List -->
      <div class="mt-6">
        <h3 class="mb-2 text-lg font-semibold">Existing Categories</h3>
        <div v-if="diseaseCategories && diseaseCategories.length">
          <div v-for="category in diseaseCategories" :key="category.category_id"
            class="flex items-center justify-between px-3 py-2 mb-2 border rounded-md">
            <span>{{ category.name }}</span>
            <button @click="deleteCategory(category.category_id)"
              class="p-2 text-white bg-red-500 rounded hover:bg-red-600" title="Delete Category">
              <Icon icon="mdi:delete" class="w-5 h-5" />
            </button>
          </div>
        </div>
        <div v-else class="text-sm text-gray-500">
          No categories available.
        </div>
      </div>
    </div>
  </AddCategoryModal>

  <!-- Add Diagnosis Modal -->
  <AddDiagnosisModal
    :show="showAddDiagnosisModal"
    title="Add New Diagnosis"
    @cancel="cancelAddDiagnosis"
    @save="saveDiagnosis"
    :save-disabled="!newDisease.name || !newDisease.category_id"
  >
  
    <div class="space-y-4">
      <!-- Diagnosis Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Diagnosis Name</label>
        <input v-model="newDisease.name" type="text" placeholder="Enter diagnosis name"
          class="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
      </div>

      <!-- Category Dropdown -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Category</label>
        <div class="flex space-x-2">
          <div class="relative flex-grow">
            <select v-model="newDisease.category_id"
              class="w-full px-3 py-2 pr-8 mt-1 border border-gray-300 rounded-md appearance-none">
              <option value="" disabled>Select a category</option>
              <option v-for="category in diseaseCategories" :key="category.category_id" :value="category.category_id">
                {{ category.name }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center px-2 mt-1 pointer-events-none">
              <Icon icon="mdi:chevron-down" class="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <button @click="openAddCategoryModal"
            class="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700" title="Add new category">
            <Icon icon="mdi:plus" />
          </button>
        </div>
      </div>
    </div>
  </AddDiagnosisModal>

  <!-- Management Modal -->
  <div v-if="showManageModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60]">
    <div class="w-full max-w-4xl p-8 bg-white rounded-lg shadow-lg max-h-[80vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-semibold text-gray-800 text2xl">Manage Diagnoses & Categories</h2>
        <button @click="closeManageModal" class="text-gray-500 hover:text-gray-700">
          <Icon icon="mdi:close" class="w-6 h-6" />
        </button>
      </div>

      <!-- Tab navigation -->
       

      <div class="flex mb-6 border-b">
        <button @click="activeManageTab = 'diagnoses'" class="px-4 py-2 -mb-px font-medium"
          :class="activeManageTab === 'diagnoses' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-600'">
          Diagnoses
        </button>
        <button @click="activeManageTab = 'categories'" class="px-4 py-2 -mb-px font-medium"
          :class="activeManageTab === 'categories' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'">
          Categories
        </button>
      </div>

      <!-- Diagnoses Tab -->
      <div v-if="activeManageTab === 'diagnoses'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="relative w-64">
            <input v-model="diagnosisManageSearchQuery" type="text" placeholder="Search diagnoses..."
              class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md" />
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Icon icon="mdi:magnify" class="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <button @click="openAddDiagnosisModal"
            class="flex items-center px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700">
            <Icon icon="mdi:plus" class="mr-1" />
            Add Diagnosis
          </button>
        </div>

        <!-- Diagnoses List -->
        <div v-for="(groupedDiseases, categoryId) in diseasesByCategory" :key="categoryId" class="mb-4">
          <div class="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-t-md">
            <h4 class="font-medium text-gray-700">{{ getCategoryName(categoryId) }}</h4>
            <span class="px-2 py-1 text-xs text-gray-600 bg-gray-200 rounded-full">
              {{ groupedDiseases.length }} items
            </span>
          </div>
          <div class="border border-t-0 rounded-b-md">
            <div v-for="disease in filteredDiagnosesByCategory(categoryId, diagnosisManageSearchQuery)"
              :key="disease.diagnosis_id" class="flex items-center justify-between px-4 py-2 border-b last:border-b-0">
              <div>{{ disease.name }}</div>
              <div class="flex space-x-2">
                <button @click="deleteDisease(disease.diagnosis_id)"
                  class="p-1 text-red-500 rounded hover:text-white hover:bg-red-500" title="Delete diagnosis">
                  <Icon icon="mdi:delete" class="w-5 h-5" />
                </button>
              </div>
            </div>
            <div v-if="filteredDiagnosesByCategory(categoryId, diagnosisManageSearchQuery).length === 0"
              class="p-4 text-sm text-gray-500">
              No diagnoses in this category
            </div>
          </div>
        </div>
      </div>

      <!-- Categories Tab -->
      <div v-else-if="activeManageTab === 'categories'" class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800">Diagnosis Categories</h3>
          <button @click="openAddCategoryModal"
            class="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
            <Icon icon="mdi:plus" class="mr-1" />
            Add Category
          </button>
        </div>

        <!-- Categories List -->
        <div class="border rounded-md">
          <div v-for="category in diseaseCategories" :key="category.category_id"
            class="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
            <span>{{ category.name }}</span>
            <div class="flex space-x-2">
              <button @click="deleteCategory(category.category_id)"
                class="p-1 text-red-500 rounded hover:text-white hover:bg-red-500"
                title="Delete category (will also delete associated diagnoses)">
                <Icon icon="mdi:delete" class="w-5 h-5" />
              </button>
            </div>
          </div>
          <div v-if="diseaseCategories.length === 0" class="p-4 text-sm text-gray-500">
            No categories available
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Add the Status Modal -->
  <StatusModal 
    :show="showStatusModal"
    :selected-status="appointmentStatus"
    :notes="appointmentNotes"
    :is-loading="isUpdatingStatus"
    @update:status="(status) => appointmentStatus = status"
    @update:notes="(notes) => appointmentNotes = notes"
    @cancel="closeStatusModal"
    @save="updateAppointmentStatus"
  />

  <!-- Confirmation Modal -->
  <ConfirmationModal
    :show="showConfirmationModal"
    :message="confirmationMessage"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
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
</style>

