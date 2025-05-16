// Dynamically determine the host based on the current environment
const getBaseUrl = () => {
  // Use environment variable if defined
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // If running in a browser, determine the host dynamically
  if (typeof window !== 'undefined') {
    // Extract the host (without port) from the current URL
    const currentHost = window.location.hostname;
    
    // If it's localhost, use localhost for the API
    if (currentHost === 'localhost') {
      return 'http://localhost:3001';
    }
    
    // Otherwise use the current host's IP with the backend port
    return `http://${currentHost}:3001`;
  }
  
  // Fallback to your specific IP address for SSR
  return 'http://10.35.133.169:3001';
};

const baseUrl = getBaseUrl();

// Helper function to safely access localStorage
const safeLocalStorage = {
  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  },
  removeItem(key: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  }
};

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
  // Add token to GET requests - use safeLocalStorage instead of direct localStorage
  const token = safeLocalStorage.getItem('token');
  try {
    console.log(`Making GET request to ${baseUrl}${endpoint}`);
    const response = await fetchWithTimeout(`${baseUrl}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    }, 30000);
    if (!response.ok) {
      throw new Error(`GET ${endpoint} failed: ${response.statusText}`);
    }
    const data = await response.json();
    console.log(`GET ${endpoint} response:`, data);
    return data;
  } catch (error) {
    console.error(`Network error during GET ${endpoint}:`, error);
    throw error;
  }
}

export async function post(endpoint: string, data: any) {
  // Use safeLocalStorage instead of direct localStorage
  const token = safeLocalStorage.getItem('token');
  try {
    const response = await fetchWithTimeout(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
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
  // Use safeLocalStorage instead of direct localStorage
  const token = safeLocalStorage.getItem('token');
  try {
    const response = await fetchWithTimeout(`${baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
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
  // Use safeLocalStorage instead of direct localStorage
  const token = safeLocalStorage.getItem('token');
  
  try {
    const response = await fetchWithTimeout(`${baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'authorization': token ? `Bearer ${token}` : '',  // lowercase to match common API conventions
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
  // Use safeLocalStorage instead of direct localStorage
  const token = safeLocalStorage.getItem('token');
  
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