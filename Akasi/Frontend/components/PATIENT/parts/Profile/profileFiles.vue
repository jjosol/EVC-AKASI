<template>
        <div>
        <ProfileFilesStudent v-if="isStudent"/>
        <ProfileFilesStaff v-else-if="isFaculty"/>
        <div v-else>
            <p>No matching layout for your user category</p>
        </div>
        </div>
</template>
    
<script setup>
    import { ref, computed, onMounted } from 'vue';
    import { useAuth } from '~/composables/useAuth';
    import { useProfile } from '~/composables/useProfile';
    import ProfileFilesStaff from './profileFilesStaff.vue';
    import ProfileFilesStudent from './profileFilesStudent.vue';
    
    definePageMeta({
        middleware: 'auth',
        requiredRole: ['nurse', 'patient'],
        layout: 'main',
    });
    
    const { isNurse, isPatient, userRole } = useAuth();
    const { profile, fetchProfile } = useProfile();

    // Add computed properties to determine user category (case-insensitive)
    const isStudent = computed(() => {
        return profile.value?.type_str?.toLowerCase() === 'student';
    });

    const isFaculty = computed(() => {
        const type_str = profile.value?.type_str?.toLowerCase();
        return type_str === 'faculty' || type_str === 'staff';
    });
    
    onMounted(async () => {
        // Fetch the profile data if not already loaded
        if (!profile.value) {
        await fetchProfile();
        }
        
        console.log('User Role:', userRole.value);
        console.log('Is Nurse:', isNurse.value);
        console.log('Is Patient:', isPatient.value);
        console.log('User Category:', profile.value?.type_str);
        console.log('Is Student:', isStudent.value);
        console.log('Is Faculty:', isFaculty.value);
    });
</script>