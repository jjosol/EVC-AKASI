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

const emit = defineEmits(['close', 'refresh']);

// Patient vital fields
const temperature = ref('');
const weight = ref('');
const height = ref('');
const bloodPressure = ref('');
const heartRate = ref('');
const complaints = ref('');
const treatment = ref('');
const prescription = ref('');

// Loading state
const isLoadingDetails = ref(false);

// Consultation details
const consultationDetails = ref(null);
const hasMedications = ref(false);
const medications = ref([]);
const hasPrescription = ref(false);
// Remove unused prescription modal variables
// const prescriptionUrl = ref('');
// const prescriptionDetails = ref(null);
const nurseRemarks = ref('');
const actionsTaken = ref([]);
const dispositions = ref([]);
const chiefComplaints = ref([]);
const doctorReviewed = ref(false);
const doctorReviewDate = ref(null);

// Prescription viewer modal (no longer needed as prescription is displayed inline)
// const showPrescriptionModal = ref(false);

// Page display state
const showNurseSummary = ref(true);
const showDoctorResponse = ref(true);

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

// Format date function
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });
};

// Format date time function
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Function to fetch consultation details including prescription and medications
const fetchConsultationDetails = async (consultationId) => {
  if (!consultationId) return;

  try {
    isLoadingDetails.value = true;
    
    // Fetch detailed consultation record
    const details = await consultationRecordService.fetchConsultationRecord(consultationId);
    consultationDetails.value = details;
    
    // Check for doctor review status
    doctorReviewed.value = details.doctor_reviewed || false;
    doctorReviewDate.value = details.doctor_review_date || null;
    
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
      // Check for prescription from doctor_prescription field
    if (details.doctor_prescription && details.doctor_prescription.trim() !== '') {
      hasPrescription.value = true;
      prescription.value = details.doctor_prescription;
    } else {
      hasPrescription.value = false;
      prescription.value = '';
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

// Removed unused prescription modal functions
// const viewPrescription = () => { showPrescriptionModal.value = true; };
// const closePrescriptionModal = () => { showPrescriptionModal.value = false; };

// Toggle section visibility
const toggleNurseSummary = () => {
  showNurseSummary.value = !showNurseSummary.value;
};

const toggleDoctorResponse = () => {
  showDoctorResponse.value = !showDoctorResponse.value;
};

// Define refs for patient demographic data
const patientType = ref('');
const patientAge = ref('');
const patientGender = ref('');

// Populate fields when consultation data is available
watch(() => props.consultation, async (newConsultation) => {
  if (newConsultation && newConsultation.consultation_id) {
    // Debug logging to see what data we receive
    console.log('Nurse DoctorResponseModal - received consultation data:', {
      type: newConsultation.type,
      age: newConsultation.age,
      gender: newConsultation.gender,
      consultation_id: newConsultation.consultation_id
    });
    
    // Use the helper function to extract all medical data in a consistent way
    const medicalData = consultationRecordService.extractMedicalData(newConsultation);
    
    console.log('Nurse DoctorResponseModal - extracted medical data:', {
      patientType: medicalData.patientType,
      patientAge: medicalData.patientAge,
      patientGender: medicalData.patientGender
    });
      // Populate form fields with the extracted data
    temperature.value = medicalData.temperature || '';
    weight.value = medicalData.weight || '';
    height.value = medicalData.height || '';
    bloodPressure.value = medicalData.blood_pressure || '';
    heartRate.value = medicalData.heart_rate || '';
    complaints.value = medicalData.diagnosis || newConsultation?.complaint || '';
    treatment.value = medicalData.treatment || '';
    prescription.value = medicalData.prescription || '';

    // Set patient demographic data from extracted data with fallbacks
    patientType.value = medicalData.patientType || newConsultation.type || 'N/A';
    patientAge.value = medicalData.patientAge || newConsultation.age || 'N/A';
    patientGender.value = medicalData.patientGender || newConsultation.gender || 'N/A';

    // Fetch detailed consultation info including prescriptions and medications
    await fetchConsultationDetails(newConsultation.consultation_id);
  }
}, { immediate: true });
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 class="text-xl font-semibold text-gray-800">
          <span v-if="doctorReviewed">Medical Record Review</span>
          <span v-else>Consultation Record</span>
        </h2>
        <button @click="closeModal" class="text-gray-500 hover:text-gray-700">
          <Icon icon="mdi:close" class="w-6 h-6" />
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-6">
        <!-- Doctor review banner if doctor has reviewed -->
        <div v-if="doctorReviewed" class="p-4 mb-6 bg-green-100 border border-green-500 rounded-md">
          <div class="flex">
            <div class="flex-shrink-0">
              <Icon icon="mdi:check-circle" class="w-6 h-6 text-green-600" />
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-green-800">
                Doctor Review Completed
              </h3>
              <div class="mt-2 text-sm text-green-700">
                <p>This consultation record has been reviewed by the doctor.</p>
                <p v-if="doctorReviewDate" class="mt-1">Reviewed on: {{ formatDateTime(doctorReviewDate) }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Not reviewed notice -->
        <div v-else class="p-4 mb-6 border rounded-md bg-amber-50 border-amber-300">
          <div class="flex">
            <div class="flex-shrink-0">
              <Icon icon="mdi:clock" class="w-5 h-5 text-amber-400" />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-amber-800">
                Awaiting Doctor Review
              </h3>
              <div class="mt-2 text-sm text-amber-700">
                <p>This consultation record has not yet been reviewed by a doctor.</p>
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
        
        <!-- Nurse Assessment Section (Collapsible) -->
        <div class="mb-6">
          <div 
            class="flex items-center justify-between p-3 bg-gray-100 border border-gray-300 rounded-t-lg cursor-pointer"
            @click="toggleNurseSummary"
          >
            <h4 class="font-medium text-gray-700">NURSE ASSESSMENT</h4>
            <Icon 
              :icon="showNurseSummary ? 'mdi:chevron-up' : 'mdi:chevron-down'" 
              class="w-5 h-5 text-gray-600" 
            />
          </div>
          
          <div v-if="showNurseSummary" class="p-4 border border-t-0 border-gray-300 rounded-b-lg">
            <!-- Chief Complaints -->
            <div class="mb-4">
              <p class="mb-1 text-sm font-medium text-gray-600">Chief Complaints:</p>
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
              <p class="mb-1 text-sm font-medium text-gray-600">Actions Taken:</p>
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
              <p class="mb-1 text-sm font-medium text-gray-600">Dispositions:</p>
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
              <p class="mb-1 text-sm font-medium text-gray-600">Nurse Remarks:</p>
              <p class="p-2 text-sm rounded bg-gray-50">{{ nurseRemarks }}</p>
            </div>

            <!-- Medications List -->
            <div v-if="hasMedications" class="mt-5">
              <p class="mb-1 text-sm font-medium text-gray-600">Medications Administered:</p>
              <div class="overflow-x-auto border border-gray-200 rounded">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Name</th>
                      <th class="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Quantity</th>
                      <th class="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Schedule</th>
                      <th class="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Period</th>
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
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
              <!-- Prescription link -->
            <div v-if="hasPrescription && prescription" class="mt-4">
              <p class="text-sm font-medium text-blue-600">
                <Icon icon="mdi:file-document-outline" class="inline w-4 h-4 mr-1" />
                Prescription available below
              </p>
            </div>
          </div>
        </div>
        
        <!-- Doctor Response Section (Collapsible) -->
        <div v-if="doctorReviewed" class="mb-6">
          <div 
            class="flex items-center justify-between p-3 bg-blue-100 border border-blue-300 rounded-t-lg cursor-pointer"
            @click="toggleDoctorResponse"
          >
            <h4 class="font-medium text-blue-800">DOCTOR'S RESPONSE</h4>
            <Icon 
              :icon="showDoctorResponse ? 'mdi:chevron-up' : 'mdi:chevron-down'" 
              class="w-5 h-5 text-blue-600" 
            />
          </div>
          
          <div v-if="showDoctorResponse" class="p-4 border border-t-0 border-blue-300 rounded-b-lg">
            <!-- Vital Signs -->
            <div class="mb-5">
              <h5 class="mb-2 text-sm font-medium text-gray-700">Vital Signs</h5>
              <div class="grid grid-cols-3 gap-4 p-3 rounded bg-gray-50">
                <div>
                  <p class="text-xs text-gray-500">Temperature</p>
                  <p class="text-sm font-medium">{{ temperature || 'N/A' }} °C</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Blood Pressure</p>
                  <p class="text-sm font-medium">{{ bloodPressure || 'N/A' }} mmHg</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Heart Rate</p>
                  <p class="text-sm font-medium">{{ heartRate || 'N/A' }} BPM</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Weight</p>
                  <p class="text-sm font-medium">{{ weight || 'N/A' }} kg</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Height</p>
                  <p class="text-sm font-medium">{{ height || 'N/A' }} cm</p>
                </div>
                <div v-if="bmi">
                  <p class="text-xs text-gray-500">BMI</p>
                  <p class="text-sm font-medium">{{ bmi }} ({{ bmiCategory }})</p>
                </div>
              </div>
            </div>
            
            <!-- Diagnosis -->
            <div class="mb-5">
              <h5 class="mb-2 text-sm font-medium text-gray-700">Diagnosis</h5>
              <div class="p-3 rounded bg-gray-50">
                <p class="text-sm whitespace-pre-wrap">{{ complaints || 'No diagnosis provided' }}</p>
              </div>
            </div>
              <!-- Treatment Plan -->
            <div class="mb-5">
              <h5 class="mb-2 text-sm font-medium text-gray-700">Treatment/Instructions</h5>
              <div class="p-3 rounded bg-gray-50">
                <p class="text-sm whitespace-pre-wrap">{{ treatment || 'No treatment plan provided' }}</p>
              </div>
            </div>

            <!-- Prescription -->
            <div class="mb-5">
              <h5 class="mb-2 text-sm font-medium text-gray-700">Prescription</h5>
              <div class="p-3 rounded bg-gray-50">
                <p class="text-sm whitespace-pre-wrap">{{ prescription || 'No prescription provided' }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="flex justify-end mt-6">
          <button
            @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none"
          >
            Close
          </button>
        </div>      </div>
    </div>
  </div>
</template>