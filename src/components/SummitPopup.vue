<template>
  <MglPopup v-if="summit" key="summitinfo" :coordinates="[summit.coordinates.longitude, summit.coordinates.latitude]" :showed="true" anchor="bottom" :closeButton="false" @close="$emit('close')" @added="popupAdded">
    <div :class="{ summitPopup: true, minimize: minimizePopup }">
      <div v-if="coverPhoto" class="photo">
        <div style="text-align: center"><a :href="coverPhoto.mediaLink" target="_blank"><img :src="coverPhoto.src" /></a></div>
        <div v-if="coverPhoto.description" class="description">{{ coverPhoto.description }}</div>
        <div v-if="coverPhoto.attribution" class="attribution" v-html="coverPhoto.attribution"></div>
      </div>
      <h2>{{ summit.name }}<span class="summitCode"><router-link :to="'/summits/' + summit.code">{{ summit.code }}</router-link></span></h2>
      <table class="summitinfo">
        <tr><th>Altitude</th><td><AltitudeLabel :altitude="summit.altitude" /></td></tr>
        <tr class="points"><th>Points</th><td><SummitPointsLabel :points="summit.points" :bonus="summit.bonusPoints" /></td></tr>
        <tr><th>Activations</th><td>{{ summit.activationCount }}</td></tr>
        <tr v-if="summit.activationDate"><th>Last activation</th><td>{{ summit.activationDate | formatActivationDate }} (<router-link :to="makeActivatorLink(summit.activationCall)">{{ summit.activationCall }}</router-link>)</td></tr>
        <tr v-if="lastSpot"><th>Last spot</th><td><span v-html="formatTimeDay(lastSpot.timeStamp)" />: <router-link :to="makeActivatorLink(lastSpot.activatorCallsign)">{{ lastSpot.activatorCallsign }}</router-link><span v-if="lastSpot.frequency">, {{ lastSpot.frequency }}</span> <ModeLabel :mode="lastSpot.mode" :type="lastSpot.type" /></td></tr>
        <tr v-if="nextAlert" class="nextAlert"><th>Next alert</th><td><span v-html="formatDateTimeRelative(nextAlert.dateActivated)" />: <router-link :to="makeActivatorLink(nextAlert.activatorCallsign)">{{ nextAlert.activatorCallsign }}</router-link><div v-if="nextAlert.frequency" class="alertFrequencies">{{ nextAlert.frequency }}</div><div v-if="nextAlert.comments" class="alertComments">{{ nextAlert.comments }}</div></td></tr>
      </table>
      <div class="buttons">
        <b-button v-if="!minimizePopup" size="is-small" icon-left="window-close" @click="$emit('close')">Close</b-button>
        <b-button v-if="!minimizePopup" size="is-small" icon-left="window-minimize" @click="minimizePopup = true">Minimize</b-button>
        <b-button v-if="minimizePopup" size="is-small" icon-left="window-maximize" @click="minimizePopup = false"></b-button>
        <router-link v-if="!minimizePopup"  class="button more is-info is-small" :to="'/summits/' + summit.code"><font-awesome-icon class="fa-icon" :icon="['far', 'expand-arrows']" style="margin-right: 0.5em" /> More</router-link>
      </div>
    </div>
  </MglPopup>
</template>

<script>
import { MglPopup } from 'vue-mapbox'
import ModeLabel from '../components/ModeLabel.vue'
import AltitudeLabel from '../components/AltitudeLabel.vue'
import SummitPointsLabel from '../components/SummitPointsLabel.vue'
import utils from '../mixins/utils.js'
import coverphoto from '../mixins/coverphoto.js'

export default {
  name: 'SummitPopup',
  props: {
    summit: Object,
    lastSpot: Object,
    nextAlert: Object
  },
  mixins: [utils, coverphoto],
  components: {
    MglPopup, ModeLabel, AltitudeLabel, SummitPointsLabel
  },
  methods: {
    popupAdded (popup) {
      popup.popup.options.focusAfterOpen = false
    }
  },
  data () {
    return {
      minimizePopup: false
    }
  }
}
</script>

<style scoped>
.summitPopup {
  padding: 0.3rem;
}
.summitPopup h2 {
  margin: 0.2em 0 0.5em 0;
  font-size: 16pt;
  white-space: nowrap;
  font-weight: normal;
}
.summitPopup .summitCode {
  color: #777;
  font-size: 10pt;
  padding-left: 0.7em;
}
.summitPopup table {
  font-size: 10pt;
  width: 100%;
}
.summitPopup .buttons {
  margin-top: 0.5em;
  float: right;
}
.summitPopup.minimize .buttons {
  margin-top: 0;
  display: inline;
  margin-left: 1em;
}
.summitPopup .points th {
  vertical-align: middle;
}
.summitPopup.minimize .photo, .summitPopup.minimize .summitinfo {
  display: none;
}
.summitPopup.minimize h2 {
  font-size: 11pt;
  display: inline;
  vertical-align: middle;
}
.summitPopup.minimize .summitCode {
  display: none;
}
.summitPopup .nextAlert :deep(.date-small) {
  font-size: 100%;
  min-width: 0;
}
.summitPopup .alertFrequencies {
  font-size: 0.9em;
  margin-top: 0.1em;
  max-width: 25em;
  overflow: hidden;
  text-overflow: ellipsis;
}
.summitPopup .alertComments {
  font-size: 0.9em;
  margin-top: 0.1em;
  max-width: 25em;
  color: #777;
  overflow: hidden;
  text-overflow: ellipsis;
}
.photo {
  width: 300px;
  padding-bottom: 0.5em;
  border-bottom: 1px solid #ccc;
  margin-bottom: 1em;
}
.photo img {
  border: 1px solid #aaa;
  vertical-align: top;
  text-align: center;
}
.photo .description {
  font-size: 9pt;
  line-height: 1.4;
  color: #777;
  margin-top: 0.5em;
}
.photo a {
  color: #3f5da7;
}
.photo .attribution {
  font-size: 0.7rem;
  line-height: 1.4;
  font-style: italic;
  color: #777;
  text-align: right;
}
.summitinfo {
  margin: 0 !important;
  border-bottom: none !important;
}
.summitinfo th {
  padding-right: 1em;
  text-align: left;
  color: #444;
}
.summitinfo th, .summitinfo td {
  border-top: 1px solid #e0e0e0;
  padding-top: 0.3em !important;
  padding-bottom: 0.3em !important;
  white-space: nowrap;
  text-transform: none;
  line-height: normal !important;
}
.tag {
  padding: 0.2em 0.3em;
}
</style>
