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
        requiredRole: ['admin', 'client'],
        layout: 'main',
    });
    
    const { isAdmin, isClient, userRole } = useAuth();
    const { profile, fetchProfile } = useProfile();
    
    // Add computed properties to determine user category
    const isStudent = computed(() => {
        return profile.value?.type === 'client' && profile.value?.category === 'student';
    });
    
    const isFaculty = computed(() => {
        return profile.value?.type === 'client' && profile.value?.category === 'faculty' || profile.value?.category === 'staff';
    });
    
    onMounted(async () => {
        // Fetch the profile data if not already loaded
        if (!profile.value) {
        await fetchProfile();
        }
        
        console.log('User Role:', userRole.value);
        console.log('Is Admin:', isAdmin.value);
        console.log('Is Client:', isClient.value);
        console.log('User Category:', profile.value?.category);
        console.log('Is Student:', isStudent.value);
        console.log('Is Faculty:', isFaculty.value);
    });
</script>