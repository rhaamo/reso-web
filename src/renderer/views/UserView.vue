<template>
  <BContainer class="p-5">
    <div class="text-center">
      <h3>{{ username }}</h3>
      <div class="text-center">
        <div class="mb-4" v-if="avatarUrl"><BImg :src="avatarUrl" rounded="circle"></BImg></div>

        <div>
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
      </div>
    </div>
  </BContainer>
</template>

<script>
import logger from '@/renderer/logging'
import { useUserStore } from '@/renderer/stores/user'
import resoniteApiClient from '@/renderer/resonite-api/client'
import { useHubContactsStore } from '@/renderer/stores/hubContacts'

export default {
  setup: () => ({
    userStore: useUserStore(),
    hubContactStore: useHubContactsStore()
  }),
  data: () => ({
    storage: {
      fullQuotaBytes: 0,
      usedBytes: 0
    }
  }),
  computed: {
    percentStorageUsed() {
      return (this.storage.usedBytes * 100) / this.storage.fullQuotaBytes
    },
    userInfos() {
      return this.hubContactStore.contacts.find((el) => el.id === this.userStore.userId)
    },
    avatarUrl() {
      if (this.userInfos && this.userInfos.profile) {
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
    }
  }
}
</script>
