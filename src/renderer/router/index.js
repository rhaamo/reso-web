import { createRouter, createWebHashHistory } from 'vue-router'
import ChatsView from '@/renderer/views/ChatsView.vue'
import AboutView from '@/renderer/views/AboutView.vue'
import LoginView from '@/renderer/views/LoginView.vue'
import LogoutView from '@/renderer/views/LogoutView.vue'
import SessionsView from '@/renderer/views/SessionsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'chats',
      component: ChatsView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/logout',
      name: 'logout',
      component: LogoutView
    },
    {
      path: '/sessions',
      name: 'sessions',
      component: SessionsView
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView
    }
  ]
})

export default router
