import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/LoginView.vue'
import LoginForm from '../components/LoginForm.vue'
import Home from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      alias:'/login',
      name: 'login',
      component: Login,
    },
    {
      path:'/login/loginform',
      name:'loginform',
      component:LoginForm,
    },
    {
      path:'/home', 
      name:'home',
      component:Home,
    }
  ]
})

export default router
