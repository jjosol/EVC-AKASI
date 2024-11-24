// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  plugins: [
    '~/plugins/iconify.ts',
    '~/plugins/auth.ts'
  ],
  css: ['~/assets/main.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  app: {
    head: {
      title: 'Akasi',
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/logo.png'
        }
      ]
    }
  },
  modules: ['@nuxtjs/google-fonts'],
  googleFonts: {
    families: {
      Inter: [400, 700] // Explicitly specify weights
    },
    display: 'swap',
    download: true, // Force download of font files
    prefetch: true, // Adds prefetch hints
  }
});
