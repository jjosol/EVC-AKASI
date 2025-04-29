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
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetchWithTimeout(`${baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'authorization': `Bearer ${token}`,  // lowercase to match common API conventions
        'Content-Type': 'application/json'   // add content-type header
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message;
      } catch (e) {
        errorMessage = errorText;
      }
      throw new Error(errorMessage || `DELETE ${endpoint} failed: ${response.statusText}`);
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