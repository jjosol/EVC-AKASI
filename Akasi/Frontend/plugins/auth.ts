// plugins/auth.ts
import { defineNuxtPlugin } from 'nuxt/app';
import { useAuth } from '~/composables/useAuth.js';

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.client) {
    // Use app:mounted hook to ensure the app is fully initialized
    nuxtApp.hook('app:mounted', () => {
      try {
        const { startTokenCheck } = useAuth();
        startTokenCheck();
      } catch (error) {
        console.error('Failed to start token check:', error);
      }
    });
  }
  
  // Return the plugin
  return {
    provide: {
      // Auth utilities could be provided here if needed
    }
  };
});