<template>
  <main class="pt-5">
    <BContainer class="bv-example-row">
      <BRow>
        <BCol cols="3">
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
                      <i class="ri-circle-fill"></i> Status
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
              <div ref="messagesContainer">
                <div v-for="msg in selectedContactMessages" :key="msg.id">
                  <BRow v-if="msg.recipientId == selectedContact.id">
                    <BCol cols="6"></BCol>
                    <BCol cols="6">
                      <div class="msgOurs" v-if="msg.messageType == 'Text'">{{ msg.content }}</div>
                      <div class="msgOurs" v-else>Unhandled message type</div>
                    </BCol>
                  </BRow>
                  <BRow v-else>
                    <BCol cols="6">
                      <div class="msgTheirs" v-if="msg.messageType == 'Text'">
                        {{ msg.content }}
                      </div>
                      <div class="msgOurs" v-else>Unhandled message type</div>
                    </BCol>
                    <BCol cols="6"></BCol>
                  </BRow>
                </div>
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
  background-color: blue;
}

.msgTheirs {
  background-color: grey;
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
import { v4 as uuidv4 } from 'uuid'

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
    this.fetchUsers()
  },
  mounted() {
    this.$nextTick(() => {
      this.hubStore.initHubConnection().then(async () => {
        this.hubStore.connection.on('ReceiveStatusUpdate', (items) => {
          logger.default.info('ReceiveStatusUpdate:', items)
        })
        // IDK, initial own status ?
        await this.hubStore.hubInitializeStatus()

        // Ask for a status update for all contacts ?
        // TODO Migrate that to a function located in hubStore
        await this.hubStore.connection
          .invoke('RequestStatus', null, false)
          .catch(async (error) => {
            logger.default.error('RequestStatus null,false err', error)
          })
          .then((res) => {
            logger.default.info('RequestStatus null,false success', res)
          })

        // Ask for a status update for a specific contact ?
        // TODO Migrate that to a function located in hubStore
        this.contacts.forEach(async (contact) => {
          await this.hubStore.connection
            .invoke('RequestStatus', contact.id, false)
            .catch(async (error) => {
              logger.default.debug(`Asking refresh for ${contact.id}`)
              logger.default.error('RequestStatus userId,false err', error)
            })
            .then((res) => {
              logger.default.debug(`Asking refresh for ${contact.id}`)
              logger.default.info('RequestStatus userId,false success', res)
            })
        })

        // Send my own status update
        let curDate = new Date()
        let ourStatus = [
          {
            userId: this.userStore.userId, // ourself
            onlineStatus: 'Online', // Online
            lastStatusChange: curDate.toISOString(),
            isPresent: true,
            lastPresenceTimestamp: curDate.toISOString(),
            userSessionId: uuidv4(),
            currentSessionIndex: -1,
            sessions: [],
            appVersion: '0.0.0 beta of reso-web',
            outputDevice: 'Unknown',
            isMobile: false,
            compatibilityHash: resoniteApiClient.COMPAT,
            sessionType: 'ChatClient' // Chat Client
          },
          {
            group: 1, // idk
            targetIds: null // either
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
    fetchUsers() {
      logger.default.info('Refreshing contacts...')
      resoniteApiClient
        .fetchContacts(this.userStore.userId, this.userStore.token)
        .then((result) => {
          logger.default.info('Fetched contacts', result)
          this.contacts = result.data
        })
        .catch((error) => {
          logger.default.error('Cannot fetch contacts', error)
          // TODO error handling
          this.contacts = []
        })
    },
    resDbToAsset(resdb) {
      if (resdb) {
        return resoniteApiClient.getAssetsDomainUrl(resdb)
      } else {
        return null
      }
    },
    loadMessages(user) {
      logger.default.info(`We want to chat with ${user.id} (${user.contactUsername})`)
      this.selectedContact = user
      this.selectedContactMessages = []
      resoniteApiClient
        .getUserMessages(this.userStore.userId, this.userStore.token, user.id, null)
        .then((response) => {
          this.selectedContactMessages = response.data.reverse()
          // TODO FIXME broken lol
          // const messagesContainer = ref()
          // messagesContainer.scrollTop = messagesContainer.scrollHeight
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
    }
  }
}
</script>
