<template>
  <div class="bg-gray-50 min-h-screen py-8">
    <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
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
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <select 
                v-model="selectedYear"
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50">
                <option value="" disabled selected>Select Year</option>
                <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>
          </div>

          <!-- Report Forms -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium text-gray-900">Report Forms</h3>
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
              <div class="flex items-start">
                <input 
                  type="checkbox" 
                  id="form1" 
                  v-model="selectedForms.summary" 
                  class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="form1" class="ml-3 text-sm text-gray-700">
                  SUMMARY OF PERCENTAGE OF THE PSHS-EVC COMMUNITY THAT ACQUIRED ILLNESSES Form
                </label>
              </div>
              
              <div class="flex items-start">
                <input 
                  type="checkbox" 
                  id="form2" 
                  v-model="selectedForms.illnesses" 
                  class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="form2" class="ml-3 text-sm text-gray-700">
                  LIST OF COMMON ILLNESSES/INJURIES Form
                </label>
              </div>
              
              <div class="flex items-start">
                <input 
                  type="checkbox" 
                  id="form3" 
                  v-model="selectedForms.monitoring" 
                  class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="form3" class="ml-3 text-sm text-gray-700">
                  INFECTIOUS DISEASE MONITORING TOOL Form
                </label>
              </div>
              
              <div class="flex items-start">
                <input 
                  type="checkbox" 
                  id="form4" 
                  v-model="selectedForms.percentage" 
                  class="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label for="form4" class="ml-3 text-sm text-gray-700">
                  PERCENTAGE OF INFECTIOUS DISEASES IN PSHS-EVC Form
                </label>
              </div>
            </div>
          </div>

          <!-- Preview Box -->
          <div class="border rounded-lg overflow-hidden bg-gray-50">
            <div class="px-4 py-3 bg-gray-100 border-b border-gray-200">
              <h3 class="font-medium text-gray-700">Report Preview</h3>
            </div>
            <div class="p-4 text-sm text-gray-600">
              <p v-if="startMonth !== '' && selectedYear !== ''">
                Generating report for: 
                <span class="font-medium">{{ months[startMonth] }}</span>
                <span v-if="endMonth !== '' && endMonth !== 'null'"> to 
                  <span class="font-medium">{{ months[endMonth] }}</span>
                </span>
                <span class="font-medium"> {{ selectedYear }}</span>
              </p>
              <p v-else class="italic text-gray-500">
                Please select date parameters to preview report details
              </p>
              
              <ul v-if="hasSelectedForms" class="mt-2 space-y-1">
                <li v-if="selectedForms.summary">• SUMMARY OF PERCENTAGE Form</li>
                <li v-if="selectedForms.illnesses">• LIST OF COMMON ILLNESSES Form</li>
                <li v-if="selectedForms.monitoring">• INFECTIOUS DISEASE MONITORING Form</li>
                <li v-if="selectedForms.percentage">• PERCENTAGE OF INFECTIOUS DISEASES Form</li>
              </ul>
            </div>
          </div>

          <!-- Generate Button -->
          <div class="flex justify-end pt-4">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import moment from 'moment-timezone'

// Import HTML template - this will be loaded as a string
const reportHtmlTemplate = ref('')

const timezone = "Asia/Manila"
const currentYear = moment().tz(timezone).year()
const selectedYear = ref("")
const startMonth = ref("")
const endMonth = ref("")
const selectedPeriod = ref("monthly")

// Form selection checkboxes
const selectedForms = ref({
  summary: true,
  illnesses: false,
  monitoring: false,
  percentage: false
})

const years = ref(Array.from(
  { length: 51 }, 
  (_, i) => currentYear - 25 + i
))

const months = ref([
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
])

// Computed properties
const hasSelectedForms = computed(() => {
  return selectedForms.value.summary || 
         selectedForms.value.illnesses || 
         selectedForms.value.monitoring || 
         selectedForms.value.percentage
})

const canGenerate = computed(() => {
  return startMonth.value !== "" && 
         selectedYear.value !== "" && 
         hasSelectedForms.value
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

const generateReport = () => {
  // Validate selections before generating
  if (startMonth.value === "" || selectedYear.value === "") {
    alert("Please select both start month and year")
    return
  }
  
  if (!hasSelectedForms.value) {
    alert("Please select at least one report form")
    return
  }
  
  // Make sure the HTML template is loaded
  if (!reportHtmlTemplate.value) {
    alert("Report template is not loaded. Please refresh and try again.")
    return
  }
  
  const startMonthName = months.value[startMonth.value]
  let endMonthName = ""
  const year = selectedYear.value
  
  // Format date range for the report heading
  let dateRange
  if (endMonth.value === "" || endMonth.value === "null") {
    dateRange = `${startMonthName} ${year}`
  } else {
    endMonthName = months.value[endMonth.value]
    dateRange = `${startMonthName} - ${endMonthName} ${year}`
  }

  // Process the HTML template: Replace placeholders with actual values
  let finalHtml = reportHtmlTemplate.value
    .replace(/{{dateRange}}/g, dateRange)
    .replace(/{{startMonth}}/g, startMonthName)
    .replace(/{{selectedYear}}/g, year)
  
  // Handle conditional end month display using Handlebars-like syntax
  if (endMonth.value !== "" && endMonth.value !== "null") {
    // Replace the conditional block with actual content including endMonth
    finalHtml = finalHtml.replace(
      /{{#if endMonth}}(.*?){{\/if}}/g, 
      (match, content) => content.replace(/{{endMonth}}/g, endMonthName)
    )
  } else {
    // Remove the conditional blocks entirely
    finalHtml = finalHtml.replace(/{{#if endMonth}}.*?{{\/if}}/g, '')
  }

  generatePdf(finalHtml)
}
</script>