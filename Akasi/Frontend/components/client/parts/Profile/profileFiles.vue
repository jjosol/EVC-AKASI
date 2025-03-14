<template>
    <div class="bg-white shadow-md rounded-xl overflow-hidden mt-5">
        <div class="tabs-container">
            <!-- Tab Navigation -->
            <div class="tab-nav">
            <button 
                @click="activeTab = 'tab1'" 
                :class="['tab-button', activeTab === 'tab1' ? 'active' : '']"
            >
                Enrollment Files
            </button>
            <button 
                @click="activeTab = 'tab2'" 
                :class="['tab-button', activeTab === 'tab2' ? 'active' : '']"
            >
                Consultation Records
            </button>
            </div>
            
            
            <div class="tab-content">

                <!-- Enrollment Files -->
                <div v-if="activeTab === 'tab1'" class="tab-panel">
                    <div class="p-6 border-b border-gray-100">
                        <div class="flex items-center justify-between">
                        
                        <!-- Dropdown Select -->
                        <div class="relative inline-block text-left">
                            <div>
                            <button @click="isOpen = !isOpen" type="button" class="inline-flex justify-between items-center w-56 rounded-md border border-gray-200 px-4 py-2 bg-white text-sm font-medium text-[#2f4a71] hover:bg-[#f8f4ff] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2f4a71]">
                                {{ selectedGrade || 'Select Grade' }}
                                <svg class="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>
                            </div>

                            <div v-if="isOpen" class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-10 max-h-20 overflow-y-auto">
                                <div class="py-1">
                                    <a v-for="grade in grades" :key="grade" 
                                    @click="selectGrade(grade)" 
                                    class="block px-4 py-2 text-sm cursor-pointer hover:bg-[#f8f4ff]"
                                    :class="selectedGrade === grade ? 'bg-[#f8f4ff] text-[#2f4a71] font-medium' : 'text-gray-700'">
                                    {{ grade }}
                                    </a>
                                </div>
                            </div>
                        </div>

                        <button @click="openModal" class="p-1 pl-3 pr-3 font-bold text-white bg-[#2f4a71] rounded hover:bg-[#8b67db]">Add Files</button>
                    </div>

                </div>

                <span class="text-[#2f4a71]"> </span>
            </div>

            <!-- Tab 2 Content -->
            <div v-if="activeTab === 'tab2'" class="tab-panel">
                <h2>Tab 2 Content</h2>
                <p>This is the content for the second tab.</p>
                <!-- Add your tab 2 content here -->
            </div>
        </div>
    </div>


    <!-- Files Grid - Shows after grade selection -->
    <div v-if="selectedGrade" class="p-6">

    </div>

    <!-- No Grade Selected State -->
    <div v-else class="p-6 text-center">
        <div class="p-8">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
        <p class="mt-4 text-gray-500">Please select a grade to view available files</p>
        </div>
    </div>
</div>

<!-- Modal Backdrop -->
<div 
    v-if="showModal" 
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeModal()"
>
    <!-- Modal Container -->
    <div name="showModal" class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">

    <!-- Modal Header -->
    <div class="flex justify-between items-center p-4 border-b">
        <h3 class="text-lg font-medium text-gray-900">Modal Title</h3>
        <button 
        @click="closeModal" 
        class="text-gray-400 hover:text-gray-500 focus:outline-none"
        >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        </button>
    </div>
    
    <!-- Modal Body - Empty Content Area -->
    <div class="p-6">
        <!-- Your content goes here -->
    </div>
    
    <!-- Modal Footer -->
    <div class="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse bg-gray-50">
        <button 
        @click="closeModal" 
        class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-500 text-base font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
        >
        Close
        </button>
    </div>
    </div>
</div>
</template>
    
<script setup>
import { ref } from 'vue'
const activeTab = ref('tab1')

const showModal = ref(false);
const grades = [
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
    'Grade 11',
    'Grade 12'
]

const isOpen = ref(false)
const selectedGrade = ref('')

// Example files data - you would replace this with actual data
const files = {
    'Grade 7': [
    { id: 1, name: 'Mathematics Syllabus', size: '1.2 MB' },
    { id: 2, name: 'Science Handbook', size: '2.4 MB' },
    { id: 3, name: 'English Workbook', size: '3.1 MB' }
    ],
    'Grade 8': [
    { id: 4, name: 'Algebra Guide', size: '1.8 MB' },
    { id: 5, name: 'Biology Notes', size: '2.2 MB' },
    { id: 6, name: 'Literature Review', size: '1.5 MB' }
    ],
    'Grade 9': [
    { id: 7, name: 'Geometry Textbook', size: '4.2 MB' },
    { id: 8, name: 'Chemistry Lab Guide', size: '1.9 MB' }
    ],
    'Grade 10': [
    { id: 9, name: 'Physics Formula Sheet', size: '0.8 MB' },
    { id: 10, name: 'History Timeline', size: '2.6 MB' }
    ],
    'Grade 11': [
    { id: 11, name: 'Calculus Problems', size: '3.4 MB' },
    { id: 12, name: 'Economics Guide', size: '2.1 MB' }
    ],
    'Grade 12': [
    { id: 13, name: 'Statistics Handbook', size: '2.7 MB' },
    { id: 14, name: 'Research Methods', size: '4.5 MB' }
    ]
}

const filesForSelectedGrade = ref([])

// Close dropdown when clicking outside
function handleClickOutside(event) {
    if (isOpen.value && !event.target.closest('.relative')) {
    isOpen.value = false
    }
}

document.addEventListener('click', handleClickOutside)

// Handle grade selection
function selectGrade(grade) {
    selectedGrade.value = grade
    filesForSelectedGrade.value = files[grade] || []
    isOpen.value = false
}

//Modal
function openModal() {
    showModal.value = true;
    document.body.classList.add('overflow-hidden');
}

function closeModal() {
    showModal.value = false;
    document.body.classList.remove('overflow-hidden');
}
</script>

<style scoped>
.tabs-container {
width: 100%;
margin: 0 auto;
}

.tab-nav {
display: flex;
border-bottom: 1px solid #ccc;
margin-bottom: 20px;
}

.tab-button {
padding: 10px 20px;
background: none;
border: none;
cursor: pointer;
font-size: 16px;
border-bottom: 3px solid transparent;
transition: all 0.3s ease;
}

.tab-button:hover {
background-color: #f5f5f5;
}

.tab-button.active {
border-bottom-color: #333;
font-weight: bold;
}

.tab-content {
padding: 20px 0;
}

.tab-panel {
animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
from { opacity: 0; }
to { opacity: 1; }
}
</style>
