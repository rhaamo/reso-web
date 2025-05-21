<template>
  <BNavbar v-b-color-mode="'dark'" toggleable="lg" variant="secondary">
    <BNavbarBrand :to="{ name: 'chats' }">ResoWeb</BNavbarBrand>
    <BNavbarToggle target="nav-collapse" />
    <BCollapse id="nav-collapse" is-nav>
      <BNavbarNav>
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
            <em>User</em>
          </template>
          <BDropdownItem href="#">Profile</BDropdownItem>
          <BDropdownItem :to="{ name: 'logout' }">Sign Out</BDropdownItem>
        </BNavItemDropdown>
      </BNavbarNav>
    </BCollapse>
  </BNavbar>

  <RouterView />
</template>

<script>
import logger from '@/renderer/logging'
import { useUserStore } from '@/renderer/stores/user'

export default {
  setup: () => ({
    userStore: useUserStore()
  }),
  created() {
    logger.default.info('App init...')

    // Check if we are logged in, if not, redirect to login page
    if (!this.userStore.isLoggedIn) {
      logger.default.info('Not logged in, redirecting to login')
      this.$router.push({
        name: 'login'
      })
    }
  }
}
</script>
