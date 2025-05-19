import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createBootstrap } from 'bootstrap-vue-next'
import { createPersistedState } from "pinia-plugin-persistedstate";

import App from './App.vue'
import router from './router'

import 'remixicon/fonts/remixicon.css'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import '@photo-sphere-viewer/core/index.css'

const app = createApp(App)

const pinia = createPinia();
pinia.use(
  createPersistedState({
    storage: localStorage,
  })
);

app.use(pinia)
app.use(router)
app.use(createBootstrap())

router.isReady().then(() => {
  app.mount('#app')
})
