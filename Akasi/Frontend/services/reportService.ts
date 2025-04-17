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
 * Generates a PDF from HTML content
 * 
 * @param htmlContent HTML content to convert to PDF
 * @param conclusionText Optional conclusion text to add to the PDF
 * @returns Promise with PDF blob data
 */
export const generatePdf = async (
  htmlContent: string,
  conclusionText?: string
): Promise<Blob> => {
  try {
    // Insert conclusion text if provided
    if (conclusionText) {
      htmlContent = htmlContent.replace(
        /<textarea[^>]*id="conclusion"[^>]*>.*?<\/textarea>/g,
        `<textarea id="conclusion" name="conclusion" rows="4">${conclusionText}</textarea>`
      );
    }
    
    const response = await fetch('/_generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        conclusionText
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate PDF');
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