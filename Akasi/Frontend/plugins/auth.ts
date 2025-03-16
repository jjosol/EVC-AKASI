// plugins/auth.ts
import { defineNuxtPlugin } from 'nuxt/app';
import { useAuth } from '~/composables/useAuth';

export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.client) {
    const { startTokenCheck } = useAuth();
    startTokenCheck();
  }
});