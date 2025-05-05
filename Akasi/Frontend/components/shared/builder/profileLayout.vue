<template>
    <div class="min-h-screen p-8 bg-white">
      <div class="max-w-4xl mx-auto">
        <div v-if="loading" class="flex flex-col items-center justify-center p-8">
          <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="mt-4 text-xl font-medium text-gray-700">Loading profile...</p>
        </div>
        <div v-else-if="error" class="p-8 text-center text-red-600 bg-red-50 rounded-lg">
          <p class="text-xl">{{ error }}</p>
          <button @click="fetchProfile()" class="px-4 py-2 mt-4 text-white bg-blue-500 rounded hover:bg-blue-600">
            Retry
          </button>
        </div>
        <template v-else>
          <ProfileHeader/>

          
          <!-- Conditional components based on user type -->
          <ProfileFiles v-if="isPatient"/>
          <div v-if="!isPatient && !isDoctor && !isNurse" class="p-6 mt-4 text-center bg-yellow-50 rounded-lg">
            <p class="text-lg text-yellow-700">No matching profile layout for your user type: {{ profile?.type || 'unknown' }}</p>
          </div>
        </template>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import ProfileHeader from '../parts/profileInformation.vue';
import ProfileFiles from '../../PATIENT/parts/Profile/profileFiles.vue';
// import DoctorDetails from '../../DOCTOR/parts/Profile/DoctorDetails.vue';
import { useProfile } from '~/composables/useProfile';
import { useAuth } from '~/composables/useAuth';

// Debug flag - set to false in production
const showDebug = ref(true);

// Get auth status from both composables to ensure we capture the role correctly
const { isPatient, isDoctor, isNurse, userRole } = useAuth();
const { profile, loading, error, fetchProfile } = useProfile();


// Log profile data when it changes
watch(() => profile.value, (newProfile) => {
  if (newProfile) {
    console.log('Profile data updated:', newProfile);
    console.log('Profile type:', newProfile.type);
    console.log('Is doctor user:', isDoctor.value);
  }
});

// Fetch profile on component mount
onMounted(() => {
  console.log('ProfileLayout mounted');
  fetchProfile().then(() => {
    console.log('Profile fetched in layout:', profile.value);
  }).catch(err => {
    console.error('Error fetching profile in layout:', err);
  });
});
console.log('Is doctor:', isDoctor.value);

// Define page meta with proper authentication requirements
definePageMeta({
  layout: 'main',
  middleware: 'auth',
  requiredRole: ['nurse', 'patient', 'doctor'],
});
</script>