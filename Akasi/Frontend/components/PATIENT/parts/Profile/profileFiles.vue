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
        requiredRole: ['nurse', 'client'],
        layout: 'main',
    });
    
    const { isNurse, isClient, userRole } = useAuth();
    const { profile, fetchProfile } = useProfile();

    // Add computed properties to determine user category
    const isStudent = computed(() => {
        console.log( profile.value?.category)
        return profile.value?.category === 'Student';
      
    });
    console.log(isStudent)
    const isFaculty = computed(() => {
        const category = profile.value?.category;
        console.log('Category value:', category);
        console.log('Type check:', profile.value?.type === 'client');
        console.log('Category check:', category === 'Student');
        return  profile.value?.category === 'Faculty' || profile.value?.category === 'Staff';
        
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
        console.log('User Category:', profile.value?.category);
        console.log('Is Student:', isStudent.value);
        console.log('Is Faculty:', isFaculty.value);
    });
</script>