import { defineNuxtPlugin } from 'nuxt/app';
import { Icon } from '@iconify/vue';

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.component('Icon', Icon);
});