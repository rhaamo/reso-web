<template>
  <BToastOrchestrator />

  <BNavbar v-b-color-mode="'dark'" toggleable="lg" variant="dark">
    <BNavbarBrand :to="{ name: 'home' }">
      <BImg src="/images/logo-512.png" width="30px"></BImg>
      &nbsp;ResoWeb
    </BNavbarBrand>
    <BNavbarToggle target="nav-collapse" />
    <BCollapse id="nav-collapse" is-nav>
      <BNavbarNav>
        <BNavItem :to="{ name: 'home' }"><i class="ri-home-heart-line"></i> Home</BNavItem>
        <BNavItem :to="{ name: 'chats' }"><i class="ri-message-2-line"></i> Chats</BNavItem>
        <BNavItem :to="{ name: 'sessions' }"
          ><i class="ri-user-community-line"></i> Sessions</BNavItem
        >
        <BNavItem :to="{ name: 'inventory' }"><i class="ri-folders-line"></i> Inventory</BNavItem>
        <BNavItem :to="{ name: 'worlds' }"><i class="ri-global-line"></i> Worlds</BNavItem>
        <BNavItem :to="{ name: 'about' }"><i class="ri-question-mark"></i> About</BNavItem>
      </BNavbarNav>
      <!-- Right aligned nav items -->
      <BNavbarNav class="ms-auto mb-2 mb-lg-0">
        <BNavItemDropdown>
          <!-- Using 'button-content' slot -->
          <template #button-content>
            <i :class="`ri-circle-fill text-${statusColor}`"></i> {{ ourStatus || 'Unknown' }}
          </template>
          <BDropdownItem @click.prevent="changeStatus('Sociable')">
            <i class="ri-circle-fill text-primary"></i> Sociable
          </BDropdownItem>
          <BDropdownItem @click.prevent="changeStatus('Online')">
            <i class="ri-circle-fill text-success"></i> Online
          </BDropdownItem>
          <BDropdownItem @click.prevent="changeStatus('Busy')">
            <i class="ri-circle-fill text-warning"></i> Busy
          </BDropdownItem>
          <BDropdownItem @click.prevent="changeStatus('Offline')">
            <i class="ri-circle-fill text-muted"></i> Offline
          </BDropdownItem>
          <BDropdownDivider />
          <BDropdownItem :to="{ name: 'settings' }">Settings</BDropdownItem>
          <BDropdownDivider />
          <BDropdownItem :to="{ name: 'logout' }">Sign Out</BDropdownItem>
        </BNavItemDropdown>
      </BNavbarNav>
    </BCollapse>
  </BNavbar>

  <RouterView />
</template>

<style lang="scss" src="./App.scss"></style>

<script>
import logger from '@/renderer/logging'
import { useUserStore } from '@/renderer/stores/user'
import { useHubStore } from '@/renderer/stores/hub'
import { useHubContactsStore } from '@/renderer/stores/hubContacts'
import { useHubSessionsStore } from '@/renderer/stores/hubSessions'
import { useStatsStore } from '@/renderer/stores/stats'
import { useToastController } from 'bootstrap-vue-next'
import { mapState } from 'pinia'

export default {
  setup: () => ({
    userStore: useUserStore(),
    hubStore: useHubStore(),
    statsStore: useStatsStore(),
    hubContactsStore: useHubContactsStore(),
    hubSessionsStore: useHubSessionsStore(),
    toasty: useToastController()
  }),
  data() {
    return {}
  },
  computed: {
    ...mapState(useHubContactsStore, {
      ourStatus(store) {
        return store.ourStatus
      }
    }),
    statusColor() {
      switch (this.ourStatus) {
        case 'Online':
          return 'success'
        case 'Sociable':
          return 'primary'
        case 'Busy':
          return 'warning'
        default:
          return 'muted'
      }
    }
  },
  created() {
    logger.default.info('App init...')

    // Check if we are logged in, if not, redirect to login page
    if (!this.userStore.isLoggedIn) {
      logger.default.info('Logged in status: nope, redirecting to login page')
      this.toasty.create({
        title: 'Authentication',
        body: 'Whoopsie, we need to login first!',
        modelValue: 3000,
        variant: 'danger'
      })
      this.$router.push({
        name: 'login'
      })
    } else {
      logger.default.info('Logged in status: we are good')
      this.toasty.create({
        title: 'Authentication',
        body: 'We are good to go!',
        modelValue: 3000,
        variant: 'success'
      })

      // Init SignalR HUB Connection
      this.hubStore
        .initHubConnection()
        // Then user handling
        .then(() => {
          // Fetch initial contact list
          this.hubContactsStore.fetchInitialContacts().then(() => {
            // Register handlers for status updates, broadcast status, etc.
            this.hubContactsStore.registerHandlers().then(() => {
              // Broadcast our initial status using last manually set status
              this.hubContactsStore.broadcastStatus(this.userStore.lastStatus).then(() => {
                // Request statues from contacts (doesn't work ?)
                this.hubContactsStore.requestStatues()
              })
            })
          })
        })
        // And sessions handling
        .then(() => {
          this.hubSessionsStore.fetchSessions().then(() => {
            // Register handlers
            this.hubSessionsStore.registerHandlers()
          })
        })
        // And stats gathering
        .then(() => {
          this.statsStore.getStats().then(() => {
            this.statsStore.registerHandlers()
          })
        })
    }
  },
  methods: {
    changeStatus(status) {
      this.hubContactsStore.broadcastStatus(status)
    }
  }
}
</script>
