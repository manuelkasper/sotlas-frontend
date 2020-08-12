<template>
  <div class="card">
    <div class="card-content">
      <div class="freqmode">{{ spot.frequency | formatFrequency }} <ModeLabel :mode="spot.mode" /></div>
      <div class="time" v-html="formatTimeDay(spot.timeStamp)" />
      <div class="callsign">
        <CountryFlag :country="country(spot.callsign)" class="flag" />
        <template v-if="callsignLink">
          <router-link :to="makeActivatorLink(spot.callsign)">{{ spot.callsign }}</router-link>
        </template>
        <template v-else>{{ spot.callsign }}</template>
      </div>
      <div class="details">
        <div class="spotter">@{{ spot.spotter }}</div>
        <div class="speedsnr">{{ spot.snr }} dB, {{ spot.speed }} wpm</div>
      </div>
    </div>
  </div>
</template>

<script>
import prefix from '../prefix.js'
import utils from '../mixins/utils.js'
import ModeLabel from '../components/ModeLabel.vue'
import CountryFlag from '../components/CountryFlag.vue'

export default {
  name: 'RBNSpotCard',
  components: {
    ModeLabel, CountryFlag
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
    }
  },
  methods: {
    country (callsign) {
      return prefix.isoCodeForCallsign(callsign)
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
  margin-bottom: 0.1em;
}
.card-content .tag {
  position: relative;
  margin-left: 0.3em;
  top: -0.1em;
}
.card-content .details {
  margin-top: 0.1em;
  font-size: 0.75rem;
}
.card-content .spotter {
  display: inline-block;
  margin-right: 0.5em;
  font-weight: bold;
  width: 6em;
}
.card-content .speedsnr {
  display: inline-block;
}
.card-content .flag {
  margin-right: 0.5em;
}
</style>
