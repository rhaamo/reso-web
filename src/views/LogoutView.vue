<template>
  <BContainer class="p-5">
    <center>
      <h3>Bye bye</h3>
    </center>
  </BContainer>
</template>

<script>
import { useUserStore } from '@/stores/user'
import logger from '@/logging'

export default {
  setup: () => ({
    userStore: useUserStore(),
  }),
  mounted() {
    if (this.userStore.isLoggedIn) {
      logger.default.info('already logged in, logging out...')
      this.userStore.logout().then(() => {
        this.$router.push({ name: 'login' })
      })
    } else {
      logger.default.info('not logged in, redirecting to login...')
      this.$router.push({ name: 'login' })
    }
  },
}
</script>
