import { defineStore } from 'pinia'
import resoniteApiClient from '@/renderer/resonite-api/client'
import logger from '@/renderer/logging'
import { useHubStore } from '@/renderer/stores/hub'
import { v4 as uuidv4 } from 'uuid'

export const useUserStore = defineStore('user', {
  persist: true,
  state: () => ({
    token: null,
    tokenExpiry: null,
    userId: null,
    loggedIn: false,
    userSessionId: null,
    lastStatus: 'Online',
    settings: {
      nativeNotifications: false,
      toastNotifications: true
    }
  }),
  getters: {
    isLoggedIn() {
      if (this.tokenExpiry < new Date()) {
        // Token has expired :(
        this.reset()
        return false
      }
      if (this.token && this.tokenExpiry && this.userId && this.loggedIn) {
        // Check if we do have an userSessionId
        if (!this.userSessionId) {
          this.userSessionId = uuidv4()
        }
        return true
      }
      // well, it's not
      return false
    },
    fullToken() {
      return this.userId && this.token ? `res ${this.userId}:${this.token}` : null
    }
  },
  actions: {
    reset() {
      this.token = null
      this.tokenExpiry = null
      this.userId = null
      this.loggedIn = false
      this.userSessionId = null
    },
    async login(username, password, totp) {
      await resoniteApiClient
        .loginUserPassword(username, password, totp)
        .then((result) => {
          logger.default.info('Logged in theorically', result.data)
          this.token = result.data.entity.token
          this.tokenExpiry = new Date(result.data.entity.expire)
          this.userId = result.data.entity.userId
          this.loggedIn = true
          this.userSessionId = uuidv4()
          const hubStore = useHubStore()

          hubStore.initHubConnection()
        })
        .catch((error) => {
          logger.default.error('Login error', error.message)
          this.reset()
        })
    },
    async logout() {
      await resoniteApiClient
        .logout(this.userId, this.token)
        .then((result) => {
          logger.default.info('Logged out', result)
          this.reset()
        })
        .catch((error) => {
          logger.default.error('Error logging out', error)
          this.reset()
        })
    }
  }
})
