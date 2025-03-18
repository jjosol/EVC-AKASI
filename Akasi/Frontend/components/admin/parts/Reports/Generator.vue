<template>
  <div class="w-4/6 p-6 mx-auto text-[#2f4a71]">
    <h2 class="mt-1 text-3xl font-bold text-left">Report Generator</h2>

    <!-- Tabs for Monthly and Annual -->
    <div class="flex justify-end mb-6 border-b border-gray-300">
      <button 
        @click="selectedPeriod = 'monthly'"
        :class="{'text-blue-600 border-b-2 border-blue-600': selectedPeriod === 'monthly'}"
        class="px-4 py-2 font-semibold text-gray-600">
        Monthly
      </button>
      <button 
        @click="selectedPeriod = 'yearly'"
        :class="{'text-blue-600 border-b-2 border-blue-600': selectedPeriod === 'yearly'}"
        class="px-4 py-2 font-semibold text-gray-600">
        Annual
      </button>
    </div>
    <div class="w-11/12 text-[#2f4a71] ml-auto gap-y-10">

      <!-- Date Selection -->
      <div class="grid grid-cols-6 gap-4 mb-20">
        <div v-if="selectedPeriod=='monthly'" class="col-span-2">
          <label class="block mb-2 font-semibold">Month</label>
          <div class="flex items-center space-x-2">
            <select v-model="startMonth" class="w-full p-2">
              <option v-for="(month, index) in months" :key="index" :value="index">{{ month }}</option>
            </select>
            <span class="text-lg">-</span>
            <select v-model="endMonth" class="w-full p-2">
              <option v-for="(month, index) in months" :key="index" :value="index">{{ month }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block mb-2 font-semibold">Year</label>
          <select v-model="selectedYear" class="w-full p-2">
            <option v-for="year in years" :key="year" :value="year">{{year}}</option>
          </select>
        </div>
      </div>

      <!-- Category and Disease Type -->
      <div class="grid grid-cols-2 gap-10 mb-20">
        <div class="p-4">
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

        <div class="p-4">
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

        <div class="p-4">
          <h3 class="mb-2 text-xl font-semibold">Fatality Rate</h3>
          <div class="pt-3 space-y-5">
            <label class="items-center block">
              <input type="checkbox" class="form-checkbox accent-[#2f4a71]" />
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

<script setup>
import { ref } from 'vue'
import moment from 'moment-timezone'

const timezone = "Asia/Manila"
const currentYear = moment().tz(timezone).year()
const selectedYear = ref(currentYear)
const startMonth = ref(moment().tz(timezone).month())
const endMonth = ref(moment().tz(timezone).month())
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
    a.download = `report-${months.value[startMonth.value]}-${months.value[endMonth.value]}-${selectedYear.value}.pdf`
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
  const startMonthName = months.value[startMonth.value]
  const endMonthName = months.value[endMonth.value]
  const year = selectedYear.value
  const period = selectedPeriod.value

  const finalHtml = html
    .replace(/{{startMonth}}/g, startMonthName)
    .replace(/{{endMonth}}/g, endMonthName)
    .replace(/{{selectedYear}}/g, year)

  generatePdf(finalHtml)
}

// HTML template string
const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PSHS-EVC Health Services Report</title>` + `
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
            color: #333;
            line-height: 1.4;
        }
        
        /* Header & Footer */
        .header, .footer {
            position: fixed;
            width: 21cm;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            z-index: 1000;
        }
        
        /* Header styles */
        .header {
            top: 0;
            border-bottom: 1px solid #ccc;
            height: 3cm;
        }
        
        /* Footer styles */
        .footer {
            bottom: 0;
            border-top: 1px solid #ccc;
            height: 2cm;
        }
        
        /* Images in header & footer */
        .header img, .footer img {
            width: 100%;
            max-width: 100%;
            height: auto;
        }
        
        /* Content area - critical fix for overflow */
        .content {
            margin: 0 auto;
            width: 100%;
            max-width: 17cm;
            padding: 0 1cm;
            /* Ensure content does not go behind header/footer */
            padding-top: 3.5cm;
            padding-bottom: 2.5cm;
            background: white;
        }
        
        /* Heading styles */
        h2 {
            font-size: 14px;
            margin-bottom: 5px;
            text-align: center;
            color: #003366;
        }
        
        h3 {
            font-size: 12px;
            margin: 10px 0 5px 0;
            color: #003366;
        }
        
        /* Table styles - COMPACTED */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        th, td {
            border: 1px solid #ccc;
            padding: 4px 6px; /* Reduced padding for more compact cells */
            text-align: center;
            font-size: 10px; /* Reduced font size */
        }
        
        th {
            background-color: #f0f5fa;
            color: #003366;
            font-weight: bold;
        }
        
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        tr:hover {
            background-color: #f0f7ff;
        }
        
        /* Total row styling */
        tr:last-child {
            font-weight: bold;
            background-color: #eef4fa;
        }
        
        /* Color styles */
        .blue {
            color: #0066cc;
        }
        
        .highlight {
            color: #cc0000;
            font-weight: bold;
        }
        
        /* Paragraphs */
        p {
            margin-bottom: 10px;
            text-align: justify;
            font-size: 11px;
        }
        
        /* Reduce spaces between sections */
        .section, .conclusion {
            margin-bottom: 10px;
        }

        .conclusion {
            page-break-inside: avoid;
            margin-bottom: 0; /* Remove bottom margin */
        }
        
        /* Page settings */
        @page {
            size: A4;
            margin: 0;
        }
        
        @media print {
            .header {
                position: fixed;
                top: 0;
            }
            
            .footer {
                position: fixed;
                bottom: 0;
            }
            
            .content {
                margin-top: 3cm;
                margin-bottom: 2cm;
            }
            
            h3 {
                page-break-after: avoid;
            }
            
            table {
                page-break-inside: avoid;
            }
        }
    </style>` + `
</head>
<body>
    <div class="header">
        <img src="/images/header.png" alt="Header Image">
    </div>
    
    ` + `
    <div class="content">
        <h2>SUMMARY OF PERCENTAGE OF THE PSHS-EVC COMMUNITY THAT ACQUIRED ILLNESSES</h2>
        <h2>({{startMonth}} - {{endMonth}} {{selectedYear}})</h2>

        <div class="section">
            <h3>Students</h3>
            <table>
                <tr>
                    <th rowspan="2">Month</th>
                    <th colspan="3">Male</th>
                    <th colspan="3">Female</th>
                    <th rowspan="2">Grand Total</th>
                </tr>
                <tr>
                    <th>Dormers</th>
                    <th>Externs</th>
                    <th>Total</th>
                    <th>Dormers</th>
                    <th>Externs</th>
                    <th>Total</th>
                </tr>
                <tr>
                    <td>July</td>
                    <td>0</td>
                    <td>0</td>
                    <td class="blue">0</td>
                    <td>0</td>
                    <td>0</td>
                    <td class="blue">0</td>
                    <td>0</td>
                </tr>
                <tr>
                    <td>August</td>
                    <td>1</td>
                    <td>1</td>
                    <td class="blue">2</td>
                    <td>0</td>
                    <td>7</td>
                    <td class="blue">9</td>
                    <td>9</td>
                </tr>
                <tr>
                    <td>September</td>
                    <td>1</td>
                    <td>1</td>
                    <td class="blue">2</td>
                    <td>2</td>
                    <td>7</td>
                    <td class="blue">11</td>
                    <td>11</td>
                </tr>
                <tr>
                    <td>October</td>
                    <td>3</td>
                    <td>0</td>
                    <td class="blue">3</td>
                    <td>0</td>
                    <td>1</td>
                    <td class="blue">4</td>
                    <td>4</td>
                </tr>
                <tr>
                    <td>November</td>
                    <td>7</td>
                    <td>0</td>
                    <td class="blue">7</td>
                    <td>2</td>
                    <td>5</td>
                    <td class="blue">14</td>
                    <td>14</td>
                </tr>
                <tr>
                    <td>December</td>
                    <td>3</td>
                    <td>2</td>
                    <td class="blue">9</td>
                    <td>9</td>
                    <td>4</td>
                    <td class="blue">22</td>
                    <td>22</td>
                </tr>
                <tr>
                    <td><b>Total</b></td>
                    <td>14</td>
                    <td>3</td>
                    <td class="highlight">17</td>
                    <td>21</td>
                    <td>24</td>
                    <td class="blue">59</td>
                    <td class="highlight">59</td>
                </tr>
            </table>
        </div>
        
        <div class="section">
            <h3>Fatality Rate - Students</h3>
            <table>
                <tr>
                    <th rowspan="2">Month</th>
                    <th colspan="3">Male</th>
                    <th colspan="3">Female</th>
                    <th rowspan="2">Grand Total</th>
                </tr>
                <tr>
                    <th>Dormers</th>
                    <th>Externs</th>
                    <th>Total</th>
                    <th>Dormers</th>
                    <th>Externs</th>
                    <th>Total</th>
                </tr>
                <tr>
                    <td>July</td>
                    <td>0</td>
                    <td>0</td>
                    <td class="blue">0</td>
                    <td>0</td>
                    <td>0</td>
                    <td class="blue">0</td>
                    <td>0</td>
                </tr>
                <tr>
                    <td>August</td>
                    <td>1</td>
                    <td>1</td>
                    <td class="blue">2</td>
                    <td>0</td>
                    <td>7</td>
                    <td class="blue">9</td>
                    <td>9</td>
                </tr>
                <tr>
                    <td>September</td>
                    <td>1</td>
                    <td>1</td>
                    <td class="blue">2</td>
                    <td>2</td>
                    <td>7</td>
                    <td class="blue">11</td>
                    <td>11</td>
                </tr>
                <tr>
                    <td>October</td>
                    <td>3</td>
                    <td>0</td>
                    <td class="blue">3</td>
                    <td>0</td>
                    <td>1</td>
                    <td class="blue">4</td>
                    <td>4</td>
                </tr>
                <tr>
                    <td>November</td>
                    <td>7</td>
                    <td>0</td>
                    <td class="blue">7</td>
                    <td>2</td>
                    <td>5</td>
                    <td class="blue">14</td>
                    <td>14</td>
                </tr>
                <tr>
                    <td>December</td>
                    <td>3</td>
                    <td>2</td>
                    <td class="blue">9</td>
                    <td>9</td>
                    <td>4</td>
                    <td class="blue">22</td>
                    <td>22</td>
                </tr>
                <tr>
                    <td><b>Total</b></td>
                    <td>14</td>
                    <td>3</td>
                    <td class="highlight">17</td>
                    <td>21</td>
                    <td>24</td>
                    <td class="blue">59</td>
                    <td class="highlight">59</td>
                </tr>
            </table>
        </div>` + `

        <div class="conclusion">
            <h3>Conclusion</h3>
            <p>Out of the n_total scholars of PSHS-EVC, n_gross referred to the HSU from {{startMonth}} to {{endMonth}} {{selectedYear}}. 
              Moreover, the diagram shows that from {{startMonth}} to {{endMonth}}, female students are more likely to be vulnerable 
              to illness than males; it also showed that in December, the number of cases significantly increased as 
              reported, followed by September and October, and the least number was November. One of the contributing 
              factors to this number of cases is the high humidity during that month.</p>
        </div>
    </div>
    
    <div class="footer">
        <img src="/images/footer.png" alt="Footer Image">
    </div>
</body>
</html>`
</script>