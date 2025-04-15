<template>
  <div class="min-h-screen py-8 bg-gray-50">
    <div class="max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow-md">
      <!-- Header -->
      <div class="bg-[#2f4a71] px-6 py-4">
        <h2 class="text-2xl font-bold text-white">PSHS-EVC Health Services Report Generator</h2>
      </div>

      <div class="p-6">
        <!-- Tabs for Monthly and Annual -->
        <div class="flex justify-end mb-6 border-b border-gray-200">
          <button 
            @click="selectedPeriod = 'monthly'"
            :class="{'text-blue-600 border-b-2 border-blue-600 font-medium': selectedPeriod === 'monthly'}"
            class="px-4 py-2 text-gray-600 transition-colors hover:text-blue-500">
            Monthly
          </button>
          <button 
            @click="selectedPeriod = 'yearly'"
            :class="{'text-blue-600 border-b-2 border-blue-600 font-medium': selectedPeriod === 'yearly'}"
            class="px-4 py-2 text-gray-600 transition-colors hover:text-blue-500">
            Yearly
          </button>
        </div>

        <div class="space-y-8">
          <!-- Date Selection -->
          <div class="grid gap-6 md:grid-cols-2">
            <div v-if="selectedPeriod === 'monthly'" class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">Month Range</label>
              <div class="flex items-center space-x-2">
                <div class="flex-1">
                  <select 
                    v-model="startMonth" 
                    class="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50">
                    <option value="" disabled selected>Start Month</option>
                    <option v-for="(month, index) in months" :key="index" :value="index">{{ month }}</option>
                  </select>
                </div>
                <span class="text-gray-500">to</span>
                <div class="flex-1">
                  <select 
                    v-model="endMonth"
                    class="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50">
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
            
            <div v-if="selectedPeriod === 'yearly'" class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">Period</label>
              <div class="px-4 py-2 bg-gray-100 border border-gray-200 rounded-md">
                Full School Year (July - June)
              </div>
            </div>
            
            <div>
              <label class="block mb-2 text-sm font-medium text-gray-700">School Year</label>
              <select 
                v-model="selectedYear"
                class="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50">
                <option value="" disabled selected>Select School Year</option>
                <option v-for="year in schoolYears" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
          </div>

          <!-- Report Preview -->
          <div class="overflow-hidden border rounded-lg bg-gray-50">
            <div class="px-4 py-3 bg-gray-100 border-b border-gray-200">
              <h3 class="font-medium text-gray-700">Report Preview</h3>
            </div>
            
            <div class="p-4 text-sm text-gray-600">
              <p class="mt-2">
                This system generates a comprehensive report including:
                <ul class="list-disc list-inside">
                  <li>SUMMARY OF THE PSHS-EVC COMMUNITY THAT ACQUIRED ILLNESSES and INJURIES</li>
                  <li>CONSULTATION/APPOINTMENT MONITORING TOOL</li>
                </ul>
              </p>
            </div>
          </div>

          <!-- Generate and Preview Buttons -->
          <div class="flex justify-between pt-4">
            <button 
              @click="previewReport" 
              class="px-6 py-2 bg-[#394a6e] text-white font-medium rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[#394a6e] focus:ring-offset-2 transform transition-transform duration-200 hover:scale-105 disabled:opacity-50"
              :disabled="!canGenerate">
              PREVIEW REPORT
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for PDF Preview -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="flex flex-col w-11/12 max-w-4xl overflow-hidden bg-white rounded-lg shadow-lg h-5/6">
        <div class="flex items-center justify-between px-4 py-2 border-b">
          <h3 class="text-lg font-medium">Report Preview</h3>
          <button @click="showModal = false" class="text-gray-500 hover:text-gray-700">
            <span class="sr-only">Close</span>
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div class="flex justify-end px-4 py-2 border-t">
          <button 
            @click="generateReport" 
            :disabled="fetchingData"
            class="bg-[#394a6e] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
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
import { fetchIllnessSummary, fetchConsultationMonitoring, generatePdf, formatReportDate } from '../../../../services/reportService'

// Import HTML template - this will be loaded as a string
const reportHtmlTemplate = ref('')

const selectedYear = ref("")
const startMonth = ref("")
const endMonth = ref("")
const selectedPeriod = ref("monthly")
const endMonthError = ref("")
const conclusionText = ref("")
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
    // Use the reportService function to generate PDF
    const blob = await generatePdf(htmlContent, conclusionText.value);
    
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

const fetchReportData = async (startMonthName, endMonthName, year, isYearly = false) => {
  fetchingData.value = true;
  fetchError.value = null;
  
  try {
    console.log(`Fetching data for: ${startMonthName} to ${endMonthName || startMonthName}, ${year}, yearly=${isYearly}`);
    
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

const fetchConsultationMonitoringData = async (startMonthName, endMonthName, year, isYearly = false) => {
  try {
    console.log(`Fetching monitoring data for: ${startMonthName} to ${endMonthName || startMonthName}, ${year}, yearly=${isYearly}`);
    
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

  // Process the HTML template: Replace placeholders with actual values
  let finalHtml = reportHtmlTemplate.value
    .replace(/{{dateRange}}/g, dateRange)
    .replace(/{{startMonth}}/g, startMonthName)
    .replace(/{{selectedYear}}/g, year);

  // Process tables with correct column counts and data (now async)
  finalHtml = await processTemplate(finalHtml, selectedMonths, data, isYearly);

  try {
    // Generate PDF with the final HTML
    await generatePdfFile(finalHtml);
  } catch (error) {
    console.error("Error generating report:", error);
    alert("Failed to generate report. Please try again later.");
  }
};

const processTemplate = async (html, selectedMonths, data, isYearly = false) => {
  let processedHtml = html;
  
  // Extract data from API response
  const { months, totals } = data;
  
  console.log("API Response Data:", data);
  console.log("Months data:", months);
  console.log("Totals data:", totals);
  
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
  
  // Fetch the consultation monitoring data
  const monitoringData = await fetchConsultationMonitoringData(startMonthName, endMonthName, year, isYearly);
  
  // Replace the consultation monitoring rows in the template
  if (monitoringData && monitoringData.length > 0) {
    // Create all the rows for monitoring data
    const monitoringRows = monitoringData.map(record => `
      <tr>
        <td>${record.clientName || 'N/A'}</td>
        <td>${record.gradeSection || 'N/A'}</td>
        <td>${record.consultationDate || 'N/A'}</td>
        <td>${record.clientType || 'N/A'}</td>
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
    console.log("No consultation monitoring data found or empty array returned");
  }
  
  return processedHtml;
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

  // Process the HTML template: Replace placeholders with actual values
  let finalHtml = reportHtmlTemplate.value
    .replace(/{{dateRange}}/g, dateRange)
    .replace(/{{startMonth}}/g, startMonthName)
    .replace(/{{selectedYear}}/g, year);

  // Process tables with correct column counts and data (now async)
  finalHtml = await processTemplate(finalHtml, selectedMonths, data, isYearly);

  try {
    // Create a blob from the HTML content
    const blob = new Blob([finalHtml], { type: 'text/html' });
    
    // Create a URL from the blob
    pdfPreviewUrl.value = URL.createObjectURL(blob);

    // Show the modal
    showModal.value = true;
  } catch (error) {
    console.error("Error generating preview:", error);
    alert("Failed to generate preview. Please try again later.");
  }
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
  
  const textArea = doc.getElementById('conclusion');
  if (textArea) {
    // Set the textarea value from our ref
    textArea.value = conclusionText.value;
    
    // Add an event listener to update our ref when the textarea changes
    textArea.addEventListener('input', () => {
      conclusionText.value = textArea.value;
    });
  }
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