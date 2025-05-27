<template>
  <div class="min-h-screen py-4 md:py-8 bg-gray-50">
    <div class="max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow-md">
      <!-- Header -->
      <div class="bg-[#2f4a71] px-2 md:px-6 py-3 md:py-4">
        <h2 class="text-base font-bold text-white truncate md:text-2xl" style="letter-spacing:0.01em;">PSHS-EVC Health Services Report Generator</h2>
      </div>

      <div class="p-4 md:p-6">
        <!-- Tabs for Monthly and Annual -->
        <div class="flex justify-center mb-6 overflow-x-auto border-b border-gray-200 md:justify-end">
          <div class="flex space-x-0 min-w-max">
            <button 
              @click="selectedPeriod = 'monthly'"
              :class="{'text-blue-600 border-b-2 border-blue-600 font-medium': selectedPeriod === 'monthly'}"
              class="px-6 py-2 text-sm text-gray-600 transition-colors md:px-4 md:text-base hover:text-blue-500 whitespace-nowrap">
              Monthly
            </button>
            <button 
              @click="selectedPeriod = 'yearly'"
              :class="{'text-blue-600 border-b-2 border-blue-600 font-medium': selectedPeriod === 'yearly'}"
              class="px-6 py-2 text-sm text-gray-600 transition-colors md:px-4 md:text-base hover:text-blue-500 whitespace-nowrap">
              Yearly
            </button>
          </div>
        </div>

        <div class="space-y-6 md:space-y-8">
          <!-- Date Selection -->
          <div class="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2">
            <div v-if="selectedPeriod === 'monthly'" class="space-y-2 md:col-span-1">
              <label class="block text-sm font-medium text-gray-700">Month Range</label>
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div class="flex-1">
                  <select 
                    v-model="startMonth" 
                    class="block w-full px-3 py-2 text-sm border-gray-300 rounded-md shadow-sm md:text-base focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.5em_1.5em]">
                    <option value="" disabled selected>Start Month</option>
                    <option v-for="(month, index) in months" :key="index" :value="index">{{ month }}</option>
                  </select>
                </div>
                <span class="text-sm text-center text-gray-500 sm:text-left">to</span>
                <div class="flex-1">
                  <select 
                    v-model="endMonth"
                    class="block w-full px-3 py-2 text-sm border-gray-300 rounded-md shadow-sm md:text-base focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.5em_1.5em]">
                    <option value="" disabled selected>End Month</option>
                    <option value="null">Same as Start Month</option>
                    <option v-for="(month, index) in months" :key="index" :value="index">{{ month }}</option>
                  </select>
                </div>
              </div>
              <div v-if="endMonthError" class="mt-1 text-sm text-red-500">
                {{ endMonthError }}
              </div>
            </div>
            
            <div v-if="selectedPeriod === 'yearly'" class="space-y-2 md:col-span-1">
              <label class="block text-sm font-medium text-gray-700">Period</label>
              <div class="px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-md md:px-4 md:text-base">
                Full School Year (July - June)
              </div>
            </div>
            
            <div class="md:col-span-1">
              <label class="block mb-2 text-sm font-medium text-gray-700">School Year</label>
              <select 
                v-model="selectedYear"
                class="block w-full px-3 py-2 text-sm border-gray-300 rounded-md shadow-sm md:text-base focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.5em_1.5em]">
                <option value="" disabled selected>Select School Year</option>
                <option v-for="year in schoolYears" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
          </div>

          <!-- Report Preview -->
          <div class="overflow-hidden border rounded-lg bg-gray-50">
            <div class="px-3 py-3 bg-gray-100 border-b border-gray-200 md:px-4">
              <h3 class="text-sm font-medium text-gray-700 md:text-base">Report Preview</h3>
            </div>
            
            <div class="p-3 text-sm text-gray-600 md:p-4">
              <p class="mt-2">
                This system generates a comprehensive report including:
                <ul class="mt-2 space-y-1 list-disc list-inside">
                  <li class="text-xs md:text-sm">SUMMARY OF THE PSHS-EVC COMMUNITY THAT ACQUIRED ILLNESSES and INJURIES</li>
                  <li class="text-xs md:text-sm">CONSULTATION/APPOINTMENT MONITORING TOOL</li>
                </ul>
              </p>
            </div>
          </div>

          <!-- Generate and Preview Buttons -->
          <div class="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-between">
            <button 
              @click="previewReport" 
              class="w-full sm:w-auto px-6 py-3 md:py-2 bg-[#394a6e] text-white text-sm md:text-base font-medium rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[#394a6e] focus:ring-offset-2 transform transition-transform duration-200 hover:scale-105 disabled:opacity-50 min-h-[44px]"
              :disabled="!canGenerate">
              PREVIEW REPORT
            </button>
          </div>
        </div>
      </div>
    </div>    <!-- Modal for PDF Preview -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black bg-opacity-50 md:p-4">
      <div class="flex flex-col w-full max-w-4xl overflow-hidden bg-white rounded-lg shadow-lg h-[90vh] md:h-5/6">
        <div class="flex items-center justify-between px-3 py-3 border-b md:px-4 md:py-2">
          <h3 class="text-base font-medium md:text-lg">Report Preview</h3>
          <button @click="showModal = false" class="p-1 text-gray-500 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <span class="sr-only">Close</span>
            <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-auto">
          <iframe 
            :src="pdfPreviewUrl" 
            class="w-full h-full" 
            frameborder="0"
            @load="onIframeLoad"
          ></iframe>
        </div>
        <div class="flex flex-col gap-2 px-3 py-3 border-t sm:flex-row sm:justify-end md:px-4 md:py-2">
          <button 
            @click="generateReport" 
            :disabled="fetchingData"
            class="w-full sm:w-auto bg-[#394a6e] hover:bg-blue-700 text-white font-bold py-3 md:py-2 px-4 rounded text-sm md:text-base min-h-[44px]"
          >
            {{ fetchingData ? 'Loading...' : 'Generate PDF' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { fetchIllnessSummary, fetchConsultationMonitoring, fetchCommonIllnessesData, generatePdf, formatReportDate } from '../../../../services/reportService'

// Import HTML template - this will be loaded as a string
const reportHtmlTemplate = ref('')

const selectedYear = ref("")
const startMonth = ref("")
const endMonth = ref("")
const selectedPeriod = ref("monthly")
const endMonthError = ref("")
const conclusionStudent = ref("") // Renamed and added others
const conclusionTeaching = ref("")
const conclusionNonTeaching = ref("")
const reportData = ref(null);
const fetchingData = ref(false);
const fetchError = ref(null);

// School years from 2014-2015 to 2024-2025
const schoolYears = ref([
  "2014-2015", "2015-2016", "2016-2017", "2017-2018", "2018-2019", 
  "2019-2020", "2020-2021", "2021-2022", "2022-2023", "2023-2024", "2024-2025"
])

// Months rearranged in academic order (July-June)
const months = ref([
  "July", "August", "September", "October", "November", "December",
  "January", "February", "March", "April", "May", "June"
])

// Modal state
const showModal = ref(false)
const pdfPreviewUrl = ref("")

// Watch for changes to end month selection and validate
watch([startMonth, endMonth], ([newStartMonth, newEndMonth]) => {
  if (selectedPeriod.value !== 'monthly') return;
  
  endMonthError.value = ""
  
  if (newEndMonth !== "" && newEndMonth !== "null") {
    const startMonthIndex = parseInt(newStartMonth)
    const endMonthIndex = parseInt(newEndMonth)
    
    if (startMonthIndex === endMonthIndex) {
      endMonthError.value = "End month cannot be the same as start month. Use 'Same as Start Month' for single month reports."
    } else {
      // Handle academic year wrap-around (July-June)
      const isFirstHalf = startMonthIndex <= 5 // July-December
      const isSecondHalf = startMonthIndex >= 6 // January-June
      const isEndInFirstHalf = endMonthIndex <= 5 // July-December
      const isEndInSecondHalf = endMonthIndex >= 6 // January-June
      
      // Valid range scenarios:
      // 1. Start and end in first half (July-Dec): endMonth > startMonth
      // 2. Start and end in second half (Jan-June): endMonth > startMonth
      // 3. Start in first half, end in second half: Always valid (wraps correctly)
      // 4. Start in second half, end in first half: Invalid (crosses school year boundary)
      
      if ((isFirstHalf && isEndInFirstHalf && endMonthIndex < startMonthIndex) ||
          (isSecondHalf && isEndInSecondHalf && endMonthIndex < startMonthIndex) ||
          (isSecondHalf && isEndInFirstHalf)) {
        endMonthError.value = "Invalid month range. End month must be after start month within the same academic year."
      }
    }
  }
})

// Watch for period changes
watch(selectedPeriod, (newPeriod) => {
  if (newPeriod === 'yearly') {
    // Reset month selection errors when switching to yearly
    endMonthError.value = ""
  }
})

// Computed properties
const canGenerate = computed(() => {
  if (selectedPeriod.value === 'yearly') {
    return selectedYear.value !== "";
  } else {
    return startMonth.value !== "" && 
           selectedYear.value !== "" &&
           endMonthError.value === "";
  }
})

// Load the HTML template on component mount
onMounted(async () => {
  try {
    const response = await fetch('/templates/report-template.html')
    if (!response.ok) {
      throw new Error('Failed to load HTML template')
    }
    reportHtmlTemplate.value = await response.text()
  } catch (error) {
    console.error("Error loading HTML template:", error)
    alert("Failed to load report template. Please refresh the page.")
  }
})

const generatePdfFile = async (htmlContent) => {
  try {
    // Use the reportService function to generate PDF with all three conclusions
    const blob = await generatePdf(
      htmlContent, 
      conclusionStudent.value, 
      conclusionTeaching.value, 
      conclusionNonTeaching.value
    );
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    // Set filename based on whether it's yearly or monthly
    let filename;
    if (selectedPeriod.value === 'yearly') {
      filename = `annual-report-${selectedYear.value}.pdf`;
    } else if (endMonth.value === "null" || endMonth.value === "") {
      filename = `report-${months.value[startMonth.value]}-${selectedYear.value}.pdf`;
    } else {
      filename = `report-${months.value[startMonth.value]}-${months.value[endMonth.value]}-${selectedYear.value}.pdf`;
    }
    
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    console.log("PDF has been generated successfully!")
  } catch (error) {
    console.error("Error generating PDF:", error)
    alert("Failed to generate PDF. Please try again.")
  }
}

const fetchReportData = async (startMonthName, endMonthName, schoolYear, isYearly = false) => {
  fetchingData.value = true;
  fetchError.value = null;
  
  try {
    console.log(`Fetching data for: ${startMonthName} to ${endMonthName || startMonthName}, ${schoolYear}, yearly=${isYearly}`);
    
    // Extract the start year from the school year (e.g., from "2015-2016" get "2015")
    const year = schoolYear.split('-')[0];
    
    console.log(`Using year ${year} for API request`);
    
    // Use the reportService function to fetch illness summary data
    const data = await fetchIllnessSummary(
      startMonthName, 
      endMonthName || null, 
      year, 
      isYearly
    );
    
    console.log("API response:", data);
    reportData.value = data;
    return data;
  } catch (error) {
    console.error('Error fetching report data:', error);
    fetchError.value = error.message;
    return null;
  } finally {
    fetchingData.value = false;
  }
};

const fetchConsultationMonitoringData = async (startMonthName, endMonthName, schoolYear, isYearly = false) => {
  try {
    console.log(`Fetching monitoring data for: ${startMonthName} to ${endMonthName || startMonthName}, ${schoolYear}, yearly=${isYearly}`);
    
    // Extract the start year from the school year (e.g., from "2015-2016" get "2015")
    const year = schoolYear.split('-')[0];
    
    console.log(`Using year ${year} for monitoring API request`);
    
    // Use the reportService function to fetch consultation monitoring data
    const data = await fetchConsultationMonitoring(
      startMonthName,
      endMonthName || null,
      year,
      isYearly
    );
    
    console.log("Consultation monitoring data:", data);
    return data;
  } catch (error) {
    console.error('Error fetching consultation monitoring data:', error);
    return [];
  }
};

const previewReport = async () => {
  if (selectedYear.value === "" || (selectedPeriod.value === 'monthly' && startMonth.value === "")) {
    alert("Please select required fields");
    return;
  }
  
  // Make sure the HTML template is loaded
  if (!reportHtmlTemplate.value) {
    alert("Report template is not loaded. Please refresh and try again.");
    return;
  }
  
  const isYearly = selectedPeriod.value === 'yearly';
  
  // For yearly report, use July-June period
  let startMonthName, endMonthName, dateRange;
  
  if (isYearly) {
    startMonthName = "July";
    endMonthName = "June";
    dateRange = `School Year ${selectedYear.value}`;
  } else {
    startMonthName = months.value[startMonth.value];
    endMonthName = endMonth.value === "null" || endMonth.value === "" 
      ? startMonthName 
      : months.value[endMonth.value];
      
    // Format date range for the report heading
    if (endMonth.value === "null" || endMonth.value === "") {
      dateRange = `${startMonthName}, S.Y. ${selectedYear.value}`;
    } else {
      dateRange = `${startMonthName} - ${endMonthName}, S.Y. ${selectedYear.value}`;
    }
  }
  
  const year = selectedYear.value;

  // Fetch data from the API
  const data = await fetchReportData(startMonthName, endMonthName, year, isYearly);
  
  if (!data) {
    alert("Failed to fetch report data. Please try again.");
    return;
  }

  // Generate the selectedMonths array (for monthly reports only)
  const selectedMonths = [];
  if (!isYearly) {
    const startIndex = parseInt(startMonth.value);
    const endIndex = endMonth.value === "null" || endMonth.value === "" ? startIndex : parseInt(endMonth.value);
    for (let i = startIndex; i <= endIndex; i++) {
      selectedMonths.push(months.value[i]);
    }
  } else {
    // For yearly reports, we'll use all months but the data processing will be different
    for (let i = 0; i < months.value.length; i++) {
      selectedMonths.push(months.value[i]);
    }
  }

  // Fetch the monitoring data
  const monitoringData = await fetchConsultationMonitoringData(startMonthName, endMonthName, year, isYearly);
  
  // Fetch common illnesses data
  const commonIllnessesData = await fetchCommonIllnessesData(startMonthName, endMonthName, year, isYearly);
  
  // Process the HTML template: Replace placeholders with actual values
  let finalHtml = reportHtmlTemplate.value
    .replace(/{{dateRange}}/g, dateRange)
    .replace(/{{startMonth}}/g, startMonthName)
    .replace(/{{selectedYear}}/g, year);

  // Process tables with correct column counts and data (now async)
  finalHtml = await processTemplate(finalHtml, selectedMonths, data, isYearly, monitoringData, commonIllnessesData);

  try {
    // Add preview-mode class to the HTML for preview
    const previewHtml = finalHtml.replace('<body>', '<body class="preview-mode">');
    
    // Create a blob from the HTML content
    const blob = new Blob([previewHtml], { type: 'text/html' });
    
    // Create a URL from the blob
    pdfPreviewUrl.value = URL.createObjectURL(blob);

    // Show the modal
    showModal.value = true;
  } catch (error) {
    console.error("Error generating preview:", error);
    alert("Failed to generate preview. Please try again later.");
  }
};

const generateReport = async () => {
  // Validate selections before generating
  if (selectedYear.value === "" || (selectedPeriod.value === 'monthly' && startMonth.value === "")) {
    alert("Please select required fields");
    return;
  }
  
  // Make sure the HTML template is loaded
  if (!reportHtmlTemplate.value) {
    alert("Report template is not loaded. Please refresh and try again.");
    return;
  }
  
  const isYearly = selectedPeriod.value === 'yearly';
  
  // For yearly report, use July-June period
  let startMonthName, endMonthName, dateRange;
  
  if (isYearly) {
    startMonthName = "July";
    endMonthName = "June";
    dateRange = `School Year ${selectedYear.value}`;
  } else {
    startMonthName = months.value[startMonth.value];
    endMonthName = endMonth.value === "null" || endMonth.value === "" 
      ? startMonthName 
      : months.value[endMonth.value];
      
    // Format date range for the report heading
    if (endMonth.value === "null" || endMonth.value === "") {
      dateRange = `${startMonthName}, S.Y. ${selectedYear.value}`;
    } else {
      dateRange = `${startMonthName} - ${endMonthName}, S.Y. ${selectedYear.value}`;
    }
  }
  
  const year = selectedYear.value;

  // Fetch data from the API
  const data = await fetchReportData(startMonthName, endMonthName, year, isYearly);
  
  if (!data) {
    alert("Failed to fetch report data. Please try again.");
    return;
  }

  // Generate the selectedMonths array (for monthly reports only)
  const selectedMonths = [];
  if (!isYearly) {
    const startIndex = parseInt(startMonth.value);
    const endIndex = endMonth.value === "null" || endMonth.value === "" ? startIndex : parseInt(endMonth.value);
    for (let i = startIndex; i <= endIndex; i++) {
      selectedMonths.push(months.value[i]);
    }
  } else {
    // For yearly reports, we'll use all months but the data processing will be different
    for (let i = 0; i < months.value.length; i++) {
      selectedMonths.push(months.value[i]);
    }
  }

  // Fetch the monitoring data
  const monitoringData = await fetchConsultationMonitoringData(startMonthName, endMonthName, year, isYearly);
  
  // Fetch common illnesses data
  const commonIllnessesData = await fetchCommonIllnessesData(startMonthName, endMonthName, year, isYearly);

  // Process the HTML template: Replace placeholders with actual values
  let finalHtml = reportHtmlTemplate.value
    .replace(/{{dateRange}}/g, dateRange)
    .replace(/{{startMonth}}/g, startMonthName)
    .replace(/{{selectedYear}}/g, year);

  // Process tables with correct column counts and data (now async)
  finalHtml = await processTemplate(finalHtml, selectedMonths, data, isYearly, monitoringData, commonIllnessesData);

  try {
    // Generate PDF with the final HTML
    await generatePdfFile(finalHtml);
  } catch (error) {
    console.error("Error generating report:", error);
    alert("Failed to generate report. Please try again later.");
  }
};

const processTemplate = async (html, selectedMonths, data, isYearly = false, monitoringData = [], commonIllnessesData = {}) => {
  let processedHtml = html;
  
  // Extract data from API response
  const { months, totals } = data;
  
  console.log("API Response Data:", data);
  console.log("Months data:", months);
  console.log("Totals data:", totals);
  console.log("Common Illnesses Data:", commonIllnessesData);
  
  // Create rows based on whether this is a yearly or monthly report
  let studentRows, teachingRows, nonTeachingRows;
  
  if (isYearly) {
    // For yearly reports, we display a single row with the school year and totals
    const year = selectedYear.value;
    
    studentRows = `
      <tr>
        <td>S.Y. ${year}</td>
        <td>${totals.students.maleDormers}</td>
        <td>${totals.students.maleExterns}</td>
        <td>${totals.students.femaleDormers}</td>
        <td>${totals.students.femaleExterns}</td>
        <td>${totals.students.total}</td>
      </tr>
    `;
    
    teachingRows = `
      <tr>
        <td>S.Y. ${year}</td>
        <td>${totals.faculty.male}</td>
        <td>${totals.faculty.female}</td>
        <td>${totals.faculty.total}</td>
      </tr>
    `;
    
    nonTeachingRows = `
      <tr>
        <td>S.Y. ${year}</td>
        <td>${totals.staff.male}</td>
        <td>${totals.staff.female}</td>
        <td>${totals.staff.total}</td>
      </tr>
    `;
  } else {
    // For monthly reports, create a row for each month as before
    studentRows = months.map(month => `
      <tr>
        <td>${month.month}</td>
        <td>${month.students.maleDormers}</td>
        <td>${month.students.maleExterns}</td>
        <td>${month.students.femaleDormers}</td>
        <td>${month.students.femaleExterns}</td>
        <td>${month.students.total}</td>
      </tr>
    `).join('');
    
    teachingRows = months.map(month => `
      <tr>
        <td>${month.month}</td>
        <td>${month.faculty.male}</td>
        <td>${month.faculty.female}</td>
        <td>${month.faculty.total}</td>
      </tr>
    `).join('');
    
    nonTeachingRows = months.map(month => `
      <tr>
        <td>${month.month}</td>
        <td>${month.staff.male}</td>
        <td>${month.staff.female}</td>
        <td>${month.staff.total}</td>
      </tr>
    `).join('');
  }
  
  // Update column header if yearly
  if (isYearly) {
    // For Students table - make School Year span two rows
    processedHtml = processedHtml.replace(
      /<table class="data-table">\s*<tr>\s*<th[^>]*>Month<\/th>/g,
      '<table class="data-table"><tr><th rowspan="2">School Year</th>'
    );
    
    // For Teaching Staff table - just replace Month with School Year (no rowspan)
    processedHtml = processedHtml.replace(
      /<h3>\s*Teaching Staff\s*<\/h3>[\s\S]*?<table[^>]*>[\s\S]*?<th[^>]*>Month<\/th>/g, 
      match => match.replace(/<th[^>]*>Month<\/th>/g, '<th>School Year</th>')
    );
    
    // For Non-Teaching Staff table - just replace Month with School Year (no rowspan)
    processedHtml = processedHtml.replace(
      /<h3>\s*Non-Teaching Staff\s*<\/h3>[\s\S]*?<table[^>]*>[\s\S]*?<th[^>]*>Month<\/th>/g,
      match => match.replace(/<th[^>]*>Month<\/th>/g, '<th>School Year</th>')
    );
  }
  
  // Replace student table
  processedHtml = processedHtml.replace(
    /(Students[\s\S]*?<\/tr>\s*<tr>[\s\S]*?<\/tr>\s*){{#each selectedMonths}}[\s\S]*?{{\/each}}/g,
    `$1${studentRows}`
  );
  
  // Replace totals for students
  processedHtml = processedHtml.replace(
    /(<td><b>Total<\/b><\/td>\s*)<td>[^<]*<\/td>\s*<td>[^<]*<\/td>\s*<td>[^<]*<\/td>\s*<td>[^<]*<\/td>\s*<td class="highlight">[^<]*<\/td>/g,
    `$1<td>${totals.students.maleDormers}</td><td>${totals.students.maleExterns}</td><td>${totals.students.femaleDormers}</td><td>${totals.students.femaleExterns}</td><td class="highlight">${totals.students.total}</td>`
  );
  
  // Use more specific patterns for the teaching staff table to avoid conflicts
  let teachingStaffPattern = new RegExp(
    '<h3>\\s*Teaching Staff\\s*</h3>[\\s\\S]*?<table[^>]*>[\\s\\S]*?<tr>\\s*<th[^>]*>[^<]*</th>[\\s\\S]*?</tr>\\s*{{#each selectedMonths}}[\\s\\S]*?{{/each}}',
    'g'
  );
  
  // Replace teaching staff table with a more precise approach
  processedHtml = processedHtml.replace(
    teachingStaffPattern,
    (match) => {
      const tableHeader = match.split('{{#each selectedMonths}}')[0];
      return tableHeader + teachingRows;
    }
  );
  
  // Use more specific patterns for the non-teaching staff table
  let nonTeachingStaffPattern = new RegExp(
    '<h3>\\s*Non-Teaching Staff\\s*</h3>[\\s\\S]*?<table[^>]*>[\\s\\S]*?<tr>\\s*<th[^>]*>[^<]*</th>[\\s\\S]*?</tr>\\s*{{#each selectedMonths}}[\\s\\S]*?{{/each}}',
    'g'
  );
  
  // Replace non-teaching staff table with a more precise approach
  processedHtml = processedHtml.replace(
    nonTeachingStaffPattern,
    (match) => {
      const tableHeader = match.split('{{#each selectedMonths}}')[0];
      return tableHeader + nonTeachingRows;
    }
  );
  
  // More precise replacement for Teaching Staff totals
  processedHtml = processedHtml.replace(
    /<h3>\s*Teaching Staff\s*<\/h3>[\s\S]*?<td>\s*Total\s*<\/td>\s*<td class="blue">[^<]*<\/td>\s*<td class="blue">[^<]*<\/td>\s*<td class="highlight">[^<]*<\/td>/g,
    (match) => {
      return match.replace(
        /<td>\s*Total\s*<\/td>\s*<td class="blue">[^<]*<\/td>\s*<td class="blue">[^<]*<\/td>\s*<td class="highlight">[^<]*<\/td>/,
        `<td>Total</td><td class="blue">${totals.faculty.male}</td><td class="blue">${totals.faculty.female}</td><td class="highlight">${totals.faculty.total}</td>`
      );
    }
  );
  
  // More precise replacement for Non-Teaching Staff totals
  processedHtml = processedHtml.replace(
    /<h3>\s*Non-Teaching Staff\s*<\/h3>[\s\S]*?<td>\s*Total\s*<\/td>\s*<td class="blue">[^<]*<\/td>\s*<td class="blue">[^<]*<\/td>\s*<td class="highlight">[^<]*<\/td>/g,
    (match) => {
      return match.replace(
        /<td>\s*Total\s*<\/td>\s*<td class="blue">[^<]*<\/td>\s*<td class="blue">[^<]*<\/td>\s*<td class="highlight">[^<]*<\/td>/,
        `<td>Total</td><td class="blue">${totals.staff.male}</td><td class="blue">${totals.staff.female}</td><td class="highlight">${totals.staff.total}</td>`
      );
    }
  );
  
  // Handle consultation monitoring data
  const year = selectedYear.value.split('-')[0];
  
  let startMonthName, endMonthName;
  if (isYearly) {
    startMonthName = "July";
    endMonthName = "June";
  } else {
    startMonthName = months.length > 0 ? months[0].month : "";
    endMonthName = months.length > 1 ? months[months.length - 1].month : startMonthName;
  }
  
  // Replace the consultation monitoring rows in the template
  if (monitoringData && monitoringData.length > 0) {
    // Create all the rows for monitoring data
    const monitoringRows = monitoringData.map(record => `
      <tr>
        <td>${record.patientName || 'N/A'}</td>
        <td>${record.gradeSection || 'N/A'}</td>
        <td>${record.consultationDate || 'N/A'}</td>
        <td>${record.patientType || 'N/A'}</td>
        <td>${record.remarks || 'N/A'}</td>
      </tr>
    `).join('');
    
    // Replace the placeholder rows with actual data
    processedHtml = processedHtml.replace(
      /{{#each consultationRecords}}[\s\S]*?{{\/each}}/g,
      monitoringRows
    );
    
    console.log("Added consultation monitoring table with", monitoringData.length, "records");
  } else {
    // If no data, just show a message
    processedHtml = processedHtml.replace(
      /{{#each consultationRecords}}[\s\S]*?{{\/each}}/g,
      '<tr><td colspan="5" style="text-align: center;">No consultation records found for the selected period.</td></tr>'
    );
  }

  // DIRECT REPLACEMENT FOR COMMON ILLNESSES SECTION
  // This approach directly finds and replaces the table cells that have template variables
  try {
    // Set default values
    const studentsTotal = commonIllnessesData?.counts?.students?.total || 0;
    const studentsMale = commonIllnessesData?.counts?.students?.male || 0;
    const studentsFemale = commonIllnessesData?.counts?.students?.female || 0;
    const facultyStaffTotal = commonIllnessesData?.counts?.facultyStaff?.total || 0;
    const facultyStaffMale = commonIllnessesData?.counts?.facultyStaff?.male || 0;
    const facultyStaffFemale = commonIllnessesData?.counts?.facultyStaff?.female || 0;

    const studentsMaleDiagnoses = commonIllnessesData?.diagnoses?.students?.male || "No data";
    const studentsFemaleDiagnoses = commonIllnessesData?.diagnoses?.students?.female || "No data";
    const facultyStaffMaleDiagnoses = commonIllnessesData?.diagnoses?.facultyStaff?.male || "No data";
    const facultyStaffFemaleDiagnoses = commonIllnessesData?.diagnoses?.facultyStaff?.female || "No data";

    // Find and replace the common illnesses table contents using regex patterns that match the exact cell structure
    
    // 1. Replace "Students = {{commonIllnesses.counts.students.total}}" pattern
    processedHtml = processedHtml.replace(
      /<td colspan="3">\s*Students\s*=\s*{{commonIllnesses\.counts\.students\.total}}\s*<\/td>/g,
      `<td colspan="3">Students = ${studentsTotal}</td>`
    );
    
    // 2. Replace "Male = {{commonIllnesses.counts.students.male}}" pattern
    processedHtml = processedHtml.replace(
      /<td>\s*Male\s*=\s*{{commonIllnesses\.counts\.students\.male}}\s*<\/td>/g,
      `<td>Male = ${studentsMale}</td>`
    );
    
    // 3. Replace "Female = {{commonIllnesses.counts.students.female}}" pattern
    processedHtml = processedHtml.replace(
      /<td>\s*Female\s*=\s*{{commonIllnesses\.counts\.students\.female}}\s*<\/td>/g,
      `<td>Female = ${studentsFemale}</td>`
    );
    
    // 4. Replace "Faculty & Staff = {{commonIllnesses.counts.facultyStaff.total}}" pattern
    processedHtml = processedHtml.replace(
      /<td colspan="3">\s*Faculty\s*&\s*Staff\s*=\s*{{commonIllnesses\.counts\.facultyStaff\.total}}\s*<\/td>/g,
      `<td colspan="3">Faculty & Staff = ${facultyStaffTotal}</td>`
    );
    
    // 5. Replace "Male = {{commonIllnesses.counts.facultyStaff.male}}" pattern
    processedHtml = processedHtml.replace(
      /<td>\s*Male\s*=\s*{{commonIllnesses\.counts\.facultyStaff\.male}}\s*<\/td>/g,
      `<td>Male = ${facultyStaffMale}</td>`
    );
    
    // 6. Replace "Female = {{commonIllnesses.counts.facultyStaff.female}}" pattern
    processedHtml = processedHtml.replace(
      /<td>\s*Female\s*=\s*{{commonIllnesses\.counts\.facultyStaff\.female}}\s*<\/td>/g,
      `<td>Female = ${facultyStaffFemale}</td>`
    );
    
    // 7. Replace the illnesses/diagnoses content - students male
    processedHtml = processedHtml.replace(
      /<td>\s*{{commonIllnesses\.diagnoses\.students\.male}}\s*<\/td>/g,
      `<td>${studentsMaleDiagnoses}</td>`
    );
    processedHtml = processedHtml.replace(
      /<td>\s*{{{commonIllnesses\.diagnoses\.students\.male}}}\s*<\/td>/g,
      `<td>${studentsMaleDiagnoses}</td>`
    );
    
    // 8. Replace the illnesses/diagnoses content - students female
    processedHtml = processedHtml.replace(
      /<td>\s*{{commonIllnesses\.diagnoses\.students\.female}}\s*<\/td>/g,
      `<td>${studentsFemaleDiagnoses}</td>`
    );
    processedHtml = processedHtml.replace(
      /<td>\s*{{{commonIllnesses\.diagnoses\.students\.female}}}\s*<\/td>/g,
      `<td>${studentsFemaleDiagnoses}</td>`
    );
    
    // 9. Replace the illnesses/diagnoses content - faculty/staff male
    processedHtml = processedHtml.replace(
      /<td>\s*{{commonIllnesses\.diagnoses\.facultyStaff\.male}}\s*<\/td>/g,
      `<td>${facultyStaffMaleDiagnoses}</td>`
    );
    processedHtml = processedHtml.replace(
      /<td>\s*{{{commonIllnesses\.diagnoses\.facultyStaff\.male}}}\s*<\/td>/g,
      `<td>${facultyStaffMaleDiagnoses}</td>`
    );
    
    // 10. Replace the illnesses/diagnoses content - faculty/staff female
    processedHtml = processedHtml.replace(
      /<td>\s*{{commonIllnesses\.diagnoses\.facultyStaff\.female}}\s*<\/td>/g,
      `<td>${facultyStaffFemaleDiagnoses}</td>`
    );
    processedHtml = processedHtml.replace(
      /<td>\s*{{{commonIllnesses\.diagnoses\.facultyStaff\.female}}}\s*<\/td>/g,
      `<td>${facultyStaffFemaleDiagnoses}</td>`
    );

    // Find and replace diagnoses with triple braces in case any were missed
    processedHtml = processedHtml.replace(
      /{{{commonIllnesses\.diagnoses\.students\.male}}}/g,
      studentsMaleDiagnoses
    );
    processedHtml = processedHtml.replace(
      /{{{commonIllnesses\.diagnoses\.students\.female}}}/g,
      studentsFemaleDiagnoses
    );
    processedHtml = processedHtml.replace(
      /{{{commonIllnesses\.diagnoses\.facultyStaff\.male}}}/g,
      facultyStaffMaleDiagnoses
    );
    processedHtml = processedHtml.replace(
      /{{{commonIllnesses\.diagnoses\.facultyStaff\.female}}}/g,
      facultyStaffFemaleDiagnoses
    );

    console.log("Successfully processed common illnesses data directly");
    
    // Handle any remaining template variables that may have been missed
    // This direct approach replaces ALL remaining templates in the common illnesses section
    processedHtml = processedHtml.replace(/{{commonIllnesses\.[^\}]+}}/g, "No data");
    processedHtml = processedHtml.replace(/{{{commonIllnesses\.[^\}]+}}}/g, "No data");
  }
  catch (error) {
    console.error("Error during direct replacement of common illnesses data:", error);
    // Handle any remaining template variables as a fallback
    processedHtml = processedHtml.replace(/{{commonIllnesses\.[^\}]+}}/g, "No data");
    processedHtml = processedHtml.replace(/{{{commonIllnesses\.[^\}]+}}}/g, "No data");
  }
  
  return processedHtml;
};

const closeModal = () => {
  showModal.value = false
  URL.revokeObjectURL(pdfPreviewUrl.value)
  pdfPreviewUrl.value = ""
}

const onIframeLoad = (event) => {
  const iframe = event.target;
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  if (!doc) return;
  
  const textAreas = [
    { id: 'conclusion-student', ref: conclusionStudent },
    { id: 'conclusion-teaching', ref: conclusionTeaching },
    { id: 'conclusion-nonteaching', ref: conclusionNonTeaching }
  ];

  textAreas.forEach(({ id, ref }) => {
    const textArea = doc.getElementById(id);
    if (textArea) {
      // Set the textarea value from our ref
      textArea.value = ref.value;
      
      // Function to adjust height
      const adjustHeight = () => {
        textArea.style.height = 'auto'; // Reset height
        textArea.style.height = textArea.scrollHeight + 'px'; // Set new height
      };

      // Add listeners for input changes
      textArea.addEventListener('input', () => {
        ref.value = textArea.value; // Update the correct ref
        adjustHeight();
      });

      // Initial height adjustment
      adjustHeight();
    } else {
      console.warn(`Textarea with ID ${id} not found in iframe.`);
    }
  });
}

// Update the fetchReport method:
async function fetchReport() {
  if (!this.selectedYear || (this.selectedPeriod === 'monthly' && !this.startMonth)) {
    this.error = "Please select required fields.";
    return;
  }
  
  try {
    this.fetchingData = true;
    this.fetchError = null;
    
    const isYearly = this.selectedPeriod === 'yearly';
    
    // Format parameters based on period type
    const params = {
      year: this.selectedYear
    };
    
    if (isYearly) {
      params.startMonth = 'July';
      params.endMonth = 'June';
      params.yearly = true;
    } else {
      params.startMonth = this.startMonth;
      // Only add endMonth if it's different from startMonth and not 'null'
      if (this.endMonth && this.endMonth !== 'null' && this.endMonth !== this.startMonth) {
        params.endMonth = this.endMonth;
      }
    }
    
    // Debug values being sent to API
    console.log(`Fetching report with:`, params);
    
    // Make the API request
    const response = await fetch(`/api/reports/illness-summary?${new URLSearchParams(params)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Debug the received data structure
    console.log('API response:', data);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    this.reportData = data;
    
  } catch (error) {
    console.error('Error fetching report:', error);
    this.fetchError = error.message || "Failed to fetch report data";
  } finally {
    this.fetchingData = false;
  }
}
</script>

<style scoped>
/* Mobile-first responsive design */
@media (max-width: 640px) {
  /* Ensure proper touch targets on mobile */
  button,
  select {
    min-height: 44px;
    font-size: 16px; /* Prevent zoom on iOS */
  }

  /* Improve select element appearance on mobile */
  select {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 2.5rem;
  }

  /* Improve modal layout on mobile */
  .fixed.inset-0 {
    padding: 0.5rem;
  }

  /* Better iframe handling on mobile */
  iframe {
    min-height: 400px;
  }

  /* Stack layout improvements */
  .grid {
    gap: 1rem;
  }

  /* Text size adjustments for mobile readability */
  .text-2xl {
    font-size: 1.25rem;
    line-height: 1.75rem;
  }

  /* Better spacing for mobile */
  .space-y-8 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 1.5rem;
  }
}

/* Tablet responsiveness */
@media (min-width: 641px) and (max-width: 768px) {
  /* Adjust grid layout for tablets */
  .grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  /* Better modal sizing for tablets */
  .max-w-4xl {
    max-width: 90vw;
  }
}

/* Improved focus states for accessibility */
button:focus,
select:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Loading state improvements */
button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Better hover states on devices that support hover */
@media (hover: hover) {
  button:hover:not(:disabled) {
    transform: translateY(-1px);
  }
}

/* Prevent zoom on form inputs for iOS */
@supports (-webkit-touch-callout: none) {
  input,
  select,
  textarea {
    font-size: 16px;
  }
}

/* Improve scrolling behavior */
.overflow-auto {
  -webkit-overflow-scrolling: touch;
}

/* Better visual hierarchy on small screens */
@media (max-width: 480px) {
  .space-y-6 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 1rem;
  }

  /* Compact spacing for very small screens */
  .p-4 {
    padding: 0.75rem;
  }

  .px-6 {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* Enhanced modal animation */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* ...existing styles... */
select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}
</style>