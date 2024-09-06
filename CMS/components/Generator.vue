
<script setup>
  import { ref, computed } from 'vue';
  import moment from 'moment-timezone';
  
  // Initialize the timezone
  const timezone = "Asia/Manila";
  
  // Reactive properties for year, month, and period
  const selectedYear = ref(moment().tz(timezone).year());
  const selectedMonth = ref(moment().tz(timezone).month());
  const selectedPeriod = ref("monthly");
  
  // Arrays for years and months
  const years = Array.from({ length: 50 }, (_, i) => moment().tz(timezone).year() - 25 + i);
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  
  // Generate report function
  const generateReport = () => {
    const monthName = months[selectedMonth.value];
    const year = selectedYear.value;
    const period = selectedPeriod.value;
  
    console.log(`Generating report for ${period} ${monthName} ${year}`);
    // Additional logic for generating the report can be added here
  };
</script>
<template>
    <div class="max-w-md p-6 mx-auto my-10 bg-white rounded-lg shadow-lg">
        <h2 class="mb-4 text-xl font-bold text-center">Report Generator</h2>
        <!-- Date Selection -->
        <div class="grid grid-cols-3 gap-4 mb-6">
            <select v-model="selectedPeriod" class="p-2 border rounded">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
            </select>
            <select v-model="selectedMonth" class="p-2 border rounded">
                <option v-for="(month, index) in months" :key="index" :value="index">{{ month }}</option>
            </select>
            <select v-model="selectedYear" class="p-2 border rounded">
                <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
            </select>
        </div>
      <div class="grid grid-cols-2 gap-10 mb-6"><!-- Category -->
        <div class="mb-6">
          <h3 class="mb-2 font-semibold">Category</h3>
          <div class="flex flex-col space-y-2">
            <label class="inline-flex items-center">
              <input type="checkbox" class="form-checkbox" />
              <span class="ml-2">Student</span>
            </label>
            <label class="inline-flex items-center">
              <input type="checkbox" class="form-checkbox" />
              <span class="ml-2">Faculty</span>
            </label>
            <label class="inline-flex items-center">
              <input type="checkbox" class="form-checkbox" />
              <span class="ml-2">Non-Teaching Staff</span>
            </label>
          </div>
        </div>
    
        <!-- Disease Type -->
        <div class="mb-6">
          <h3 class="mb-2 font-semibold">Disease Type</h3>
          <div class="flex flex-col space-y-2">
            <label class="inline-flex items-center">
              <input type="checkbox" class="form-checkbox" />
              <span class="ml-2">Communicable</span>
            </label>
            <label class="inline-flex items-center">
              <input type="checkbox" class="form-checkbox" />
              <span class="ml-2">Non-Communicable</span>
            </label>
          </div>
        </div>
      </div>
  
      <!-- Sex -->
      <div class="grid grid-cols-2 gap-10 mb-6">
        <div class="mb-6">
          <h3 class="mb-2 font-semibold">Sex</h3>
          <div class="flex flex-col space-y-2">
            <label class="inline-flex items-center">
              <input type="checkbox" class="form-checkbox" />
              <span class="ml-2">Female</span>
            </label>
            <label class="inline-flex items-center">
              <input type="checkbox" class="form-checkbox" />
              <span class="ml-2">Male</span>
            </label>
          </div>
        </div>
    
        <!-- Fatality Count -->
        <div class="mb-6">
          <h3 class="mb-2 font-semibold">Fatality Rate</h3>
          <label class="inline-flex items-center">
            <input type="checkbox" class="form-checkbox" />
            <span class="ml-2">Include fatality count</span>
          </label>
        </div>
      </div>
  
      <!-- Generate Button -->
      <div class="text-center">
        <button @click="generateReport" class="px-4 py-2 text-white bg-blue-600 rounded-lg">
          GENERATE
        </button>
      </div>
    </div>
  </template>
  <style scoped>
  /* Add custom styles if needed */
  </style>
  