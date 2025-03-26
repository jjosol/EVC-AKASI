<template>
     <div class="flex-grow bg-white rounded-lg shadow">
        <h3 class="m-5 font-bold"> Files</h3>
        <div class="grid grid-cols-2 gap-2 mt-2 text-gray-700">
            <p><button class="buttonGrey">Grade 7</button></p>
            <p><button class="buttonGrey">Grade 10</button></p>
            <p><button class="buttonGrey">Grade 8</button></p>
            <p><button class="buttonGrey">Grade 11</button></p>
            <p><button class="buttonGrey">Grade 9</button></p>
            <p><button class="buttonGrey">Grade 12</button></p>
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

<style>
    .buttonGrey {
        font-weight: bold;
        background-color: lightgray;
        color: #2f4a71;
        padding: 20px 50px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    
    }
    
    .buttonGrey:hover {
        background-color: #2f4a71;
        color: white;
    }
    
</style>
