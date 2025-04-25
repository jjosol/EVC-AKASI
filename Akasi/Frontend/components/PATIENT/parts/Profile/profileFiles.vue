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
    
    const { isNurse, isClient, userRole } = useAuth();
    const { profile, fetchProfile } = useProfile();

    // Add computed properties to determine user category
    const isStudent = computed(() => {
        console.log( profile.value?.type_str)
        return profile.value?.type_str === 'Student';
      
    });
    console.log(isStudent)
    const isFaculty = computed(() => {
        const type_str = profile.value?.type_str;
        console.log('Category value:', type_str);
        console.log('Type check:', profile.value?.type === 'patient');
        console.log('Category check:', type_str === 'Student');
        return  profile.value?.type_str === 'Faculty' || profile.value?.type_str === 'Staff';
        
    });
    console.log('isStudent.value:', isStudent.value);
    onMounted(async () => {
        // Fetch the profile data if not already loaded
        if (!profile.value) {
        await fetchProfile();
        }
        
        console.log('User Role:', userRole.value);
        console.log('Is Nurse:', isNurse.value);
        console.log('Is Client:', isClient.value);
        console.log('User Category:', profile.value?.type_str);
        console.log('Is Student:', isStudent.value);
        console.log('Is Faculty:', isFaculty.value);
    });
</script>