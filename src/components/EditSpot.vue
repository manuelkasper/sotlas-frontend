<template>
  <div class="modal-card" style="width: auto">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ this.spot ? 'Edit' : 'Add' }} Spot</p>
    </header>
    <section class="modal-card-body">
      <b-field label="Callsign" :message="isOwnCallsign ? '' : 'You are spotting someone else\'s callsign'" :type="isOwnCallsign ? '' : 'is-info'">
        <b-input type="text" class="callsign" v-model="callsign" pattern="[a-zA-Z0-9/]{3,}" validation-message="Invalid callsign" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" required />
      </b-field>

      <b-field label="Summit reference" :message="summitDisplay" :type="summitType" :class="summitLabelClass" expanded>
        <b-field>
          <b-input type="text" class="summit-code" ref="summitCode" v-model="summitCode" placeholder="XX/YY-000" :loading="summitLoading" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" required />
          <p class="control">
            <NearbySummitsList @summitSelected="onSummitSelected" />
          </p>
        </b-field>
      </b-field>

      <b-field label="Frequency" :message="maybeKhz ? 'Do you really mean ' + frequency + ' MHz, or are you missing a dot?' : ''" :type="maybeKhz ? 'is-warning' : ''">
        <b-field :type="maybeKhz ? 'is-warning' : ''">
          <FrequencyInput v-model="frequency" :disabled="type !== 'NORMAL'" />
          <p class="control">
            <b-button @click="setType('QRT')" :type="type === 'QRT' ? 'is-primary' : ''">QRT</b-button>
          </p>
          <p class="control">
            <b-button  @click="setType('TEST')" :type="type === 'TEST' ? 'is-primary' : ''">Test</b-button>
          </p>
        </b-field>
      </b-field>

      <b-field label="Mode">
        <b-field>
          <b-radio-button v-for="(curModeDisp, curMode) in allModes()" :key="curMode" v-model="mode" :size="$mq.mobile ? 'is-small' : ''" :native-value="curMode" :disabled="type !== 'NORMAL'">{{ curModeDisp }}</b-radio-button>
        </b-field>
      </b-field>

      <b-field label="Comments">
        <b-input v-model="comments" type="text" maxlength="60" />
      </b-field>
    </section>
    <footer class="modal-card-foot">
      <b-button @click="$parent.close()">Cancel</b-button>
      <b-button type="is-info" :disabled="!isInputValid" :loading="posting" @click="postSpot">{{ (this.spot && this.spot.id) ? 'Edit' : 'Add' }} Spot</b-button>
    </footer>
  </div>
</template>

<script>
import axios from 'axios'
import utils from '../mixins/utils.js'
import prefs from '../mixins/prefs.js'
import sotawatch from '../mixins/sotawatch.js'
import NearbySummitsList from './NearbySummitsList.vue'
import FrequencyInput from './FrequencyInput.vue'

export default {
  components: {
    NearbySummitsList, FrequencyInput
  },
  mixins: [utils, prefs, sotawatch],
  props: {
    defaultSummitCode: String,
    spot: Object
  },
  prefs: {
    key: 'spotPrefs',
    props: ['lastCallsign', 'lastSummitCode', 'defaultComments']
  },
  mounted () {
    if (!this.callsign) {
      if (this.lastCallsign) {
        this.callsign = this.lastCallsign
      } else if (this.myCallsign) {
        this.callsign = this.myCallsign
        if (!/\/P$/.test(this.callsign)) {
          this.callsign += '/P'
        }
      }
    }
    if (!this.summitCode) {
      if (this.lastSummitCode) {
        this.summitCode = this.lastSummitCode
      }
    }
    if (!this.comments && this.defaultComments) {
      this.comments = this.defaultComments
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
      return /^[a-zA-Z0-9/]{3,}$/.test(this.callsign) && this.summit !== null && this.isSummitValid(this.summit) && (this.type !== 'NORMAL' || (this.frequency && this.mode))
    },
    summitLabelClass () {
      if (!this.summit || this.isSummitValid(this.summit)) {
        return { summitref: true }
      } else {
        return { summitref: true, invalid: true }
      }
    },
    isOwnCallsign () {
      return (!this.callsign || !this.myCallsign || (this.homeCallsign(this.callsign) === this.homeCallsign(this.myCallsign)))
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
            axios.get(process.env.VUE_APP_API_URL + '/summits/' + this.summitCode)
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
          this.callsign = this.spot.activatorCallsign
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
    postSpot () {
      this.lastCallsign = this.callsign.toUpperCase()
      this.lastSummitCode = this.summitCode

      // Advertise in comments :)
      let commentsTag = '[sotl.as]'
      let comments = this.comments
      if ((comments.length + commentsTag.length) < 60 && !comments.endsWith(commentsTag)) {
        if (comments.length > 0) {
          comments += ' '
        }
        comments += commentsTag
      }

      let params = {
        callsign: this.myCallsign,
        activatorCallsign: this.callsign.toUpperCase(),
        associationCode: this.summitCode.substring(0, this.summitCode.indexOf('/')),
        summitCode: this.summitCode.substring(this.summitCode.indexOf('/') + 1),
        frequency: String(this.frequency),
        mode: this.allModes()[this.mode],
        type: this.type,
        comments
      }
      if (this.spot && this.spot.id) {
        params.id = this.spot.id
      }
      if (this.type !== 'NORMAL') {
        delete params.mode
        delete params.frequency
      }
      this.posting = true
      this.postSotaWatchSpot(params)
        .then(response => {
          this.$store.commit('updateSpot', {
            id: (this.spot && this.spot.id) ? this.spot.id : response.data.id,
            timeStamp: response.data.timeStamp,
            frequency: response.data.frequency,
            mode: response.data.mode,
            summit: this.summit,
            activatorCallsign: response.data.activatorCallsign,
            callsign: response.data.callsign,
            comments: response.data.comments,
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
            message: 'Could not post spot: ' + errorText,
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
      callsign: '',
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
.callsign >>> input {
  text-transform: uppercase;
}
.invalid >>> .help {
  text-decoration: line-through;
}
>>> input::-webkit-outer-spin-button,
>>> input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
>>> input[type=number] {
  -moz-appearance:textfield;
}
.summitref .field {
  margin-bottom: 0;
}
>>> .help.is-warning {
  color: #cda400;
}

/* Fix from https://github.com/buefy/buefy/issues/1932#issuecomment-551453842 */
>>> .field.has-addons {
  flex-wrap: wrap;
}
>>> .field.has-addons .help {
  width: 100%;
}
</style>
