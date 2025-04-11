// middleware/auth.ts
import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app';
import { useAuth } from '~/composables/useAuth.js';

export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return;

  const { checkToken, userRole } = useAuth();

  if (!checkToken()) {
    return navigateTo('/login');
  }

  let requiredRole: string[] = to.meta.requiredRole as string[];

  // Ensure requiredRole is always an array
  if (requiredRole && !Array.isArray(requiredRole)) {
    requiredRole = [requiredRole]; // Convert to an array if it's not already
  }

  if (requiredRole) {
    // Check if userRole is in the array of required roles
    if (userRole.value && !requiredRole.includes(userRole.value)) {
      // User doesn't have any of the required roles
      if (userRole.value === 'nurse') {  // Previously 'admin'
        return navigateTo('/home'); // Redirect nurse
      } else if (userRole.value === 'doctor') {  // New role
        return navigateTo('/home'); // Redirect doctor
      } else if (userRole.value === 'patient') {  // Previously 'client'
        return navigateTo('/bulletin'); // Redirect patient
      } else {
        return navigateTo('/login'); // Redirect unknown roles
      }
    }
  }
});