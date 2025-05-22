<template>
  <main class="pt-5">
    <BContainer class="bv-example-row">
      <BRow>
        <BCol cols="4">
          <BListGroup>
            <BListGroupItem
              :active="selectedContact?.id == contact.id"
              :href="`#${contact.id}`"
              v-for="contact in contacts"
              :key="contact.id"
              @click.prevent="showMessages(contact)"
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
import { useHubContactsStore } from '@/renderer/stores/hubContacts'
import resoniteApiClient from '@/renderer/resonite-api/client'
import { mapState } from 'pinia'
import { useToastController } from 'bootstrap-vue-next'

// TODO: contacts filtering by status, if I manage to get status :')

export default {
  setup: () => ({
    userStore: useUserStore(),
    hubStore: useHubStore(),
    toasty: useToastController(),
    hubContactStore: useHubContactsStore()
  }),
  data: () => ({
    selectedContact: null,
    inputMessage: ''
  }),
  computed: {
    ...mapState(useHubContactsStore, {
      contacts(store) {
        return store.contacts
      },
      selectedContactMessages(store) {
        if (!this.selectedContact) {
          return []
        }
        return store.contactsMessages[this.selectedContact.id]
      }
    })
  },
  created() {
    // Check if we are logged in, if not, redirect to login page
    if (!this.userStore.isLoggedIn) {
      logger.default.info('Logged in status: nope, redirecting to login page')
      this.$router.push({
        name: 'login'
      })
    } else {
      logger.default.info('Logged in status: we are good')
    }
  },
  beforeUnmount() {},
  mounted() {},
  watch: {
    selectedContactMessages: function () {
      // TODO FIXME doesn't always trigger :(
      this.goToBottomOfMessages()
    }
  },
  methods: {
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
          this.goToBottomOfMessages()
        })
        .catch((error) => {
          logger.default.error('Cannot send message', error)
          this.toasty.create({
            title: 'Sending message',
            body: `Failed to send message :( (${error})`,
            modelValue: 3000,
            variant: 'danger'
          })
        })
    },
    showMessages(contact) {
      logger.default.info(`Selected ${contact.id} for chat`, contact)
      this.hubContactStore.fetchUserMessages(contact).then(() => {
        this.selectedContact = contact
        this.goToBottomOfMessages()
      })
    }
  }
}
</script>
