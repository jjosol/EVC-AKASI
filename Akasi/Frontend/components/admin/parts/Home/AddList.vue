<script setup>
import { ref, computed, onMounted } from 'vue'
import { formatAMPM } from '~/composables/useTimeFormatter';
import moment from 'moment-timezone';

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

    const response = await fetch(`http://localhost:3001/consultation-records/${consultation_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: person.clientId,
        admin_id: 1, // Replace with actual admin_id
        date: existingRecord.date, // Use the original date and time
        patient_name: person.name,
        patient_occupation: person.occupation || `${person.grade}-${person.section}`,
        doctor: 'John Doe',
        complaint: person.generalComplaint || '',
        remarks: person.remarks || '',
        confined: person.confined || false,
        medAdministration: person.medicationAdministration || false,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update consultation record');
    }

    const data = await response.json();
    return data;
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
    const response = await fetch(`http://localhost:3001/consultation-records/${consultation_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        medAdministration: true
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update consultation record medication status');
    }
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
      throw new Error('Client ID is required');
    }

    const selectedDateTime = new Date(props.currentDay.date);
    const now = new Date();
    selectedDateTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    
    const formattedDateTime = selectedDateTime.toISOString();

    const response = await fetch('http://localhost:3001/consultation-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: person.clientId,
        admin_id: 1, // Default admin ID
        date: formattedDateTime,
        patient_name: person.name,
        patient_occupation: person.occupation || `${person.grade}-${person.section}`,
        complaint: selectedConsultationRecord.value?.complaint || '',
        remarks: selectedConsultationRecord.value?.remarks || '',
        confined: selectedConsultationRecord.value?.confined || false,
        medAdministration: true,
        doctor: 'John Doe'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create consultation record');
    }

    return await response.json();
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
    const response = await fetch('http://localhost:3001/clients');
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    const data = await response.json();
    allPeople.value = data.map((client) => ({
      clientId: client.client_id,
      name: client.name,
      section: client.section || 'N/A',
      grade: client.grade || 'N/A',
      age: client.age || 0,
      sex: client.sex || 'N/A',
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
    const response = await fetch('http://localhost:3001/consultation-records');
    if (!response.ok) {
      throw new Error('Failed to fetch consultation records');
    }
    const data = await response.json();

    // Use moment.js for consistent timezone handling
    const currentDate = moment(props.currentDay.date).tz("Asia/Manila");
    
    patients.value = data
      .filter(record => {
        const recordDate = moment(record.date).tz("Asia/Manila");
        return recordDate.isSame(currentDate, 'day');
      })
      .map((record) => ({
        id: record.client_id,
        consultation_id: record.consultation_id,
        name: record.patient_name,
        occupation: record.patient_occupation || 'N/A',
        time: moment(record.date).tz("Asia/Manila").format('hh:mm A'),
        complaint: record.complaint,
        remarks: record.remarks,
        confined: record.confined,
        medAdministration: record.medAdministration,
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
    const response = await fetch(`http://localhost:3001/consultation-records/count?year=${year}&month=${month}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }
    const count = await response.json();
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

    // Prepare consultation data
    const selectedDateTime = new Date(props.currentDay.date);
    const now = new Date();
    selectedDateTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const consultationData = {
      client_id: selectedPerson.value.clientId,
      admin_id: 1, // Replace with the actual admin ID
      date: selectedDateTime.toISOString(),
      patient_name: selectedPerson.value.name,
      patient_occupation:
        selectedPerson.value.occupation ||
        `${selectedPerson.value.grade}-${selectedPerson.value.section}`,
      doctor: 'John Doe',
      complaint: selectedPerson.value.generalComplaint || '',
      remarks: selectedPerson.value.remarks || '',
      confined: Boolean(selectedPerson.value.confined),
      medAdministration: Boolean(selectedPerson.value.medicationAdministration),
    };

    let consultationId;

    // Check if updating an existing consultation record
    if (selectedConsultationRecord.value?.consultation_id) {
      // Update the existing consultation record
      const response = await fetch(
        `http://localhost:3001/consultation-records/${selectedConsultationRecord.value.consultation_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(consultationData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update consultation record');
      }

      consultationId = selectedConsultationRecord.value.consultation_id;
    } else {
      // Create a new consultation record
      const response = await fetch('http://localhost:3001/consultation-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consultationData),
      });

      if (!response.ok) {
        throw new Error('Failed to create consultation record');
      }

      const newRecord = await response.json();
      consultationId = newRecord.consultation_id;
    }

    // Ensure consultationId is obtained
    if (!consultationId) {
      throw new Error('Consultation ID is not available');
    }

    // Handle medicines if medication administration is enabled
    if (
      selectedPerson.value.medicationAdministration &&
      selectedPerson.value.medicines?.length > 0
    ) {
      for (const medicine of selectedPerson.value.medicines) {
        if (medicine.markedForDeletion) {
          // Delete the medicine
          const response = await fetch(`http://localhost:3001/med-administration/${medicine.consultation_id}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            throw new Error('Failed to delete medicine record');
          }
        } else {
          // Save or update the medicine
          const medAdminData = {
            consultation_id: consultationId,
            client_id: selectedPerson.value.clientId,
            admin_id: 1,
            med_id: medicine.med_id,
            medName: medicine.name,
            count: Number(medicine.quantity),
            schedule: medicine.schedule || '',
            start_date: medicine.startDate,
            end_date: medicine.endDate,
            remarks: medicine.remarks || '',
            date: new Date().toISOString(),
            patient: selectedPerson.value.name
          };

          const response = await fetch('http://localhost:3001/med-administration', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(medAdminData)
          });

          if (!response.ok) {
            throw new Error(`Failed to save medicine ${medicine.name}`);
          }
        }
      }
    }

    // Reset form and refresh data
    selectedPerson.value = null;
    showEditModal.value = false;
    showAddModal.value = false;
    await fetchPatients();
  } catch (error) {
    console.error('Error saving data:', error);
    alert('Failed to save data: ' + error.message);
  }
};

/**
 * Fetches medicine inventory from API
 * @returns {Promise<void>}
 */
const fetchInventory = async () => {
  try {
    const response = await fetch('http://localhost:3001/inventory');
    if (!response.ok) {
      throw new Error('Failed to fetch inventory');
    }
    const data = await response.json();
    allMedicines.value = data.map(item => ({
      med_id: item.med_id,
      name: item.medName,
      expirationDate: formatDate(item.expiration),
      count: parseInt(item.count),
      requestedQuantity: 1
    }));
  } catch (error) {
    console.error('Error fetching inventory:', error);
  }
};


// fetch data when mounted
onMounted(() => {
  fetchPeople();
  fetchPatients();
  fetchRecordCount();
  fetchInventory(); // This should be called
});
console.log(patients)
// Initialize values for meds list
const allMedicines = ref([]);

// Add these with your other refs
const expandedMedicines = ref(new Set());

// Add these computed properties
const groupedMedicines = computed(() => {
  const groups = {};
  allMedicines.value.forEach(item => {
    if (!medicineSearchQuery.value || 
        item.name.toLowerCase().includes(medicineSearchQuery.value.toLowerCase())) {
      if (!groups[item.name]) {
        groups[item.name] = [];
      }
      groups[item.name].push(item);
    }
  });

  // Sort each group by expiration date
  Object.keys(groups).forEach(name => {
    groups[name].sort((a, b) => 
      new Date(a.expirationDate) - new Date(b.expirationDate)
    );
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
  return selectedPerson.value.medicines.filter(medicine => !medicine.markedForDeletion);
});

/**
 * Fetches a specific consultation record
 * @param {number} consultation_id - ID of consultation to fetch
 * @returns {Promise<Object>} Consultation record data
 */
const fetchConsultationRecord = async (consultation_id) => {
  try {
    const response = await fetch(`http://localhost:3001/consultation-records/${consultation_id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch consultation record`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching consultation record:', error);
    throw error;
  }
};

// Rest of your existing methods...
/**
 * Opens edit modal with consultation record data
 * @param {Object} patient - Patient to edit
 * @returns {Promise<void>}
 */
const openEditModal = async (patient) => {
  try {
    const consultationRecord = await fetchConsultationRecord(patient.consultation_id);
    selectedConsultationRecord.value = consultationRecord;
    
    // Fetch medication administration records
    const medAdminResponse = await fetch(`http://localhost:3001/med-administration/consultation/${patient.consultation_id}`);
    const medAdminRecords = await medAdminResponse.json();
    
    // Map the med admin records to match the expected format
    const mappedMedicines = medAdminRecords.map(record => ({
      med_id: record.med_id,
      consultation_id: record.consultation_id, // Add this line
      name: record.medName,
      quantity: record.count,
      schedule: record.schedule,
      startDate: new Date(record.start_date).toISOString().split('T')[0],
      endDate: new Date(record.end_date).toISOString().split('T')[0],
      remarks: record.remarks
    }));

    selectedPerson.value = {
      ...patient,
      clientId: patient.id,
      generalComplaint: consultationRecord.complaint,
      remarks: consultationRecord.remarks,
      confined: consultationRecord.confined,
      medicationAdministration: consultationRecord.medAdministration,
      medicines: mappedMedicines // Add the medicines array
    };

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
    const response = await fetch(`http://localhost:3001/consultation-records/${consultation_id}/delete`, {
      method: 'DELETE',
    });
    if(!response.ok){
      throw new Error('Failed to delete consultation record ${consultation_id}');
    }
    await fetchPatients();
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
    selectedPerson.value = { ...person, addedAt: now, medicines: [] };
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
};

/**
 * Closes add modal and resets state
 */
const cancelAdd = () =>{
  showAddModal.value = false;
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
    if (!medicine?.med_id || !medicine?.requestedQuantity) {
      throw new Error('Invalid medicine data');
    }

    const today = new Date();
    showMedicineDetailModal.value = true;
    selectedMedicine.value = {
      med_id: medicine.med_id,
      name: medicine.name,
      quantity: medicine.requestedQuantity,  // First set
      originalQuantity: medicine.requestedQuantity  // Also stored as originalQuantity
    };

  } catch (error) {
    console.error('AddMedicine error:', error);
    alert(error.message);
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
    consultation_id: medicine.consultation_id, // Add this line
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
 * Saves medicine details back to consultation
 * Validates required fields before saving
 */
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
    
    if (!medicine.quantity || medicine.quantity <= 0) {
      throw new Error('Valid quantity is required');
    }

    // Only update local state
    if (medicine.index !== undefined) {
      selectedPerson.value.medicines[medicine.index] = { ...medicine };
    } else {
      selectedPerson.value.medicines.push({ ...medicine });
    }

    showMedicineDetailModal.value = false;
  } catch (error) {
    console.error('Error saving medicine details:', error);
    alert(error.message);
  }
};

/**
 * Removes medicine from current consultation
 * @param {number} index - Index of medicine to remove
 */
 const removeMedicine = (index) => {
  selectedPerson.value.medicines[index].markedForDeletion = true;
  console.log(index)
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
const emit = defineEmits(['confined', 'update-confined']);


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
</script>

<template>
  <div class="fixed w-4/6">
    <div class="fixed top-0 right-0 w-1/4 h-screen p-5 bg-white border-[#2f4a71] border-l-2">
    <div class="h-full p-5 overflow-y-auto l">
      <h2 class="text-2xl text-[#2f4a71]">{{ selectedDate.day }}</h2>
      <h2 class="mb-4 text-3xl font-bold text-[#2f4a71] border-b-2 border-[#2f4a71]">{{ selectedDate.monthYear }}</h2>
      <!-- <p class="text-2xl text-[#d3cae7]">CONFINEMENTS:</p> -->
      <button @click="showAddModal = true" v-if="!showAddModal" class="block p-2 mt-4 ml-auto text-3xl active:bg-blue-700 text-white rounded-full  bg-[#745dab] "><Icon icon="subway:add-1" /></button>
      <button @click="cancelAdd" v-if="showAddModal" class="block p-2  ml-auto text-3xl active:bg-blue-700 text-white rounded-full  bg-[#745dab] "><Icon icon="maki:cross" /></button>
      <div v-if="showAddModal">
        <div class="flex items-center mt-1 mb-4">
          <div class="relative w-full">
            <input
              v-model="searchQuery"
              placeholder="Search"
              class="w-full p-2 pl-10 border border-[#2f4a71] rounded-full focus:outline-none"
            />
            <Icon icon="fluent:search-12-regular" class="absolute top-2 left-3 text-[#2f4a71]" />
          </div>
          <!-- <button @click="cancelAdd" class="ml-4 text-[#2f4a71] hover:underline">Cancel</button> -->
        </div>
        <!-- People List -->
        <ul class="overflow-y-auto max-h-60 text-[#2f4a71]">
          <li
            v-for="person in filteredPeople"
            :key="person.name"
            class="flex items-center justify-between p-2 mb-2 text-lg rounded-lg hover:bg-indigo-100"
          >
            <span>{{ person.name }}</span>
            <button @click="addPerson(person)" class="p-2 text-[#2f4a71] hover:text-white bg-transparent hover:bg-[#2f4a71] rounded-full">
              <Icon icon="subway:add-1" />
            </button>
          </li>
        </ul>
      </div>
  

      <ul class="mt-4 overflow-y-auto max-h-60">
        <li v-for="(patient, index) in patients" :key="patient.consultationId" class="flex items-center justify-between mb-2 text-lg confinement-item text-[#2f4a71]">
          <span @click="openEditModal(patient)" class="cursor-pointer confinement-details">
            {{ patient.name }} - {{ patient.occupation }} - {{ patient.time }} 
          </span>
          <button @click="deleteConsultationRecord(patient.consultation_id)" class="p-1 .text-white bg-red-500 rounded ">
            <Icon icon="fluent:delete-28-regular" />
          </button>
        </li>
      </ul>
    </div>
  </div>
    <!-- Add Modal -->
  

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
        <div class="flex flex-col justify-center w-3/6 h-screen p-8 bg-white rounded-2xl">
          <h2 class="mb-6 text-2xl text-[#2f4a71] font-bold">Consultation Record</h2>
          
          <div class="grid grid-cols-2 gap-6">
            <!-- Left Column -->
            <div>
              <!-- Attending Physician -->
              <div class="mb-4">
                <label for="ap" class="block text-sm font-semibold text-gray-600">Attending Physician</label>
                <input type="text" value="John Doe" id="ap" disabled
                  class="w-full px-4 py-2 mt-1 bg-gray-200 border border-gray-300 rounded-lg">
              </div>

              <!-- Name -->
              <div class="mb-4">
                <label for="name" class="block text-sm font-semibold text-gray-600">Name</label>
                <input type="text" value="Fiona Nadine Macalalag" id="name" disabled
                  class="w-full px-4 py-2 mt-1 bg-gray-200 border border-gray-300 rounded-lg">
              </div>

            </div>
            
            <!-- Right Column -->
            <div>
              <!-- Date -->
              <div class="mb-4">
                <label for="date" class="block text-sm font-semibold text-gray-600">Date</label>
                <input type="text" :value="selectedDate.monthyear" id="date" disabled
                  class="w-full px-4 py-2 mt-1 bg-gray-200 border border-gray-300 rounded-lg">
              </div>

              <!-- Grade Level & Section -->
              <div class="flex items-center mb-4 space-x-4">
                <div class="w-1/2">
                  <label for="grade-level" class="block text-sm font-semibold text-gray-600">Grade Level</label>
                  <input type="text" value="12" id="grade-level" disabled
                    class="w-full px-4 py-2 mt-1 text-center bg-gray-200 border border-gray-300 rounded-full">
                </div>
                <div class="w-1/2">
                  <label for="section" class="block text-sm font-semibold text-gray-600">Section</label>
                  <input type="text" value="C" id="section" disabled
                    class="w-full px-4 py-2 mt-1 text-center bg-gray-200 border border-gray-300 rounded-full">
                </div>
              </div>

              <!-- Remarks -->
              
          </div>
          
        </div>
        <!-- Complaint -->
        <div class="mb-4">
                <label for="complaint" class="block text-sm font-semibold text-gray-600">Complaint</label>
                <textarea v-model="selectedPerson.generalComplaint" placeholder="General Complaint"
                  class="w-full h-32 px-4 py-2 mt-1 border border-gray-300 rounded-lg"></textarea>
              </div>
            <div class="mb-4">
                <label for="remarks" class="block text-sm font-semibold text-gray-600">Remarks</label>
              <textarea v-model="selectedPerson.remarks" placeholder="Remarks"
                class="w-full h-32 px-4 py-2 mt-1 border border-gray-300 rounded-lg"></textarea>
            </div>

        <!-- Confined and Medication Administration -->
        <div class="flex items-center w-full mb-6 space-x-8">
          <div class="flex items-center space-x-2">
            <input type="checkbox" id="confined" v-model="selectedPerson.confined" class="text-blue-500 form-checkbox">
            <label for="confined" class="text-sm font-semibold">Confined</label>
          </div>
          <div class="flex items-center space-x-2">
            <input type="checkbox" id="medication-admin" v-model="selectedPerson.medicationAdministration" class="text-blue-500 form-checkbox">
            <label for="medication-admin" class="text-sm font-semibold">Medication Administration</label>
          </div>
          <div class="flex justify-end w-7/12">
            <button v-if="selectedPerson.medicationAdministration" @click="openMedicineModal" class="px-4 text-purple-800 bg-transparent rounded-lg ">Add Product</button>
          </div>
        </div>

        <!-- Medicines Table -->
        <div class="overflow-x-auto" v-if="selectedPerson.medicationAdministration">
          <table class="w-full text-left border-t">
            <thead class="text-sm font-semibold text-gray-600">
              <tr>
                <th class="py-2">Pharmaceutical Product</th>
                <th class="py-2">Schedule</th>
                <th class="py-2">Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(medicine, index) in filteredMedicines" :key="index">
                <td class="py-2 cursor-pointer" @click="openViewMedicineModal(medicine)">{{ medicine.name }}</td>
                <td class="py-2">{{ medicine.schedule }}</td>
                <td class="py-2">{{ medicine.quantity }}</td>
                <td class="py-2">
                  <div class="flex space-x-2">
                    <button v-if="medicine.consultation_id" @click="editMedicine(medicine, index)" class="text-blue-500 hover:text-blue-700">
                      <Icon icon="mdi:pencil" />
                    </button>
                    <button v-if="medicine.consultation_id" @click="removeMedicine(index)" class="text-red-500 hover:text-red-700">
                      <Icon icon="mdi:delete" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-between mt-6">
          <button @click="cancelEdit" class="text-purple-600 underline">Cancel</button>
          <button @click="savePerson" class="px-4 py-2 text-white bg-purple-500 rounded-lg">Submit</button>
        </div>
      </div>
    </div>



    <!-- Medicine Modal -->
    <div v-if="showMedicineModal" class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
  <div class="w-2/3 p-6 bg-white rounded-2xl">
    <h2 class="mb-4 text-2xl font-semibold">Add Product</h2>
    <div class="flex items-center mb-4">
      <input
        v-model="medicineSearchQuery"
        placeholder="Search Product"
        class="w-full p-2 border border-gray-300 rounded-l-md"
      />
      <button class="p-2 bg-gray-100 border-t border-b border-r rounded-r-md">
        <Icon icon="mdi:magnify" />
      </button>
      <button class="p-2 ml-2 bg-gray-100 border rounded-md">
        <Icon icon="mdi:filter-variant" />
      </button>
      <button class="p-2 ml-2 bg-gray-100 border rounded-md">
        <Icon icon="mdi:sort-ascending" />
      </button>
    </div>
    <table class="w-full table-auto">
      <thead class="border-b-2 border-gray-300">
        <tr class="text-left text-gray-600">
          <th class="pb-2">Medicine Name</th>
          <th class="pb-2">Total Count</th>
          <th class="pb-2">Actions</th>
        </tr>
      </thead>
      <tbody class="text-gray-700">
        <template v-for="(medicines, name) in groupedMedicines" :key="name">
          <tr class="border-b border-gray-200">
            <td class="py-2">
              <div class="flex items-center">
                <button @click="toggleMedicineExpand(name)" class="flex items-center">
                  <Icon 
                    :icon="expandedMedicines.has(name) ? 'mdi:chevron-down' : 'mdi:chevron-right'" 
                    class="mr-2"
                  />
                  {{ name }}
                </button>
              </div>
            </td>
            <td class="py-2">
              {{ medicines.reduce((sum, med) => sum + med.count, 0) }}
            </td>
            <td></td>
          </tr>
          <tr v-if="expandedMedicines.has(name)" v-for="medicine in medicines" :key="medicine.med_id">
            <td colspan="3" class="py-2 pl-6 bg-gray-50">
              <div class="flex items-center justify-between">
                <div>
                  <span class="mr-4">Exp: {{ medicine.expirationDate || 'None' }}</span>
                  <span>Count: {{ medicine.count }}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <input 
                    type="number"
                    v-model.number="medicine.requestedQuantity"
                    class="w-20 p-1 text-center border rounded"
                    min="1"
                    :max="medicine.count"
                    placeholder="Qty"
                  >
                  <button 
                    @click="addMedicine(medicine)"
                    class="text-[#2f4a71] hover:text-white hover:bg-[#2f4a71] rounded-md p-2"
                    :disabled="!canAddMedicine(medicine)"
                    :class="{ 'opacity-50 cursor-not-allowed': !canAddMedicine(medicine) }"
                  >
                    <Icon icon="subway:add-1" />
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
    <div class="flex justify-end mt-6">
      <button @click="cancelMedicine" class="p-2 ml-2 text-white bg-gray-500 rounded-md">Cancel</button>
    </div>
  </div>
</div>

    <!-- Medicine Detail Modal -->
    <div v-if="showMedicineDetailModal" class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
  <div class="w-1/3 p-6 bg-white rounded-2xl">
    <h2 class="mb-4 text-2xl font-semibold">Medicine Details</h2>
    
    <div class="space-y-4">
      <!-- Medicine Name -->
      <div>
        <label class="block text-gray-700">Medicine Name</label>
        <input type="text" v-model="selectedMedicine.name" :disabled="isViewOnly"
          class="w-full p-2 bg-gray-100 border rounded-md">
      </div>
      
      <!-- Quantity -->
      <div>
        <label class="block text-gray-700">Quantity</label>
        <input type="number" v-model="selectedMedicine.quantity" :disabled="isViewOnly"
          class="w-full p-2 border rounded-md">
      </div>
      
      <!-- Schedule -->
      <div>
        <label class="block text-gray-700">Schedule</label>
        <input type="text" v-model="selectedMedicine.schedule" :disabled="isViewOnly"
          placeholder="e.g., 3 times a day after meals"
          class="w-full p-2 border rounded-md">
      </div>
      
      <!-- Dates -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-gray-700">Start Date</label>
          <input type="date" v-model="selectedMedicine.startDate" :disabled="isViewOnly"
            class="w-full p-2 border rounded-md">
        </div> 
        <div>
          <label class="block text-gray-700">End Date</label>
          <input type="date" v-model="selectedMedicine.endDate" :disabled="isViewOnly"
            class="w-full p-2 border rounded-md">
        </div>
      </div>
      
      <!-- Remarks -->
      <div>
        <label class="block text-gray-700">Remarks</label>
        <textarea v-model="selectedMedicine.remarks" :disabled="isViewOnly"
          class="w-full p-2 border rounded-md"
          rows="3"></textarea>
      </div>
    </div>

   <div class="flex justify-end mt-6 space-x-4">
      <button @click="cancelMedicineDetails"
        class="px-4 py-2 text-gray-600 bg-gray-200 rounded-md">Cancel</button>
      <button v-if="!isViewOnly" @click="saveMedicineDetails"
        class="px-4 py-2 text-white bg-blue-600 rounded-md">Save</button>
    </div>
  </div>
</div>

  </div>
</template>
<style scoped>
textarea {
  resize: none;
}
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
</style>