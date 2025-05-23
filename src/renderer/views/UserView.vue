<template>
  <BContainer class="p-5">
    <div class="text-center">
      <h3>{{ username }}</h3>
      <div class="text-center" v-if="userInfos">
        <BRow>
          <BCol>
            <div class="mb-4" v-if="avatarUrl"
              ><BImg width="200px" :src="avatarUrl" rounded="circle"></BImg
            ></div>
          </BCol>
          <BCol class="text-start">
            <h3>
              <BButton
                size="sm"
                title="Edit tagline and description"
                @click="showEditModal = !showEditModal"
                ><i class="ri-pencil-line"></i
              ></BButton>
              {{ userInfos.contactUsername }}
              <span class="fs-6">({{ userInfos.id }})</span>
            </h3>
            <p>
              <template v-if="userInfos?.profile?.tagline">
                Tag line: {{ userInfos.profile.tagline || 'None set' }}
              </template>
              <template v-else>Tag line: <i>empty</i></template>
            </p>

            <p>
              <template v-if="userInfos?.profile?.description">
                Description: {{ userInfos.profile.description || 'None set' }}
              </template>
              <template v-else>Description: <i>empty</i></template>
            </p>
          </BCol>
        </BRow>

        <div class="mb-3">
          <BCard title="Storage Quota">
            <BCardText>
              <BProgress
                :value="percentStorageUsed"
                :min="storage.usedBytes"
                :max="storage.fullQuotaBytes"
                show-value
                show-progress
              />
              <div class="row">
                <div class="col text-start">{{ formatBytes(storage.usedBytes) }}</div>
                <div class="col text-center">{{ percentStorageUsed.toFixed(1) }}%</div>
                <div class="col text-end">{{ formatBytes(storage.fullQuotaBytes) }}</div>
              </div>
            </BCardText>
          </BCard>
        </div>

        <div>
          <BCard title="Stats">
            Total of {{ stats.presentUsers }} users, with {{ stats.usersInVR }} in VR,
            {{ stats.usersInScreen }} in PC and {{ stats.usersOnMobile }} on Mobile<br />
            {{ stats.usersInVisiblePublicSessions }} in public sessions,
            {{ stats.usersInPrivateSessions }} in private, {{ stats.usersInHiddenSessions }} in
            hidden and {{ stats.usersInVisibleSemiAccessibleSessions }} in semi-accessible.<br />
          </BCard>
        </div>
      </div>
    </div>
  </BContainer>

  <BModal
    v-model="showEditModal"
    title="Edit profile"
    @ok="editModalOk"
    @close="editModalClose"
    @cancel="editModalClose"
    @show="editModalShow"
    ok-title="Save"
  >
    <BFormGroup label="Tagline:" label-for="editProfileTagline">
      <BFormInput id="editProfileTagline" v-model="userEditProfile.tagline" type="text" />
    </BFormGroup>
    <BFormGroup label="Description:" label-for="editProfileDescription">
      <BFormInput id="editProfileDescription" v-model="userEditProfile.description" type="text" />
    </BFormGroup>
  </BModal>
</template>

<script>
import logger from '@/renderer/logging'
import { useUserStore } from '@/renderer/stores/user'
import resoniteApiClient from '@/renderer/resonite-api/client'
import { useHubContactsStore } from '@/renderer/stores/hubContacts'
import { useToastController } from 'bootstrap-vue-next'
import { useStatsStore } from '@/renderer/stores/stats'
import { mapState } from 'pinia'

export default {
  setup: () => ({
    userStore: useUserStore(),
    hubContactStore: useHubContactsStore(),
    statsStore: useStatsStore(),
    toasty: useToastController()
  }),
  data: () => ({
    storage: {
      fullQuotaBytes: 0,
      usedBytes: 0
    },
    showEditModal: false,
    userEditProfile: {
      tagline: null,
      description: null
    }
  }),
  computed: {
    ...mapState(useStatsStore, {
      stats(store) {
        return store.stats
      }
    }),
    percentStorageUsed() {
      return (this.storage.usedBytes * 100) / this.storage.fullQuotaBytes
    },
    userInfos() {
      return this.hubContactStore.contacts.find((el) => el.id === this.userStore.userId)
    },
    avatarUrl() {
      if (this.userInfos?.profile?.iconUrl) {
        return resoniteApiClient.getAssetsDomainUrl(this.userInfos?.profile?.iconUrl)
      }
      return null
    },
    username() {
      return this.userStore.userName
    }
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
  mounted() {
    this.getStorage()
  },
  methods: {
    getStorage() {
      resoniteApiClient.getStorageQuota(this.userStore.userId, this.userStore.token).then((res) => {
        this.storage.fullQuotaBytes = res.data.fullQuotaBytes
        this.storage.usedBytes = res.data.usedBytes
      })
    },
    formatBytes(bytes, decimals = 2) {
      if (!+bytes) return '0 Bytes'

      const k = 1024
      const dm = decimals < 0 ? 0 : decimals
      const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

      const i = Math.floor(Math.log(bytes) / Math.log(k))

      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
    },
    editModalOk() {
      // See beware in saveUserProfileValue(), you have to send back everything, not just the changed value
      // or you will loose badges, profile icon, etc.
      let profileValues = this.userInfos.profile
      profileValues.tagline = this.userEditProfile.tagline
      profileValues.description = this.userEditProfile.description
      // there is probably reactivity so uh, no need to update our profile in hubContacts I guess

      resoniteApiClient
        .saveUserProfileValue(this.userStore.userId, this.userStore.token, profileValues)
        .then((res) => {
          logger.default.info('Saving profile values success', res)
          this.toasty.create({
            title: 'Updating profile',
            body: `Success :3`,
            modelValue: 3000,
            variant: 'success'
          })
        })
        .catch((err) => {
          logger.default.info('Saving profile values error', err)
          this.toasty.create({
            title: 'Updating profile',
            body: `Error :( (${err})`,
            modelValue: 3000,
            variant: 'danger'
          })
        })

      this.userEditProfile.tagline = null
      this.userEditProfile.description = null
    },
    editModalClose() {
      this.userEditProfile.tagline = null
      this.userEditProfile.description = null
    },
    editModalShow() {
      this.userEditProfile.tagline = this.userInfos.profile?.tagline || ''
      this.userEditProfile.description = this.userInfos.profile?.description || ''
    }
  }
}
</script>
