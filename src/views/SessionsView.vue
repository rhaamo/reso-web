<template>
  <BContainer class="bv-example-row pt-5">
    Filters are hardcoded, only showing >1 active user.<br /><br />
    <BCardGroup columns>
      <a
        :href="`#${session.sessionId}`"
        v-for="session in sessions"
        :key="session.sessionId"
        @click.prevent="showModal(session)"
      >
        <BCard style="max-width: 20rem" :img-src="session.thumbnailUrl" img-top>
          <BCardImg></BCardImg>
          <!-- TODO FIXME no colors with v-html ? -->
          <BCardTitle v-html="session.name"></BCardTitle>
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
    :title="session.name"
  >
    <div
      id="sphere-world-preview"
      ref="sphere-world-preview"
      style="width: 48rem; height: 30rem"
    ></div>
    <hr />
    <template v-if="session.description">Description: {{ session.description }}</template>
    <template v-else>No description provided.</template>
    <br />
    Tags:
    <BBadge variant="info" v-for="tag in session.tags" :key="tag">{{ tag }}</BBadge>
    <br />
    Access level: {{ session.accessLevel }}
    <br />
    Headless: {{ session.headlessHost }}
    <br />
    Users [{{ session.activeUsers }}/{{ session.maxUsers }}]:
    <ul>
      <li v-for="user in session.sessionUsers" :key="user.userId">
        {{ user.username }} (<template v-if="!user.isPresent">inactive</template
        ><template v-else>active</template>)
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
import logger from '@/logging'
import { useUserStore } from '@/stores/user'
import { useHubStore } from '@/stores/hub'
import resoniteApiClient from '@/resonite-api/client'
import { HubOnlineStatus, HubUserSessionType } from '@/utils/resonite'
import { v4 as uuidv4 } from 'uuid'
import { ref } from 'vue'
import { useModal } from 'bootstrap-vue-next'
import { Viewer as PhotoSphereViewer } from '@photo-sphere-viewer/core'

// Filters to do:
// - session name
// - host name
// - minimum users
// - include ended
// - include empty headless
// - include incompatible

export default {
  setup: () => ({
    userStore: useUserStore(),
    hubStore: useHubStore(),
    sessionInfosModal: useModal('#modal-session-infos'),
  }),
  data: () => ({
    sessions: [],
    showSessionInfosModal: false,
    session: {},
  }),
  created() {
    logger.default.info('Chats: check for login...')

    // Check if we are logged in, if not, redirect to login page
    if (!this.userStore.isLoggedIn) {
      logger.default.info('not logged in, redirecting...')
      this.$router.push({
        name: 'login',
      })
    } else {
      logger.default.info('we are')
    }
    this.fetchSessions()
  },
  mounted() {
    this.hubStore.initHubConnection().then(async () => {
      // probably do something here
    })
  },
  methods: {
    fetchSessions() {
      logger.default.info('Refreshing sessions...')
      let filterParams = {
        minActiveUsers: 1,
        includeEnded: false,
        includeEmptyHeadless: false,
      }
      resoniteApiClient
        .getSessions(this.userStore.userId, this.userStore.token, filterParams)
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
          this.session = result.data
          this.sessionInfosModal.show()
          this.showSessionInfosModal = true
        })
        .then(() => {
          const viewer = new PhotoSphereViewer({
            container: document.getElementById('sphere-world-preview'),
            panorama: session.thumbnailUrl.replace(
              'skyfrost-archive.resonite.com',
              resoniteApiClient.SKYFROST_DOMAIN,
            ),
            navbar: false,
            defaultZoomLvl: 0,
            moveSpeed: 2,
          })
        })
    },
  },
}
</script>
