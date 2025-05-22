<template>
  <ConfirmPopup></ConfirmPopup>
  <ConfirmDialog group="dialog"></ConfirmDialog>
  <Toast />
  <DynamicDialog />

  <Menubar :model="menuBarItems">
    <template #start>
      <Image src="/images/logo-512.png" alt="ResoWEB Logo" width="30px" />
    </template>
  </Menubar>

  <RouterView />
</template>

<script>
import logger from '@/renderer/logging'
import { useUserStore } from '@/renderer/stores/user'
import { useToast } from 'primevue/usetoast'

export default {
  setup: () => ({
    userStore: useUserStore(),
    toast: useToast()
  }),
  data() {
    return {
      menuBarItems: [
        {
          label: 'Home',
          icon: 'ri-home-heart-line',
          command: () => {
            this.$router.push({ name: 'home' })
          }
        },
        {
          label: 'Chats',
          icon: 'ri-message-2-line',
          command: () => {
            this.$router.push({ name: 'chats' })
          }
        },
        {
          label: 'Sessions',
          icon: 'ri-user-community-line',
          command: () => {
            this.$router.push({ name: 'sessions' })
          }
        },
        {
          label: 'Inventory',
          icon: 'ri-folders-line',
          command: () => {
            this.$router.push({ name: 'inventory' })
          }
        },
        {
          label: 'Worlds',
          icon: 'ri-global-line',
          command: () => {
            this.$router.push({ name: 'worlds' })
          }
        },
        {
          label: 'About',
          icon: 'ri-question-mark',
          command: () => {
            this.$router.push({ name: 'about' })
          }
        }
      ]
    }
  },
  created() {
    logger.default.info('App init...')

    // Check if we are logged in, if not, redirect to login page
    if (!this.userStore.isLoggedIn) {
      logger.default.info('Logged in status: nope, redirecting to login page')
      this.toast.add({
        severity: 'danger',
        life: 2000,
        summary: 'Authentication',
        detail: 'Whoopsie, we need to login first!'
      })
      this.$router.push({
        name: 'login'
      })
    } else {
      logger.default.info('Logged in status: we are good')
      this.toast.add({
        severity: 'success',
        life: 20000,
        summary: 'Authentication',
        detail: 'We are good to go!'
      })
    }
  }
}
</script>
