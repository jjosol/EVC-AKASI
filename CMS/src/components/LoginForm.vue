
<template>
<section>
<div class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0 text-[#2F4A71]">
    <div class="w-full bg-blue-300 shadow rounded-3xl dark:border md:mt-0 sm:max-w-md xl:p-0 ">
        <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 class="text-xl font-bold leading-tight tracking-tight md:text-2xl">
                Login to your account
            </h1>
            <form class="space-y-4 md:space-y-6" action="#">
                <div>
                    <label for="email" class="block mb-2 text-sm font-medium ">Your email</label>
                    <input type="email" name="email" id="email" placeholder="@evc.pshs.edu.ph"
                    class="bg-transparent border border-[#2F4A71]   rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ">
                </div>
                <div>
                    <label for="password" class="block mb-2 text-sm font-medium ">Password</label>
                    <input type="password" name="password" id="password" placeholder="••••••••" 
                    class="bg-transparent border border-[#2F4A71] rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 ">
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-start">
                        <div class="flex items-center h-5">
                        <input id="remember" aria-describedby="remember" type="checkbox" class="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 accent-[#2F4A71] ">
                        </div>
                        <div class="ml-3 text-sm">
                        <label for="remember" class="font-bold">Remember me</label>
                        </div>
                    </div>
                    <a href="#" class="text-sm font-bold text-primary-600 hover:underline dark:text-primary-500">Forgot password?</a>
                </div>
                <RouterLink :to="{name:'home'}" class="flex justify-center">
                    <button type="submit" class="px-10 py-3 text-sm font-medium text-center bg-blue-400 rounded-full hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300">Login</button>
                </RouterLink>
            </form>
        </div>
    </div>
</div>
</section>
</template>