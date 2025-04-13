<template>
  <div>
    <BulletinLayoutA v-if="isNurse" />
    <BulletinLayoutC v-else-if="isPatient" />
    <div v-else>
      <p>No Bulletin Layout</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';

definePageMeta({
  middleware: 'auth', 
  requiredRole: ['nurse', 'patient'],
  layout: 'main',
});
const { isNurse, isPatient, userRole } = useAuth();


onMounted(() => {
  console.log('User Role:', userRole.value);
  console.log('Is Nurse:', isNurse.value);
  console.log('Is Patient:', isPatient.value);
});
</script>