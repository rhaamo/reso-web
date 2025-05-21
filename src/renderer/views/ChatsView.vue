<template>
  <main class="pt-5">
    <BContainer class="bv-example-row">
      <BRow>
        <BCol cols="4">
          <BListGroup>
            <BListGroupItem
              :active="selectedContact.id == contact.id"
              :href="`#${contact.id}`"
              v-for="contact in contacts"
              :key="contact.id"
              @click.prevent="loadMessages(contact)"
            >
              <BRow>
                <BCol cols="4">
                  <BImg
                    v-if="contact.profile && resDbToAsset(contact.profile.iconUrl)"
                    :src="resDbToAsset(contact.profile.iconUrl)"
                    fluid
                    alt="Profile picture"
                    rounded="circle"
                  />
                </BCol>
                <BCol>
                  <div class="flex-column align-items-start">
                    <div class="d-flex w-100 justify-content-between">
                      <h5 class="mb-1">
                        {{ contact.contactUsername }}
                        <small>
                          <BBadge v-if="contact.profile && contact.profile.tagline">
                            {{ contact.profile.tagline }}
                          </BBadge>
                        </small>
                      </h5>
                    </div>
                    <small v-if="contact.profile && contact.profile.description">
                      {{ contact.profile.description }}
                    </small>
                    <p class="mb-1" v-if="!contact.isAccepted">
                      <i class="ri-question-mark"></i> Request sent
                    </p>
                    <p class="mb-1" v-if="contact.isAccepted">
                      <i class="ri-circle-fill"></i>
                      {{ contact.onlineStatus || 'Offline' }}
                    </p>
                  </div>
                </BCol></BRow
              >
            </BListGroupItem>
          </BListGroup>
        </BCol>

        <BCol v-if="!selectedContact">Please select a contact to chat with.</BCol>
        <BCol v-else>
          <BCard header-tag="header" footer-tag="footer">
            <template #header>
              <h6 class="mb-0">{{ selectedContact.contactUsername }}</h6>
            </template>
            <BCardText class="allMsgs">
              <div ref="messagesContainer" id="messagesContainer">
                <div v-for="msg in selectedContactMessages" :key="msg.id">
                  <BRow v-if="msg.recipientId == selectedContact.id">
                    <BCol cols="6"></BCol>
                    <BCol cols="6">
                      <BCard class="msgOurs">
                        <template v-if="msg.messageType == 'Text'">{{ msg.content }}</template>
                        <template v-else>Unhandled message type</template>
                        <template #footer>
                          <span class="float-end">
                            <template v-if="!msg.readTime">
                              <i class="ri-check-line"></i>&nbsp;
                            </template>
                            <template v-else> <i class="ri-check-double-line"></i>&nbsp; </template>
                            {{ getMsgTime(msg.sendTime) }}
                          </span>
                        </template>
                      </BCard>
                    </BCol>
                  </BRow>
                  <BRow v-else>
                    <BCol cols="6">
                      <BCard class="msgTheirs">
                        <template v-if="msg.messageType == 'Text'">{{ msg.content }}</template>
                        <template v-else>Unhandled message type</template>
                        <template #footer>
                          <span class="float-end">
                            <template v-if="!msg.readTime">
                              <i class="ri-check-line"></i>&nbsp;
                            </template>
                            <template v-else> <i class="ri-check-double-line"></i>&nbsp; </template>
                            {{ getMsgTime(msg.sendTime) }}
                          </span>
                        </template>
                      </BCard>
                    </BCol>
                    <BCol cols="6"></BCol>
                  </BRow>
                </div>
                <div ref="bottomOfMessages" id="bottomOfMessages"></div>
              </div>
            </BCardText>
            <template #footer>
              <BForm autocomplete="off" @submit.prevent="sendMessage()">
                <BFormInput v-model="inputMessage" placeholder="UwU~" autocomplete="off" />
              </BForm>
            </template>
          </BCard>
        </BCol>
      </BRow>
    </BContainer>
  </main>
</template>

<style scoped>
.msgOurs {
  background-color: #72333f;
}

.msgTheirs {
  background-color: #3d3233;
}

.allMsgs {
  max-height: 30em;
  overflow-y: scroll;
  overflow-x: hidden;
}
</style>

<script>
import logger from '@/renderer/logging'
import { useUserStore } from '@/renderer/stores/user'
import { useHubStore } from '@/renderer/stores/hub'
import resoniteApiClient from '@/renderer/resonite-api/client'
// import { ref } from 'vue'

// TODO: contacts filtering by status, if I manage to get status :')

export default {
  setup: () => ({
    userStore: useUserStore(),
    hubStore: useHubStore()
  }),
  data: () => ({
    contacts: [],
    selectedContact: '',
    selectedContactMessages: [],
    inputMessage: ''
  }),
  created() {
    logger.default.info('Chats: check for login...')

    // Check if we are logged in, if not, redirect to login page
    if (!this.userStore.isLoggedIn) {
      logger.default.info('not logged in, redirecting...')
      this.$router.push({
        name: 'login'
      })
    } else {
      logger.default.info('we are')
    }
    // this.fetchUsers()
  },
  beforeUnmount() {
    // Remove the handlers
    this.hubStore.connection.off('ReceiveStatusUpdate', this.contactStatusUpdate)
    this.hubStore.connection.off('MessageSent', this.updateMessages)
    this.hubStore.connection.off('ReceiveMessage', this.updateMessages)
  },
  mounted() {
    this.$nextTick(() => {
      this.hubStore.initHubConnection().then(async () => {
        // First do a call for InitializeContact, which should returns your contact list
        await this.hubStore.connection.stream('InitializeContacts').subscribe({
          next: (item) => {
            this.contactStatusUpdate(item)
          },
          complete: () => {},
          error: (err) => {
            console.log('Error while doing a ReceiveStatusUpdate', err)
          }
        })

        // Then register a handler to get status updates
        this.hubStore.connection.on('ReceiveStatusUpdate', this.contactStatusUpdate)
        // And one for messages sent
        this.hubStore.connection.on('MessageSent', this.updateMessages)
        // And received
        this.hubStore.connection.on('ReceiveMessage', this.updateMessages)

        // Then a RequestStatus, with null and false as arguments
        // TODO Migrate that to a function located in hubStore
        await this.hubStore.connection
          .invoke('RequestStatus', null, false)
          .catch(async (error) => {
            logger.default.error('RequestStatus null,false err', error)
          })
          .then((res) => {
            logger.default.info('RequestStatus null,false success', res)
          })

        // Send my own status update
        // This should be moved into the navbar on the right with a dropdown for the status
        let curDate = new Date(Date.now()).toISOString()
        let ourStatus = [
          {
            userId: this.userStore.userId, // ourself
            userSessionId: this.userStore.userSessionId,
            sessionType: 'ChatClient', // Chat Client
            outputDevice: 'Unknown',
            isMobile: false,
            onlineStatus: 'Online', // Online
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
        // TODO Timer to resend periodically
        // TODO Migrate that to a function located in hubStore
        await this.hubStore.connection
          .invoke('BroadcastStatus', ...ourStatus)
          .catch(async (error) => {
            logger.default.error('BroadcastStatus err', error)
          })
          .then(async (res) => {
            logger.default.info('BroadcastStatus success', res)
          })
        logger.default.info('ourStatus', ourStatus)
      })
    })
  },
  methods: {
    contactStatusUpdate(statusUpdate) {
      logger.default.info('contactStatusUpdate', statusUpdate)
      let contactIdx = this.contacts.findIndex((el) => el.id === statusUpdate.userId)
      if (contactIdx && contactIdx >= 0) {
        console.log('contact idx', contactIdx)
        // Merge the contact with the status update
        logger.default.info(`User ${statusUpdate.id} already exist, merging status`)
        this.contacts[contactIdx] = Object.assign(this.contacts[contactIdx], statusUpdate)
      } else {
        // Create a new user
        logger.default.info(`User ${statusUpdate.id} didn't exist`)
        this.contacts.push(statusUpdate)
      }
    },
    resDbToAsset(resdb) {
      if (resdb) {
        return resoniteApiClient.getAssetsDomainUrl(resdb)
      } else {
        return null
      }
    },
    getMsgTime(date) {
      let d = new Date(date)
      return `${d.getHours()}:${d.getMinutes()}`
    },
    loadMessages(user) {
      logger.default.info(`We want to chat with ${user.id} (${user.contactUsername})`)
      this.selectedContact = user
      this.selectedContactMessages = []
      resoniteApiClient
        .getUserMessages(this.userStore.userId, this.userStore.token, user.id, null)
        .then((response) => {
          // Reverse to have latest message at the bottom
          this.selectedContactMessages = response.data.reverse()

          // Then scroll to bottom of messages
          this.goToBottomOfMessages()
        })
    },
    goToBottomOfMessages() {
      this.$nextTick(() => {
        this.$refs.bottomOfMessages.scrollIntoView({ behavior: 'smooth' })
      })
    },
    sendMessage() {
      logger.default.info(
        `We want to send '${this.inputMessage}' to ${this.selectedContact.id} (${this.selectedContact.contactUsername})`
      )
      // send message
      this.hubStore
        .hubSendTextMessage(this.selectedContact.id, this.inputMessage)
        .then(() => {
          // clear input
          this.inputMessage = ''
        })
        .catch((error) => {
          logger.default.error('Cannot send message', error)
          // TODO error handling
        })
    },
    updateMessages(message) {
      logger.default.info('A message has been sent:', message)
      this.selectedContactMessages.push(message)
      // Then scroll to bottom of messages
      this.goToBottomOfMessages()
    }
  }
}
</script>
