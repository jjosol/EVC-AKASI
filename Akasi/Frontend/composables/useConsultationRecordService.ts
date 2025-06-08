// Composable to provide access to consultation record service
import { ref } from "vue";
import * as consultationRecordServiceFunctions from "~/services/consultationRecordService";

export function useConsultationRecordService() {
  const loading = ref(false);
  const error = ref(null);

  // Wrap functions with error handling and loading state
  const fetchConsultationRecords = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      return await consultationRecordServiceFunctions.fetchConsultationRecords();
    } catch (err) {
      console.error("Error in fetchConsultationRecords:", err);
      error.value = err;
      return [];
    } finally {
      loading.value = false;
    }
  };

  // Add other wrapped functions as needed

  return {
    loading,
    error,
    fetchConsultationRecords,
    // Export other functions as needed
    ...consultationRecordServiceFunctions
  };
}
