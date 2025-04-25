import { get } from './apiService.js';

// Base URL for reports API endpoints
const REPORTS_URL = '/reports';

/**
 * Interface for Report API illness summary response
 */
interface IllnessSummaryData {
  months: Array<{
    month: string;
    students: {
      maleDormers: number;
      maleExterns: number;
      femaleDormers: number;
      femaleExterns: number;
      total: number;
    };
    faculty: {
      male: number;
      female: number;
      total: number;
    };
    staff: {
      male: number;
      female: number;
      total: number;
    };
  }>;
  totals: {
    students: {
      maleDormers: number;
      maleExterns: number;
      femaleDormers: number;
      femaleExterns: number;
      total: number;
    };
    faculty: {
      male: number;
      female: number;
      total: number;
    };
    staff: {
      male: number;
      female: number;
      total: number;
    };
  };
}

/**
 * Interface for consultation monitoring record
 */
interface ConsultationMonitoringRecord {
  clientName: string;
  gradeSection: string;
  consultationDate: string;
  clientType: string;
  remarks: string;
}

/**
 * Interface for common illnesses data
 */
interface CommonIllnessesData {
  counts: {
    students: {
      total: number;
      male: number;
      female: number;
    };
    facultyStaff: {
      total: number;
      male: number;
      female: number;
    };
  };
  diagnoses: {
    students: {
      male: string;
      female: string;
    };
    facultyStaff: {
      male: string;
      female: string;
    };
  };
}

/**
 * Fetches illness summary report data from the backend
 * 
 * @param startMonth The starting month for the report period
 * @param endMonth The ending month for the report period (optional)
 * @param year The year for the report
 * @param isYearly Whether this is a yearly report (optional)
 * @returns Promise with illness summary data
 */
export const fetchIllnessSummary = async (
  startMonth: string,
  endMonth: string | null,
  year: string,
  isYearly: boolean = false
): Promise<IllnessSummaryData> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('startMonth', startMonth);
    
    if (endMonth && endMonth !== 'null') {
      params.append('endMonth', endMonth);
    }
    
    params.append('year', year);
    
    if (isYearly) {
      params.append('yearly', 'true');
    }
    
    console.log(`Fetching illness summary data with params: ${params.toString()}`);
    return await get(`${REPORTS_URL}/illness-summary?${params.toString()}`);
  } catch (error) {
    console.error('Error fetching illness summary data:', error);
    throw error;
  }
};

/**
 * Fetches consultation monitoring data from the backend
 * 
 * @param startMonth The starting month for the report period
 * @param endMonth The ending month for the report period (optional)
 * @param year The year for the report
 * @param isYearly Whether this is a yearly report (optional)
 * @returns Promise with consultation monitoring data
 */
export const fetchConsultationMonitoring = async (
  startMonth: string,
  endMonth: string | null,
  year: string,
  isYearly: boolean = false
): Promise<ConsultationMonitoringRecord[]> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('startMonth', startMonth);
    
    if (endMonth && endMonth !== 'null') {
      params.append('endMonth', endMonth);
    }
    
    params.append('year', year);
    
    if (isYearly) {
      params.append('yearly', 'true');
    }
    
    console.log(`Fetching consultation monitoring data with params: ${params.toString()}`);
    return await get(`${REPORTS_URL}/monitoring?${params.toString()}`);
  } catch (error) {
    console.error('Error fetching consultation monitoring data:', error);
    throw error;
  }
};

/**
 * Fetches common illnesses data from the backend
 * 
 * @param startMonth The starting month for the report period
 * @param endMonth The ending month for the report period (optional)
 * @param year The year for the report
 * @param isYearly Whether this is a yearly report (optional)
 * @returns Promise with common illnesses data
 */
export const fetchCommonIllnessesData = async (
  startMonth: string,
  endMonth: string | null,
  year: string,
  isYearly: boolean = false
): Promise<CommonIllnessesData> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('startMonth', startMonth);
    
    if (endMonth && endMonth !== 'null') {
      params.append('endMonth', endMonth);
    }
    
    params.append('startYear', year);
    
    // For yearly reports, the end year could be next year (for academic year reports)
    if (isYearly) {
      const academicEndYear = (parseInt(year.split('-')[0]) + 1).toString();
      params.append('endYear', academicEndYear);
    } else {
      params.append('endYear', year);
    }
    
    console.log(`Fetching common illnesses data with params: ${params.toString()}`);
    const response = await get(`${REPORTS_URL}/common-illnesses?${params.toString()}`);
    
    return response.data || {
      counts: {
        students: { total: 0, male: 0, female: 0 },
        facultyStaff: { total: 0, male: 0, female: 0 }
      },
      diagnoses: {
        students: { male: 'No data', female: 'No data' },
        facultyStaff: { male: 'No data', female: 'No data' }
      }
    };
  } catch (error) {
    console.error('Error fetching common illnesses data:', error);
    return {
      counts: {
        students: { total: 0, male: 0, female: 0 },
        facultyStaff: { total: 0, male: 0, female: 0 }
      },
      diagnoses: {
        students: { male: 'Error retrieving data', female: 'Error retrieving data' },
        facultyStaff: { male: 'Error retrieving data', female: 'Error retrieving data' }
      }
    };
  }
};

/**
 * Generates a PDF from HTML content
 * 
 * @param htmlContent HTML content to convert to PDF
 * @param conclusionStudent Optional conclusion text for the student section
 * @param conclusionTeaching Optional conclusion text for the teaching staff section
 * @param conclusionNonTeaching Optional conclusion text for the non-teaching staff section
 * @returns Promise with PDF blob data
 */
export const generatePdf = async (
  htmlContent: string,
  conclusionStudent?: string,
  conclusionTeaching?: string,
  conclusionNonTeaching?: string
): Promise<Blob> => {
  try {
    // Insert conclusion texts if provided
    if (conclusionStudent) {
      htmlContent = htmlContent.replace(
        /<textarea[^>]*id="conclusion-student"[^>]*>.*?<\/textarea>/g,
        `<textarea id="conclusion-student" name="conclusion-student" rows="4">${conclusionStudent}</textarea>`
      );
    }
    if (conclusionTeaching) {
      htmlContent = htmlContent.replace(
        /<textarea[^>]*id="conclusion-teaching"[^>]*>.*?<\/textarea>/g,
        `<textarea id="conclusion-teaching" name="conclusion-teaching" rows="4">${conclusionTeaching}</textarea>`
      );
    }
    if (conclusionNonTeaching) {
      htmlContent = htmlContent.replace(
        /<textarea[^>]*id="conclusion-nonteaching"[^>]*>.*?<\/textarea>/g,
        `<textarea id="conclusion-nonteaching" name="conclusion-nonteaching" rows="4">${conclusionNonTeaching}</textarea>`
      );
    }
    
    const response = await fetch(`${REPORTS_URL}/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        conclusionStudent, 
        conclusionTeaching,
        conclusionNonTeaching
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'PDF generation failed');
    }

    return await response.blob();
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Formats a date string for display in reports
 * 
 * @param dateString Date string to format
 * @returns Formatted date string (e.g. "January 1, 2025")
 */
export const formatReportDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString || '';
  }
};