<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import * as consultationRecordService from '~/services/consultationRecordService';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  consultation: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close', 'save']);

// Form fields
const temperature = ref('');
const weight = ref('');
const height = ref('');
const bloodPressure = ref('');
const heartRate = ref('');
const complaints = ref('');
const treatment = ref('');

// Loading state
const isSaving = ref(false);
const isLoadingDetails = ref(false);

// Consultation details
const consultationDetails = ref(null);
const hasMedications = ref(false);
const medications = ref([]);
const hasPrescription = ref(false);
const prescriptionUrl = ref('');
const prescriptionDetails = ref(null);
const nurseRemarks = ref('');
const actionsTaken = ref([]);
const dispositions = ref([]);
const chiefComplaints = ref([]);

// Confirmation modal state
const showConfirmationModal = ref(false);

// Prescription viewer modal
const showPrescriptionModal = ref(false);

// Page navigation state
const currentPage = ref(1); // 1 = form, 2 = confirmation, 3 = nurse view

// Computed properties for BMI calculation
const bmi = computed(() => {
  const weightValue = parseFloat(weight.value);
  const heightValue = parseFloat(height.value);
  if (weightValue > 0 && heightValue > 0) {
    // Height in meters (convert from cm)
    const heightInMeters = heightValue / 100;
    return (weightValue / (heightInMeters * heightInMeters)).toFixed(2);
  }
  return '';
});

const bmiCategory = computed(() => {
  const bmiValue = parseFloat(bmi.value);
  if (!bmiValue) return '';
  
  if (bmiValue < 18.5) return 'Underweight';
  if (bmiValue < 25) return 'Normal';
  if (bmiValue < 30) return 'Overweight';
  return 'Obese';
});

// Function to fetch consultation details including prescription and medications
const fetchConsultationDetails = async (consultationId) => {
  if (!consultationId) return;

  try {
    isLoadingDetails.value = true;
    
    // Fetch detailed consultation record
    const details = await consultationRecordService.fetchConsultationRecord(consultationId);
    consultationDetails.value = details;
    
    // Check for and parse chief complaints
    if (details.complaint) {
      try {
        const complaintsArray = details.complaint.split(', ');
        chiefComplaints.value = complaintsArray.map(complaint => {
          const injuryMatch = complaint.match(/^Injury: (.+)$/);
          const otherMatch = complaint.match(/^Other: (.+)$/);
          
          if (injuryMatch) {
            return { value: 'Injury', details: injuryMatch[1] };
          } else if (otherMatch) {
            return { value: 'Other', details: otherMatch[1] };
          } else {
            return { value: complaint, details: '' };
          }
        });
      } catch (error) {
        console.error('Error parsing complaints:', error);
        chiefComplaints.value = [{ value: details.complaint, details: '' }];
      }
    }

    // Check for and parse action taken
    if (details.action) {
      try {
        const actionsArray = details.action.split(', ');
        actionsTaken.value = actionsArray.map(action => {
          const headCheckMatch = action.match(/^Head checked for: (.+)$/);
          const parentNotifiedMatch = action.match(/^Parent\/guardian notified at: (.+)$/);
          const otherMatch = action.match(/^Other: (.+)$/);
          
          if (headCheckMatch) {
            return { value: 'Head checked for', details: headCheckMatch[1] };
          } else if (parentNotifiedMatch) {
            return { value: 'Parent/guardian notified at', details: parentNotifiedMatch[1] };
          } else if (otherMatch) {
            return { value: 'Other', details: otherMatch[1] };
          } else {
            return { value: action, details: '' };
          }
        });
      } catch (error) {
        console.error('Error parsing actions:', error);
        actionsTaken.value = [{ value: details.action, details: '' }];
      }
    }

    // Check for and parse dispositions
    if (details.disposition) {
      try {
        const dispositionsArray = details.disposition.split(', ');
        dispositions.value = dispositionsArray.map(disposition => {
          const otherMatch = disposition.match(/^Other: (.+)$/);
          
          if (otherMatch) {
            return { value: 'Other', details: otherMatch[1] };
          } else {
            return { value: disposition, details: '' };
          }
        });
      } catch (error) {
        console.error('Error parsing dispositions:', error);
        dispositions.value = [{ value: details.disposition, details: '' }];
      }
    }
    
    // Set nurse remarks
    nurseRemarks.value = details.remarks || '';
    
    // Fetch medication administration records if available
    if (details.medAdministration) {
      const meds = await consultationRecordService.fetchMedAdministrationRecords(consultationId);
      medications.value = meds;
      hasMedications.value = meds && meds.length > 0;
    } else {
      hasMedications.value = false;
      medications.value = [];
    }
    
    // Check for prescription
    try {
      const prescriptionInfo = await consultationRecordService.fetchPrescriptionByConsultation(consultationId);
      if (prescriptionInfo && prescriptionInfo.prescription_id) {
        hasPrescription.value = true;
        prescriptionDetails.value = prescriptionInfo;
        prescriptionUrl.value = `http://localhost:3001/patient-files/prescription/${prescriptionInfo.prescription_id}`;
      } else {
        hasPrescription.value = false;
        prescriptionDetails.value = null;
      }
    } catch (error) {
      console.error('Error fetching prescription:', error);
      hasPrescription.value = false;
    }
    
  } catch (error) {
    console.error('Error fetching consultation details:', error);
  } finally {
    isLoadingDetails.value = false;
  }
};

// Function to close modal
const closeModal = () => {
  emit('close');
};

// Function to go back to previous page
const goBack = () => {
  currentPage.value = 1;
};

// Function to show confirmation modal
const showConfirmation = () => {
  currentPage.value = 2;
};

// Function to cancel save action
const cancelSave = () => {
  currentPage.value = 1;
};

// Function to view prescription
const viewPrescription = () => {
  showPrescriptionModal.value = true;
};

// Function to close prescription modal
const closePrescriptionModal = () => {
  showPrescriptionModal.value = false;
};

// Function to save medical data
const saveConsultation = async () => {
  try {
    isSaving.value = true;
    
    if (!props.consultation.consultation_id) {
      throw new Error('Consultation ID is required');
    }

    // Prepare medical data to save
    const medicalData = {
      temperature: temperature.value,
      weight: weight.value,
      height: height.value,
      blood_pressure: bloodPressure.value,
      heart_rate: heartRate.value,
      diagnosis: complaints.value,
      treatment: treatment.value,
      // Include patient demographic data
      age: props.consultation.age,
      gender: props.consultation.gender
    };

    // Call service to update consultation with medical data
    await consultationRecordService.updateConsultationMedicalData(
      props.consultation.consultation_id,
      medicalData
    );
    
    // Update to show nurse view
    currentPage.value = 3;

    // Call additional service to notify nurse
    await consultationRecordService.notifyNurseAboutMedicalRecord(
      props.consultation.consultation_id
    );
    
    // Show success message
    alert('Medical data saved successfully and sent to the nurse');
    
    // Trigger refresh but don't close modal yet (nurse can see the info)
    emit('save');
  } catch (error) {
    console.error('Error saving medical data:', error);
    alert('Error saving medical data: ' + error.message);
    currentPage.value = 1;
  } finally {
    isSaving.value = false;
  }
};

// Define refs for patient demographic data
const patientType = ref('');
const patientAge = ref('');
const patientGender = ref('');

// Format date function
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });
};

// Populate fields when consultation data is available
watch(() => props.consultation, async (newConsultation) => {
  if (newConsultation && newConsultation.consultation_id) {
    // Use the helper function to extract all medical data in a consistent way
    const medicalData = consultationRecordService.extractMedicalData(newConsultation);
    
    // Populate form fields with the extracted data
    temperature.value = medicalData.temperature || '';
    weight.value = medicalData.weight || '';
    height.value = medicalData.height || '';
    bloodPressure.value = medicalData.blood_pressure || '';
    heartRate.value = medicalData.heart_rate || '';
    complaints.value = medicalData.diagnosis || newConsultation?.complaint || '';
    treatment.value = medicalData.treatment || '';

    // Set patient demographic data from extracted data with fallbacks
    patientType.value = medicalData.patientType || newConsultation.type || 'N/A';
    patientAge.value = medicalData.patientAge || newConsultation.age || 'N/A';
    patientGender.value = medicalData.patientGender || newConsultation.gender || 'N/A';

    // Fetch detailed consultation info including prescriptions and medications
    await fetchConsultationDetails(newConsultation.consultation_id);

    // If this consultation has been reviewed by a doctor before, show the nurse view directly
    if (newConsultation.doctor_reviewed) {
      currentPage.value = 3; // Skip to the nurse view page
    }
  }
}, { immediate: true });
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-800">
          <template v-if="currentPage === 1">Medical Consultation</template>
          <template v-if="currentPage === 2">Confirm Record Saving</template>
          <template v-if="currentPage === 3">Medical Record (For Nurse)</template>
        </h2>
        <button @click="closeModal" class="text-gray-500 hover:text-gray-700">
          <Icon icon="mdi:close" class="w-6 h-6" />
        </button>
      </div>
      
      <!-- Main Form Page -->
      <div v-if="currentPage === 1">
        <!-- Patient info -->
        <div class="px-6 py-4 bg-gray-50">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Patient Name</p>
              <p class="font-medium">{{ consultation.name }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Type</p>
              <p class="font-medium">{{ patientType }}</p>
            </div>
            <div v-if="consultation.grade">
              <p class="text-sm text-gray-500">Grade/Section</p>
              <p class="font-medium">{{ consultation.grade }}-{{ consultation.section }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Date/Time</p>
              <p class="font-medium">{{ consultation.time }}</p>
            </div>
          </div>

          <!-- Nurse Consultation Summary -->
          <div v-if="isLoadingDetails" class="p-3 mt-4 rounded bg-blue-50">
            <p class="text-sm text-center text-blue-600">Loading consultation details...</p>
          </div>
          <div v-else-if="consultationDetails" class="p-3 mt-4 rounded bg-blue-50">
            <h4 class="mb-2 font-medium text-blue-800">Nurse Consultation Summary</h4>
            
            <!-- Chief Complaints -->
            <div v-if="chiefComplaints.length > 0" class="mb-2">
              <span class="text-xs font-medium text-blue-700">Chief Complaints:</span>
              <ul class="ml-4 text-sm text-blue-800">
                <li v-for="(complaint, index) in chiefComplaints" :key="index">
                  {{ complaint.value }}{{ complaint.details ? ': ' + complaint.details : '' }}
                </li>
              </ul>
            </div>
            
            <!-- Actions Taken -->
            <div v-if="actionsTaken.length > 0" class="mb-2">
              <span class="text-xs font-medium text-blue-700">Actions Taken:</span>
              <ul class="ml-4 text-sm text-blue-800">
                <li v-for="(action, index) in actionsTaken" :key="index">
                  {{ action.value }}{{ action.details ? ': ' + action.details : '' }}
                </li>
              </ul>
            </div>
            
            <!-- Dispositions -->
            <div v-if="dispositions.length > 0" class="mb-2">
              <span class="text-xs font-medium text-blue-700">Dispositions:</span>
              <ul class="ml-4 text-sm text-blue-800">
                <li v-for="(disposition, index) in dispositions" :key="index">
                  {{ disposition.value }}{{ disposition.details ? ': ' + disposition.details : '' }}
                </li>
              </ul>
            </div>
            
            <!-- Nurse Remarks -->
            <div v-if="nurseRemarks">
              <span class="text-xs font-medium text-blue-700">Nurse Remarks:</span>
              <p class="text-sm text-blue-800">{{ nurseRemarks }}</p>
            </div>
            
            <!-- Medication & Prescription Alert -->
            <div v-if="hasMedications || hasPrescription" class="flex items-center mt-2 space-x-2">
              <Icon v-if="hasMedications" icon="mdi:pill" class="w-4 h-4 text-blue-600" />
              <span v-if="hasMedications" class="text-xs text-blue-700">Medications Provided</span>
              
              <Icon v-if="hasPrescription" icon="mdi:file-document" class="w-4 h-4 ml-2 text-blue-600" />
              <button 
                v-if="hasPrescription" 
                @click="viewPrescription" 
                class="text-xs text-blue-700 underline"
              >
                View Prescription
              </button>
            </div>
          </div>
        </div>
        
        <!-- Medical Form -->
        <div class="p-6">
          <!-- Vital signs - smaller fields -->
          <div class="mb-5">
            <h3 class="mb-3 font-medium text-gray-700">Vital Signs</h3>
            
            <div class="grid grid-cols-2 gap-x-6 gap-y-3">
              <!-- Temperature -->
              <div class="col-span-1">
                <div class="flex items-center justify-between">
                  <label class="block mb-1 text-sm font-medium text-gray-700">Temperature (°C)</label>
                  <span v-if="temperature" class="flex items-center text-xs font-medium text-green-600">
                    <Icon icon="mdi:check-circle" class="w-4 h-4 mr-1" />Completed
                  </span>
                </div>
                <input
                  v-model="temperature"
                  type="text"
                  class="w-full px-3 py-2 text-sm transition-all border rounded-md"
                  :class="temperature ? 'border-green-400 bg-green-50' : 'border-gray-300'"
                  placeholder="36.5"
                />
              </div>
              
              <!-- Blood Pressure -->
              <div class="col-span-1">
                <div class="flex items-center justify-between">
                  <label class="block mb-1 text-sm font-medium text-gray-700">Blood Pressure (mmHg)</label>
                  <span v-if="bloodPressure" class="flex items-center text-xs font-medium text-green-600">
                    <Icon icon="mdi:check-circle" class="w-4 h-4 mr-1" />Completed
                  </span>
                </div>
                <input
                  v-model="bloodPressure"
                  type="text"
                  class="w-full px-3 py-2 text-sm transition-all border rounded-md"
                  :class="bloodPressure ? 'border-green-400 bg-green-50' : 'border-gray-300'"
                  placeholder="120/80"
                />
              </div>
              
              <!-- Weight -->
              <div class="col-span-1">
                <div class="flex items-center justify-between">
                  <label class="block mb-1 text-sm font-medium text-gray-700">Weight (kg)</label>
                  <span v-if="weight" class="flex items-center text-xs font-medium text-green-600">
                    <Icon icon="mdi:check-circle" class="w-4 h-4 mr-1" />Completed
                  </span>
                </div>
                <input
                  v-model="weight"
                  type="number"
                  class="w-full px-3 py-2 text-sm transition-all border rounded-md"
                  :class="weight ? 'border-green-400 bg-green-50' : 'border-gray-300'"
                  placeholder="60"
                />
              </div>
              
              <!-- Heart Rate -->
              <div class="col-span-1">
                <div class="flex items-center justify-between">
                  <label class="block mb-1 text-sm font-medium text-gray-700">Heart Rate (BPM)</label>
                  <span v-if="heartRate" class="flex items-center text-xs font-medium text-green-600">
                    <Icon icon="mdi:check-circle" class="w-4 h-4 mr-1" />Completed
                  </span>
                </div>
                <input
                  v-model="heartRate"
                  type="number"
                  class="w-full px-3 py-2 text-sm transition-all border rounded-md"
                  :class="heartRate ? 'border-green-400 bg-green-50' : 'border-gray-300'"
                  placeholder="80"
                />
              </div>
              
              <!-- Height -->
              <div class="col-span-1">
                <div class="flex items-center justify-between">
                  <label class="block mb-1 text-sm font-medium text-gray-700">Height (cm)</label>
                  <span v-if="height" class="flex items-center text-xs font-medium text-green-600">
                    <Icon icon="mdi:check-circle" class="w-4 h-4 mr-1" />Completed
                  </span>
                </div>
                <input
                  v-model="height"
                  type="number"
                  class="w-full px-3 py-2 text-sm transition-all border rounded-md"
                  :class="height ? 'border-green-400 bg-green-50' : 'border-gray-300'"
                  placeholder="170"
                />
              </div>
              
              <!-- BMI (calculated) -->
              <div class="col-span-1" v-if="bmi">
                <div class="flex items-center justify-between">
                  <label class="block mb-1 text-sm font-medium text-gray-700">BMI</label>
                  <span class="flex items-center text-xs font-medium text-green-600">
                    <Icon icon="mdi:check-circle" class="w-4 h-4 mr-1" />Calculated
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-full px-3 py-2 text-sm border border-green-400 rounded-md bg-green-50">
                    {{ bmi }} - {{ bmiCategory }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Medications List -->
          <div v-if="hasMedications" class="mb-5">
            <h3 class="mb-3 font-medium text-gray-700">Medications Administered</h3>
            <div class="overflow-hidden border border-gray-200 rounded-md">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Name</th>
                    <th class="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Quantity</th>
                    <th class="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Schedule</th>
                    <th class="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Duration</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(med, index) in medications" :key="index">
                    <td class="px-4 py-2 text-sm text-gray-900">{{ med.medName }}</td>
                    <td class="px-4 py-2 text-sm text-gray-900">{{ med.count }}</td>
                    <td class="px-4 py-2 text-sm text-gray-900">{{ med.schedule || 'As needed' }}</td>
                    <td class="px-4 py-2 text-sm text-gray-900">
                      {{ formatDate(med.start_date) }} to {{ formatDate(med.end_date) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Complaints/Diagnosis - larger field -->
          <div class="mb-5">
            <div class="flex items-center justify-between mb-2">
              <label class="block font-medium text-gray-700">Complaints/Diagnosis</label>
              <span v-if="complaints" class="flex items-center text-xs font-medium text-green-600">
                <Icon icon="mdi:check-circle" class="w-4 h-4 mr-1" />Completed
              </span>
            </div>
            <textarea
              v-model="complaints"
              class="w-full h-32 px-3 py-2 text-sm transition-all border rounded-md resize-none"
              :class="complaints ? 'border-green-400 bg-green-50' : 'border-gray-300'"
              placeholder="Enter patient complaints and diagnosis"
            ></textarea>
          </div>
          
          <!-- Treatment/Instructions - larger field -->
          <div class="mb-5">
            <div class="flex items-center justify-between mb-2">
              <label class="block font-medium text-gray-700">Treatment/Instructions</label>
              <span v-if="treatment" class="flex items-center text-xs font-medium text-green-600">
                <Icon icon="mdi:check-circle" class="w-4 h-4 mr-1" />Completed
              </span>
            </div>
            <textarea
              v-model="treatment"
              class="w-full h-32 px-3 py-2 text-sm transition-all border rounded-md resize-none"
              :class="treatment ? 'border-green-400 bg-green-50' : 'border-gray-300'"
              placeholder="Enter treatment plan and instructions"
            ></textarea>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="showConfirmation"
            :disabled="isSaving"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50"
          >
            <span v-if="isSaving">Saving...</span>
            <span v-else>Save Medical Record</span>
          </button>
        </div>
      </div>
      
      <!-- Confirmation Modal Page -->
      <div v-if="currentPage === 2" class="p-6">
        <div class="py-6 text-center">
          <div class="mx-auto mb-4 text-red-500">
            <Icon icon="mdi:alert-circle-outline" class="w-16 h-16" />
          </div>
          
          <h3 class="mb-2 text-lg font-medium text-gray-900">Confirm Medical Record Saving</h3>
          <div class="mb-6 text-gray-600">
            <p>Are you sure you want to save this medical record?</p>
            <p class="mt-2 font-medium text-red-600">This action is irreversible and cannot be undone.</p>
          </div>
          
          <div class="flex justify-center gap-4">
            <button
              @click="cancelSave"
              class="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              @click="saveConsultation"
              :disabled="isSaving"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none disabled:opacity-50"
            >
              <span v-if="isSaving">Processing...</span>
              <span v-else>Confirm & Save</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Nurse View Page -->
      <div v-if="currentPage === 3" class="p-6">
        <!-- Completion Banner -->
        <div class="p-4 mb-6 bg-green-100 border border-green-500 rounded-md">
          <div class="flex">
            <div class="flex-shrink-0">
              <Icon icon="mdi:check-circle" class="w-6 h-6 text-green-600" />
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-green-800">
                Medical Record Completed
              </h3>
              <div class="mt-2 text-sm text-green-700">
                <p>This medical record has been completed and sent to the nurse. No further modifications can be made.</p>
                <p class="mt-1">Completed on: {{ new Date().toLocaleString() }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Banner for nurse -->
        <div class="p-4 mb-6 border border-blue-300 rounded-md bg-blue-50">
          <div class="flex">
            <div class="flex-shrink-0">
              <Icon icon="mdi:information" class="w-5 h-5 text-blue-400" />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800">
                Medical Record from Doctor
              </h3>
              <div class="mt-2 text-sm text-blue-700">
                <p>This medical record has been shared with you by the doctor.</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Patient info -->
        <div class="p-4 mb-6 bg-white border border-gray-200 rounded-lg">
          <h4 class="mb-2 text-sm font-medium text-gray-500">PATIENT INFORMATION</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Patient Name</p>
              <p class="font-medium">{{ consultation.name }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Type</p>
              <p class="font-medium">{{ patientType }}</p>
            </div>
            <div v-if="consultation.grade">
              <p class="text-sm text-gray-500">Grade/Section</p>
              <p class="font-medium">{{ consultation.grade }}-{{ consultation.section }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Date/Time</p>
              <p class="font-medium">{{ consultation.time }}</p>
            </div>
          </div>
        </div>
        
        <!-- Vital Signs -->
        <div class="p-4 mb-6 bg-white border border-gray-200 rounded-lg">
          <h4 class="mb-2 text-sm font-medium text-gray-500">VITAL SIGNS</h4>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <p class="text-sm text-gray-500">Temperature</p>
              <p class="font-medium">{{ temperature || 'N/A' }} °C</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Blood Pressure</p>
              <p class="font-medium">{{ bloodPressure || 'N/A' }} mmHg</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Heart Rate</p>
              <p class="font-medium">{{ heartRate || 'N/A' }} BPM</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Weight</p>
              <p class="font-medium">{{ weight || 'N/A' }} kg</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Height</p>
              <p class="font-medium">{{ height || 'N/A' }} cm</p>
            </div>
            <div v-if="bmi">
              <p class="text-sm text-gray-500">BMI</p>
              <p class="font-medium">{{ bmi }} ({{ bmiCategory }})</p>
            </div>
          </div>
        </div>

        <!-- Nurse Information -->
        <div class="p-4 mb-6 bg-white border border-gray-200 rounded-lg">
          <h4 class="mb-2 text-sm font-medium text-gray-500">NURSE ASSESSMENT</h4>
          
          <!-- Chief Complaints -->
          <div class="mb-4">
            <p class="mb-1 text-sm text-gray-600">Chief Complaints:</p>
            <div class="pl-4">
              <div v-if="chiefComplaints.length > 0">
                <ul class="pl-4 list-disc">
                  <li v-for="(complaint, index) in chiefComplaints" :key="index" class="text-sm">
                    {{ complaint.value }}{{ complaint.details ? ': ' + complaint.details : '' }}
                  </li>
                </ul>
              </div>
              <p v-else class="text-sm italic text-gray-500">No complaints recorded</p>
            </div>
          </div>
          
          <!-- Actions Taken -->
          <div class="mb-4">
            <p class="mb-1 text-sm text-gray-600">Actions Taken:</p>
            <div class="pl-4">
              <div v-if="actionsTaken.length > 0">
                <ul class="pl-4 list-disc">
                  <li v-for="(action, index) in actionsTaken" :key="index" class="text-sm">
                    {{ action.value }}{{ action.details ? ': ' + action.details : '' }}
                  </li>
                </ul>
              </div>
              <p v-else class="text-sm italic text-gray-500">No actions recorded</p>
            </div>
          </div>
          
          <!-- Dispositions -->
          <div class="mb-4">
            <p class="mb-1 text-sm text-gray-600">Dispositions:</p>
            <div class="pl-4">
              <div v-if="dispositions.length > 0">
                <ul class="pl-4 list-disc">
                  <li v-for="(disposition, index) in dispositions" :key="index" class="text-sm">
                    {{ disposition.value }}{{ disposition.details ? ': ' + disposition.details : '' }}
                  </li>
                </ul>
              </div>
              <p v-else class="text-sm italic text-gray-500">No dispositions recorded</p>
            </div>
          </div>
          
          <!-- Remarks -->
          <div v-if="nurseRemarks" class="mb-2">
            <p class="mb-1 text-sm text-gray-600">Nurse Remarks:</p>
            <p class="p-2 text-sm rounded bg-gray-50">{{ nurseRemarks }}</p>
          </div>
        </div>
        
        <!-- Medications List -->
        <div v-if="hasMedications" class="p-4 mb-6 bg-white border border-gray-200 rounded-lg">
          <h4 class="mb-2 text-sm font-medium text-gray-500">MEDICATIONS</h4>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Name</th>
                  <th class="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Quantity</th>
                  <th class="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Schedule</th>
                  <th class="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Period</th>
                  <th class="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Remarks</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(med, index) in medications" :key="index">
                  <td class="px-3 py-2 text-xs text-gray-900">{{ med.medName }}</td>
                  <td class="px-3 py-2 text-xs text-gray-900">{{ med.count }}</td>
                  <td class="px-3 py-2 text-xs text-gray-900">{{ med.schedule || 'As needed' }}</td>
                  <td class="px-3 py-2 text-xs text-gray-900">
                    {{ formatDate(med.start_date) }} - {{ formatDate(med.end_date) }}
                  </td>
                  <td class="px-3 py-2 text-xs text-gray-900">{{ med.remarks || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Prescription button -->
          <div v-if="hasPrescription" class="mt-4">
            <button 
              @click="viewPrescription" 
              class="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              <Icon icon="mdi:file-document-outline" class="w-5 h-5 mr-1" />
              View Prescription
            </button>
          </div>
        </div>
        
        <!-- Diagnosis -->
        <div class="p-4 mb-6 bg-white border border-gray-200 rounded-lg">
          <h4 class="mb-2 text-sm font-medium text-gray-500">DIAGNOSIS</h4>
          <p class="whitespace-pre-wrap">{{ complaints || 'No diagnosis provided' }}</p>
        </div>
        
        <!-- Treatment Plan -->
        <div class="p-4 mb-6 bg-white border border-gray-200 rounded-lg">
          <h4 class="mb-2 text-sm font-medium text-gray-500">TREATMENT PLAN</h4>
          <p class="whitespace-pre-wrap">{{ treatment || 'No treatment plan provided' }}</p>
        </div>
        
        <!-- Footer -->
        <div class="flex justify-end mt-6">
          <button
            @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Prescription Viewer Modal -->
  <div v-if="showPrescriptionModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
    <div class="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="text-lg font-medium">Prescription</h3>
        <button @click="closePrescriptionModal" class="text-gray-400 hover:text-gray-600">
          <Icon icon="mdi:close" class="w-6 h-6" />
        </button>
      </div>
      
      <!-- Body -->
      <div class="flex-1 p-4 overflow-auto">
        <div v-if="prescriptionDetails">
          <!-- Display image if it's an image type -->
          <img 
            v-if="prescriptionDetails.mime_type && prescriptionDetails.mime_type.startsWith('image/')" 
            :src="prescriptionUrl" 
            alt="Prescription" 
            class="h-auto max-w-full mx-auto"
          />
          
          <!-- Display PDF in iframe if it's a PDF -->
          <iframe 
            v-else-if="prescriptionDetails.mime_type === 'application/pdf'" 
            :src="prescriptionUrl" 
            class="w-full h-[70vh]"
          ></iframe>
          
          <!-- Fallback for other file types -->
          <div v-else class="py-8 text-center">
            <Icon icon="mdi:file-document-outline" class="w-16 h-16 mx-auto text-gray-400" />
            <p class="mt-2 text-sm text-gray-600">
              {{ prescriptionDetails.file_name || 'Prescription file' }}
            </p>
            <a 
              :href="prescriptionUrl" 
              target="_blank" 
              class="inline-block px-4 py-2 mt-4 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Download Prescription
            </a>
          </div>
        </div>
        <div v-else class="py-8 text-center">
          <p class="text-gray-500">No prescription available</p>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="p-4 border-t">
        <div class="flex justify-end">
          <button 
            @click="closePrescriptionModal" 
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>