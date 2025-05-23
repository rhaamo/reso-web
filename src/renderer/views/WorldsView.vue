<template>
  <BContainer class="p-5">
    <BRow>
      <BCol cols="5">
        <label for="filtersRequiredTags">Enter tags separated by a comma:</label>
        <BFormTags
          v-model="filters.requiredTags"
          input-id="filtersRequiredTags"
          separator=","
          placeholder="avali,bird"
          no-add-on-enter
        />
      </BCol>
      <BCol cols="3">
        <label for="filtersSortDirection">Sort direction:</label>
        <BFormSelect
          input-id="filtersSortDirection"
          v-model="filters.sortDirection"
          :options="options.sortDirection"
        /><br />
      </BCol>
      <BCol cols="3">
        <label for="filtersSortby">Sort by:</label>
        <BFormSelect input-id="filtersSortby" v-model="filters.sortBy" :options="options.sortBy" />
      </BCol>

      <BCol cols="1">
        <br />
        <BButton @click.prevent="searchWorlds">Search</BButton>
      </BCol>
    </BRow>

    <BCardGroup columns>
      <div v-for="world in worlds" :key="world.id" class="card" style="width: 18rem">
        <a :href="`#${world.id}`" @click.prevent="showModal(world)">
          <img
            title="Show session details"
            :src="resDbToAsset(world.thumbnailUri)"
            class="card-img-top"
            alt="session thumbnail"
          />
        </a>
        <div class="card-body">
          <h5 class="card-title">
            <span v-html="formatText(world.name || 'Unknown world name')"></span>
          </h5>
          <p class="card-text">blah blah</p>
        </div>
      </div>
    </BCardGroup>

    <hr />
    <div class="text-center">
      <BButtonGroup aria-label="Pagination">
        <BButton @click.prevent="previousPage"
          ><i class="ri-arrow-left-line"></i> Previous page</BButton
        >
        <BButton @click.prevent="nextPage">Next page <i class="ri-arrow-right-line"></i></BButton>
      </BButtonGroup>
    </div>
  </BContainer>

  <BModal
    no-close-on-backdrop
    no-footer
    size="lg"
    v-if="showWorldInfosModal"
    v-model="showWorldInfosModal"
    id="modal-world-infos"
  >
    <template #title><span v-html="formatText(worldDetails.name)"></span></template>
    <div
      id="sphere-world-preview"
      ref="sphere-world-preview"
      style="width: 48rem; height: 30rem"
      class="mb-3"
    ></div>
    <hr />
    <template v-if="worldDetails.description">
      <span v-html="formatText(worldDetails.description)"></span>
      <hr />
    </template>
    Tags:
    <template v-for="tag in worldDetails.tags" :key="tag">
      <BBadge pill variant="info">{{ tag }}</BBadge
      >&#8239;
    </template>

    <br />
    Created by {{ worldDetails.ownerName }}<br />
    Created at {{ formatDateLocale(worldDetails.creationTime) }}<br />
    Last Modified at {{ formatDateLocale(worldDetails.lastModificationTime) }}<br />
    Visits: {{ worldDetails.visits }}<br />
    Rating: {{ worldDetails.rating }}
  </BModal>
</template>

<script>
import logger from '@/renderer/logging'
import { useUserStore } from '@/renderer/stores/user'
import { useWorldsStore } from '@/renderer/stores/worlds'
import { useToastController } from 'bootstrap-vue-next'
import { mapState } from 'pinia'
import resoniteApiClient from '@/renderer/resonite-api/client'
import { parseResoniteText } from '@/renderer/utils/resonite'
import { useModal } from 'bootstrap-vue-next'
import { Viewer as PhotoSphereViewer } from '@photo-sphere-viewer/core'

export default {
  setup: () => ({
    userStore: useUserStore(),
    worldsStore: useWorldsStore(),
    toasty: useToastController(),
    worldInfosModal: useModal('#modal-world-infos')
  }),
  data: () => ({
    options: {
      sortDirection: [
        { value: 'ascending', text: 'Ascending' },
        { value: 'descending', text: 'Descending' }
      ],
      sortBy: [
        { value: 'creationDate', text: 'Creation Date' },
        { value: 'lastUpdateDate', text: 'Last Update Date' },
        { value: 'firstPublishTime', text: 'First Publish Time' },
        { value: 'totalVisits', text: 'Total Visits' },
        { value: 'name', text: 'Name' },
        { value: 'rand', text: 'Random' }
      ]
    },
    showWorldInfosModal: false,
    photoSphereViewer: null,
    worldDetails: {}
  }),
  computed: {
    ...mapState(useWorldsStore, {
      worlds(store) {
        return store.worlds
      },
      filters(store) {
        return store.filters
      },
      hasMoreResults(store) {
        return store.hasMoreResults
      }
    }),
    perPage() {
      return this.filters.count
    },
    canPrevious() {
      return this.filters.offset > 0
    },
    canNext() {
      // we don't really know, the API doesn't returns the total count
      return true
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

    // Initial world search
    this.searchWorlds()
  },
  methods: {
    formatText(text) {
      return parseResoniteText(text)
    },
    resDbToAsset(resdb) {
      if (resdb) {
        return resoniteApiClient.getAssetsDomainUrl(resdb)
      } else {
        return null
      }
    },
    formatDateLocale(date) {
      return new Date(date).toLocaleString()
    },
    searchWorlds() {
      logger.default.info('We want to search worlds with', this.filters)
      this.worldsStore
        .searchWorlds()
        .then(() => {
          // well, that's good
        })
        .catch((error) => {
          logger.default.info('Searching worlds error', error)
          this.toasty.create({
            title: 'Searching worlds',
            body: `Error :( (${error})`,
            modelValue: 3000,
            variant: 'danger'
          })
        })
    },
    showModal(world) {
      console.log(world)
      this.worldDetails = world
      this.worldInfosModal.show()
      this.showWorldInfosModal = true

      // This needs to be called after the modal is shown, or the element will not be found
      this.$nextTick(() => {
        // And after the next tick to have time for the DOM to update I guess
        this.photoSphereViewer = new PhotoSphereViewer({
          container: document.getElementById('sphere-world-preview'),
          panorama: this.resDbToAsset(world.thumbnailUri),
          navbar: false,
          defaultZoomLvl: 0,
          moveSpeed: 2
        })
      })
    },
    previousPage() {
      if (!this.canPrevious) {
        logger.default.error(
          `Cannot go to previous page, count=${this.filters.count}, offset=${this.filters.offset}`
        )
        return
      }

      // Decrement the offset by removing the count per page
      this.filters.offets -= this.filters.count
      // Then get new results
      this.worldsStore.searchWorlds()
    },
    nextPage() {
      if (!this.canNext) {
        logger.default.error('Cannot go to next page')
        return
      }

      // Increment the offset by adding the count per page
      this.filters.offset += this.filters.count
      // Then get new results
      this.worldsStore.searchWorlds()
    }
  }
}
</script>
