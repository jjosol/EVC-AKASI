<script setup>
// Reactive properties
const currentDay = ref({ date: new Date() });
const confinedCount = ref(0);

// Handlers
const handleDaySelected = (day) => {
  currentDay.value = day;
};

const updateConfinedCount = (value) => {
  confinedCount.value = value;
};
</script>

<template>
    <NuxtLayout>
        <div class="flex flex-col min-h-screen">
            <div class="flex items-center justify-center flex-grow">
            <div class="flex w-full max-w-6xl space-x-4">
                <Calendar @day-selected="handleDaySelected" :updateConfined="confinedCount" />
                <AddList :current-day="currentDay" @update-confined="updateConfinedCount" />
            </div>
            </div>
        </div>
    </NuxtLayout>
</template>