<template>
  <div class="card">
    <div v-if="$slots.header" class="card-header"><p class="card-header-title"><slot name="header"></slot></p></div>
    <div class="card-content">
      <div class="time" v-html="formatTime(alert.dateActivated)" />
      <div class="freqmode">{{ alert.frequency }}</div>
      <div class="callsign">
        <template v-if="callsignLink">
          <router-link :to="makeActivatorLink(alert.activatorCallsign)">{{ alert.activatorCallsign }}</router-link>
        </template>
        <template v-else>{{ alert.activatorCallsign }}</template>
      </div>
      <div v-if="showSummitInfo" class="summit">
        <div class="summit-title" v-if="alert.summit.name">
          <CountryFlag v-if="alert.summit.isoCode" :country="alert.summit.isoCode" class="flag" />
          <router-link :to="makeSummitLink(alert.summit.code)"><span class="summit-name">{{ alert.summit.name }}</span></router-link>
        </div>
        <div class="summit-info">{{ alert.summit.code }}<span v-if="alert.summit.altitude">, <AltitudeLabel :altitude="alert.summit.altitude" />, {{ alert.summit.points }}pt<ActivationCount :activationCount="alert.summit.activationCount" /></span></div>
      </div>
      <div class="poster">{{ alert.posterCallsign }}</div>
      <div class="comments">{{ alert.comments }}</div>
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script>
import utils from '../mixins/utils.js'
import ActivationCount from '../components/ActivationCount.vue'
import CountryFlag from '../components/CountryFlag.vue'
import AltitudeLabel from '../components/AltitudeLabel.vue'

export default {
  name: 'AlertCard',
  components: {
    ActivationCount, CountryFlag, AltitudeLabel
  },
  mixins: [utils],
  props: {
    alert: {
      type: Object,
      required: true
    },
    showSummitInfo: {
      type: Boolean,
      default: true
    },
    callsignLink: {
      type: Boolean,
      default: true
    }
  }
}
</script>

<style scoped>
.card-header {
  background-color: #eee;
  margin-top: 1em;
  font-size: 1rem;
}
.card-header-title {
  padding: 0.3em 0.5em;
}
.card-content {
  font-size: 0.9rem;
  padding: 0.6rem;
  line-height: 1.3;
  overflow: auto;
}
.card-content .time {
  margin-right: 0.5em;
  min-width: 3.5em;
  display: inline-block;
}
.card-content .callsign {
  font-weight: bold;
  display: inline-block;
}
.card-content .freqmode {
  float: right;
  font-size: 0.75rem;
  line-height: 1.5;
  margin-left: 0.3em;
  max-width: calc(100vw - 20em);
  text-align: right;
}
.card-content .summit {
  font-size: 0.75rem;
  margin-top: 0.1em;
}
.card-content .summit-name {
  font-size: 0.9rem;
}
.card-content .comments {
  font-size: 0.75rem;
  color: #777;
  margin-top: 0.1em;
}
.card-content .poster {
  float: right;
  font-style: italic;
  margin-left: 0.3em;
  font-size: 0.75rem;
  clear: right;
  color: #777;
}
.card-content .flag {
  margin-right: 0.5em;
  margin-left: 0.1em;
  position: relative;
  top: -0.05em;
}
.card-content .activation-count {
  margin-left: 0.4em;
}
.summit-title {
  display: inline-block;
  margin-right: 0.3em;
}
@media (min-width: 769px) {
  .summit-info {
    display: inline-block;
  }
}
</style>
