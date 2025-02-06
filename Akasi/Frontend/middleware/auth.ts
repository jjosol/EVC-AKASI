// middleware/auth.ts
import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app';
import { useAuth } from '~/composables/useAuth';

export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return;
  
  const { checkToken } = useAuth();
  
  if (!checkToken()) {
    return navigateTo('/login');
  }
}); 