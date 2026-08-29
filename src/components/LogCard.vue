<template>
  <div class="modal-card" style="width: auto">
    <header class="modal-card-head">
      <p class="modal-card-title">Log Spot</p>
    </header>
    <section class="modal-card-body">
      <b-field label="Your Callsign">
        <b-input type="text" class="callsign" v-model="your_callsign" pattern="[a-zA-Z0-9/]{3,}" validation-message="Invalid callsign" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" required />
      </b-field>

      <b-field label="Other Callsign">
        <b-input type="text" class="callsign" v-model="other_callsign" pattern="[a-zA-Z0-9/]{3,}" validation-message="Invalid callsign" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" required />
      </b-field>

      <b-field label="Summit reference" :message="summitDisplay" :type="summitType" :class="summitLabelClass" expanded>
        <b-field>
          <b-input type="text" class="summit-code" ref="summitCode" v-model="summitCode" placeholder="XX/YY-000" :loading="summitLoading" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" required />
        </b-field>
      </b-field>

      <b-field label="Frequency" :message="maybeKhz ? 'Do you really mean ' + frequency + ' MHz, or are you missing a dot?' : ''" :type="maybeKhz ? 'is-warning' : ''">
        <b-field :type="maybeKhz ? 'is-warning' : ''">
          <FrequencyInput v-model="frequency" :disabled="type !== 'NORMAL'" />
        </b-field>
      </b-field>

      <b-field label="Mode">
        <b-field>
          <b-radio-button v-for="(curModeDisp, curMode) in allModes()" :key="curMode" v-model="mode" :size="$mq.mobile ? 'is-small' : ''" :native-value="curMode" :disabled="type !== 'NORMAL'">{{ curModeDisp }}</b-radio-button>
        </b-field>
      </b-field>

      <b-field grouped>
        <b-field label="QTH Latitude">
          <b-input v-model="latitude" type="number" step="0.0001" />
        </b-field>
        <b-field label="QTH Longitude">
          <b-input v-model="longitude" type="number" step="0.0001" />
        </b-field>
      </b-field>

    </section>
    <footer class="modal-card-foot">
      <b-button @click="$parent.close()">Cancel</b-button>
      <b-button type="is-info" :disabled="!isInputValid" :loading="posting" @click="logSpot">Log Spot</b-button>
    </footer>
  </div>
</template>

<script>
import axios from 'axios'
import utils from '../mixins/utils.js'
import prefs from '../mixins/prefs.js'
import sotadb from '../mixins/sotadb.js'
import FrequencyInput from './FrequencyInput.vue'

export default {
  components: {
    FrequencyInput
  },
  mixins: [utils, prefs, sotadb],
  props: {
    defaultSummitCode: String,
    spot: Object
  },
  prefs: {
    key: 'loggingPrefs',
    props: ['lastCallsign', 'lastSummitCode', 'qth_latitude', 'qth_longitude']
  },
  mounted () {
    if (!this.other_callsign) {
      if (this.lastCallsign) {
        this.other_callsign = this.lastCallsign
      } else if (this.myCallsign) {
        this.other_callsign = this.myCallsign
        if (!/\/P$/.test(this.other_callsign)) {
          this.other_callsign += '/P'
        }
      }
    }
    if (!this.summitCode) {
      if (this.lastSummitCode) {
        this.summitCode = this.lastSummitCode
      }
    }

    if (!this.latitude || !this.longitude) {
      this.latitude = this.qth_latitude
      this.longitude = this.qth_longitude
    }
  },
  computed: {
    summitDisplay () {
      if (this.summit) {
        if (this.$store.state.altitudeUnits === 'ft') {
          return this.summit.name + ' (' + Math.round(this.summit.altitude * 3.28084) + ' ft)'
        } else {
          return this.summit.name + ' (' + this.summit.altitude + ' m)'
        }
      } else if (this.summitInvalid) {
        return 'Summit not found'
      } else {
        return 'You can enter spaces instead of / and -'
      }
    },
    summitType () {
      if (this.summitInvalid) {
        return 'is-danger'
      } else {
        return ''
      }
    },
    isInputValid () {
      return /^[a-zA-Z0-9/]{3,}$/.test(this.other_callsign) && this.summit !== null && this.isSummitValid(this.summit) && (this.type !== 'NORMAL' || (this.frequency && this.mode))
    },
    summitLabelClass () {
      if (!this.summit || this.isSummitValid(this.summit)) {
        return { summitref: true }
      } else {
        return { summitref: true, invalid: true }
      }
    },
    isOwnCallsign () {
      return (!this.other_callsign || !this.myCallsign || (this.homeCallsign(this.other_callsign) === this.homeCallsign(this.myCallsign)))
    },
    maybeKhz () {
      return (this.frequency && this.frequency > 1500)
    }
  },
  watch: {
    defaultSummitCode: {
      immediate: true,
      handler () {
        if (!this.summitCode) {
          this.summitCode = this.defaultSummitCode
        }
      }
    },
    summitCode: {
      immediate: true,
      handler () {
        if (this.summitCode) {
          // Shorthand input
          let summitRegex = /^([A-Z0-9]{1,8})[/ ]([A-Z]{2})[- ]?([0-9]{3})$/i
          let matches = this.summitCode.match(summitRegex)
          if (matches) {
            this.summitCode = (matches[1] + '/' + matches[2] + '-' + matches[3]).toUpperCase()
            this.summitLoading = true
            axios.get(import.meta.env.VITE_API_URL + '/summits/' + this.summitCode)
              .then(response => {
                this.summitLoading = false
                this.summitInvalid = false
                this.summit = response.data
              })
              .catch(() => {
                this.summitLoading = false
                this.summitInvalid = true
                this.summit = null
              })
          } else {
            this.summit = null
            this.summitInvalid = false
          }
        } else {
          this.summit = null
          this.summitInvalid = false
        }
      }
    },
    spot: {
      immediate: true,
      handler () {
        if (this.spot) {
          this.other_callsign = this.spot.activatorCallsign
          this.summitCode = this.spot.summit.code
          this.frequency = this.spot.frequency
          this.mode = this.spot.mode.toLowerCase()
          this.comments = (this.spot.comments ? this.spot.comments.replace('[sotl.as]', '').trim() : '')
          this.type = this.spot.type ?? 'NORMAL'
        }
      }
    }
  },
  methods: {
    logSpot () {
      let logTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

      let params = {
        activations: [],
        chases: [{
          band: String(this.frequency) + "MHz",
          // date format is "DD/MM/YYY"
          date: new Date().toLocaleDateString('en-GB'),
          latitude: this.latitude,
          longitude: this.longitude,
          // location format: "lat, lon" e.g. "12.3456, -1.2345"
          location: `${this.latitude},${this.longitude}`,
          mode: this.allModes()[this.mode],
          otherCallsign: this.other_callsign.toUpperCase(),
          ownCallsign: this.myCallsign,
          s2s: false,
          s2sSummitCode: this.summitCode,
          summitCode: "",
          swl: false,
          // time format is "HH:MM"
          time: logTime,
          timeStr: logTime,
        }],
        s2s: []
      }

      this.logging = true
      console.log('SPOTLOGGING: ', params)
      this.logSpotToDb(params)
        .then(response => {
          this.$store.commit('logSpot', {
            id: (this.spot && this.spot.id) ? this.spot.id : response.data.id,
            userID: response.data.userID,
            timeStamp: response.data.timeStamp,
            frequency: response.data.frequency,
            mode: response.data.mode,
            summit: this.summit,
            activatorCallsign: response.data.activatorCallsign,
            callsign: response.data.callsign,
            type: response.data.type
          })

          this.$parent.close()
        })
        .catch(err => {
          let errorText = err.message
          if (err.response && err.response.data) {
            errorText = err.response.data
          }
          this.$buefy.dialog.alert({
            title: 'Error',
            message: 'Could not log spot: ' + errorText,
            type: 'is-danger',
            ariaRole: 'alertdialog',
            ariaModal: true
          })
        })
        .finally(() => {
          this.posting = false
        })
    },
    onSummitSelected (summit) {
      this.summitCode = summit.code
      this.$nextTick(() => {
        this.$refs.summitCode.checkHtml5Validity()
      })
    },
    setType (type) {
      if (this.type === type) {
        this.type = 'NORMAL'
      } else {
        this.type = type
      }
    }
  },
  data () {
    return {
      qth_latitude: null,
      qth_longitude: null,
      other_callsign: '',
      lastCallsign: null,
      defaultComments: '',
      summitCode: '',
      lastSummitCode: null,
      frequency: '',
      mode: '',
      comments: '',
      summit: null,
      summitInvalid: false,
      summitLoading: false,
      posting: false,
      type: 'NORMAL'
    }
  }
}
</script>

<style scoped>
.callsign :deep(input) {
  text-transform: uppercase;
}
.invalid :deep(.help) {
  text-decoration: line-through;
}
:deep(input::-webkit-outer-spin-button),
:deep(input::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}
:deep(input[type=number]) {
  -moz-appearance:textfield;
}
.summitref .field {
  margin-bottom: 0;
}
:deep(.help.is-warning) {
  color: #cda400;
}

/* Fix from https://github.com/buefy/buefy/issues/1932#issuecomment-551453842 */
:deep(.field.has-addons) {
  flex-wrap: wrap;
}
:deep(.field.has-addons .help) {
  width: 100%;
}
</style>
