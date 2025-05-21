<template>
  <BContainer class="bv-example-row pt-5">
    <BBreadcrumb>
      <BBreadcrumbItem v-for="p in inventoryPath" :key="p" @click.prevent="navigateBreadcrumb(p)">
        <span v-html="formatText(p)"></span>
      </BBreadcrumbItem>
    </BBreadcrumb>

    <BCardGroup columns>
      <BCard v-for="record in inventory" :key="record.id" img-top>
        <BCardImg
          v-if="record.thumbnailUri"
          :src="resDbToAsset(record.thumbnailUri)"
          height="297px"
          width="auto"
        ></BCardImg>
        <i :class="iconForRecordType(record.recordType)"></i>&nbsp;
        <BLink
          v-if="record.recordType === 'directory' || record.recordType === 'linkPLSFIXMEDONTWORK'"
          @click.prevent="navigateFolder(record)"
          v-html="formatText(record.name)"
        >
        </BLink>
        <!-- TODO handle browsing links too -->
        <span v-else v-html="formatText(record.name)"></span>
        <template v-if="record.recordType === 'object'">
          <br />
          <small>
            <i class="ri-time-line"></i>&nbsp;{{ formatDate(record.lastModificationTime) }}
            <br />
            <BButton size="sm" @click.prevent="copyResdb(record)"
              ><i class="ri-clipboard-line"></i> resdb://</BButton
            >
          </small>
        </template>
      </BCard>
    </BCardGroup>
  </BContainer>
</template>

<script>
// TODO: order by name, date, favorite, and ASC/DESC

import logger from '@/renderer/logging'
import { useUserStore } from '@/renderer/stores/user'
import { useHubStore } from '@/renderer/stores/hub'
import resoniteApiClient from '@/renderer/resonite-api/client'
import { parseResoniteText } from '@/renderer/utils/resonite'

export default {
  setup: () => ({
    userStore: useUserStore(),
    hubStore: useHubStore()
  }),
  data: () => ({
    inventory: [],
    inventoryPath: ['Inventory'],
    currentPathIndex: null
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
    this.fetchInventory('Inventory')
  },
  mounted() {},
  unmounted() {},
  methods: {
    formatText(text) {
      return parseResoniteText(text)
    },
    iconForRecordType(recordType) {
      switch (recordType) {
        case 'link':
          return 'ri-link'
        case 'directory':
          return 'ri-folder-2-line'
        case 'object':
          return 'ri-file-line'
        default:
          return 'ri-file-unknow-line'
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleString()
    },
    fetchInventory(path = 'Inventory', userId = this.userStore.userId) {
      logger.default.info('Getting inventory...')
      resoniteApiClient
        .getUserRecordsAt(userId, this.userStore.token, path)
        .then((result) => {
          logger.default.info('Fetched inventory', result)
          this.inventory = result.data
        })
        .catch((error) => {
          logger.default.error('Cannot fetch inventory', error)
          // TODO error handling
          this.inventory = []
        })
    },
    fetchGroup(record) {
      // TODO FIXME doesn't work
      logger.default.info('fetchGroup', record)
      resoniteApiClient
        .getGroupRecordsAt(record.ownerId, `${record.path}\\${record.name}`)
        .then((result) => {
          logger.default.info('Fetched group path', result)
          this.inventory = result.data
        })
        .catch((error) => {
          logger.default.error('Cannot fetch group path', error)
          // TODO error handling
          this.inventory = []
        })
    },
    resDbToAsset(resdb) {
      if (resdb) {
        return resoniteApiClient.getAssetsDomainUrl(resdb)
      } else {
        return null
      }
    },
    navigateFolder(record) {
      logger.default.info('navigateFolder', record)

      this.inventoryPath.push(record.name)
      let p = 'Inventory\\' + this.inventoryPath.slice(1).join('\\')
      if (record.recordType === 'link') {
        this.fetchGroup(record)
      } else {
        this.fetchInventory(p)
      }
    },
    navigateBreadcrumb(destPath) {
      logger.default.info('navigateBreadcrumb', destPath)

      if (destPath === 'Inventory' && this.inventoryPath.length === 1) {
        logger.default.info('Already at Inventory and no subfolder')
        return
      } else if (destPath === 'Inventory') {
        logger.default.info('Navigating to root Inventory')
        this.inventoryPath = ['Inventory']
        this.fetchInventory('Inventory')
        return
      } else if (destPath === this.inventoryPath.slice(-1)[0]) {
        logger.default.info(`Already at ${destPath}`)
        return
      }

      let idx = this.inventoryPath.indexOf(destPath) + 1
      let path = 'Inventory\\' + this.inventoryPath.slice(1, idx).join('\\')
      this.inventoryPath = this.inventoryPath.slice(0, idx)
      this.fetchInventory(path)
    },
    copyResdb(record) {
      logger.default.info(record.assetUri)
      const clipboardItem = new ClipboardItem({ ['text/plain']: record.assetUri })
      navigator.clipboard.write([clipboardItem])
    }
  }
}
</script>
