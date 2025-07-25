<template>
  <div class="modal-card" style="width: auto">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ this.alert ? 'Edit' : 'Add' }} Alert</p>
    </header>
    <section class="modal-card-body">
      <b-field label="Callsign" :message="isOwnCallsign ? '' : 'You are posting an alert for someone else\'s callsign'" :type="isOwnCallsign ? '' : 'is-info'">
        <b-input type="text" class="callsign" v-model="callsign" pattern="[a-zA-Z0-9\/]{3,}" validation-message="Invalid callsign" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" required />
      </b-field>

      <b-field label="Summit reference" :message="summitDisplay" :type="summitType" :class="summitLabelClass" expanded>
        <b-field>
          <b-input type="text" class="summit-code" ref="summitCode" v-model="summitCode" placeholder="XX/YY-000" :loading="summitLoading" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" required />
          <p class="control">
            <NearbySummitsList @summitSelected="onSummitSelected" />
          </p>
        </b-field>
      </b-field>

      <b-field label="Activation date" message="dd/mm/yyyy" expanded>
        <b-datepicker v-model="date" icon="calendar-day" :min-date="minDate" :date-formatter="dateFormatter" :date-parser="dateParser" :mobile-native="false" required />
      </b-field>

      <b-field label="ETA" message="e.g. 12:15" class="eta" expanded>
        <b-field>
          <b-input :type="$mq.mobile ? 'time' : 'text'" pattern="([0-1]{1}[0-9]{1}|20|21|22|23):[0-5]{1}[0-9]{1}" class="time-input" v-model="time" icon="clock" required />
          <p class="control">
            <b-radio-button v-model="timeZone" native-value="local">Local</b-radio-button>
          </p>
          <p class="control">
            <b-radio-button v-model="timeZone" native-value="utc">UTC</b-radio-button>
          </p>
        </b-field>
      </b-field>

      <b-field label="Frequency-Mode(s)">
        <b-taginput v-model="freqMode" ref="freqMode" autocomplete rounded :data="freqModeSuggestions" :confirm-key-codes="[9,13,32,188]" @typing="updateFreqModeSuggestions" @input="onFreqModeInput" @blur="onFreqModeBlur" @keydown.native="onFreqModeKeyDown" append-to-body />
        <template slot="message">
          Format: <em>freq-mode, ...</em> (e.g. <em>7.030-cw, 14.250-ssb</em>)
        </template>
      </b-field>

      <b-field label="Comments">
        <b-input v-model="comments" type="text" maxlength="60" />
      </b-field>
    </section>
    <footer class="modal-card-foot">
      <b-button @click="$parent.close()">Cancel</b-button>
      <b-button type="is-info" :disabled="!isInputValid" :loading="posting" @click="postAlert">{{ this.alert ? 'Edit' : 'Add' }} Alert</b-button>
    </footer>
  </div>
</template>

<script>
import axios from 'axios'
import moment from 'moment'

import utils from '../mixins/utils.js'
import prefs from '../mixins/prefs.js'
import sotawatch from '../mixins/sotawatch.js'
import NearbySummitsList from './NearbySummitsList.vue'

export default {
  components: {
    NearbySummitsList
  },
  mixins: [utils, prefs, sotawatch],
  props: {
    defaultSummitCode: String,
    alert: Object
  },
  prefs: {
    key: 'editAlertPrefs',
    props: ['lastCallsign', 'timeZone', 'defaultComments']
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

    if (!this.timeZone) {
      this.timeZone = 'utc'
    }

    if (!this.comments && this.defaultComments) {
      this.comments = this.defaultComments
    }
  },
  computed: {
    minDate () {
      if (this.timeZone === 'local') {
        return moment(moment().startOf('day').format('YYYY-MM-DD')).toDate()
      } else {
        return moment(moment.utc().startOf('day').format('YYYY-MM-DD')).toDate()
      }
    },
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
      return /^[a-zA-Z0-9/]{3,}$/.test(this.callsign) &&
        (this.summitCodeXxx || (this.summit !== null && this.isSummitValid(this.summit))) &&
        this.date && /^\d\d:\d\d$/.test(this.time) &&
        this.freqMode.length > 0 && (this.freqMode.join(', ').length <= 40 || this.freqMode.join(',').length <= 40)
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
          let summitRegex = /^([A-Z0-9]{1,8})[/ ]([A-Z]{2}|\?\?)[- ]?([0-9]{3}|xxx|\?\?\?)$/i
          let matches = this.summitCode.match(summitRegex)
          if (matches) {
            this.summitCode = (matches[1] + '/' + matches[2] + '-' + matches[3]).toUpperCase()
            if (matches[2].toUpperCase() === 'XX' || matches[2] === '??' || matches[3].toUpperCase() === 'XXX' || matches[3] === '???') {
              this.summitInvalid = false
              this.summitCodeXxx = true
              this.summit = null
            } else {
              this.summitLoading = true
              this.summitCodeXxx = false
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
            }
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
    alert: {
      immediate: true,
      handler () {
        if (this.alert) {
          this.callsign = this.alert.activatorCallsign
          this.summitCode = this.alert.summit.code
          this.date = moment(this.alert.dateActivated.substring(0, 19)).toDate()
          this.time = moment(this.alert.dateActivated.substring(0, 19)).format('HH:mm')
          this.freqMode = this.alert.frequency.split(/\s*,\s*/)
          this.comments = this.alert.comments
        }
      }
    },
    timeZone (newTimeZone) {
      if (!this.date || !this.time) {
        return
      }

      if (newTimeZone === 'local') {
        let conv = this.utcToLocal(this.date, this.time)
        if (conv) {
          this.date = conv.date
          this.time = conv.time
        }
      } else {
        let conv = this.localToUtc(this.date, this.time)
        if (conv) {
          this.date = conv.date
          this.time = conv.time
        }
      }
    },
    time (newTime) {
      // Add colon to nnnn style times
      let matches = newTime.match(/^(\d\d)(\d\d)$/)
      if (matches) {
        this.time = matches[1] + ':' + matches[2]
      }
    }
  },
  methods: {
    postAlert () {
      this.lastCallsign = this.callsign.toUpperCase()
      let freqMode = this.freqMode.join(', ')
      if (freqMode.length > 40) {
        freqMode = this.freqMode.join(',')
      }
      let utcDate = this.date
      let utcTime = this.time
      if (this.timeZone === 'local') {
        let conv = this.localToUtc(this.date, this.time)
        utcDate = conv.date
        utcTime = conv.time
      }
      let params = {
        activatingCallsign: this.callsign.toUpperCase(),
        associationCode: this.summitCode.substring(0, this.summitCode.indexOf('/')),
        summitCode: this.summitCode.substring(this.summitCode.indexOf('/') + 1),
        dateActivated: moment(utcDate).format('YYYY-MM-DD') + 'T' + utcTime + ':00Z',
        frequency: freqMode,
        comments: this.comments,
        posterCallsign: this.myCallsign
      }
      if (this.alert) {
        params.id = this.alert.id
      }
      this.posting = true
      this.postSotaWatchAlert(params)
        .then(response => {
          this.$store.dispatch('reloadAlerts')
          this.$parent.close()
        })
        .catch(err => {
          let errorText = err.message
          if (err.response && err.response.data) {
            errorText = err.response.data
          }
          this.$buefy.dialog.alert({
            title: 'Error',
            message: 'Could not post alert: ' + errorText,
            type: 'is-danger',
            ariaRole: 'alertdialog',
            ariaModal: true
          })
        })
        .finally(() => {
          this.posting = false
        })
    },
    dateFormatter (date) {
      return moment(date).format('DD/MM/YYYY')
    },
    dateParser (date) {
      return moment(date).toDate()
    },
    updateFreqModeSuggestions (text) {
      let matches = text.match(/^([0-9.]+)/)
      if (matches) {
        this.freqModeSuggestions = Object.keys(this.allModes()).map(mode => {
          return matches[1] + '-' + mode
        }).filter(suggestion => {
          return suggestion.startsWith(text.toLowerCase())
        })
      } else {
        this.freqModeSuggestions = []
      }
    },
    onFreqModeInput () {
      let splitFreqModes = []
      this.freqMode.forEach(fm => {
        splitFreqModes = splitFreqModes.concat(fm.split(/\s*[, ]\s*/))
      })
      this.freqMode = splitFreqModes
    },
    onFreqModeBlur () {
      // Delay to avoid double entry when clicking a tag suggestion
      setTimeout(() => {
        this.$refs.freqMode.addTag()
      }, 100)
    },
    onFreqModeKeyDown () {
      // Hack to allow us to get keep-first behavior on autocomplete despite the fact
      // that b-taginput sets keepFirst = !allowNew
      if (this.$refs.freqMode.confirmKeyCodes.indexOf(event.keyCode) >= 0) {
        event.preventDefault()
        this.$refs.freqMode.addTag()
      }
    },
    onSummitSelected (summit) {
      this.summitCode = summit.code
      this.$nextTick(() => {
        this.$refs.summitCode.checkHtml5Validity()
      })
    },
    localToUtc (date, time) {
      let utc = moment(moment(date).format('YYYY-MM-DD') + ' ' + time).utc()
      if (!utc.isValid()) {
        return undefined
      }
      return {
        date: moment(moment(utc).startOf('day').format('YYYY-MM-DD')).toDate(),
        time: utc.format('HH:mm')
      }
    },
    utcToLocal (date, time) {
      let local = moment.utc(moment(date).format('YYYY-MM-DD') + ' ' + time).local()
      if (!local.isValid()) {
        return undefined
      }
      return {
        date: moment(moment(local).startOf('day').format('YYYY-MM-DD')).toDate(),
        time: local.format('HH:mm')
      }
    }
  },
  data () {
    return {
      callsign: '',
      lastCallsign: null,
      defaultComments: '',
      summitCode: '',
      date: new Date(),
      time: '',
      freqMode: [],
      freqModeSuggestions: [],
      comments: '',
      summit: null,
      summitInvalid: false,
      summitCodeXxx: false,
      summitLoading: false,
      timeZone: 'utc',
      posting: false
    }
  }
}
</script>

<style scoped>
.callsign >>> input {
  text-transform: uppercase;
}
@media (max-width: 1023px) {
  >>> .datepicker .dropdown.is-mobile-modal .dropdown-menu {
    width: calc(100vw - 40px);
  }
}
>>> .datepicker .dropdown.is-active .dropdown-menu {
  position: fixed !important;
  left: 50% !important;
  top: 50% !important;
  transform: translate(-50%, -50%);
  z-index: 100;
}
.invalid >>> .help {
  text-decoration: line-through;
}
.taginput {
  max-width: 30em;
}
.eta .field {
  margin-bottom: 0;
}
.eta >>> .time-input {
  width: 8em;
}
.summitref .field {
  margin-bottom: 0;
}

/* Fix from https://github.com/buefy/buefy/issues/1932#issuecomment-551453842 */
>>> .field.has-addons {
  flex-wrap: wrap;
}
>>> .field.has-addons .help {
  width: 100%;
}
</style>
