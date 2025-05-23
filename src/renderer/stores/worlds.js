import { defineStore } from 'pinia'
import resoniteApiClient from '@/renderer/resonite-api/client'
import { useUserStore } from '@/renderer/stores/user'
import logger from '@/renderer/logging'

export const useWorldsStore = defineStore('worlds', {
  persist: false,
  state: () => ({
    worlds: [],
    hasMoreResults: null,
    filters: {
      requiredTags: [],
      sortDirection: 'descending',
      sortBy: 'lastUpdateDate',
      count: 12, // hardcoded limit
      offset: 0, // idk
      recordType: 'world'
    }
  }),
  getters: {},
  actions: {
    reset() {
      this.worlds = []
      this.hasMoreResults = null
      this.filters.requiredTags = []
      this.filters.sortDirection = 'descending'
      this.filters.sortBy = 'lastUpdateDate'
      this.filters.count = 12
      this.filters.offset = 0
      this.filters.recordType = 'world'
    },
    async searchWorlds() {
      const userStore = useUserStore()
      resoniteApiClient
        .searchWorldRecords(userStore.userId, userStore.token, this.filters)
        .then((result) => {
          logger.default.info('Fetched worlds', result)
          this.worlds = result.data.records
          this.hasMoreResults = result.data.hasMoreResults
        })
        .catch((error) => {
          logger.default.error('Cannot fetch worlds', error)
          this.worlds = []
          this.hasMoreResults = null
        })
    }
  }
})
