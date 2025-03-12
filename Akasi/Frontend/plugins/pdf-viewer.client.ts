import { defineNuxtPlugin } from 'nuxt/app'
import VuePdfEmbed from 'vue-pdf-embed'

export default defineNuxtPlugin((nuxtApp) => {
  // Register the component globally
  nuxtApp.vueApp.component('PdfViewer', VuePdfEmbed);
});