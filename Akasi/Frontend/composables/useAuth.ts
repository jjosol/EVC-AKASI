// composables/useAuth.ts
import { ref, onMounted, onUnmounted } from 'vue';
import { jwtDecode } from 'jwt-decode';
import { navigateTo } from 'nuxt/app';

export const useAuth = () => {
  const isAuthenticated = ref(false);
  let tokenCheckInterval: ReturnType<typeof setInterval> | null = null;

  const checkToken = () => {
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
    navigateTo('/login');
  };

  const startTokenCheck = () => {
    // Initial check
    checkToken();
    
    // Set up interval for subsequent checks
    tokenCheckInterval = setInterval(checkToken, 30000); // 30 seconds
  };

  const stopTokenCheck = () => {
    if (tokenCheckInterval) {
      clearInterval(tokenCheckInterval);
      tokenCheckInterval = null;
    }
  };

  // Start monitoring when component is mounted
  onMounted(() => {
    if (import.meta.client) {
      startTokenCheck();
    }
  });

  // Clean up when component is unmounted
  onUnmounted(() => {
    if (import.meta.client) {
      stopTokenCheck();
    }
  });

  return {
    isAuthenticated,
    checkToken,
    handleLogout,
    startTokenCheck,
    stopTokenCheck
  };
};