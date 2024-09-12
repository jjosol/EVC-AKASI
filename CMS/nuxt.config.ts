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
      title:'CMS',
      link:[
        {
          rel: 'icon',
          type:'image/png',
          href:'/logo.png'
        }
      ]
    }
  }
})
