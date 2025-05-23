import { defineStore } from 'pinia'
import resoniteApiClient from '@/renderer/resonite-api/client'
import { useUserStore } from '@/renderer/stores/user'
import logger from '@/renderer/logging'
import { useHubStore } from '@/renderer/stores/hub'

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
    },
    async fetchSessions() {
      const userStore = useUserStore()
      resoniteApiClient
        .getSessions(userStore.userId, userStore.token, this.filters)
        .then((result) => {
          logger.default.info('Fetched sessions', result)
          this.sessions = result.data
        })
        .catch((error) => {
          logger.default.error('Cannot fetch sessions', error)
          this.sessions = []
        })
    },
    async registerHandlers() {
      const hubStore = useHubStore()
      hubStore.connection.on('ReceiveSessionUpdate', this.updateSession)
      hubStore.connection.on('RemoveSession', this.removeSession)
    },
    async deregisterHandlers() {
      const hubStore = useHubStore()
      hubStore.connection.off('ReceiveSessionUpdate', this.updateSession)
      hubStore.connection.off('RemoveSession', this.removeSession)
    },
    removeSession(session) {
      let sessionIdx = this.sessions.findIndex((el) => el.sessionId === session.sessionId)
      if (sessionIdx >= 0) {
        this.sessions.splice(sessionIdx, 1)
      }
    },
    updateSession(session) {
      // No real need for filtering, if we have a session already "known" then update it
      // else, just don't do anything
      let sessionIdx = this.sessions.findIndex((el) => el.sessionId === session.sessionId)
      if (sessionIdx >= 0) {
        this.sessions[sessionIdx] = Object.assign(this.sessions[sessionIdx], session)
      }
    }
  }
})
