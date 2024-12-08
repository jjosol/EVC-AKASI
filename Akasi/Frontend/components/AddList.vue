<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { formatAMPM } from '~/composables/useTimeFormatter';
import { Icon } from '@iconify/vue';

const props = defineProps({
  currentDay: {
    type: Object,
    default: () => ({ date: new Date() })
  }
});

// Modal states
const showAddModal = ref(false);
const showEditModal = ref(false);
const showMedicineModal = ref(false);
const showMedicineDetailModal = ref(false);
const medicinesVisible = ref(true);

// Selected person and record
const selectedPerson = ref(null);
const selectedConsultationRecord = ref(null);
const selectedMedicine = ref({
  name: '',
  dosage: null,
  quantity: 1,
  originalQuantity: 0,
  schedule: '',
  startDate: '',
  endDate: '',
  count: 0, // Available stock
  med_id: null,
  expirationDate: '',
});
const expandedMedicines = ref(new Set());

// Date and time computations
const currentDateTime = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
});

const selectedDate = computed(() => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dayOptions = { weekday: 'long' };
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Intl.DateTimeFormat('en-US', options).format(props.currentDay.date);
  const day = new Intl.DateTimeFormat('en-US', dayOptions).format(props.currentDay.date);
  const monthYear = new Intl.DateTimeFormat('en-US', dateOptions).format(props.currentDay.date);

  return { day, monthYear, date };
});

const confinedCount = ref(0);
const selectedTime = ref(formatAMPM(new Date()));

// Search queries
const searchQuery = ref('');
const medicineSearchQuery = ref('');

// To contain all that is part of the list
const people = ref([]);
const allPeople = ref([]);
const patients = ref([]);

// Medicines data
const allMedicines = ref([]);
const groupedMedicines = computed(() => {
  const groups = {};
  allMedicines.value.forEach(item => {
    if (!groups[item.name]) {
      groups[item.name] = [];
    }
    groups[item.name].push(item);
  });
  return groups;
});

// Add this computed property for filtering people
const filteredPeople = computed(() => {
  if (!searchQuery.value) return allPeople.value;
  
  return allPeople.value.filter(person => 
    person.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    person.section.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Add computed property for formatted expiration date
const formattedExpirationDate = computed(() => {
  if (!selectedMedicine.value?.expirationDate) return '';
  return formatDate(selectedMedicine.value.expirationDate);
});

// Fetch functions
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

const fetchPatients = async () => {
  try {
    const response = await fetch('http://localhost:3001/consultation-records');
    if (!response.ok) {
      throw new Error('Failed to fetch consultation records');
    }
    const data = await response.json();

    // Filter patients based on the selected date
    patients.value = data
      .filter(record => {
        const recordDate = new Date(record.date);
        const selectedDateObj = new Date(props.currentDay.date);
        
        return recordDate.getFullYear() === selectedDateObj.getFullYear() &&
               recordDate.getMonth() === selectedDateObj.getMonth() &&
               recordDate.getDate() === selectedDateObj.getDate();
      })
      .map((record) => ({
        id: record.client_id,
        consultation_id: record.consultation_id,
        name: record.patient_name,
        occupation: record.patient_occupation || 'N/A',
        time: new Date(record.date).toLocaleTimeString('en-US', {
          timeZone: 'Asia/Manila',
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
        }),
        complaint: record.complaint,
        remarks: record.remarks,
        confined: record.confined,
        medAdministration: record.medAdministration,
      }));
  } catch (error) {
    console.error('Error fetching patients:', error.message);
  }
};

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

const fetchMedicines = async () => {
  try {
    const response = await fetch('http://localhost:3001/inventory');
    if (!response.ok) {
      throw new Error('Failed to fetch medicines');
    }
    const data = await response.json();
    allMedicines.value = data.map(item => ({
      med_id: item.med_id,
      name: item.medName,
      expirationDate: new Date(item.expiration).toISOString().split('T')[0],
      count: item.count,
    }));
  } catch (error) {
    console.error('Error fetching medicines:', error);
  }
};

// Formatting functions
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months start at 0
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

// Methods
const toggleExpandMedicine = (name) => {
  if (expandedMedicines.value.has(name)) {
    expandedMedicines.value.delete(name);
  } else {
    expandedMedicines.value.add(name);
  }
};

const addMedicine = (medicine) => {
  if (medicine.count <= 0) {
    alert('This medicine is out of stock');
    return;
  }
  selectedMedicine.value = { 
    ...medicine, 
    quantity: 1,
    originalQuantity: 0,
    schedule: '', 
    startDate: '', 
    endDate: '' 
  };
  showMedicineDetailModal.value = true;
  showMedicineModal.value = false;
};

const editMedicine = (medicine, index) => {
  selectedMedicine.value = { ...medicine, index };
  selectedMedicine.value.originalQuantity = medicine.quantity; // Store original quantity
  showMedicineDetailModal.value = true;
};

const saveMedicineDetails = async () => {
  const originalQuantity = selectedMedicine.value.originalQuantity || 0;
  const newQuantity = selectedMedicine.value.quantity;
  
  // Calculate the quantity difference
  const quantityDifference = newQuantity - originalQuantity;
  
  // Check if the inventory has enough stock for the increase
  if (quantityDifference > 0 && quantityDifference > selectedMedicine.value.count) {
    alert('Cannot dispense more medicine than available in stock');
    return;
  }

  // Update the medicine in the selectedPerson's medicines array
  if (selectedMedicine.value.index !== undefined) {
    selectedPerson.value.medicines[selectedMedicine.value.index] = { ...selectedMedicine.value };
    delete selectedMedicine.value.index;
  } else {
    if (!selectedPerson.value.medicines) {
      selectedPerson.value.medicines = [];
    }
    selectedPerson.value.medicines.push({ ...selectedMedicine.value });
  }

  // Update the inventory in the database
  try {
    const newCount = selectedMedicine.value.count - quantityDifference;

    // Update the inventory via API
    await fetch(`http://localhost:3001/inventory/${selectedMedicine.value.med_id}/${selectedMedicine.value.name}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: selectedMedicine.value.name,
        expirationDate: selectedMedicine.value.expirationDate,
        count: newCount,
      }),
    });

    // Update the local medicine's count
    selectedMedicine.value.count = newCount;
    
  } catch (error) {
    console.error('Error updating inventory:', error);
    alert('Failed to update inventory');
    return;
  }

  showMedicineDetailModal.value = false;
};

const cancelMedicineDetails = () => {
  showMedicineDetailModal.value = false;
};

const openEditModal = async (patient) => {
  try {
    const consultationRecord = await fetchConsultationRecord(patient.consultation_id);
    selectedConsultationRecord.value = consultationRecord;

    // Fetch associated medicines
    const medResponse = await fetch(`http://localhost:3001/med-administration/consultation/${consultationRecord.consultation_id}`);
    const medicines = await medResponse.json();

    selectedPerson.value = {
      ...patient,
      clientId: consultationRecord.client_id,
      generalComplaint: consultationRecord.complaint,
      remarks: consultationRecord.remarks,
      confined: consultationRecord.confined,
      medicationAdministration: consultationRecord.medAdministration,
      medicines: medicines.map(med => ({
        med_id: med.med_id,
        name: med.medName,
        quantity: med.count,
        schedule: med.schedule,
        startDate: med.start_date,
        endDate: med.end_date,
        count: med.inventory.count, // Assuming you include inventory data
      })),
    };

    selectedTime.value = new Date(consultationRecord.date).toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
    });
    showEditModal.value = true;
  } catch (error) {
    console.error('Error opening edit modal:', error);
  }
};

const savePerson = async () => {
  try {
    let consultationRecord;
    if (selectedConsultationRecord.value) {
      consultationRecord = await updateConsultationRecord(
        selectedConsultationRecord.value.consultation_id,
        selectedPerson.value
      );
    } else {
      consultationRecord = await createConsultationRecord(selectedPerson.value);
    }

    // Handle medicine administration after consultation record is created
    if (selectedPerson.value.medicationAdministration && selectedPerson.value.medicines?.length) {
      for (const medicine of selectedPerson.value.medicines) {
        // Create med administration record
        await fetch('http://localhost:3001/med-administration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: selectedPerson.value.clientId,
            admin_id: 1, // Replace with actual admin_id
            med_id: medicine.med_id,
            consultation_id: consultationRecord.consultation_id,
            start_date: medicine.startDate,
            end_date: medicine.endDate,
            patient: selectedPerson.value.name,
            schedule: medicine.schedule,
            medName: medicine.name,
            count: medicine.quantity
          }),
        });
      }
    }

    // Refresh everything
    await fetchPatients();
    await fetchPeople();
    await fetchRecordCount();
    await fetchMedicines();
    
    showEditModal.value = false;
    showAddModal.value = false;
    selectedPerson.value = null;
    selectedConsultationRecord.value = null;
  } catch (error) {
    console.error('Error saving data:', error);
    alert('Failed to save data');
  }
};

onMounted(() => {
  fetchPeople();
  fetchPatients();
  fetchRecordCount();
  fetchMedicines();
});

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

const createConsultationRecord = async (person) => {
  try {
    // Create a datetime string using the selected date and current time
    const selectedDateTime = new Date(props.currentDay.date);
    const now = new Date();
    selectedDateTime.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    
    const formattedDateTime = `${selectedDateTime.getFullYear()}-${String(selectedDateTime.getMonth() + 1).padStart(2, '0')}-${String(selectedDateTime.getDate()).padStart(2, '0')} ${String(selectedDateTime.getHours()).padStart(2, '0')}:${String(selectedDateTime.getMinutes()).padStart(2, '0')}:${String(selectedDateTime.getSeconds()).padStart(2, '0')}`;

    const response = await fetch('http://localhost:3001/consultation-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: person.clientId,
        admin_id: 1, // Replace with actual admin_id
        date: formattedDateTime, // Now using the selected date with current time
        patient_name: person.name,
        patient_occupation: `${person.grade}-${person.section}`,
        doctor: 'John Doe',
        complaint: person.generalComplaint || '',
        remarks: person.remarks || '',
        confined: person.confined || false,
        medAdministration: person.medicationAdministration || false,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create consultation record');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating consultation record:', error);
    throw error;
  }
};

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

const addPerson = (person) => {
  const now = new Date();
  if (person.name && person.section) {
    selectedPerson.value = { ...person, addedAt: now, medicines: [] };
    selectedTime.value = formatAMPM(now);
    showEditModal.value = true;
  }
};

const cancelEdit = () => {
  showEditModal.value = false;
};

const cancelAdd = () =>{
  showAddModal.value = false;
};

const cancelMedicine = () => {
  showMedicineModal.value = false;
};

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

// Modify the addMedicine function
const openMedicineModal = () => {
  showMedicineModal.value = true;
  // Reset medicine search
  medicineSearchQuery.value = '';
};

// Update filteredMedicines computed property
const filteredMedicines = computed(() => {
  const query = medicineSearchQuery.value.toLowerCase();
  if (!query) return groupedMedicines.value;
  
  const filtered = {};
  Object.entries(groupedMedicines.value).forEach(([name, medicines]) => {
    if (name.toLowerCase().includes(query)) {
      filtered[name] = medicines;
    }
  });
  return filtered;
});
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
        <div v-if="selectedPerson.medicationAdministration && selectedPerson.medicines.length">
          <table class="w-full text-left border-t">
            <thead class="text-sm font-semibold text-gray-600">
              <tr>
                <th class="py-2">Pharmaceutical Product</th>
                <th class="py-2">Quantity</th>
                <th class="py-2">Schedule</th>
                <th class="py-2">Start Date</th>
                <th class="py-2">End Date</th>
                <th class="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(medicine, index) in selectedPerson.medicines" :key="index">
                <td class="py-2">{{ medicine.name }}</td>
                <td class="py-2">{{ medicine.quantity }}</td>
                <td class="py-2">{{ medicine.schedule }}</td>
                <td class="py-2">{{ formatDate(medicine.startDate) }}</td>
                <td class="py-2">{{ formatDate(medicine.endDate) }}</td>
                <td class="py-2">
                  <button @click="editMedicine(medicine, index)" class="px-2 text-blue-600">Edit</button>
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
          <th class="pb-2">Name</th>
          <th class="pb-2">Expiration</th>
          <th class="pb-2">Count</th>
        </tr>
      </thead>
      <tbody class="text-gray-700">
        <template v-for="(medicines, name) in filteredMedicines" :key="name">
          <!-- Main row -->
          <tr class="border-b border-gray-200 hover:bg-gray-100">
            <td class="py-2">
              <button @click="toggleExpandMedicine(name)" class="flex items-center">
                <Icon 
                  :icon="expandedMedicines.has(name) ? 'mdi:chevron-down' : 'mdi:chevron-right'" 
                  class="mr-2"
                />
                {{ name }}
              </button>
            </td>
            <td></td>
            <td class="py-2">{{ medicines.reduce((sum, med) => sum + med.count, 0) }}</td>
          </tr>
          <!-- Expanded details -->
          <template v-if="expandedMedicines.has(name)">
            <tr v-for="medicine in medicines" :key="medicine.med_id" class="bg-gray-50">
              <td class="py-2 pl-8">Batch {{ medicine.med_id }}</td>
              <td class="py-2">{{ formatDate(medicine.expirationDate) }}</td>
              <td class="flex items-center justify-between py-2">
                <span>{{ medicine.count }}</span>
                <button 
                  @click="addMedicine(medicine)" 
                  class="text-[#2f4a71] hover:text-white hover:bg-[#2f4a71] rounded-md p-2"
                  :disabled="medicine.count <= 0"
                >
                  <Icon icon="subway:add-1" />
                </button>
              </td>
            </tr>
          </template>
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
    <h2 class="mb-4 text-2xl font-semibold">Add Product</h2>

    <!-- Product, Expiration Date, Quantity -->
    <div class="grid grid-cols-3 gap-4 mb-4">
      <div>
        <label class="block mb-1 text-gray-600">Product</label>
        <input type="text" v-model="selectedMedicine.name" class="w-full p-2 bg-gray-100 border rounded-md" disabled>
      </div>
      <div>
        <label class="block mb-1 text-gray-600">Expiration Date</label>
        <input type="text" v-model="formattedExpirationDate" class="w-full p-2 bg-gray-100 border rounded-md" disabled>
      </div>
      <div>
        <label class="block mb-1 text-gray-600">Quantity</label>
        <input type="number" v-model="selectedMedicine.quantity" class="w-full p-2 text-center border rounded-md">
      </div>
    </div>

    <!-- Schedule -->
    <div class="mb-4">
      <label class="block mb-1 text-gray-600">Schedule</label>
      <input type="text" v-model="selectedMedicine.schedule" placeholder="e.g., Every 4 hours, 3 times a day" class="w-full p-2 border rounded-md">
    </div>

    <!-- Start Date and End Date -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div>
        <label class="block mb-1 text-gray-600">Start Date</label>
        <div class="relative">
          <input
            type="date"
            v-model="selectedMedicine.startDate"
            class="w-full p-2 border rounded-md"
          />
          <span class="absolute inset-y-0 flex items-center right-2">
            <Icon icon="mdi:calendar" />
          </span>
        </div>

      </div>
      <div>
        <label class="block mb-1 text-gray-600">End Date</label>
        <div class="relative">
          <input
            type="date"
            v-model="selectedMedicine.endDate"
            class="w-full p-2 border rounded-md"
          />
          <span class="absolute inset-y-0 flex items-center right-2">
            <Icon icon="mdi:calendar" />
          </span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end mt-4">
      <button @click="cancelMedicineDetails" class="mr-auto text-gray-600 underline">Cancel</button>
      <button @click="saveMedicineDetails" class="p-2 text-white bg-[#2f4a71] rounded-md">Add</button>
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
/* Add this to show disabled state */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>