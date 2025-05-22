import { createRouter, createWebHashHistory } from 'vue-router'
import ChatsView from '@/renderer/views/ChatsView.vue'
import AboutView from '@/renderer/views/AboutView.vue'
import LoginView from '@/renderer/views/LoginView.vue'
import LogoutView from '@/renderer/views/LogoutView.vue'
import SessionsView from '@/renderer/views/SessionsView.vue'
import InventoryView from '@/renderer/views/InventoryView.vue'
import WorldsView from '@/renderer/views/WorldsView.vue'
import UserView from '@/renderer/views/UserView.vue'
import SettingsView from '@/renderer/views/SettingsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: UserView
    },
    {
      path: '/chats',
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
      path: '/inventory',
      name: 'inventory',
      component: InventoryView
    },
    {
      path: '/worlds',
      name: 'worlds',
      component: WorldsView
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView
    }
  ]
})

export default router
