<template>
    <div>
        <div v-if="showMessage" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p class="font-bold">Access Restricted</p>
            <p>This service is only available to students with grade level below 13.</p>
        </div>
        <ServicesLayout/>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const showMessage = ref(false);

onMounted(() => {
    if (route.query.message === 'gradeRestriction') {
        showMessage.value = true;
    }
});

definePageMeta({
    middleware: ['auth', 'student-grade'],
    layout: 'main',
    requiredRole: ['client']
});
</script>