/**
 * Report generation and data fetching services
 */

/**
 * Formats a date range for display in reports
 */
export const formatReportDate = (startMonth, endMonth, year, isYearly = false) => {
  if (isYearly) {
    return `School Year ${year}`;
  } else if (!endMonth || startMonth === endMonth) {
    return `${startMonth}, S.Y. ${year}`;
  } else {
    return `${startMonth} - ${endMonth}, S.Y. ${year}`;
  }
};

/**
 * Fetches illness summary data from the API
 */
export const fetchIllnessSummary = async (startMonth, endMonth, schoolYear, isYearly = false) => {
  try {
    // Extract the start year from the school year format (e.g., "2015-2016" -> "2015")
    const year = schoolYear.split('-')[0];

    const params = new URLSearchParams();
    params.append('startMonth', startMonth);
    if (endMonth) params.append('endMonth', endMonth);
    params.append('year', year);

    // Determine API base URL based on environment
    const apiBaseUrl = process.env.NODE_ENV === 'production' ? '/api' : '/api';
    
    // Add console log to debug the request
    console.log(`Making request to: ${apiBaseUrl}/reports/illness-summary?${params}`);
    console.log(`Using year ${year} from school year ${schoolYear}`);
    
    const response = await fetch(`${apiBaseUrl}/reports/illness-summary?${params}`);
    if (!response.ok) {
      console.error(`Error response: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch illness summary: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching illness summary:', error);
    throw error;
  }
};

/**
 * Fetches consultation monitoring data from the API
 */
export const fetchConsultationMonitoring = async (startMonth, endMonth, schoolYear, isYearly = false) => {
  try {
    // Extract the start year from the school year format (e.g., "2015-2016" -> "2015")
    const year = schoolYear.split('-')[0];

    const params = new URLSearchParams();
    params.append('startMonth', startMonth);
    if (endMonth) params.append('endMonth', endMonth);
    params.append('year', year);

    console.log(`Making monitoring request with year ${year} from school year ${schoolYear}`);

    const response = await fetch(`/api/reports/monitoring?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch consultation monitoring: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching consultation monitoring:', error);
    return [];
  }
};

/**
 * Fetches common illnesses and interventions data from the API
 */
export const fetchCommonIllnessesData = async (startMonth, endMonth, startYear, isYearly = false) => {
  try {
    const params = new URLSearchParams();
    params.append('startMonth', startMonth);
    if (endMonth) params.append('endMonth', endMonth);
    
    // Handle academic year format (e.g., "2024-2025")
    const yearParts = startYear.split('-');
    params.append('startYear', yearParts[0]);
    
    if (yearParts.length > 1) {
      params.append('endYear', yearParts[1]);
    } else if (isYearly) {
      // For yearly reports, if using a single year format, increment by 1 for end year
      params.append('endYear', (parseInt(yearParts[0]) + 1).toString());
    }

    const response = await fetch(`/api/reports/common-illnesses?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch common illnesses: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Ensure we have the data property from the response
    if (data.success && data.data) {
      return data.data;
    } else {
      console.error('Unexpected response format:', data);
      return {};
    }
  } catch (error) {
    console.error('Error fetching common illnesses:', error);
    return {};
  }
};

/**
 * Generates a PDF from HTML content
 */
export const generatePdf = async (htmlContent, conclusionStudent, conclusionTeaching, conclusionNonTeaching) => {
  try {
    // Replace textarea placeholders with provided values
    let finalHtml = htmlContent;
    
    if (conclusionStudent) {
      finalHtml = finalHtml.replace(
        /<textarea id="conclusion-student"[^>]*>[^<]*<\/textarea>/g,
        `<textarea id="conclusion-student" name="conclusion-student" rows="4">${conclusionStudent}</textarea>`
      );
    }
    
    if (conclusionTeaching) {
      finalHtml = finalHtml.replace(
        /<textarea id="conclusion-teaching"[^>]*>[^<]*<\/textarea>/g,
        `<textarea id="conclusion-teaching" name="conclusion-teaching" rows="4">${conclusionTeaching}</textarea>`
      );
    }
    
    if (conclusionNonTeaching) {
      finalHtml = finalHtml.replace(
        /<textarea id="conclusion-nonteaching"[^>]*>[^<]*<\/textarea>/g,
        `<textarea id="conclusion-nonteaching" name="conclusion-nonteaching" rows="4">${conclusionNonTeaching}</textarea>`
      );
    }
    
    // Call the API endpoint that generates PDFs using the correct endpoint path
    // Notice that we're using /api/reports/generate-pdf to match the pattern of other API calls
    const response = await fetch(`/api/reports/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: finalHtml,
        conclusionStudent,
        conclusionTeaching,
        conclusionNonTeaching
      }),
    });
    
    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.statusText}`);
    }
    
    // Return the blob from the response
    return await response.blob();
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Processes the HTML template with actual data values
 * This is a helper function that can be used to pre-process templates before displaying them
 */
export const processTemplate = async (html, data) => {
  // Deep clone the data to avoid mutations
  const templateData = JSON.parse(JSON.stringify(data));
  
  // Replace any remaining Handlebars-style variables with actual data
  let processedHtml = html;
  
  // Create a recursive function to traverse the data object and replace variables
  const replaceVariables = (obj, prefix = '') => {
    if (!obj) return;
    
    if (typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null) {
          // Recursively process nested objects
          replaceVariables(value, newPrefix);
        } else {
          // Replace variables with the actual value
          const regex = new RegExp(`{{${newPrefix}}}`, 'g');
          processedHtml = processedHtml.replace(regex, value);
          
          // Also handle triple braces for HTML content
          const htmlRegex = new RegExp(`{{{${newPrefix}}}}`, 'g');
          processedHtml = processedHtml.replace(htmlRegex, value);
        }
      });
    }
  };
  
  // Process the data object
  replaceVariables(templateData);
  
  return processedHtml;
};