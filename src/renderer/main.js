import App from '@/renderer/App.vue'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createBootstrap } from 'bootstrap-vue-next'
import { createPersistedState } from 'pinia-plugin-persistedstate'

import router from '@/renderer/router'

const app = createApp(App)

const pinia = createPinia()
pinia.use(
  createPersistedState({
    storage: localStorage
  })
)

import 'remixicon/fonts/remixicon.css'
import '@photo-sphere-viewer/core/index.css'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

app.use(pinia)
app.use(router)
app.use(createBootstrap())

router.isReady().then(() => {
  app.mount('#app')
})
