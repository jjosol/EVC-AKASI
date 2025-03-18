<script setup>
import { ref } from 'vue'
import moment from 'moment-timezone'

const timezone = "Asia/Manila"
const currentYear = moment().tz(timezone).year()
const selectedYear = ref(currentYear)
const selectedMonth = ref(moment().tz(timezone).month())
const selectedPeriod = ref("monthly")

const years = ref(Array.from(
  { length: 51 }, 
  (_, i) => currentYear - 25 + i
))
const months = ref([
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
])

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
    a.download = `report-${months[selectedMonth.value]}-${selectedYear.value}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    console.log("PDF has been generated successfully!")
  } catch (error) {
    console.error("Error generating PDF:", error)
  }
}

const generateReport = () => {
  const monthName = months[selectedMonth.value]
  const year = selectedYear.value
  const period = selectedPeriod.value

  const finalHtml = html
    .replace(/{{selectedMonth}}/g, monthName)
    .replace(/{{selectedYear}}/g, year)

  generatePdf(finalHtml)
}

// HTML template string
const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Letterhead</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        /* Body setup */
        body {
            font-family: Arial, sans-serif;
            max-width: 21cm;
            margin: 0 auto;
            background: white;
            position: relative;
        }
        
        /* Letterhead container */
        .letterhead {
            width: 100%;
            min-height: 100vh;
            padding: 3cm 0; /* Space for header and footer */
            position: relative;
        }
        
        /* Header & Footer */
        .header, .footer {
            position: fixed;
            width: 21cm;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            z-index: 1000;
            height: 3cm;
        }
        
        /* Header styles */
        .header {
            top: 0;
            border-bottom: 1px solid #ccc;
        }
        
        /* Footer styles */
        .footer {
            bottom: 0;
            border-top: 1px solid #ccc;
        }
        
        /* Images in header & footer */
        .header img, .footer img {
            width: 100%;
            max-width: 100%;
            height: auto;
        }
        
        /* Content area */
        .content {
            position: relative;
            width: 100%;
            max-width: 17cm;
            margin: 0 auto;
            padding: 0 2cm; /* Horizontal padding only */
            z-index: 1;
            background: white;
            /* Ensure content does not overlap with header and footer */
            padding-top: 3cm; /* Space for header */
            padding-bottom: 3cm; /* Space for footer */
        }
        
        /* Page settings */
        @page {
            size: A4;
            margin: 0;
        }
        
        @media print {
            body {
                margin: 0;
            }
        
            .letterhead {
                padding: 3cm 0;
            }
        
            .header, .footer {
                position: fixed;
                width: 21cm;
            }
        
            .content {
                margin: 0 auto;
                padding: 3cm 2cm; /* Adjusted padding for print */
            }
        
            .header {
                top: 0;
            }
        
            .footer {
                bottom: 0;
            }
        }
    </style>
</head>
<body>
    <div class="letterhead">
        <div class="header">
            <img src="/images/header.png" alt="Header Image">
        </div>
        <div class="content">
            sebbycakes
        </div>
        <div class="footer">
            <img src="/images/footer.png" alt="Footer Image">
        </div>
    </div>
</body>
</html>`
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