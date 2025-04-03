const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Find your fetchWithTimeout function and increase the timeout value
export const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 15000) => {
  // Increase the default timeout from 5000ms to 15000ms (15 seconds)
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout for ${url}`);
    }
    throw error;
  }
};

export async function get(endpoint: string) {
  // Add token to GET requests
  const token = localStorage.getItem('token');
  try {
    const response = await fetchWithTimeout(`${baseUrl}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    }, 30000);
    if (!response.ok) {
      throw new Error(`GET ${endpoint} failed: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error(`Network error during GET ${endpoint}:`, error);
    throw error;
  }
}

export async function post(endpoint: string, data: any) {
  // Change authToken to token
  const token = localStorage.getItem('token');
  try {
    const response = await fetchWithTimeout(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }, 30000);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `POST ${endpoint} failed`);
    }
    return response.json();
  } catch (error) {
    console.error(`Network error during POST ${endpoint}:`, error);
    throw error;
  }
}

export async function put(endpoint: string, data: any) {
  const token = localStorage.getItem('token'); // Change from 'authToken' to 'token'
  try {
    const response = await fetchWithTimeout(`${baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    }, 30000);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `PUT ${endpoint} failed`);
    }
    return response.json();
  } catch (error) {
    console.error(`Network error during PUT ${endpoint}:`, error);
    throw error;
  }
}

export async function del(endpoint: string) {
  const token = localStorage.getItem('token'); // Change from 'authToken' to 'token'
  
  try {
    const response = await fetchWithTimeout(`${baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // Clone the response to use it twice
      const clonedResponse = response.clone();
      
      // Try to parse error message from JSON response
      try {
        const errorData = await clonedResponse.json();
        throw new Error(errorData.message || `DELETE ${endpoint} failed: ${response.statusText}`);
      } catch (jsonError) {
        // If JSON parsing fails, fall back to statusText
        throw new Error(`DELETE ${endpoint} failed: ${response.statusText}`);
      }
    }
    
    const text = await response.text();
    if (text && text.length > 0) {
      try {
        return JSON.parse(text);
      } catch (e) {
        return text;
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Network error during DELETE ${endpoint}:`, error);
    throw error;
  }
}

// Add this new function to your apiService.ts
export async function uploadFile(endpoint: string, formData: FormData) {
  const token = localStorage.getItem('token'); // Change from 'authToken' to 'token'
  
  try {
    const response = await fetchWithTimeout(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: formData
    }, 60000); // Use longer timeout for uploads
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload to ${endpoint} failed: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Network error during upload to ${endpoint}:`, error);
    throw error;
  }
}