import { defineStore } from 'pinia'

export const useHubSessionsStore = defineStore('hubSessions', {
  persist: false,
  state: () => ({
    sessions: [],
    filters: {
      name: '',
      hostName: '',
      minActiveUsers: 1,
      includeEnded: false,
      includeEmptyHeadless: false,
      includeIncompatible: false
    }
  }),
  getters: {},
  actions: {
    reset() {
      this.sessions = []
      this.filters.name = ''
      this.filters.hostName = ''
      this.filters.minActiveUsers = 1
      this.filters.includeEnded = false
      this.filters.includeEmptyHeadless = false
      this.filters.includeIncompatible = false
    },
    async fetchSessions() {},
    async registerHandlers() {},
    async deregisterHandlers() {},
    addSession() {},
    removeSession() {},
    updateSession() {}
  }
})
