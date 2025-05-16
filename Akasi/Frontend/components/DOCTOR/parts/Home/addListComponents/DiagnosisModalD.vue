<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="w-full max-w-3xl p-6 bg-white rounded-lg max-h-[90vh] overflow-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-[#2f4a71]">Diagnosis Management</h3>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">
          <Icon icon="mdi:close" class="w-6 h-6" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex mb-4 border-b border-gray-200">
        <button 
          @click="activeTab = 'diagnoses'" 
          class="px-4 py-2 text-sm font-medium border-b-2" 
          :class="activeTab === 'diagnoses' ? 'border-[#2f4a71] text-[#2f4a71]' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Diagnoses
        </button>
        <button 
          @click="activeTab = 'categories'" 
          class="px-4 py-2 ml-4 text-sm font-medium border-b-2" 
          :class="activeTab === 'categories' ? 'border-[#2f4a71] text-[#2f4a71]' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          Categories
        </button>
      </div>

      <!-- Diagnoses Tab -->
      <div v-if="activeTab === 'diagnoses'" class="mb-4">
        <div class="flex justify-between mb-4">
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="Search diagnoses..."
            class="flex-1 px-4 py-2 mr-2 border border-gray-300 rounded-md"
          />
          <button 
            @click="openAddDiagnosisModal"
            class="px-4 py-2 text-white bg-[#2f4a71] rounded-md hover:bg-[#1d3050]"
          >
            Add New Diagnosis
          </button>
        </div>

        <!-- List of diagnoses grouped by category -->
        <div v-if="isLoading" class="py-4 text-center">
          <p>Loading diagnoses...</p>
        </div>
        <div v-else class="space-y-4">
          <div v-for="(category, categoryId) in groupedDiagnoses" :key="categoryId" class="overflow-hidden border border-gray-200 rounded-md">
            <div class="flex items-center justify-between px-4 py-2 bg-gray-50">
              <h4 class="font-medium text-gray-700">{{ getCategoryName(categoryId) }}</h4>
              <span class="px-2 py-1 text-xs text-gray-700 bg-gray-200 rounded-full">
                {{ category.length }} diagnoses
              </span>
            </div>
            <div class="divide-y divide-gray-200">
              <div 
                v-for="diagnosis in filteredDiagnosesByCategory(categoryId)" 
                :key="diagnosis.diagnosis_id" 
                class="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <div>
                  <p class="font-medium">{{ diagnosis.name }}</p>
                  <p class="text-xs text-gray-500">
                    Status: 
                    <span :class="diagnosis.active ? 'text-green-600' : 'text-red-600'">
                      {{ diagnosis.active ? 'Active' : 'Inactive' }}
                    </span>
                  </p>
                </div>
                <div class="flex space-x-2">
                  <button 
                    @click="toggleDiagnosisStatus(diagnosis)"
                    class="p-1 text-gray-500 rounded-md hover:bg-gray-200"
                    :title="diagnosis.active ? 'Deactivate' : 'Activate'"
                  >
                    <Icon :icon="diagnosis.active ? 'mdi:eye-off' : 'mdi:eye'" class="w-5 h-5" />
                  </button>
                  <button 
                    @click="editDiagnosis(diagnosis)"
                    class="p-1 text-blue-600 rounded-md hover:bg-blue-50"
                    title="Edit"
                  >
                    <Icon icon="mdi:pencil" class="w-5 h-5" />
                  </button>
                  <button 
                    @click="confirmDeleteDiagnosis(diagnosis)"
                    class="p-1 text-red-600 rounded-md hover:bg-red-50"
                    title="Delete"
                  >
                    <Icon icon="mdi:delete" class="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Categories Tab -->
      <div v-if="activeTab === 'categories'" class="mb-4">
        <div class="flex justify-between mb-4">
          <input 
            v-model="categorySearchQuery"
            type="text"
            placeholder="Search categories..."
            class="flex-1 px-4 py-2 mr-2 border border-gray-300 rounded-md"
          />
          <button 
            @click="openAddCategoryModal"
            class="px-4 py-2 text-white bg-[#2f4a71] rounded-md hover:bg-[#1d3050]"
          >
            Add New Category
          </button>
        </div>

        <!-- List of categories -->
        <div v-if="isLoading" class="py-4 text-center">
          <p>Loading categories...</p>
        </div>
        <div v-else class="overflow-hidden border border-gray-200 rounded-md">
          <div class="divide-y divide-gray-200">
            <div 
              v-for="category in filteredCategories" 
              :key="category.category_id" 
              class="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div>
                <p class="font-medium">{{ category.name }}</p>
                <p class="text-xs text-gray-500">{{ category.diagnoses_count }} diagnoses</p>
              </div>
              <div class="flex space-x-2">
                <button 
                  @click="editCategory(category)"
                  class="p-1 text-blue-600 rounded-md hover:bg-blue-50"
                  title="Edit"
                >
                  <Icon icon="mdi:pencil" class="w-5 h-5" />
                </button>
                <button 
                  @click="confirmDeleteCategory(category)"
                  class="p-1 text-red-600 rounded-md hover:bg-red-50"
                  title="Delete"
                  :disabled="category.diagnoses_count > 0"
                  :class="category.diagnoses_count > 0 ? 'opacity-50 cursor-not-allowed' : ''"
                >
                  <Icon icon="mdi:delete" class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Diagnosis Form -->
      <div v-if="showDiagnosisForm" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-60">
        <div class="w-full max-w-md p-6 bg-white rounded-lg">
          <h3 class="text-lg font-bold text-[#2f4a71] mb-4">{{ editingDiagnosis ? 'Edit Diagnosis' : 'Add New Diagnosis' }}</h3>
          
          <div class="mb-4">
            <label class="block mb-1 text-sm font-medium text-gray-700">Name</label>
            <input
              v-model="diagnosisForm.name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter diagnosis name"
            />
          </div>

          <div class="mb-4">
            <label class="block mb-1 text-sm font-medium text-gray-700">Category</label>
            <select
              v-model="diagnosisForm.category_id"
              class="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option disabled value="">Select a category</option>
              <option v-for="category in categories" :key="category.category_id" :value="category.category_id">
                {{ category.name }}
              </option>
            </select>
          </div>

          <div class="flex justify-end space-x-3">
            <button
              @click="closeDiagnosisForm"
              class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              @click="saveDiagnosis"
              class="px-4 py-2 text-white bg-[#2f4a71] rounded-md hover:bg-[#1d3050]"
              :disabled="isSaving"
            >
              {{ isSaving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Add/Edit Category Form -->
      <div v-if="showCategoryForm" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-60">
        <div class="w-full max-w-md p-6 bg-white rounded-lg">
          <h3 class="text-lg font-bold text-[#2f4a71] mb-4">{{ editingCategory ? 'Edit Category' : 'Add New Category' }}</h3>
          
          <div class="mb-4">
            <label class="block mb-1 text-sm font-medium text-gray-700">Name</label>
            <input
              v-model="categoryForm.name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter category name"
            />
          </div>

          <div class="flex justify-end space-x-3">
            <button
              @click="closeCategoryForm"
              class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              @click="saveCategory"
              class="px-4 py-2 text-white bg-[#2f4a71] rounded-md hover:bg-[#1d3050]"
              :disabled="isSaving"
            >
              {{ isSaving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Confirmation modal -->
      <div v-if="showConfirmation" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-70">
        <div class="w-full max-w-md p-6 bg-white rounded-lg">
          <h3 class="mb-4 text-lg font-bold text-red-600">{{ confirmationTitle }}</h3>
          <p class="mb-6">{{ confirmationMessage }}</p>
          
          <div class="flex justify-end space-x-3">
            <button
              @click="cancelConfirmation"
              class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              @click="confirmAction"
              class="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              :disabled="isDeleting"
            >
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { Icon } from '@iconify/vue';
import * as consultationRecordService from '~/services/consultationRecordService';
import { useProfile } from '~/composables/useProfile';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['close', 'update']);

// State management
const activeTab = ref('diagnoses');
const searchQuery = ref('');
const categorySearchQuery = ref('');
const isLoading = ref(true);
const isSaving = ref(false);
const isDeleting = ref(false);

// Diagnoses and categories data
const diagnoses = ref([]);
const categories = ref([]);

// Grouped diagnoses by category
const groupedDiagnoses = computed(() => {
  const grouped = {};
  
  diagnoses.value.forEach(diagnosis => {
    const categoryId = diagnosis.category_id || 'uncategorized';
    if (!grouped[categoryId]) {
      grouped[categoryId] = [];
    }
    grouped[categoryId].push(diagnosis);
  });
  
  return grouped;
});

// Form handling
const showDiagnosisForm = ref(false);
const showCategoryForm = ref(false);
const editingDiagnosis = ref(false);
const editingCategory = ref(false);
const diagnosisForm = ref({
  name: '',
  category_id: '',
  active: true
});
const categoryForm = ref({
  name: ''
});

// Confirmation modal
const showConfirmation = ref(false);
const confirmationTitle = ref('');
const confirmationMessage = ref('');
const pendingAction = ref(null);
const itemToDelete = ref(null);

// Get user profile for creating diagnoses
const { profile } = useProfile();
const currentUserId = computed(() => {
  if (!profile.value) return 1;
  return profile.value.doctor_id || 1;
});

// Fetch diagnoses and categories
const fetchData = async () => {
  try {
    isLoading.value = true;
    const [diagnosesData, categoriesData] = await Promise.all([
      consultationRecordService.fetchDiseases(),
      consultationRecordService.fetchDiseaseCategories()
    ]);
    diagnoses.value = diagnosesData;
    categories.value = categoriesData;
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    isLoading.value = false;
  }
};

// Filter diagnoses by category with search
const filteredDiagnosesByCategory = (categoryId) => {
  if (!searchQuery.value) {
    return groupedDiagnoses.value[categoryId] || [];
  }
  
  const query = searchQuery.value.toLowerCase();
  return (groupedDiagnoses.value[categoryId] || []).filter(diagnosis =>
    diagnosis.name.toLowerCase().includes(query)
  );
};

// Filter categories
const filteredCategories = computed(() => {
  if (!categorySearchQuery.value) {
    return categories.value;
  }
  
  const query = categorySearchQuery.value.toLowerCase();
  return categories.value.filter(category =>
    category.name.toLowerCase().includes(query)
  );
});

// Get category name by ID
const getCategoryName = (categoryId) => {
  if (categoryId === 'uncategorized') return 'Uncategorized';
  const category = categories.value.find(c => c.category_id == categoryId);
  return category ? category.name : 'Unknown';
};

// Toggle diagnosis active status
const toggleDiagnosisStatus = async (diagnosis) => {
  try {
    await consultationRecordService.toggleDiagnosisStatus(diagnosis.diagnosis_id);
    diagnosis.active = !diagnosis.active;
  } catch (error) {
    console.error('Error toggling diagnosis status:', error);
    alert('Failed to update diagnosis status');
  }
};

// Open add diagnosis form
const openAddDiagnosisModal = () => {
  editingDiagnosis.value = false;
  diagnosisForm.value = {
    name: '',
    category_id: categories.value.length > 0 ? categories.value[0].category_id : '',
    active: true
  };
  showDiagnosisForm.value = true;
};

// Open edit diagnosis form
const editDiagnosis = (diagnosis) => {
  editingDiagnosis.value = true;
  diagnosisForm.value = {
    diagnosis_id: diagnosis.diagnosis_id,
    name: diagnosis.name,
    category_id: diagnosis.category_id,
    active: diagnosis.active
  };
  showDiagnosisForm.value = true;
};

// Open add category form
const openAddCategoryModal = () => {
  editingCategory.value = false;
  categoryForm.value = {
    name: ''
  };
  showCategoryForm.value = true;
};

// Open edit category form
const editCategory = (category) => {
  editingCategory.value = true;
  categoryForm.value = {
    category_id: category.category_id,
    name: category.name
  };
  showCategoryForm.value = true;
};

// Close diagnosis form
const closeDiagnosisForm = () => {
  showDiagnosisForm.value = false;
};

// Close category form
const closeCategoryForm = () => {
  showCategoryForm.value = false;
};

// Save diagnosis
const saveDiagnosis = async () => {
  try {
    if (!diagnosisForm.value.name) {
      alert('Please enter a diagnosis name');
      return;
    }
    
    if (!diagnosisForm.value.category_id) {
      alert('Please select a category');
      return;
    }
    
    isSaving.value = true;
    
    if (editingDiagnosis.value) {
      // Update existing diagnosis
      await consultationRecordService.updateDisease(
        diagnosisForm.value.diagnosis_id, 
        {
          name: diagnosisForm.value.name,
          category_id: diagnosisForm.value.category_id,
          active: diagnosisForm.value.active
        }
      );
    } else {
      // Create new diagnosis
      await consultationRecordService.createDisease({
        name: diagnosisForm.value.name,
        category_id: diagnosisForm.value.category_id,
        created_by: currentUserId.value,
        active: true
      });
    }
    
    // Refresh data
    await fetchData();
    showDiagnosisForm.value = false;
    emit('update');
  } catch (error) {
    console.error('Error saving diagnosis:', error);
    alert(`Failed to save diagnosis: ${error.message || 'Unknown error'}`);
  } finally {
    isSaving.value = false;
  }
};

// Save category
const saveCategory = async () => {
  try {
    if (!categoryForm.value.name) {
      alert('Please enter a category name');
      return;
    }
    
    isSaving.value = true;
    
    if (editingCategory.value) {
      // Update existing category
      await consultationRecordService.updateDiseaseCategory(
        categoryForm.value.category_id, 
        { name: categoryForm.value.name }
      );
    } else {
      // Create new category
      await consultationRecordService.createDiseaseCategory({
        name: categoryForm.value.name
      });
    }
    
    // Refresh data
    await fetchData();
    showCategoryForm.value = false;
    emit('update');
  } catch (error) {
    console.error('Error saving category:', error);
    alert(`Failed to save category: ${error.message || 'Unknown error'}`);
  } finally {
    isSaving.value = false;
  }
};

// Delete confirmation handlers
const confirmDeleteDiagnosis = (diagnosis) => {
  confirmationTitle.value = 'Delete Diagnosis';
  confirmationMessage.value = `Are you sure you want to delete "${diagnosis.name}"? This action cannot be undone.`;
  pendingAction.value = 'deleteDiagnosis';
  itemToDelete.value = diagnosis;
  showConfirmation.value = true;
};

const confirmDeleteCategory = (category) => {
  if (category.diagnoses_count > 0) {
    alert(`Cannot delete category "${category.name}" because it contains diagnoses. Please move or delete these diagnoses first.`);
    return;
  }
  
  confirmationTitle.value = 'Delete Category';
  confirmationMessage.value = `Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`;
  pendingAction.value = 'deleteCategory';
  itemToDelete.value = category;
  showConfirmation.value = true;
};

const cancelConfirmation = () => {
  showConfirmation.value = false;
  pendingAction.value = null;
  itemToDelete.value = null;
};

const confirmAction = async () => {
  try {
    isDeleting.value = true;
    
    if (pendingAction.value === 'deleteDiagnosis') {
      await consultationRecordService.deleteDisease(itemToDelete.value.diagnosis_id);
    } else if (pendingAction.value === 'deleteCategory') {
      await consultationRecordService.deleteDiseaseCategory(itemToDelete.value.category_id);
    }
    
    // Refresh data
    await fetchData();
    showConfirmation.value = false;
    emit('update');
  } catch (error) {
    console.error('Error during delete action:', error);
    alert(`Failed to delete: ${error.message || 'Unknown error'}`);
  } finally {
    isDeleting.value = false;
    pendingAction.value = null;
    itemToDelete.value = null;
  }
};

// Fetch data on component mount
onMounted(() => {
  fetchData();
});

// Watch for show prop to refresh data when modal opens
watch(() => props.show, (value) => {
  if (value) {
    fetchData();
  }
});
</script>

<style scoped>
/* Add any component-specific styles here */
</style>