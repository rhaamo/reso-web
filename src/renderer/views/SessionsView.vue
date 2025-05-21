<template>
  <BContainer class="bv-example-row pt-5">
    <BButton v-b-toggle="'collapse-filter-options'" variant="primary">Filter options</BButton>

    <BCollapse id="collapse-filter-options">
      <BForm @submit.prevent="filterSessions()" class="mb-3">
        <BRow>
          <BCol cols="5">
            <BFormGroup
              label-cols-lg="4"
              label="Session name:"
              label-for="sessionFiltersSessionName"
            >
              <BFormInput id="sessionFiltersSessionName" v-model="sessionsFilters.name" />
            </BFormGroup>
            <BFormGroup label-cols-lg="4" label="Host name:" label-for="sessionFiltersHostName">
              <BFormInput id="sessionFiltersHostName" v-model="sessionsFilters.hostName" />
            </BFormGroup>
            <BFormGroup label-cols-lg="4" label="Min users:" label-for="sessionFiltersMinUsers">
              <BFormSpinbutton
                id="sessionFiltersMinUsers"
                v-model="sessionsFilters.minActiveUsers"
                min="0"
                max="999"
              />
            </BFormGroup>
          </BCol>

          <BCol cols="3">
            <BFormCheckbox
              id="filterIncludeEnded"
              v-model="sessionsFilters.includeEnded"
              name="filterIncludeEnded"
            >
              Include Ended
            </BFormCheckbox>
            <BFormCheckbox
              id="filterIncludeEmptyHeadless"
              v-model="sessionsFilters.includeEmptyHeadless"
              name="filterIncludeEmptyHeadless"
            >
              Include Empty Headless
            </BFormCheckbox>
            <BFormCheckbox
              id="filterIncludeIncompatible"
              v-model="sessionsFilters.includeIncompatible"
              name="filterIncludeIncompatible"
            >
              Include Incompatible
            </BFormCheckbox>
          </BCol>

          <BCol cols="1">
            <BButton variant="primary" type="submit">filter</BButton>
          </BCol>
        </BRow>
      </BForm>
    </BCollapse>

    <hr />

    <BCardGroup columns>
      <a
        :href="`#${session.sessionId}`"
        v-for="session in sessions"
        :key="session.sessionId"
        @click.prevent="showModal(session)"
      >
        <BCard style="max-width: 20rem" :img-src="session.thumbnailUrl" img-top>
          <BCardImg></BCardImg>
          <BCardTitle v-html="formatText(session.name)"></BCardTitle>
          <BCardText> {{ session.totalActiveUsers }}/{{ session.maxUsers }} Online </BCardText>
        </BCard>
      </a>
    </BCardGroup>
  </BContainer>

  <BModal
    no-close-on-backdrop
    no-footer
    size="lg"
    v-if="showSessionInfosModal"
    v-model="showSessionInfosModal"
    id="modal-session-infos"
  >
    <template #title><span v-html="formatText(sessionDetails.name)"></span></template>
    <div
      id="sphere-world-preview"
      ref="sphere-world-preview"
      style="width: 48rem; height: 30rem"
    ></div>
    <hr />
    <template v-if="sessionDetails.description">
      <span v-html="formatText(sessionDetails.description)"></span>
      <hr />
    </template>
    <template v-if="sessionDetails.correspondingWorldId">
      <!-- TODO get the username for .ownerId from an API call, and probably cache it a bit -->
      A world by {{ sessionDetails.correspondingWorldId.ownerId }}, last updated on
      {{ formatDateYYYMMDD(sessionDetails.lastUpdate) }}.
      <br />
    </template>
    Tags:
    <BBadge variant="info" v-for="tag in sessionDetails.tags" :key="tag">{{ tag }}</BBadge>
    <br />
    Access level: {{ sessionDetails.accessLevel }}
    <br />
    <template v-if="sessionDetails.headlessHost">
      Headless: {{ sessionDetails.headlessHost }} ({{ sessionDetails.hostUsername }})
    </template>
    <br />
    Users [{{ sessionDetails.activeUsers }}/{{ sessionDetails.maxUsers }}]:
    <ul>
      <li v-for="user in sessionDetails.sessionUsers" :key="user.userId">
        {{ user.username }} (<template v-if="!user.isPresent">inactive</template
        ><template v-else>active</template
        ><template v-if="user.userID === sessionDetails.hostUserId">, session host</template>)
      </li>
    </ul>
  </BModal>
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
import { useModal } from 'bootstrap-vue-next'
import { Viewer as PhotoSphereViewer } from '@photo-sphere-viewer/core'
import { parseResoniteText } from '@/renderer/utils/resonite'

export default {
  setup: () => ({
    userStore: useUserStore(),
    hubStore: useHubStore(),
    sessionInfosModal: useModal('#modal-session-infos')
  }),
  data: () => ({
    sessions: [],
    showSessionInfosModal: false,
    sessionDetails: {},
    photoSphereViewer: null,
    sessionsFilters: {
      name: '',
      hostName: '',
      minActiveUsers: 1,
      includeEnded: false,
      includeEmptyHeadless: false,
      includeIncompatible: false
    }
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
    this.fetchSessions()
  },
  mounted() {
    this.hubStore.initHubConnection().then(async () => {
      this.hubStore.connection.on('ReceiveSessionUpdate', this.handleSessionUpdate)
      // TODO: Add session and Remove session
    })
  },
  unmounted() {
    this.hubStore.connection.off('ReceiveSessionUpdate', this.handleSessionUpdate)
  },
  methods: {
    formatText(text) {
      return parseResoniteText(text)
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handleSessionUpdate(item) {
      // spammy
      //logger.default.info('Got session update: ', item)
      // TODO FIXME pls
    },
    formatDateYYYMMDD(date) {
      return new Date(date).toLocaleString()
    },
    fetchSessions() {
      logger.default.info('Refreshing sessions...')
      resoniteApiClient
        .getSessions(this.userStore.userId, this.userStore.token, this.sessionsFilters)
        .then((result) => {
          logger.default.info('Fetched sessions', result)
          this.sessions = result.data
        })
        .catch((error) => {
          logger.default.error('Cannot fetch sessions', error)
          // TODO error handling
          this.sessions = []
        })
    },
    filterSessions() {
      logger.default.info('Reloading sessions with new filter')
      this.fetchSessions()
    },
    resDbToAsset(resdb) {
      if (resdb) {
        return resoniteApiClient.getAssetsDomainUrl(resdb)
      } else {
        return null
      }
    },
    showModal(session) {
      logger.default.info(`Wants to get session infos for ${session.sessionId} / ${session.name}`)
      resoniteApiClient
        .getSession(this.userStore.userId, this.userStore.token, session.sessionId)
        .then((result) => {
          this.sessionDetails = result.data
          this.sessionInfosModal.show()
          this.showSessionInfosModal = true
        })
        .then(() => {
          this.photoSphereViewer = new PhotoSphereViewer({
            container: document.getElementById('sphere-world-preview'),
            panorama: session.thumbnailUrl,
            navbar: false,
            defaultZoomLvl: 0,
            moveSpeed: 2
          })
        })
    },
    getUsernameByUserId(userId) {
      console.log(this.sessionDetails.sessionUsers)
      return (
        this.sessionDetails.sessionUsers.find((el) => el.userID === userId)?.username ||
        'No user found'
      )
    }
  }
}
</script>
