<script>
import { parseResoniteText } from '@/renderer/utils/resonite'
import resoniteApiClient from '@/renderer/resonite-api/client'

export default {
  props: {
    msg: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    theMsg: {}
  }),
  created() {
    // Set our msg
    this.theMsg = this.msg
    // Reconvert inner JSON if needed
    if (['SessionInvite', 'Sound', 'Object'].includes(this.theMsg.messageType)) {
      this.theMsg.content = JSON.parse(this.theMsg.content)
    }
  },
  methods: {
    formatText(text) {
      if (text) {
        return parseResoniteText(text)
      } else {
        return ''
      }
    },
    resDbToAsset(resdb) {
      if (resdb) {
        return resoniteApiClient.getAssetsDomainUrl(resdb)
      } else {
        return null
      }
    }
  }
}
</script>

<template>
  <template v-if="theMsg.messageType == 'Text'">
    {{ theMsg.content }}
  </template>
  <template v-else-if="theMsg.messageType == 'Sound'">
    <audio controls>
      <source :src="resDbToAsset(theMsg.content.assetUri)" type="audio/ogg" />
      Your browser does not support the audio element.
    </audio>
  </template>
  <template v-else-if="theMsg.messageType == 'SessionInvite'">
    <BCard img-src="theMsg.content.thumbnailUrl" img-alt="Session Thumbnail" img-top>
      <template #header><div v-html="formatText(theMsg.content.name)"></div></template>
      <BCardText>
        {{ formatText(theMsg.content.description) }}
      </BCardText>
      <template #footer>
        <small>Hosted by {{ theMsg.content.hostUsername }}</small>
      </template>
    </BCard>
  </template>
  <template v-else-if="theMsg.messageType == 'Object'">Unhandled Object message</template>
  <template v-else-if="theMsg.messageType == 'InviteRequest'"
    ><i class="ri-robot-2-line"></i> Your contact requested an invite into your session.</template
  >
  <template v-else>Unhandled message type: {{ theMsg.messageType }}</template>
</template>
