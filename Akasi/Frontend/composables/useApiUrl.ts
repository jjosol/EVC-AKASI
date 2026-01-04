import { getApiUrl as configGetApiUrl } from '../config/api.js';

export const useApiUrl = () => {
  /**
   * Gets a fully qualified API URL for a given endpoint
   * @param endpoint The API endpoint path
   * @returns The full API URL
   */
  const getApiUrl = (endpoint: string): string => {
    return configGetApiUrl(endpoint);
  };

  return {
    getApiUrl,
  };
};
