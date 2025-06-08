// Composable to provide access to calendar service
import { ref } from "vue";
import * as calendarServiceFunctions from "~/services/calendarService";

export function useCalendarService() {
  // Store any calendar-related state here
  const loading = ref(false);
  const error = ref(null);

  // Wrap the service functions with error handling and state management
  const fetchConfinedCount = async (year, month) => {
    loading.value = true;
    error.value = null;
    
    try {
      return await calendarServiceFunctions.fetchConfinedCount(year, month);
    } catch (err) {
      console.error("Error in fetchConfinedCount:", err);
      error.value = err;
      return 0;
    } finally {
      loading.value = false;
    }
  };

  const fetchMonthlyConsultationCount = async (year, month) => {
    loading.value = true;
    error.value = null;
    
    try {
      return await calendarServiceFunctions.fetchMonthlyConsultationCount(year, month);
    } catch (err) {
      console.error("Error in fetchMonthlyConsultationCount:", err);
      error.value = err;
      return 0;
    } finally {
      loading.value = false;
    }
  };

  const fetchYearlyConsultationCount = async (year) => {
    loading.value = true;
    error.value = null;
    
    try {
      return await calendarServiceFunctions.fetchYearlyConsultationCount(year);
    } catch (err) {
      console.error("Error in fetchYearlyConsultationCount:", err);
      error.value = err;
      return 0;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    fetchConfinedCount,
    fetchMonthlyConsultationCount,
    fetchYearlyConsultationCount
  };
}
