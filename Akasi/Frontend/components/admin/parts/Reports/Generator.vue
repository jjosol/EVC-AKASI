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
    <div class="flex justify-between items-center p-4 border-b border-gray-200">
      <h3 class="text-lg font-medium text-gray-700">PDF Preview</h3>
      <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div class="flex-1 overflow-auto">
      <iframe :src="pdfPreviewUrl" class="w-full h-full" frameborder="0"></iframe>
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
    // Academic year wraps around (July to June)
    // For months 0-5 (July-December), valid end months are >= startMonth and <= 11
    // For months 6-11 (January-June), valid end months are >= startMonth or <= 5
    
    const startMonthIndex = parseInt(newStartMonth)
    const endMonthIndex = parseInt(newEndMonth)
    
    if (startMonthIndex === endMonthIndex) {
      endMonthError.value = "End month cannot be the same as start month. Use 'Same as Start Month' for single month reports."
    } else if (startMonthIndex > endMonthIndex) {
        endMonthError.value = "Invalid month range. End month must be after start month or within the same academic year."
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
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ html: htmlContent })
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

const generateReport = async () => {
  // Validate selections before generating
  if (startMonth.value === "" || selectedYear.value === "") {
    alert("Please select both start month and year")
    return
  }
  
  // Make sure the HTML template is loaded
  if (!reportHtmlTemplate.value) {
    alert("Report template is not loaded. Please refresh and try again.")
    return
  }
  
  const startMonthName = months.value[startMonth.value]
  let endMonthName = endMonth.value === "null" || endMonth.value === "" 
    ? startMonthName 
    : months.value[endMonth.value]
  const year = selectedYear.value

  // Format date range for the report heading
  let dateRange
  if (endMonth.value === "null" || endMonth.value === "") {
    dateRange = `${startMonthName}, S.Y. ${year}`
  } else {
    dateRange = `${startMonthName} - ${endMonthName}, S.Y. ${year}`
  }

  // Fetch the illness summary data from the API
  try {
    const apiUrl = `http://localhost:3001/reports/illness-summary?startMonth=${startMonthName}&endMonth=${endMonthName}&year=${year}`;;
    console.log("Fetching from:", apiUrl);
    
    const response = await fetch(apiUrl);
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response body:", errorText);
      throw new Error(`Server returned ${response.status}: ${errorText.substring(0, 100)}`);
    }
    
    const responseText = await response.text();
    console.log("Raw response:", responseText);
    
    // Handle empty response
    if (!responseText.trim()) {
      console.warn("Empty response from server");
      throw new Error("Server returned empty response");
    }
    
    // Try to parse JSON
    try {
      const summaryData = JSON.parse(responseText);
      console.log("Parsed data:", summaryData);
      
      // Check if data is empty array
      if (Array.isArray(summaryData) && summaryData.length === 0) {
        console.warn("Server returned empty data array");
        throw new Error("No data available for the selected period");
      }
      
      // Continue with your existing code
      const studentRows = summaryData.map(month => `
        <tr>
          <td>${month.month}</td>
          <td>${month.students.male}</td>
          <td>${month.students.female}</td>
          <td class="blue">${month.students.total}</td>
          <td>${month.students.malePct}%</td>
          <td>${month.students.femalePct}%</td>
          <td class="blue">${month.students.totalPct}%</td>
          <td>${month.students.grandTotal}</td>
        </tr>
      `).join('')
      
      const teachingRows = summaryData.map(month => `
        <tr>
          <td>${month.month}</td>
          <td>${month.teachingStaff.male}</td>
          <td>${month.teachingStaff.female}</td>
          <td>${month.teachingStaff.total}</td>
        </tr>
      `).join('')
      
      const nonTeachingRows = summaryData.map(month => `
        <tr>
          <td>${month.month}</td>
          <td>${month.nonTeachingStaff.male}</td>
          <td>${month.nonTeachingStaff.female}</td>
          <td>${month.nonTeachingStaff.total}</td>
        </tr>
      `).join('')
  
      // Process the HTML template: Replace placeholders with actual values
      let finalHtml = reportHtmlTemplate.value
        .replace(/{{dateRange}}/g, dateRange)
        .replace(/{{startMonth}}/g, startMonthName)
        .replace(/{{selectedYear}}/g, year)
      
      // Replace student table rows
      finalHtml = finalHtml.replace(
        /(Students[\s\S]*?){{#each selectedMonths}}[\s\S]*?{{\/each}}/g, 
        `$1${studentRows}`
      )
      
      // Replace teaching staff table rows
      finalHtml = finalHtml.replace(
        /(Teaching Staff[\s\S]*?){{#each selectedMonths}}[\s\S]*?{{\/each}}/g, 
        `$1${teachingRows}`
      )
      
      // Replace non-teaching staff table rows
      finalHtml = finalHtml.replace(
        /(Non-Teaching Staff[\s\S]*?){{#each selectedMonths}}[\s\S]*?{{\/each}}/g, 
        `$1${nonTeachingRows}`
      )
      
      // Handle conditional end month display
      if (endMonth.value !== "" && endMonth.value !== "null") {
        finalHtml = finalHtml.replace(
          /{{#if endMonth}}(.*?){{\/if}}/g, 
          (match, content) => content.replace(/{{endMonth}}/g, endMonthName)
        )
      } else {
        finalHtml = finalHtml.replace(/{{#if endMonth}}.*?{{\/if}}/g, '')
      }
  
      generatePdf(finalHtml)
      
    } catch (error) {
      console.error("Error parsing JSON:", error);
      alert("Failed to parse report data. Please try again.");
    }
  } catch (error) {
    console.error("Error fetching illness summary data:", error)
    alert("Failed to fetch report data. Please try again.")
  }
}

const processTemplate = (html, selectedMonths) => {
  let processedHtml = html;

  // Replace Students table rows (8 columns)
  const studentPattern = selectedMonths.map(month => `
    <tr>
      <td>${month}</td>
      <td>0</td>
      <td>0</td>
      <td class="blue">0</td>
      <td>0</td>
      <td>0</td>
      <td class="blue">0</td>
      <td>0</td>
    </tr>
  `).join('');

  // Replace Staff table rows (4 columns)
  const staffPattern = selectedMonths.map(month => `
    <tr>
      <td>${month}</td>
      <td>0</td>
      <td>0</td>
      <td>0</td>
    </tr>
  `).join('');

  // Replace each table section with appropriate pattern
  processedHtml = processedHtml
    .replace(
      /(Students[\s\S]*?){{#each selectedMonths}}[\s\S]*?{{\/each}}/g, 
      `$1${studentPattern}`
    )
    .replace(
      /(Teaching Staff[\s\S]*?){{#each selectedMonths}}[\s\S]*?{{\/each}}/g, 
      `$1${staffPattern}`
    )
    .replace(
      /(Non-Teaching Staff[\s\S]*?){{#each selectedMonths}}[\s\S]*?{{\/each}}/g, 
      `$1${staffPattern}`
    );

  return processedHtml;
}

const previewReport = async () => {
  // Validate selections before previewing
  if (startMonth.value === "" || selectedYear.value === "") {
    alert("Please select both start month and year")
    return
  }
  
  // Make sure the HTML template is loaded
  if (!reportHtmlTemplate.value) {
    alert("Report template is not loaded. Please refresh and try again.")
    return
  }
  
  const startMonthName = months.value[startMonth.value]
  // Fix this line to match generateReport function's approach
  let endMonthName = endMonth.value === "null" || endMonth.value === "" 
    ? startMonthName 
    : months.value[endMonth.value]
  const year = selectedYear.value
  
  // Format date range for the report heading
  let dateRange
  if (endMonth.value === "" || endMonth.value === "null") {
    dateRange = `${startMonthName}, S.Y. ${year}`
  } else {
    dateRange = `${startMonthName} - ${endMonthName}, S.Y. ${year}`
  }

  // Generate the selectedMonths array
  const selectedMonths = []
  const startIndex = parseInt(startMonth.value)
  const endIndex = endMonth.value === "null" || endMonth.value === "" ? startIndex : parseInt(endMonth.value)
  for (let i = startIndex; i <= endIndex; i++) {
    selectedMonths.push(months.value[i])
  }

  // Process the HTML template: Replace placeholders with actual values
  let finalHtml = reportHtmlTemplate.value
    .replace(/{{dateRange}}/g, dateRange)
    .replace(/{{startMonth}}/g, startMonthName)
    .replace(/{{selectedYear}}/g, year);

  // Process tables with correct column counts
  finalHtml = processTemplate(finalHtml, selectedMonths);

  try {
    const response = await fetch(`http://localhost:3001/reports/illness-summary?startMonth=${startMonthName}&endMonth=${endMonthName}&year=${year}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch illness summary data')
    }
    
    const summaryData = await response.json()
    
    // Create table content from the data
    const studentRows = summaryData.map(month => `
      <tr>
        <td>${month.month}</td>
        <td>${month.students.male}</td>
        <td>${month.students.female}</td>
        <td class="blue">${month.students.total}</td>
        <td>${month.students.malePct}%</td>
        <td>${month.students.femalePct}%</td>
        <td class="blue">${month.students.totalPct}%</td>
        <td>${month.students.grandTotal}</td>
      </tr>
    `).join('')
    
    const teachingRows = summaryData.map(month => `
      <tr>
        <td>${month.month}</td>
        <td>${month.teachingStaff.male}</td>
        <td>${month.teachingStaff.female}</td>
        <td>${month.teachingStaff.total}</td>
      </tr>
    `).join('')
    
    const nonTeachingRows = summaryData.map(month => `
      <tr>
        <td>${month.month}</td>
        <td>${month.nonTeachingStaff.male}</td>
        <td>${month.nonTeachingStaff.female}</td>
        <td>${month.nonTeachingStaff.total}</td>
      </tr>
    `).join('')

    // Process the HTML template: Replace placeholders with actual values
    finalHtml = finalHtml
      .replace(/{{dateRange}}/g, dateRange)
      .replace(/{{startMonth}}/g, startMonthName)
      .replace(/{{selectedYear}}/g, year)
    
    // Replace student table rows
    finalHtml = finalHtml.replace(
      /(Students[\s\S]*?){{#each selectedMonths}}[\s\S]*?{{\/each}}/g, 
      `$1${studentRows}`
    )
    
    // Replace teaching staff table rows
    finalHtml = finalHtml.replace(
      /(Teaching Staff[\s\S]*?){{#each selectedMonths}}[\s\S]*?{{\/each}}/g, 
      `$1${teachingRows}`
    )
    
    // Replace non-teaching staff table rows
    finalHtml = finalHtml.replace(
      /(Non-Teaching Staff[\s\S]*?){{#each selectedMonths}}[\s\S]*?{{\/each}}/g, 
      `$1${nonTeachingRows}`
    )
    
    // Handle conditional end month display
    if (endMonth.value !== "" && endMonth.value !== "null") {
      finalHtml = finalHtml.replace(
        /{{#if endMonth}}(.*?){{\/if}}/g, 
        (match, content) => content.replace(/{{endMonth}}/g, endMonthName)
      )
    } else {
      finalHtml = finalHtml.replace(/{{#if endMonth}}.*?{{\/if}}/g, '')
    }

    // Create a blob URL for the preview
    const blob = new Blob([finalHtml], { type: 'text/html' })
    pdfPreviewUrl.value = URL.createObjectURL(blob)

    // Show the modal
    showModal.value = true
  } catch (error) {
    console.error("Error fetching illness summary data:", error)
    alert("Failed to fetch report data. Please try again.")
  }
}

const closeModal = () => {
  showModal.value = false
  URL.revokeObjectURL(pdfPreviewUrl.value)
  pdfPreviewUrl.value = ""
}

const illnessSummaryData = ref([]);

const fetchIllnessSummary = async () => {
  try {
    const response = await fetch(`http://localhost:3001/reports/illness-summary?startMonth=July&endMonth=December&year=2022`);
    if (!response.ok) {
      throw new Error('Failed to fetch illness summary data');
    }
    illnessSummaryData.value = await response.json();
  } catch (error) {
    console.error('Error fetching illness summary data:', error);
  }
};

onMounted(fetchIllnessSummary);
</script>