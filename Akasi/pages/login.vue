<script setup>


</script>
<template>
  <div class="font-inter bg-[url('~/assets/EVC.png')] h-screen min-h-screen w-full bg-[length:125rem_60rem]">
      <div class="flex justify-end">
        <div class="bg-[#d9d9d9] w-5/12 h-screen ">
            <Header class="mt-10 mb-36"/>
            <MidTitle class="my-6 text-7xl" />
              <loginForm class="my-6 text-center" />
              <div class="flex flex-col items-center justify-center">
                <NuxtLink to="/home">
                <loginButton  />
                </NuxtLink>
              </div>
            <Footer/>
        </div>
      </div>
    </div>


</template>