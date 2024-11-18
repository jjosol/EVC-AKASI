<script setup>
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
   <div class="w-4/6 p-6 mx-auto text-[#2f4a71]">
      <h2 class="mt-1 text-3xl font-bold text-left ">Report Generator</h2>

      <!-- Tabs for Monthly and Annual -->
      <div class="flex justify-end mb-6 border-b border-gray-300">
        <button 
          @click="selectedPeriod = 'monthly'"
          :class="{'text-blue-600 border-b-2 border-blue-600': selectedPeriod === 'monthly'}"
          class="px-4 py-2 font-semibold text-gray-600">
          Monthly
        </button>
        <button 
          @click="selectedPeriod ='yearly'"
          :class="{'text-blue-600 border-b-2 border-blue-600': selectedPeriod === 'yearly'}"
          class="px-4 py-2 font-semibold text-gray-600">
          Annual
        </button>
      </div>
      <div class="w-11/12  text-[#2f4a71] ml-auto gap-y-10">

    <!-- Date Selection -->
    <div class="grid grid-cols-6 gap-4 mb-20">
      <div v-if="selectedPeriod=='monthly'">
        <label class="block mb-2 font-semibold">Month</label>
        <select v-model="selectedMonth" class="w-full p-2 ">
          <option v-for="(month, index) in months" :key="index" :value="index">{{ month }}</option>
        </select>
      </div>
      <div>
        <label class="block mb-2 font-semibold">Year</label>
        <select v-model="selectedYear" class="w-full p-2 ">
          <option v-for="year in years" :key="year" :value="year">{{year}}</option>
        </select>
      </div>
    </div>

    <!-- Category and Disease Type -->
    <div class="grid grid-cols-2 gap-10 mb-20">
      <div class="p-4 ">
        <h3 class="text-xl font-semibold mb-">Category</h3>
        <div class="pt-3 space-y-5">
          <label class="items-center block">
            <input type="checkbox" class="form-checkbox accent-[#2f4a71]" />
            <span class="ml-2">Student</span>
          </label>
          <label class="items-center block">
            <input type="checkbox" class="form-checkbox accent-[#2f4a71]" />
            <span class="ml-2">Faculty</span>
          </label>
          <label class="items-center block">
            <input type="checkbox" class="form-checkbox accent-[#2f4a71]" />
            <span class="ml-2">Non-Teaching Staff</span>
          </label>
        </div>
      </div>

      <div class="p-4 ">
        <h3 class="mb-2 text-xl font-semibold">Disease Type</h3>
        <div class="pt-3 space-y-5">
          <label class="items-center block">
            <input type="checkbox" class="form-checkbox accent-[#2f4a71]" />
            <span class="ml-2">Communicable</span>
          </label>
          <label class="items-center block">
          <input type="checkbox" class="form-checkbox accent-[#2f4a71]" />
            <span class="ml-2">Non-Communicable</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Sex and Fatality Count -->
    <div class="grid grid-cols-2 gap-10 mb-20">
      <div class="p-4">
        <h3 class="mb-2 text-xl font-semibold">Sex</h3>
        <div class="pt-3 space-y-5">
          <label class="items-center block">
            <input type="checkbox" class="form-checkbox accent-[#2f4a71]" />
            <span class="ml-2">Female</span>
          </label>
          <label class="items-center block">
            <input type="checkbox" class="form-checkbox accent-[#2f4a71]" />
            <span class="ml-2">Male</span>
          </label>
        </div>
      </div>

      <div class="p-4 ">
        <h3 class="mb-2 text-xl font-semibold">Fatality Rate</h3>
        <div class="pt-3 space-y-5">
          <label class="items-center block">
            <input type="checkbox" class="form-checkbox accent-[#2f4a71] "/>
            <span class="ml-2">Include fatality count</span>
          </label>
        </div>
        
      </div>
    </div>

    <!-- Generate Button -->
    <div class="text-right">
      <button @click="generateReport" class="px-6 py-2 text-white bg-blue-600 rounded-full">
        GENERATE
      </button>
    </div>
      </div>
</div>
  </template>