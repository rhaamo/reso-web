<template>
  <BContainer class="p-5">
    <div class="text-center">
      <h3>Settings</h3>
      <h5>New messages</h5>
      <div>
        <BFormCheckbox
          id="toastNotifications"
          v-model="userSettings.toastNotifications"
          name="toastNotifications"
        >
          Toast Notifications (within the app)
        </BFormCheckbox>

        <BFormCheckbox
          id="nativeNotifications"
          v-model="userSettings.nativeNotifications"
          name="nativeNotifications"
        >
          Native Notifications (native to your operating-system)
        </BFormCheckbox>
      </div>
    </div>
  </BContainer>
</template>

<script>
import logger from '@/renderer/logging'
import { useUserStore } from '@/renderer/stores/user'
import { useToastController } from 'bootstrap-vue-next'
import { mapState } from 'pinia'

export default {
  setup: () => ({
    userStore: useUserStore(),
    toasty: useToastController()
  }),
  data: () => ({}),
  computed: {
    ...mapState(useUserStore, {
      userSettings(store) {
        return store.settings
      }
    })
  },
  created() {
    // Check if we are logged in, if not, redirect to login page
    if (!this.userStore.isLoggedIn) {
      logger.default.info('Logged in status: nope, redirecting to login page')
      this.$router.push({
        name: 'login'
      })
    } else {
      logger.default.info('Logged in status: we are good')
    }
  },
  beforeUnmount() {},
  mounted() {},
  watch: {
    'userSettings.nativeNotifications': function () {
      this.toasty.create({
        title: 'Settings',
        body: 'Saved!',
        modelValue: 1000,
        variant: 'success'
      })
    },
    'userSettings.toastNotifications': function () {
      this.toasty.create({
        title: 'Settings',
        body: 'Saved!',
        modelValue: 1000,
        variant: 'success'
      })
    }
  },
  methods: {}
}
</script>
