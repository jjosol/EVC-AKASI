// middleware/auth.ts
import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app';
import { useAuth } from '~/composables/useAuth';

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
      if (userRole.value === 'admin') {
        return navigateTo('/home'); // Redirect admin
      } else if (userRole.value === 'client') {
        return navigateTo('/bulletin'); // Redirect client
      } else {
        return navigateTo('/login'); // Redirect unknown roles
      }
    }
  }
});