// API Configuration File
// This file centralizes all API URL configuration for easier maintenance

// Get the environment-specific base URL
export const getApiBaseUrl = () => {
  // In production, use relative path
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  
  // For development, check if we have a specific URL in env vars
  // This could come from .env file or be set at runtime
  if (import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Default fallback for local development
  return 'http://localhost:3001';
};

// Export a utility for building full API URLs
export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  // Ensure endpoint starts with / for proper path joining
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${normalizedEndpoint}`;
};
