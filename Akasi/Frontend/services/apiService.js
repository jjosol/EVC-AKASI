// Common API service functions for HTTP requests
// Used by other service files for API communication

export async function get(endpoint) {
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error during GET request to ${endpoint}:`, error);
    throw error;
  }
}

export async function post(endpoint, data) {
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error during POST request to ${endpoint}:`, error);
    throw error;
  }
}

export async function put(endpoint, data) {
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error during PUT request to ${endpoint}:`, error);
    throw error;
  }
}

export async function del(endpoint) {
  const baseUrl = getBaseUrl();
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error during DELETE request to ${endpoint}:`, error);
    throw error;
  }
}

// Helper to get base URL from environment variable
function getBaseUrl() {
  // Use environment variable if defined
  if (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // If running in a browser, determine the host dynamically
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    
    // If it's localhost, use localhost for the API
    if (currentHost === 'localhost') {
      return 'http://localhost:3001';
    } else {
      // Otherwise use the current host's IP with the backend port
      return `http://${currentHost}:3001`;
    }
  }
  
  // Default fallback
  return 'http://localhost:3001';
}

// Helper to get auth headers
function getAuthHeaders() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
  return {};
}
