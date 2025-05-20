import { defineStore } from 'pinia'
import resoniteApiClient from '@/renderer/resonite-api/client'
import logger from '@/renderer/logging'
import { useHubStore } from '@/renderer/stores/hub'

export const useUserStore = defineStore('user', {
  persist: true,
  state: () => ({
    token: null,
    tokenExpiry: null,
    userId: null,
    loggedIn: false
  }),
  getters: {
    isLoggedIn() {
      if (this.tokenExpiry < new Date()) {
        // Token has expired :(
        this.reset()
        return false
      }
      if (this.token && this.tokenExpiry && this.userId && this.loggedIn) {
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
