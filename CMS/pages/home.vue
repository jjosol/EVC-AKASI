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
        <div class="flex flex-col">
            <div class="flex items-center justify-center flex-grow mt-32">
              <div class="flex w-full max-w-7xl space-x-28">
                  <Calendar @day-selected="handleDaySelected" :updateConfined="confinedCount" />
                  <AddList :current-day="currentDay" @update-confined="updateConfinedCount" />
              </div>
            </div>
        </div>
    </NuxtLayout>
</template>