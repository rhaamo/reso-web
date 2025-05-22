import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createBootstrap } from 'bootstrap-vue-next'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import PrimeVue from 'primevue/config'
import Nora from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import DialogService from 'primevue/dialogservice'

import App from '@/renderer/App.vue'
import router from '@/renderer/router'

import 'remixicon/fonts/remixicon.css'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import '@photo-sphere-viewer/core/index.css'

import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

const app = createApp(App)

const pinia = createPinia()
pinia.use(
  createPersistedState({
    storage: localStorage
  })
)

app.use(pinia)
app.use(router)
app.use(createBootstrap())
app.use(PrimeVue, {
  theme: {
    preset: Nora
  }
})
app.use(ToastService)
app.use(ConfirmationService)
app.use(DialogService)

router.isReady().then(() => {
  app.mount('#app')
})
