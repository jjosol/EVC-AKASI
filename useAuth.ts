// composables/useAuth.ts
import { ref, computed } from 'vue';
import { jwtDecode } from 'jwt-decode';
import { navigateTo, useRouter } from 'nuxt/app';

export const useAuth = () => {
  const isAuthenticated = ref(false);
  const userRole = ref<string | null>(null);
  const router = useRouter(); // Get the router instance
  let tokenCheckInterval: ReturnType<typeof setInterval> | null = null;

  const checkToken = () => {
    if (process.server) return true; // Skip token check on server-side

    const token = localStorage.getItem('token');

    if (!token) {
      handleLogout();
      return false;
    }

    try {
      const decoded = jwtDecode<any>(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        handleLogout();
        return false;
      }

      isAuthenticated.value = true;
      userRole.value = decoded.role || null;
      return true;
    } catch (error) {
      console.error('Error decoding token:', error);
      handleLogout();
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    isAuthenticated.value = false;
    userRole.value = null;
    navigateTo('/login');
  };

  const startTokenCheck = () => {
    if (process.server) return;

    checkToken();
    tokenCheckInterval = setInterval(() => {
      checkToken();
    }, 30000);
  };

  const stopTokenCheck = () => {
    if (tokenCheckInterval) {
      clearInterval(tokenCheckInterval);
      tokenCheckInterval = null;
    }
  };

  const setToken = (token: string) => {
    localStorage.setItem('token', token);
    checkToken(); // Update isAuthenticated and userRole
  };

  const isAdmin = computed(() => userRole.value === 'admin');
  const isClient = computed(() => userRole.value === 'client');

  startTokenCheck(); // Start token check immediately

  return {
    isAuthenticated,
    userRole,
    isAdmin,
    isClient,
    checkToken,
    handleLogout,
    startTokenCheck,
    stopTokenCheck,
    setToken,
  };
};