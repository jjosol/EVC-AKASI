<script setup>
import { formatAMPM } from '~/composables/useTimeFormatter';
// Props to receive the current day from the parent component
const props = defineProps({
  currentDay: {
    type: Object,
    default: () => ({ date: new Date() }) // Default to today's date
  }
});

// Modal show or not
const showAddModal = ref(false);
const showEditModal = ref(false);
const showMedicineModal = ref(false);
const showMedicineDetailModal = ref(false);
const medicinesVisible = ref(true);

// Selected person and date/time
const selectedPerson = ref(null);
//sets the date to be full and not abbreviation
const selectedDate = computed(() => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dayOptions = { weekday: 'long' }; // For day of the week (e.g., Monday)
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' }; // For date (e.g., September 20, 2024)
  const date = new Intl.DateTimeFormat('en-US', options).format(props.currentDay.date);
  const day = new Intl.DateTimeFormat('en-US', dayOptions).format(props.currentDay.date);
  const monthYear = new Intl.DateTimeFormat('en-US', dateOptions).format(props.currentDay.date);

  return { day, monthYear, date };
});

const selectedTime = ref(formatAMPM(new Date()));
// console.log(selectedTime.value)

// Search queries
const searchQuery = ref('');
const medicineSearchQuery = ref('');

// To contain all that is part of the list
const people = ref([]);

// Initialize values for people list
const allPeople = ref([
  { name: 'John Doe', section: '11 A', age: 30, sex: 'male' },
  { name: 'Jane Smith', section: '12 B', age: 25, sex: 'female' },
  { name: 'Alice Johnson', section: '11 C', age: 28, sex: 'female' },
  { name: 'Bob Brown', section: '12 C', age: 32, sex: 'male' },
]);

// Initialize values for meds list
const allMedicines = ref([
  { name: 'Paracetamol', dosages: [250, 500] },
  { name: 'Ibuprofen', dosages: [200, 400, 600] },
  { name: 'Aspirin', dosages: [75, 150, 300] },
  { name: 'Amoxicillin', dosages: [250, 500, 1000] },
]);
//create composable for search
// Search person
const filteredPeople = computed(() => {
  if (!searchQuery.value) {
    return allPeople.value;
  }
  return allPeople.value.filter(person => person.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

// Search meds
const filteredMedicines = computed(() => {
  if (!medicineSearchQuery.value) {
    return allMedicines.value;
  }
  return allMedicines.value.filter(medicine => medicine.name.toLowerCase().includes(medicineSearchQuery.value.toLowerCase()));
});

// To reset but if theres a db it should be changed
watch(() => props.currentDay, (newVal) => {
  if (newVal && newVal.date) {
    people.value = []; 
    //function to change people based on which day if we have db
  }
});

// About people modal
const openEditModal = (person) => {
  selectedPerson.value = { ...person };
  selectedTime.value = formatAMPM(new Date(person.addedAt));
  showEditModal.value = true;
};

// Add person
const addPerson = (person) => {
  const now = new Date();
  if (person.name && person.section) {
    selectedPerson.value = { ...person, addedAt: now, medicines: [] };
    selectedTime.value = formatAMPM(now);
    showEditModal.value = true;
  }
};

// Delete person
const deletePerson = (index) => {
  people.value.splice(index, 1);
};

// Time when added (am/pm)
// const formatAMPM = (date) => {
//   let hours = date.getHours();
//   let minutes = date.getMinutes();
//   let ampm = hours >= 12 ? 'PM' : 'AM';
//   hours = hours % 12;
//   hours = hours ? hours : 12;
//   minutes = minutes < 10 ? '0' + minutes : minutes;
//   let strTime = hours + ':' + minutes + ' ' + ampm;
//   return strTime;
// };

// Save person
const savePerson = () => {
  const now = new Date();
  selectedPerson.value.addedAt = now; // Update addedAt to the current time
  const index = people.value.findIndex(p => p.name === selectedPerson.value.name);
  if (index !== -1) {
    people.value[index] = { ...selectedPerson.value };
  } else {
    people.value.push({ ...selectedPerson.value });
  }
  showEditModal.value = false;
  showAddModal.value = false;
};


// Cancel edit
const cancelEdit = () => {
  showEditModal.value = false;
};

const cancelAdd = () =>{
  showAddModal.value = false;
}
// Medicine modal
const openMedicineModal = () => {
  showMedicineModal.value = true;
};

// Add medicine
const addMedicine = (medicine) => {
  selectedMedicine.value = { ...medicine, dosage: null, quantity: 1, schedule: '', startDate: '', endDate: '' };
  showMedicineDetailModal.value = true;
  showMedicineModal.value = false;
};

// Edit medicine
const editMedicine = (medicine, index) => {
  selectedMedicine.value = { ...medicine, index };
  showMedicineDetailModal.value = true;
};

// Save medicine details
const saveMedicineDetails = () => {
  if (selectedMedicine.value.index !== undefined) {
    selectedPerson.value.medicines[selectedMedicine.value.index] = { ...selectedMedicine.value };
    delete selectedMedicine.value.index;
  } else {
    if (!selectedPerson.value.medicines) {
      selectedPerson.value.medicines = [];
    }
    selectedPerson.value.medicines.push({ ...selectedMedicine.value });
  }
  showMedicineDetailModal.value = false;
  showMedicineModal.value = false;
};

// Remove medicine
const removeMedicine = (index) => {
  selectedPerson.value.medicines.splice(index, 1);
};

// Cancel medicine
const cancelMedicine = () => {
  showMedicineModal.value = false;
};

// Cancel medicine details
const cancelMedicineDetails = () => {
  showMedicineDetailModal.value = false;
  showMedicineModal.value = false;
};

// Selected medicine for detail modal
const selectedMedicine = ref({
  name: '',
  dosage: null,
  quantity: 1,
  schedule: '',
  startDate: '',
  endDate: ''
});
const emit = defineEmits(['confined']);

const confinedPeople = () => {
  emit('confined', people.value.length);
};

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
console.log(selectedDate.value)
</script>

<template>
  <div class="fixed w-4/6">
    <div class="fixed top-0 right-0 w-1/4 h-screen p-5 bg-white border-[#2f4a71] border-l-2">
    <div class="h-full p-5 overflow-y-auto l">
      <h2 class="text-2xl text-[#2f4a71]">{{ selectedDate.day }}</h2>
      <h2 class="mb-4 text-3xl font-bold text-[#2f4a71] border-b-2 border-[#2f4a71]">{{ selectedDate.monthYear }}</h2>
      <!-- <p class="text-2xl text-[#d3cae7]">CONFINEMENTS:</p> -->
      <button @click="showAddModal = true" class="block p-2 mt-4 ml-auto text-3xl text-[#2f4a71] hover:text-white bg-[#e6e6e6] rounded-full hover:bg-[#745dab] "><Icon icon="subway:add-1" /></button>
      <div v-if="showAddModal">
        <div class="flex items-center mb-4">
          <div class="relative w-full">
            <input
              v-model="searchQuery"
              placeholder="Search"
              class="w-full p-2 pl-10 border border-[#2f4a71] rounded-full focus:outline-none"
            />
            <Icon icon="fluent:search-12-regular" class="absolute top-2 left-3 text-[#2f4a71]" />
          </div>
          <button @click="cancelAdd" class="ml-4 text-[#2f4a71] hover:underline">Cancel</button>
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
        <li v-for="(person, index) in people" :key="index" class="flex items-center justify-between mb-2 text-lg confinement-item text-[#2f4a71]">
          <span @click="openEditModal(person)" class="cursor-pointer confinement-details">{{ person.name }} - {{ person.section }}</span>
          <button @click="deletePerson(index)" class="p-2 text-white bg-red-500 rounded"><Icon icon="fluent:delete-28-regular" /></button>
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
                <input type="text" value="xxx - xxx - xxxx" id="date" disabled
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
        <div class="overflow-x-auto">
          <table class="w-full text-left border-t">
            <thead class="text-sm font-semibold text-gray-600">
              <tr>
                <th class="py-2">Pharmaceutical Product</th>
                <th class="py-2">Count</th>
                <th class="py-2">Cancel</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(medicine, index) in selectedPerson.medicines" :key="index" v-if="medicinesVisible">
                <td class="py-2">{{ medicine.name }}</td>
                <td class="py-2">{{ medicine.quantity }}</td>
                <td class="py-2">
                  <button @click="removeMedicine(index)" class="text-red-500">-</button>
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
      <div class="w-1/3 p-4 bg-white rounded-2xl">
        <h2 class="mb-2 text-xl">Add Medicine</h2>
        <input v-model="medicineSearchQuery" placeholder="Search Medicine" class="w-full p-2 mb-2 border rounded">
        <ul class="mt-4 overflow-y-auto max-h-60">
          <li v-for="medicine in filteredMedicines" :key="medicine.name" class="flex items-center justify-between mb-2 text-lg">
            <span>{{ medicine.name }}</span>
            <button @click="addMedicine(medicine)" class="p-2 text-[#2f4a71] hover:text-white bg-transparent hover:bg-[#2f4a71] rounded"><Icon icon="subway:add-1"/></button>
          </li>
        </ul>
        <div class="flex justify-end mt-4">
          <button @click="cancelMedicine" class="p-2 ml-2 text-white bg-gray-500 rounded">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Medicine Detail Modal -->
    <div v-if="showMedicineDetailModal" class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
      <div class="w-1/3 p-4 bg-white rounded-2xl">
        <h2 class="mb-2 text-xl">Medicine Details</h2>
        <p><strong>Medicine:</strong> {{ selectedMedicine.name }}</p>
        <div class="mb-2">
          <label for="dosage" class="block mb-1">Dosage (mg):</label>
          <select id="dosage" v-model="selectedMedicine.dosage" class="w-full p-2 mb-2 border rounded">
            <option v-for="dosage in selectedMedicine.dosages" :key="dosage" :value="dosage">{{ dosage }}</option>
          </select>
        </div>
        <div class="mb-2">
          <label for="quantity" class="block mb-1">Quantity:</label>
          <input type="number" id="quantity" v-model="selectedMedicine.quantity" min="1" class="w-16 p-2 mx-2 text-center border rounded">
        </div>
        <div class="mb-2">
          <label for="schedule" class="block mb-1">Schedule:</label>
          <textarea id="schedule" v-model="selectedMedicine.schedule" placeholder="e.g., Every 4 hours, 3 times a day" class="w-full p-2 mb-2 border rounded"></textarea>
        </div>
        <div class="mb-2">
          <label for="startDate" class="block mb-1">Start Date:</label>
          <input type="date" id="startDate" v-model="selectedMedicine.startDate" class="w-full p-2 mb-2 border rounded">
        </div>
        <div class="mb-2">
          <label for="endDate" class="block mb-1">End Date:</label>
          <input type="date" id="endDate" v-model="selectedMedicine.endDate" class="w-full p-2 mb-2 border rounded">
        </div>
        <div class="flex justify-end mt-4">
          <button @click="saveMedicineDetails" class="p-2 text-white bg-green-500 rounded">Save</button>
          <button @click="cancelMedicineDetails" class="p-2 ml-2 text-white bg-gray-500 rounded">Cancel</button>
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