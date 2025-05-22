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
    ourStatus: 'Online',
    statusInterval: null
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
      this.contacts = [] // first reset contacts list before adding them
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
      hubStore.connection.on('MessageSent', this.addSentMessage)
      hubStore.connection.on('ReceiveMessage', this.addReceivedMessage)
      // every 150 seconds, broadcast our status
      this.statusInterval = setInterval(this.broadcastMyStatus, 150000)
      logger.default.info('Registered various handlers')
    },
    async deregisterHandlers() {
      const hubStore = useHubStore()
      hubStore.connection.off('ReceiveStatusUpdate', this.contactStatusUpdate)
      hubStore.connection.off('MessageSent', this.addSentMessage)
      hubStore.connection.off('ReceiveMessage', this.addReceivedMessage)
      clearInterval(this.statusInterval)
      logger.default.info('Unregistered various handlers')
    },
    contactStatusUpdate(statusUpdate) {
      logger.default.info('We need to handle a status update:', statusUpdate)
      let userId = statusUpdate.id || statusUpdate.userId
      let contactIdx = this.contacts.findIndex((el) => el.id === userId || el.userId === userId)
      if (contactIdx >= 0) {
        // Merge the contact with the status update
        logger.default.info(
          `User id:${statusUpdate.id}/userId:${statusUpdate.userId} already exist, merging status`
        )
        this.contacts[contactIdx] = Object.assign(this.contacts[contactIdx], statusUpdate)
      } else {
        // Create a new user
        logger.default.info(
          `User id:${statusUpdate.id}/userId:${statusUpdate.userId} didn't exist, creating`
        )
        this.contacts.push(statusUpdate)
      }
    },
    addSentMessage(message) {
      logger.default.info('Got a message to add to the list', message)
      this.contactsMessages[message.recipientId].push(message)
    },
    addReceivedMessage(message) {
      logger.default.info('Got a message to add to the list', message)
      this.contactsMessages[message.senderId].push(message)
    },
    async fetchUserMessages(user) {
      logger.default.info('Fetching messages for', user)
      const userStore = useUserStore()
      await resoniteApiClient
        .getUserMessages(userStore.userId, userStore.token, user.id, null)
        .then((response) => {
          // Reverse to have latest message at the bottom
          this.contactsMessages[user.id] = response.data.reverse()
        })
    },
    async broadcastMyStatus() {
      await this.broadcastStatus(this.ourStatus)
    },
    async broadcastStatus(status = 'Online') {
      const userStore = useUserStore()
      const hubStore = useHubStore()

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

      await hubStore.connection
        .invoke('BroadcastStatus', ...ourStatus)
        .catch(async (error) => {
          logger.default.error('broadcastStatus error', error)
        })
        .then(async (res) => {
          logger.default.info('We have broadcasted our status', status, res)
          this.ourStatus = status
          userStore.lastStatus = status
        })
    },
    async requestStatus(userId = null) {
      const hubStore = useHubStore()
      await hubStore.connection
        .invoke('RequestStatus', userId, false)
        .catch(async (error) => {
          logger.default.error(`RequestStatus ${userId},false err`, error)
        })
        .then((res) => {
          logger.default.info(`RequestStatus ${userId},false success`, res)
        })
    },
    async requestStatues() {
      this.contacts.forEach(async (el) => await this.requestStatus(el.id || el.userId || null))
    }
  }
})
