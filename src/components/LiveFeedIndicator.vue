<template>
  <div v-if="$mq.mobile" class="liveinfo">
    LIVE <span :class="{ indicator: true, connected: this.$store.state.socket.isConnected }">●</span>
  </div>
  <b-tooltip v-else class="liveinfo" type="is-info" label="New spots appear immediately, no need to refresh the page" position="is-left">
    <b-taglist attached>
      <b-tag type="is-dark">Live Feed</b-tag>
      <b-tag :type="this.$store.state.socket.isConnected ? 'is-success' : 'is-danger'">{{ this.$store.state.socket.isConnected ? 'CONNECTED' : 'DISCONNECTED' }}</b-tag>
    </b-taglist>
  </b-tooltip>
</template>

<style scoped>
.liveinfo {
  margin-left: 1em;
}
.indicator {
  color: #dd0000;
}
.indicator.connected {
  color: #00dd00;
}
</style>
