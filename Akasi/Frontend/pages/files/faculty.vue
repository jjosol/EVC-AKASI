<script setup>
definePageMeta({
  layout: 'custom',
  middleware: 'auth', // Reference your middleware here
})

// import { ref, computed } from 'vue';

// Reactive state using ref
const searchQuery = ref('');
const sortByGrade = ref(false);

// Students data stored as a ref
//fix when connecting with the db
const students = ref([ 
  { id: 1, name: 'John J. Josol', grade: '11 A' },
  { id: 2, name: 'Fiona Nadine G. Macalalag', grade: '11 C' },
  { id: 3, name: 'Sebastian Theo S. Ong', grade: '11 C' },
  { id: 4, name: 'John A. Josol', grade: '11 A' },
  { id: 5, name: 'Fiona Nadine B. Macalalag', grade: '11 C' },
  { id: 6, name: 'Sebastian Theo C. Ong', grade: '11 C' },
  { id: 7, name: 'John D. Josol', grade: '11 A' }
]);

// Computed property for filtering and sorting
const filteredAndSortedStudents = computed(() => {
  let result = students.value;

  // Filter based on search query
  if (searchQuery.value) {
    result = result.filter(student =>
      student.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  };
});
//   // Sort by grade if sortByGrade is true
//   if (sortByGrade.value) {
//     result = result.sort((a, b) => (a.grade > b.grade ? 1 : -1));
//   }

//   return result;
// });

// // Function to toggle sorting by grade
// const toggleSort = () => {
//   sortByGrade.value = !sortByGrade.value;
// };

// Function to navigate to student's files
//logic: a vue file that basically changes items inside each time a new student is clicked 
const goToStudentFiles = (id) => {
  // Implement navigation logic here
  alert(`Navigating to files of student ID: ${id}`);
};

</script>

<template>
    <NuxtLayout>
        <div class="flex items-center justify-center student-list">
            <h1>FACULTY LIST</h1>
        </div>
    </NuxtLayout>
    
</template>
  