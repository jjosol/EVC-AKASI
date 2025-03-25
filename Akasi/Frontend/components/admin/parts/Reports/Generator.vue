<template>
  <div class="bg-gray-50 min-h-screen py-8">
    <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
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
            class="px-4 py-2 text-gray-600 hover:text-blue-500 transition-colors">
            Monthly
          </button>
          <button 
            @click="selectedPeriod = 'yearly'"
            :class="{'text-blue-600 border-b-2 border-blue-600 font-medium': selectedPeriod === 'yearly'}"
            class="px-4 py-2 text-gray-600 hover:text-blue-500 transition-colors">
            Yearly
          </button>
        </div>

        <div class="space-y-8">
          <!-- Date Selection -->
          <div class="grid md:grid-cols-2 gap-6">
            <div v-if="selectedPeriod === 'monthly'" class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">Month Range</label>
              <div class="flex items-center space-x-2">
                <div class="flex-1">
                  <select 
                    v-model="startMonth" 
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50">
                    <option value="" disabled selected>Start Month</option>
                    <option v-for="(month, index) in months" :key="index" :value="index">{{ month }}</option>
                  </select>
                </div>
                <span class="text-gray-500">to</span>
                <div class="flex-1">
                  <select 
                    v-model="endMonth"
                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50">
                    <option value="" disabled selected>End Month</option>
                    <option value="null">Same as Start Month</option>
                    <option v-for="(month, index) in months" :key="index" :value="index">{{ month }}</option>
                  </select>
                </div>
              </div>
              <div v-if="endMonthError" class="text-red-500 text-sm mt-1">
                {{ endMonthError }}
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">School Year</label>
              <select 
                v-model="selectedYear"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50">
                <option value="" disabled selected>Select School Year</option>
                <option v-for="year in schoolYears" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
          </div>

          <!-- Report Preview -->
          <div class="border rounded-lg overflow-hidden bg-gray-50">
            <div class="px-4 py-3 bg-gray-100 border-b border-gray-200">
              <h3 class="font-medium text-gray-700">Report Preview</h3>
            </div>
            
            <div class="p-4 text-sm text-gray-600">
              <p class="mt-2">
                This system generates a comprehensive report including:
                <ul class="list-disc list-inside">
                  <li>SUMMARY OF PERCENTAGE OF THE PSHS-EVC COMMUNITY THAT ACQUIRED ILLNESSES</li>
                  <li>LIST OF COMMON ILLNESSES/INJURIES</li>
                  <li>INFECTIOUS DISEASE MONITORING TOOL</li>
                  <li>PERCENTAGE OF INFECTIOUS DISEASES IN PSHS-EVC</li>
                </ul>
              </p>
            </div>
          </div>

          <!-- Generate and Preview Buttons -->
          <div class="flex justify-between pt-4">
            <button 
              @click="previewReport" 
              class="px-6 py-2 bg-blue-600 text-white font-medium rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-transform duration-200 hover:scale-105 disabled:opacity-50"
              :disabled="!canGenerate">
              PREVIEW REPORT
            </button>
            <button 
              @click="generateReport" 
              class="px-6 py-2 bg-blue-600 text-white font-medium rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-transform duration-200 hover:scale-105 disabled:opacity-50"
              :disabled="!canGenerate">
              GENERATE REPORT
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for PDF Preview -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white rounded-lg shadow-lg overflow-hidden w-11/12 max-w-4xl h-5/6 flex flex-col">
        <div class="px-4 py-2 flex justify-between items-center border-b">
          <h3 class="text-lg font-medium">Report Preview</h3>
          <button @click="showModal = false" class="text-gray-500 hover:text-gray-700">
            <span class="sr-only">Close</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div class="px-4 py-2 border-t flex justify-end">
          <button 
            @click="generateReport" 
            :disabled="fetchingData"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
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
//import moment from 'moment-timezone'

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

// Computed properties
const canGenerate = computed(() => {
  return startMonth.value !== "" && 
         selectedYear.value !== "" &&
         endMonthError.value === ""
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

const generatePdf = async (htmlContent) => {
  try {
    // Ensure conclusion text is in the HTML before generating
    htmlContent = htmlContent.replace(
      /<textarea[^>]*id="conclusion"[^>]*>.*?<\/textarea>/g,
      `<textarea id="conclusion" name="conclusion" rows="4">${conclusionText.value}</textarea>`
    );
    
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        html: htmlContent,
        conclusionText: conclusionText.value 
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to generate PDF')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    // Set filename based on whether there's an end month
    let filename
    if (endMonth.value === "null" || endMonth.value === "") {
      filename = `report-${months.value[startMonth.value]}-${selectedYear.value}.pdf`
    } else {
      filename = `report-${months.value[startMonth.value]}-${months.value[endMonth.value]}-${selectedYear.value}.pdf`
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

const fetchReportData = async (startMonthName, endMonthName, year) => {
  fetchingData.value = true;
  fetchError.value = null;
  
  try {
    // Add URL encode for month names with spaces and proper handling of year
    const encodedStartMonth = encodeURIComponent(startMonthName);
    const encodedEndMonth = encodeURIComponent(endMonthName || startMonthName);
    
    console.log(`Fetching data for: ${encodedStartMonth} to ${encodedEndMonth}, ${year}`);
    
    const response = await fetch(
      `http://localhost:3001/reports/illness-summary?startMonth=${encodedStartMonth}&endMonth=${encodedEndMonth}&year=${year}`
    );
    
    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
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

const generateReport = async () => {
  // Validate selections before generating
  if (startMonth.value === "" || selectedYear.value === "") {
    alert("Please select both start month and year");
    return;
  }
  
  // Make sure the HTML template is loaded
  if (!reportHtmlTemplate.value) {
    alert("Report template is not loaded. Please refresh and try again.");
    return;
  }
  
  const startMonthName = months.value[startMonth.value];
  let endMonthName = endMonth.value === "null" || endMonth.value === "" 
    ? startMonthName 
    : months.value[endMonth.value];
  const year = selectedYear.value;

  // Format date range for the report heading
  let dateRange;
  if (endMonth.value === "null" || endMonth.value === "") {
    dateRange = `${startMonthName}, S.Y. ${year}`;
  } else {
    dateRange = `${startMonthName} - ${endMonthName}, S.Y. ${year}`;
  }

  // Fetch data from the API
  const data = await fetchReportData(startMonthName, endMonthName, year);
  
  if (!data) {
    alert("Failed to fetch report data. Please try again.");
    return;
  }

  // Generate the selectedMonths array
  const selectedMonths = [];
  const startIndex = parseInt(startMonth.value);
  const endIndex = endMonth.value === "null" || endMonth.value === "" ? startIndex : parseInt(endMonth.value);
  for (let i = startIndex; i <= endIndex; i++) {
    selectedMonths.push(months.value[i]);
  }

  // Process the HTML template: Replace placeholders with actual values
  let finalHtml = reportHtmlTemplate.value
    .replace(/{{dateRange}}/g, dateRange)
    .replace(/{{startMonth}}/g, startMonthName)
    .replace(/{{selectedYear}}/g, year);

  // Process tables with correct column counts and data
  finalHtml = processTemplate(finalHtml, selectedMonths, data);

  try {
    // Generate PDF with the final HTML
    await generatePdf(finalHtml);
  } catch (error) {
    console.error("Error generating report:", error);
    alert("Failed to generate report. Please try again later.");
  }
};

const processTemplate = (html, selectedMonths, data) => {
  let processedHtml = html;
  
  // Extract data from API response
  const { months, totals } = data;
  
  console.log("API Response Data:", data); // Add this to debug
  console.log("Months data:", months); // Add this to debug
  console.log("Totals data:", totals); // Add this to debug
  
  // Create student rows with actual data
  const studentRows = months.map(month => `
    <tr>
      <td>${month.month}</td>
      <td>${month.students.maleDormers}</td>
      <td>${month.students.maleExterns}</td>
      <td>${month.students.femaleDormers}</td>
      <td>${month.students.femaleExterns}</td>
      <td>${month.students.total}</td>
    </tr>
  `).join('');
  
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
  
  // Create teaching staff (faculty) rows
  const teachingRows = months.map(month => `
    <tr>
      <td>${month.month}</td>
      <td>${month.faculty.male}</td>
      <td>${month.faculty.female}</td>
      <td>${month.faculty.total}</td>
    </tr>
  `).join('');
  
  // Replace teaching staff table
  processedHtml = processedHtml.replace(
    /(Teaching Staff[\s\S]*?<\/tr>)\s*{{#each selectedMonths}}[\s\S]*?{{\/each}}/g,
    `$1${teachingRows}`
  );
  
  // Create non-teaching staff rows
  const nonTeachingRows = months.map(month => `
    <tr>
      <td>${month.month}</td>
      <td>${month.staff.male}</td>
      <td>${month.staff.female}</td>
      <td>${month.staff.total}</td>
    </tr>
  `).join('');
  
  // Replace non-teaching staff table
  processedHtml = processedHtml.replace(
    /(Non-Teaching Staff[\s\S]*?<\/tr>)\s*{{#each selectedMonths}}[\s\S]*?{{\/each}}/g,
    `$1${nonTeachingRows}`
  );
  
  // More precise replacement for Teaching Staff totals
  processedHtml = processedHtml.replace(
    /<h3>Teaching Staff<\/h3>[\s\S]*?<td>Total<\/td>\s*<td class="blue">[^<]*<\/td>\s*<td class="blue">[^<]*<\/td>\s*<td class="highlight">[^<]*<\/td>/g,
    (match) => {
      return match.replace(
        /<td>Total<\/td>\s*<td class="blue">[^<]*<\/td>\s*<td class="blue">[^<]*<\/td>\s*<td class="highlight">[^<]*<\/td>/,
        `<td>Total</td><td class="blue">${totals.faculty.male}</td><td class="blue">${totals.faculty.female}</td><td class="highlight">${totals.faculty.total}</td>`
      );
    }
  );
  
  // More precise replacement for Non-Teaching Staff totals
  processedHtml = processedHtml.replace(
    /<h3>Non-Teaching Staff<\/h3>[\s\S]*?<td>Total<\/td>\s*<td class="blue">[^<]*<\/td>\s*<td class="blue">[^<]*<\/td>\s*<td class="highlight">[^<]*<\/td>/g,
    (match) => {
      return match.replace(
        /<td>Total<\/td>\s*<td class="blue">[^<]*<\/td>\s*<td class="blue">[^<]*<\/td>\s*<td class="highlight">[^<]*<\/td>/,
        `<td>Total</td><td class="blue">${totals.staff.male}</td><td class="blue">${totals.staff.female}</td><td class="highlight">${totals.staff.total}</td>`
      );
    }
  );
  
  // Replace the conclusion placeholder
  processedHtml = processedHtml.replace(
    /<textarea id="conclusion"[^>]*>.*?<\/textarea>/g,
    `<textarea id="conclusion" name="conclusion" rows="4">${conclusionText.value}</textarea>`
  );
  
  return processedHtml;
};

const previewReport = async () => {
  if (startMonth.value === "" || selectedYear.value === "") {
    alert("Please select both start month and year");
    return;
  }
  
  // Make sure the HTML template is loaded
  if (!reportHtmlTemplate.value) {
    alert("Report template is not loaded. Please refresh and try again.");
    return;
  }
  
  const startMonthName = months.value[startMonth.value];
  let endMonthName = endMonth.value === "null" || endMonth.value === "" 
    ? startMonthName 
    : months.value[endMonth.value];
  const year = selectedYear.value;
  
  // Format date range for the report heading
  let dateRange;
  if (endMonth.value === "" || endMonth.value === "null") {
    dateRange = `${startMonthName}, S.Y. ${year}`;
  } else {
    dateRange = `${startMonthName} - ${endMonthName}, S.Y. ${year}`;
  }

  // Fetch data from the API
  const data = await fetchReportData(startMonthName, endMonthName, year);
  
  if (!data) {
    alert("Failed to fetch report data. Please try again.");
    return;
  }

  // Generate the selectedMonths array
  const selectedMonths = [];
  const startIndex = parseInt(startMonth.value);
  const endIndex = endMonth.value === "null" || endMonth.value === "" ? startIndex : parseInt(endMonth.value);
  for (let i = startIndex; i <= endIndex; i++) {
    selectedMonths.push(months.value[i]);
  }

  // Process the HTML template: Replace placeholders with actual values
  let finalHtml = reportHtmlTemplate.value
    .replace(/{{dateRange}}/g, dateRange)
    .replace(/{{startMonth}}/g, startMonthName)
    .replace(/{{selectedYear}}/g, year);

  // Process tables with correct column counts and data
  finalHtml = processTemplate(finalHtml, selectedMonths, data);

  try {
    // Create a blob URL for the preview
    const blob = new Blob([finalHtml], { type: 'text/html' });
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
</script>