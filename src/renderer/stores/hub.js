import { defineStore } from 'pinia'
import { HubConnectionBuilder, LogLevel as HubLogLevel } from '@microsoft/signalr'

import logger from '@/renderer/logging'
import { useUserStore } from '@/renderer/stores/user'
import resoniteApiClient from '@/renderer/resonite-api/client'
import { v4 as uuidv4 } from 'uuid'

// Some docs: https://github.com/Lexevolution/Skyfrost-Unofficial-Docs/

// All .send or .invoke on the SignalR thingy ends up with:
// {"type":3,"invocationId":"4","result":null}
// so idk... but we receive correctly the session updates
// it's just that anything send to it just seems to silently fail

// example:
// TX: {"arguments":[],"invocationId":"0","target":"InitializeStatus","type":1}
// RX: {"type":3,"invocationId":"0","result":null}
// ReCon send:
// {type: 1, invocationId: 38c6f633-ef56-45cc-884c-63577d161b08, target: InitializeStatus, arguments: []}

// send message from ReCon
// {type: 1,
// invocationId: 818ee13c-41d0-48d9-9c8d-4997a6899eb2,
// target: SendMessage,
// arguments:
// [
// {
// id: MSG-cd12647e-1b32-48bd-93e7-f6a8abbaeac4,
// recipientId: U-1QStUlUj0gy,
// senderId: U-1QStUlUj0gy,
// ownerId: U-1QStUlUj0gy,
// messageType: Text,
// content: woof, sendTime: 2025-05-19T20:21:45.968555Z}]}
// well the hub returns
// {type: 3, invocationId: 818ee13c-41d0-48d9-9c8d-4997a6899eb2, result: null}
// anyway...

export const useHubStore = defineStore('hub', {
  persist: false,
  state: () => ({
    connection: null,
    connected: false
  }),
  actions: {
    async initHubConnection() {
      const userStore = useUserStore()

      // Init hub
      if (!this.connection) {
        this.connection = new HubConnectionBuilder()
          .withUrl(`${resoniteApiClient.API}/hub`, {
            headers: {
              Authorization: userStore.fullToken
              // Are thoses two really required ? ReCon doesn't seems to have them
              // "UID": resoniteApiClient.MACHINEID,
              // "SecretClientAccessKey": resoniteApiClient.KEY
            }
          })
          .withAutomaticReconnect()
          .configureLogging(HubLogLevel.Debug)
          .build()

        this.connection.on('ReceiveSessionUpdate', () => {
          // spammy so ignore for now
          // logger.default.debug('ReceiveSessionUpdate:', items)
        })

        this.connection.on('debug', (items) => {
          logger.default.info('debug:', items)
        })

        this.connection.on('ReceiveStatusUpdate', (items) => {
          logger.default.info('ReceiveStatusUpdate:', items)
        })

        this.connection.on('RemoveSession', () => {
          // logger.default.info('RemoveSession:', items)
        })

        this.connection.on('ReceiveMessage', (items) => {
          logger.default.info('ReceiveMessage:', items)
        })

        this.connection.on('MessageSent', (items) => {
          logger.default.info('MessageSent:', items)
        })
        logger.default.info('Resonite SignalR HUB Initialized')
      } else {
        logger.default.info('Resonite SignalR HUB Already initialized, skipping')
      }

      // Start connection
      await this.startHubConnection()
    },
    async stopHubConnection() {
      if (!this.connected) {
        return
      }

      try {
        await this.connection.stop()
        this.connected = false
        logger.default.info('Resonite SignalR HUB Disconnected')
      } catch (err) {
        this.connected = null
        logger.default.error('Resonite SignalR HUB Disconnection Error:', err)
      }
    },
    async startHubConnection() {
      if (this.connected) {
        return
      }

      const userStore = useUserStore()
      if (!userStore.isLoggedIn) {
        logger.default.info('Wanting to start the SignalR HUB but isLoggedIn==false')
        return null
      }

      try {
        await this.connection.start()
        logger.default.info('Resonite SignalR HUB Connected')
        this.connected = true
      } catch (err) {
        logger.default.error('Resonite SignalR HUB Connection Error:', err)
        this.connected = null
      }
    },
    async hubInitializeStatus() {
      return this.connection
        .invoke('InitializeStatus')
        .catch(async (error) => {
          logger.default.error('hubInitializeStatus err', error)
        })
        .then((res) => {
          logger.default.info('hubInitializeStatus success', res)
        })
    },
    async hubRequestStatus() {},
    async hubBroadcastStatus() {},
    async hubSendTextMessage(toUserId, message) {
      const userStore = useUserStore()

      let msg = {
        id: `MSG-${uuidv4()}`,
        senderId: userStore.userId,
        ownerId: userStore.userId,
        recipientId: toUserId,
        messageType: 'Text',
        sendTime: new Date().toISOString(),
        // lastUpdateTime: new Date().toISOString(),
        content: message
      }

      logger.default.info('Sending TextMessage:', msg)

      await this.connection
        .invoke('SendMessage', msg)
        .catch(async (error) => {
          logger.default.error(error)
        })
        .then((res) => {
          logger.default.info(res)
        })
    }
  }
})
