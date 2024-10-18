// middleware/auth.ts
import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app'; // Import navigateTo
import { jwtDecode } from 'jwt-decode'; // Import your JWT decoding function

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.client) {
    const token = localStorage.getItem('token');

    if (!token) {
      return navigateTo('/login'); // Redirect to login if no token is found
    }

    try {
      const decoded = jwtDecode<any>(token); // Use any type for decoded if you don't have an interface
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        localStorage.removeItem('token'); 
        return navigateTo('/login'); // Redirect to login if the token is expired
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      return navigateTo('/login'); 
    }
  }
});
