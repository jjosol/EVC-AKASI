<script setup>
import { ref, computed, watch } from 'vue';
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

// Confirmation modal state
const showConfirmationModal = ref(false);

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
      treatment: treatment.value
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

// Populate fields when consultation data is available
watch(() => props.consultation, (newConsultation) => {
  if (newConsultation && newConsultation.medical_data) {
    const data = newConsultation.medical_data;
    temperature.value = data.temperature || '';
    weight.value = data.weight || '';
    height.value = data.height || '';
    bloodPressure.value = data.blood_pressure || '';
    heartRate.value = data.heart_rate || '';
    complaints.value = data.diagnosis || '';
    treatment.value = data.treatment || '';
  } else {
    // Set initial values based on consultation data
    complaints.value = props.consultation?.complaint || '';
  }
}, { immediate: true });
</script>

<template>
  <div v-if="show" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
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
              <p class="text-sm text-gray-500">Category</p>
              <p class="font-medium">{{ consultation.category }}</p>
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
        
        <!-- Medical Form -->
        <div class="p-6">
          <!-- Vital signs - smaller fields -->
          <div class="mb-5">
            <h3 class="font-medium text-gray-700 mb-3">Vital Signs</h3>
            
            <div class="grid grid-cols-2 gap-x-6 gap-y-3">
              <!-- Temperature -->
              <div class="col-span-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
                <input
                  v-model="temperature"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="36.5"
                />
              </div>
              
              <!-- Blood Pressure -->
              <div class="col-span-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (mmHg)</label>
                <input
                  v-model="bloodPressure"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="120/80"
                />
              </div>
              
              <!-- Weight -->
              <div class="col-span-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                <input
                  v-model="weight"
                  type="number"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="60"
                />
              </div>
              
              <!-- Heart Rate -->
              <div class="col-span-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">Heart Rate (BPM)</label>
                <input
                  v-model="heartRate"
                  type="number"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="80"
                />
              </div>
              
              <!-- Height -->
              <div class="col-span-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                <input
                  v-model="height"
                  type="number"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="170"
                />
              </div>
              
              <!-- BMI (calculated) -->
              <div class="col-span-1" v-if="bmi">
                <label class="block text-sm font-medium text-gray-700 mb-1">BMI</label>
                <div class="flex items-center gap-2">
                  <span class="px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 w-full">
                    {{ bmi }} - {{ bmiCategory }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Complaints/Diagnosis - larger field -->
          <div class="mb-5">
            <label class="block font-medium text-gray-700 mb-2">Complaints/Diagnosis</label>
            <textarea
              v-model="complaints"
              class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
              placeholder="Enter patient complaints and diagnosis"
            ></textarea>
          </div>
          
          <!-- Treatment/Instructions - larger field -->
          <div class="mb-5">
            <label class="block font-medium text-gray-700 mb-2">Treatment/Instructions</label>
            <textarea
              v-model="treatment"
              class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
              placeholder="Enter treatment plan and instructions"
            ></textarea>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            @click="closeModal"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="showConfirmation"
            :disabled="isSaving"
            class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none disabled:opacity-50"
          >
            <span v-if="isSaving">Saving...</span>
            <span v-else>Save Medical Record</span>
          </button>
        </div>
      </div>
      
      <!-- Confirmation Modal Page -->
      <div v-if="currentPage === 2" class="p-6">
        <div class="text-center py-6">
          <div class="mx-auto mb-4 text-red-500">
            <Icon icon="mdi:alert-circle-outline" class="w-16 h-16" />
          </div>
          
          <h3 class="text-lg font-medium text-gray-900 mb-2">Confirm Medical Record Saving</h3>
          <div class="mb-6 text-gray-600">
            <p>Are you sure you want to save this medical record?</p>
            <p class="font-medium mt-2 text-red-600">This action is irreversible and cannot be undone.</p>
          </div>
          
          <div class="flex justify-center gap-4">
            <button
              @click="cancelSave"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              @click="saveConsultation"
              :disabled="isSaving"
              class="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 focus:outline-none disabled:opacity-50"
            >
              <span v-if="isSaving">Processing...</span>
              <span v-else>Confirm & Save</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Nurse View Page -->
      <div v-if="currentPage === 3" class="p-6">
        <!-- Banner for nurse -->
        <div class="bg-blue-50 border border-blue-300 rounded-md p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <Icon icon="mdi:information" class="h-5 w-5 text-blue-400" />
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
        <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h4 class="text-sm font-medium text-gray-500 mb-2">PATIENT INFORMATION</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Patient Name</p>
              <p class="font-medium">{{ consultation.name }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Category</p>
              <p class="font-medium">{{ consultation.category }}</p>
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
        <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h4 class="text-sm font-medium text-gray-500 mb-2">VITAL SIGNS</h4>
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
        
        <!-- Diagnosis -->
        <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h4 class="text-sm font-medium text-gray-500 mb-2">DIAGNOSIS</h4>
          <p class="whitespace-pre-wrap">{{ complaints || 'No diagnosis provided' }}</p>
        </div>
        
        <!-- Treatment Plan -->
        <div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h4 class="text-sm font-medium text-gray-500 mb-2">TREATMENT PLAN</h4>
          <p class="whitespace-pre-wrap">{{ treatment || 'No treatment plan provided' }}</p>
        </div>
        
        <!-- Footer -->
        <div class="mt-6 flex justify-end">
          <button
            @click="closeModal"
            class="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>