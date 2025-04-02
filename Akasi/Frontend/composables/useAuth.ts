// composables/useAuth.ts
import { ref, computed } from 'vue';
import { jwtDecode } from 'jwt-decode';
import { navigateTo, useRouter } from 'nuxt/app';

export const useAuth = () => {
  const isAuthenticated = ref(false);
  const userRole = ref<string | null>(null);
  const userCategory = ref<string | null>(null);
  const userGrade = ref<number | null>(null);
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
      userCategory.value = decoded.category || null;
      userGrade.value = decoded.grade || null;
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
    userCategory.value = null;
    userGrade.value = null;
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
  const isManager = computed(() => userRole.value === 'manager');

  // New computed property for student check with grade condition
  const isEligibleStudent = computed(() =>
    isClient.value &&
    userCategory.value?.toLowerCase() === 'student' &&
    (userGrade.value === null || userGrade.value < 13)
  );

  startTokenCheck(); // Start token check immediately

  return {
    isAuthenticated,
    userRole,
    userCategory,
    userGrade,
    isAdmin,
    isClient,
    isManager,
    isEligibleStudent,
    checkToken,
    handleLogout,
    startTokenCheck,
    stopTokenCheck,
    setToken,
  };
};