// filepath:Y modules/custom-router.ts
import { defineNuxtModule } from '@nuxt/kit';

export default defineNuxtModule({
  setup(_, nuxt) {
    nuxt.hook('pages:extend', (pages) => {
      pages.push({
        name: 'files',
        path: '/files',
        file: '~/pages/files.vue',
        children: [
          {
            name: 'files-student',
            path: 'student',
            file: '~/components/admin/parts/Files/student.vue',
          },
          {
            name: 'files-faculty',
            path: 'faculty',
            file: '~/components/admin/parts/Files/faculty.vue',
          },
          {
            name: 'files-non-teaching-staff',
            path: 'non-teaching-staff',
            file: '~/components/admin/parts/Files/non-teaching-staff.vue',
          },
        ],
      });
    });
  },
});