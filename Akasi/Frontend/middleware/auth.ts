// middleware/auth.ts
import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app';
import { useAuth } from '~/composables/useAuth.js';

export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return;

  // Skip auth check for login page to prevent infinite redirects
  if (to.path === '/login' || to.path === '/register' || to.path.startsWith('/reset-password')) {
    return;
  }

  const { checkToken, userRole } = useAuth();

  if (!checkToken()) {
    return navigateTo('/login');
  }

  let requiredRole: string[] = to.meta.requiredRole as string[];

  // Ensure requiredRole is always an array
  if (requiredRole && !Array.isArray(requiredRole)) {
    requiredRole = [requiredRole]; // Convert to an array if it's not already
  }

  // If no specific role is required, allow access to authenticated users
  if (!requiredRole || requiredRole.length === 0) {
    return;
  }

  // Check if user has the required role
  if (userRole.value && !requiredRole.includes(userRole.value)) {
    // User doesn't have any of the required roles - redirect to their appropriate homepage
    console.log(`User role ${userRole.value} doesn't match required roles ${requiredRole.join(', ')}`);

    if (userRole.value === 'nurse') {
      return navigateTo('/home');
    } else if (userRole.value === 'doctor') {
      // Redirect doctors to their dedicated page
      return navigateTo('/doctor');
    } else if (userRole.value === 'patient') {
      return navigateTo('/bulletin');
    } else {
      return navigateTo('/login');
    }
  }
});