import { defineStore } from 'pinia'
import {
  HubConnectionBuilder,
  LogLevel as HubLogLevel,
  HttpTransportType
} from '@microsoft/signalr'

import logger from '@/renderer/logging'
import { useUserStore } from '@/renderer/stores/user'
import resoniteApiClient from '@/renderer/resonite-api/client'
import { v4 as uuidv4 } from 'uuid'

// Some docs: https://github.com/Lexevolution/Skyfrost-Unofficial-Docs/

export const useHubStore = defineStore('hub', {
  persist: false,
  state: () => ({
    connection: null,
    connected: false
  }),
  actions: {
    async initHubConnection() {
      logger.default.info('HUB: init')
      const userStore = useUserStore()

      // Init hub
      if (!this.connection) {
        this.connection = new HubConnectionBuilder()
          // Here is a fun one!
          // YOU CAN'T SEND CUSTOM HEADERS WITH WEBSOCKETS FROM THE BROWSER
          // https://github.com/Azure/azure-signalr/issues/1495#issuecomment-1238386753
          .withUrl(`${resoniteApiClient.API}/hub`, {
            // skipNegotiation: true,
            // No websocket for us sadly
            transport: HttpTransportType.LongPolling,
            // transport: HttpTransportType.ServerSentEvents, // apparently no custom headers for you too
            headers: {
              Authorization: userStore.fullToken,
              // Are thoses two really required ? ReCon doesn't seems to have them
              UID: resoniteApiClient.MACHINEID,
              SecretClientAccessKey: resoniteApiClient.KEY
            }
          })
          .withAutomaticReconnect()
          .configureLogging(HubLogLevel.Critical)
          .build()

        this.connection.on('debug', (items) => {
          logger.default.info('Debug from the HUB:', items)
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
        logger.default.info('HUB: already started')
        return
      }
      logger.default.info('HUB: start')

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
        ownerId: userStore.userId,
        senderId: userStore.userId,
        recipientId: toUserId,
        // The senderUserSessionId is found when resonite does a PUT on /users/U-serId/rsa/<*UUID*> with an RSA key:
        /*
        "Exponent": "MEOW",
        "Modulus": "rg+farts==",
        "P": null,
        "Q": null,
        "DP": null,
        "DQ": null,
        "InverseQ": null,
        "D": null
        */
        // IDK if that UUID is really needed
        // senderUserSessionId: uuidv4(),
        senderUserSessionId: userStore.userSessionId,
        messageType: 'Text',
        content: message,
        sendTime: new Date(Date.now()).toISOString(),
        lastUpdateTime: '0001-01-01T00:00:00', // *shrug*
        readTime: null,
        isMigrated: false
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
