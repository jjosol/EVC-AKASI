// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  plugins: [
    '~/plugins/iconify.ts'  
  ],
  css: ['~/assets/main.css'],
  postcss:{
    plugins:{
      tailwindcss:{},
      autoprefixer:{},
    },
  },
  app:{
    head:{
      title:'Akasi',
      link:[
        {
          rel: 'icon',
          type:'image/png',
          href:'/logo.png'
        }
      ]
    }
  },
  modules: ['@nuxtjs/google-fonts'],
  googleFonts: {
    families: {
      Inter: true // Add any other font weights you need
    },
    display: 'swap' // Improves loading performance
  }
})
