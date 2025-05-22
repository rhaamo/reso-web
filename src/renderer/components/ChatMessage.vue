<script>
import { parseResoniteText } from '@/renderer/utils/resonite'

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
    if (this.theMsg.messageType === 'SessionInvite') {
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
    }
  }
}
</script>

<template>
  <template v-if="theMsg.messageType == 'Text'">
    {{ theMsg.content }}
  </template>
  <template v-else-if="theMsg.messageType == 'Sound'">Unhandled sound message</template>
  <template v-else-if="theMsg.messageType == 'SessionInvite'">
    <BCard img-src="theMsg.content.thumbnailUrl" img-alt="Session Thumbnail" img-top>
      <template #header><div v-html="formatText(theMsg.content.name)"></div></template>
      <BCardText>
        {{ formatText(theMsg.content.description) }}<br />
        <small>Hosted by {{ theMsg.content.hostUsername }}</small>
      </BCardText>
    </BCard>
  </template>
  <template v-else-if="theMsg.messageType == 'Object'">Unhandled Object message</template>
  <template v-else-if="theMsg.messageType == 'InviteRequest'"
    >Unhandled InviteRequest message</template
  >
  <template v-else>Unhandled message type: {{ theMsg.messageType }}</template>
</template>
