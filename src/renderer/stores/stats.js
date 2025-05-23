import { defineStore } from 'pinia'
import { useUserStore } from '@/renderer/stores/user'
import resoniteApiClient from '@/renderer/resonite-api/client'

export const useStatsStore = defineStore('stats', {
  persist: false,
  state: () => ({
    stats: {},
    statsInterval: null
  }),
  getters: {},
  actions: {
    reset() {
      this.stats = {}
    },
    async getStats() {
      const userStore = useUserStore()
      await resoniteApiClient.onlineStats(userStore.userId, userStore.token).then((response) => {
        this.stats = response.data
      })
    },
    async registerHandlers() {
      // every 5 minutess, get stats
      this.statsInterval = setInterval(this.getStats, 60000 * 5)
    },
    async deregisterHandlers() {
      clearInterval(this.statsInterval)
    }
  }
})
