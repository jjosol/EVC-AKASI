<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref } from 'vue';

const router = useRouter(); // Initialize the router
const username = ref<string>(''); // Reactive variable for username
const password = ref<string>(''); // Reactive variable for password
const loginStatus = ref<string | undefined>(); // Reactive variable for login status message

const handleLogin = async () => {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: username.value, password: password.value }),
    });

    if (!response.ok) {
      // Handle server response errors
      throw new Error('Network response was not ok');
    }

    const data = await response.json(); // Parse the JSON response

    // Set login status based on authentication result
    loginStatus.value = data.isAuthenticated ? 'Logged in' : 'Invalid Credentials';

    if (data.isAuthenticated) {
      // Store the JWT token in localStorage
      localStorage.setItem('token', data.token);
      
      // Redirect to home if authenticated
      router.push('/home');
      console.log(data.token);
    } else {
      // Use window.alert instead of alert
      alert("Invalid Credentials");
    }
  } catch (error: unknown) { // Explicitly set error type to unknown
    console.error('Error during login:', error);
    // Provide a more specific error handling based on error type
    if (error instanceof Error) {
      loginStatus.value = 'An error occurred: ' + error.message; // Provide error message to user
    } else {
      loginStatus.value = 'An unknown error occurred';
    }
  }
};
</script>

<template>
  <div class="font-inter bg-[url('~/assets/EVC.png')] h-screen min-h-screen w-full bg-[length:125rem_60rem]">
    <div class="flex justify-end">
      <div class="bg-[#d9d9d9] w-5/12 h-screen">
        <Header class="mt-10 mb-36"/>
        <MidTitle class="my-6 text-7xl" />
        <div class="my-6 text-center">
          <div class="p-6 text-[#2f4a71] rounded-full text-center flex flex-col items-center">
            <div class="text-red-900 ">
              <input 
                type="text"
                placeholder="Username"
                v-model="username"
                class="w-full py-3 px-2 rounded-full input-field placeholder:text-[#2f4a71] outline outline-1 outline-gray-500"
              />
            </div>
            <br>
            <div>
              <input
                type="password"
                placeholder="Password"
                v-model="password"
                class="w-full py-3 px-2 rounded-full input-field placeholder:text-[#2f4a71] outline outline-1 outline-gray-500"
              />
            </div>
          </div>
        </div>
        <div class="flex flex-col items-center justify-center">
          <loginButton @click="handleLogin" />
        </div>
        <Footer/>
      </div>
    </div>
  </div>
</template>
