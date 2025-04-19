import { ref } from 'vue';

export function useReportData() {
  const loading = ref(false);
  const error = ref(null);

  // Fetch illness summary data
  const fetchIllnessSummary = async (startMonth: string, endMonth: string, year: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch(`/api/reports/illness-summary?startMonth=${startMonth}&endMonth=${endMonth}&year=${year}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error fetching illness summary data');
      }
      
      return data;
    } catch (err: any) {
      console.error('Error fetching illness summary:', err);
      error.value = err.message || 'Error fetching illness summary data';
      return null;
    } finally {
      loading.value = false;
    }
  };
  
  // Fetch consultation monitoring data
  const fetchConsultationMonitoring = async (startMonth: string, endMonth: string, year: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch(`/api/reports/monitoring?startMonth=${startMonth}&endMonth=${endMonth}&year=${year}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error fetching consultation monitoring data');
      }
      
      return data;
    } catch (err: any) {
      console.error('Error fetching consultation monitoring:', err);
      error.value = err.message || 'Error fetching consultation monitoring data';
      return null;
    } finally {
      loading.value = false;
    }
  };
  
  // Fetch common illnesses and interventions data
  const fetchCommonIllnesses = async (startMonth: string, endMonth: string, startYear: string, endYear?: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const url = `/api/reports/common-illnesses?startMonth=${startMonth}&endMonth=${endMonth}&startYear=${startYear}${endYear ? `&endYear=${endYear}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error fetching common illnesses data');
      }
      
      return data.data;
    } catch (err: any) {
      console.error('Error fetching common illnesses:', err);
      error.value = err.message || 'Error fetching common illnesses data';
      return null;
    } finally {
      loading.value = false;
    }
  };
  
  // Generate PDF report with all data
  const generateReport = async (startMonth: string, endMonth: string, startYear: string, endYear?: string) => {
    const endYearValue = endYear || startYear;
    
    loading.value = true;
    error.value = null;
    
    try {
      // Fetch all necessary data
      const illnessSummary = await fetchIllnessSummary(startMonth, endMonth, startYear);
      const consultations = await fetchConsultationMonitoring(startMonth, endMonth, startYear);
      const commonIllnesses = await fetchCommonIllnesses(startMonth, endMonth, startYear, endYearValue);
      
      // Format the date range for display
      const dateRange = endYear && startYear !== endYear 
        ? `${startMonth} ${startYear} to ${endMonth} ${endYearValue}` 
        : `${startMonth} to ${endMonth} ${startYear}`;
      
      // Prepare report data
      const reportData = {
        dateRange,
        selectedMonths: extractMonthNames(illnessSummary.months),
        illnessSummary,
        consultationRecords: consultations,
        commonIllnesses
      };
      
      return reportData;
    } catch (err: any) {
      console.error('Error generating report:', err);
      error.value = err.message || 'Error generating report';
      return null;
    } finally {
      loading.value = false;
    }
  };
  
  // Helper function to extract month names
  const extractMonthNames = (months) => {
    return months.map(month => month.month);
  };
  
  return {
    loading,
    error,
    fetchIllnessSummary,
    fetchConsultationMonitoring,
    fetchCommonIllnesses,
    generateReport
  };
}