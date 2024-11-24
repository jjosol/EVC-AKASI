<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref<string>('')
const password = ref<string>('')
const loginError = ref<string>()

const handleLogin = async () => {
  try {
    const response = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username: username.value, 
        password: password.value 
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Login failed')
    }

    const { isAuthenticated, token, role } = await response.json()

    if (isAuthenticated) {
      localStorage.setItem('token', token)
      localStorage.setItem('userRole', role)

      loginError.value = undefined
      router.push('/home')
    }
  } catch (error) {
    loginError.value = error instanceof Error ? error.message : 'An unexpected error occurred'
    password.value = ''
  }
}
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
