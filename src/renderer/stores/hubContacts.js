import { defineStore } from 'pinia'
import logger from '@/renderer/logging'
import { useHubStore } from '@/renderer/stores/hub'
import { useUserStore } from '@/renderer/stores/user'
import resoniteApiClient from '@/renderer/resonite-api/client'

export const useHubContactsStore = defineStore('hubContacts', {
  persist: false,
  state: () => ({
    contacts: [],
    contactsMessages: {},
    ourStatus: 'Online'
  }),
  getters: {},
  actions: {
    reset() {
      this.contacts = []
      this.contactsMessages = {}
      this.ourStatus = 'Online'
    },
    async fetchInitialContacts() {
      const hubStore = useHubStore()
      await hubStore.connection.stream('InitializeContacts').subscribe({
        next: (item) => {
          this.contactStatusUpdate(item)
        },
        complete: () => {},
        error: (err) => {
          logger.default.error('hubContact [fetchInitialContacts] error', err)
        }
      })
    },
    async registerHandlers() {
      const hubStore = useHubStore()
      hubStore.connection.on('ReceiveStatusUpdate', this.contactStatusUpdate)
      hubStore.connection.on('MessageSent', this.updateMessages)
      hubStore.connection.on('ReceiveMessage', this.updateMessages)
    },
    async deregisterHandlers() {
      const hubStore = useHubStore()
      hubStore.connection.off('ReceiveStatusUpdate', this.contactStatusUpdate)
      hubStore.connection.off('MessageSent', this.updateMessages)
      hubStore.connection.off('ReceiveMessage', this.updateMessages)
    },
    contactStatusUpdate(statusUpdate) {
      let contactIdx = this.contacts.findIndex((el) => el.id === statusUpdate.userId)
      if (contactIdx && contactIdx >= 0) {
        // Merge the contact with the status update
        logger.default.info(`User ${statusUpdate.id} already exist, merging status`)
        this.contacts[contactIdx] = Object.assign(this.contacts[contactIdx], statusUpdate)
      } else {
        // Create a new user
        logger.default.info(`User ${statusUpdate.id} didn't exist, creating`)
        this.contacts.push(statusUpdate)
      }
    },
    updateMessages(message) {
      // TODO FIXME .ownerId correct ?
      logger.default.info('Got a message to add to the list', message)
      this.contactsMessages[message.ownerId].push(message)
    },
    async fetchUserMessages(user) {
      logger.default.info('Fetching messages for', user)
      await resoniteApiClient
        .getUserMessages(this.userStore.userId, this.userStore.token, user.id, null)
        .then((response) => {
          // Reverse to have latest message at the bottom
          this.contactsMessages[user.id] = response.data.reverse()
        })
    },
    async broadcastStatus(status = 'Online') {
      const userStore = useUserStore()
      let curDate = new Date(Date.now()).toISOString()
      let ourStatus = [
        {
          userId: userStore.userId, // ourself
          userSessionId: userStore.userSessionId,
          sessionType: 'ChatClient', // Chat Client
          outputDevice: 'Unknown',
          isMobile: false,
          onlineStatus: status, // Online
          isPresent: true,
          lastPresenceTimestamp: curDate,
          lastStatusChange: curDate,
          // hashSalt: '???', // Probably linked to the RSA key ?
          appVersion: '1.0.0 beta of reso-web',
          compatibilityHash: resoniteApiClient.COMPAT,
          // See hubSendTextMessage in store/hub.js for more infos about that RSA key
          // publicRSAKey: {
          //   Exponent: 'xxx',
          //   Modulus: 'xxx',
          //   P: null,
          //   Q: null,
          //   DP: null,
          //   DQ: null,
          //   InverseQ: null,
          //   D: null
          // },
          // I guess if there is no session, it would be -1 ?
          // Resonite did connect to my home and has a session filled then... (and sessionIndex 1, not 0)
          currentSessionIndex: -1,
          sessions: []
        },
        {
          // 0 Public, 1 AllContacts, SpecificContacts, BroadcastKey, ConnectionIds
          group: 0, // AllContacts
          targetIds: null // no targets when 0 and 1
        }
      ]

      await this.hubStore.connection
        .invoke('BroadcastStatus', ...ourStatus)
        .catch(async (error) => {
          logger.default.error('broadcastStatus err', error)
        })
        .then(async (res) => {
          logger.default.info('broadcastStatus success', res)
        })
    },
    async requestStatus() {
      await this.hubStore.connection
        .invoke('RequestStatus', null, false)
        .catch(async (error) => {
          logger.default.error('RequestStatus null,false err', error)
        })
        .then((res) => {
          logger.default.info('RequestStatus null,false success', res)
        })
    }
  }
})
