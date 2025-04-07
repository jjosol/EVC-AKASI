<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';

const router = useRouter();
const username = ref<string>('');
const password = ref<string>('');
const loginError = ref<string>();
const isLoading = ref<boolean>(false);
const showPassword = ref<boolean>(false);

const { setToken } = useAuth();

const handleLogin = async () => {
  if (!username.value || !password.value) {
    loginError.value = 'Please enter both username and password';
    return;
  }
  
  try {
    isLoading.value = true;
    loginError.value = undefined;
    
    const response = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    const { isAuthenticated, token, role } = data;

    if (isAuthenticated && token) {
      setToken(token);
      
      // Redirect based on role
      if (role === 'admin') {
        router.push('/home');
      } else if (role === 'client') {
        router.push('/bulletin');
      } else if (role === 'manager') {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  } catch (error) {
    loginError.value = error instanceof Error ? error.message : 'An unexpected error occurred';
    password.value = '';
  } finally {
    isLoading.value = false;
  }
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
  <div class="relative flex min-h-screen overflow-hidden font-inter">
    <!-- Background Image (Left Side) -->
    <div class="absolute inset-0 bg-[url('~/assets/EVC.png')] bg-cover bg-center bg-no-repeat bg-[#f8f4ff]"></div>
    
    <!-- Login Panel (Right Side) - attached directly to right edge -->
    <div class="ml-auto relative bg-[#f8f4ff] w-full md:w-5/12 h-screen flex flex-col">
      <!-- Header Section -->
      <Header class="mt-10 mb-16" />
      
      <!-- Logo Section -->
      <div class="px-12">
        <AkasiLogin class="mb-8 text-6xl md:text-7xl" />
        
        <!-- Login Form -->
        <div class="space-y-6">
          <!-- Username Field -->
          <div class="relative">
            <label for="username" class="block text-sm font-medium text-[#2f4a71] mb-1 ml-2">Username</label>
            <div class="relative flex items-center">
              <span class="absolute left-3 text-[#745dab]">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
              </span>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                v-model="username"
                class="w-full py-3 pl-10 pr-4 bg-white rounded-full placeholder:text-gray-400 text-[#2f4a71] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#745dab] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          
          <!-- Password Field -->
          <div class="relative">
            <label for="password" class="block text-sm font-medium text-[#2f4a71] mb-1 ml-2">Password</label>
            <div class="relative flex items-center">
              <span class="absolute left-3 text-[#745dab]">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                </svg>
              </span>
              <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                v-model="password"
                class="w-full py-3 pl-10 pr-11 bg-white rounded-full placeholder:text-gray-400 text-[#2f4a71] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#745dab] focus:border-transparent transition-all duration-200"
              />
              <button 
                type="button" 
                @click="togglePasswordVisibility" 
                class="absolute right-3 text-gray-500 hover:text-[#745dab] transition-colors"
              >
                <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Error Message -->
          <div v-if="loginError" class="p-4 text-sm text-red-700 border-l-4 border-red-500 rounded-lg bg-red-50 animate-fadeIn">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              {{ loginError }}
            </div>
          </div>
          
          <!-- Login Button -->
          <div class="pt-2">
            <button 
              @click="handleLogin" 
              class="w-full py-3 px-4 bg-[#745dab] hover:bg-[#2f4a71] text-white rounded-full transition-colors duration-300 flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#745dab] disabled:opacity-70"
              :disabled="isLoading"
            >
              <svg v-if="isLoading" class="w-4 h-4 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isLoading ? 'Signing in...' : 'Sign in' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Spacer -->
      <div class="flex-grow"></div>
      
      <!-- Footer -->
      <Footer />
    </div>
  </div>
</template>

<style scoped>
.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>