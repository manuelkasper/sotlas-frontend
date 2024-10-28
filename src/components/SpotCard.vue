<template>
  <div class="card">
    <div class="card-content">
      <div class="freqmode"><span v-if="!spot.type || spot.type === 'NORMAL'">{{ spot.frequency | formatFrequency }} </span><ModeLabel :mode="spot.mode" :type="spot.type" /></div>
      <div class="time" v-html="formatTimeDay(spot.timeStamp)" />
      <div class="callsign">
        <template v-if="callsignLink">
          <router-link :to="makeActivatorLink(spot.activatorCallsign)">{{ spot.activatorCallsign }}</router-link>
        </template>
        <template v-else>{{ spot.activatorCallsign }}</template>
      </div>
      <div class="summit" v-if="showSummitInfo">
        <div class="summit-title" v-if="spot.summit.name">
          <CountryFlag v-if="spot.summit.isoCode" :country="spot.summit.isoCode" class="flag" />
          <router-link :to="makeSummitLink(spot.summit.code)"><span class="summit-name">{{ spot.summit.name }}</span></router-link>
        </div>
        <div class="summit-info">{{ spot.summit.code }}<template v-if="spot.summit.altitude">, <AltitudeLabel :altitude="spot.summit.altitude" />, {{ spot.summit.points }}pt<ActivationCount :activationCount="spot.summit.activationCount" /></template></div>
      </div>
      <div class="spotter">{{ spot.callsign }}</div>
      <div class="comments">{{ spot.comments }}</div>
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script>
import utils from '../mixins/utils.js'
import ModeLabel from '../components/ModeLabel.vue'
import ActivationCount from '../components/ActivationCount.vue'
import CountryFlag from '../components/CountryFlag.vue'
import AltitudeLabel from '../components/AltitudeLabel.vue'

export default {
  name: 'SpotCard',
  components: {
    ModeLabel, ActivationCount, CountryFlag, AltitudeLabel
  },
  mixins: [utils],
  props: {
    spot: {
      type: Object,
      required: true
    },
    callsignLink: {
      type: Boolean,
      default: true
    },
    showSummitInfo: {
      type: Boolean,
      default: true
    }
  }
}
</script>

<style scoped>
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
  margin-left: 0.3em;
}
.card-content .tag {
  position: relative;
  margin-left: 0.3em;
  top: -0.1em;
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
.card-content .spotter {
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
.card-content .actions {
  margin-top: 0.5em;
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
