<template>
  <b-modal
    v-model="modalActive"
    :can-cancel="modalCanCancel"
    :custom-class="modalCustomClass"
    :destroy-on-hide="false"
    has-modal-card
    @after-enter="onAfterEnter"
    @before-leave="onBeforeLeave"
    @after-leave="finishLeave"
  >
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title"><span v-if="activationDetails"><router-link :to="makeActivatorLinkUserId(activationDetails.UserID)">{{ activationDetails.OwnCallsign }}</router-link> on <router-link :to="makeSummitLink(summitCode)">{{ activationDetails.Summit }}</router-link>, <span class="activation-date">{{ niceActivationDate }}</span></span></p>
        <button class="delete" aria-label="close" @click="modalActive = false"></button>
      </header>
      <section class="modal-card-body">
        <QSOList v-if="activationDetails" :data="activationDetails.ActivatorLogs || []" />
        <b-loading :is-full-page="false" :model-value="activationLoading" />
      </section>
      <footer class="modal-card-foot"></footer>
    </div>
  </b-modal>
</template>

<script>
import moment from 'moment'

import QSOList from '../components/QSOList.vue'
import sotadb from '../mixins/sotadb.js'
import utils from '../mixins/utils.js'

export default {
  props: {
    activationId: Number
  },
  mixins: [ sotadb, utils ],
  components: { QSOList },
  watch: {
    activationId: {
      immediate: true,
      handler (activationId) {
        this.pendingId = activationId
        if (activationId == null) {
          this.loadToken++
          this.activationLoading = false
          this.modalActive = false
          return
        }

        // A close animation still owns the modal. Opening again before it
        // finishes used to destroy the dialog while html stayed is-clipped,
        // which left an invisible overlay and a page that ignored input.
        if (this.leaving) {
          return
        }

        this.showActivation(activationId)
      }
    },
    modalActive (newModalActive) {
      if (!newModalActive) {
        this.$emit('modalClosed')
      }
    }
  },
  computed: {
    modalCanCancel () {
      return this.modalReady ? ['escape', 'outside'] : ['escape']
    },
    modalCustomClass () {
      return this.modalReady ? undefined : 'qso-modal-inert'
    },
    niceActivationDate () {
      if (!this.activationDetails || !this.activationDetails.ActivationDate) {
        return ''
      }
      return moment(this.activationDetails.ActivationDate, 'DD/MM/YYYY').format('DD MMM YYYY')
    },
    summitCode () {
      if (!this.activationDetails || !this.activationDetails.Summit) {
        return ''
      }
      return this.activationDetails.Summit.substring(0, this.activationDetails.Summit.indexOf(' '))
    }
  },
  methods: {
    showActivation (activationId) {
      const token = ++this.loadToken
      this.activationDetails = null
      this.activationLoading = true
      if (!this.modalActive) {
        this.modalReady = false
      }
      this.modalActive = true

      this.loadActivationDetails(activationId)
        .then(activationDetails => {
          if (token !== this.loadToken || !activationDetails) {
            if (token === this.loadToken) {
              this.activationLoading = false
            }
            return
          }

          this.activationDetails = activationDetails
          this.activationLoading = false

          let matches = String(activationDetails.ActivationDate || '').match(/^\d\d\/\d\d\/(\d\d\d\d)$/)
          if (!matches) {
            return
          }

          this.loadS2SLog(activationDetails.UserID, matches[1])
            .then(response => {
              if (token !== this.loadToken) {
                return
              }
              this.augmentS2S(response)
            })
            .catch(() => {
              // S2S notes are optional; the log is already on screen.
            })
        })
        .catch(() => {
          if (token !== this.loadToken) {
            return
          }
          this.activationLoading = false
        })
    },
    onAfterEnter () {
      this.modalReady = true
    },
    onBeforeLeave () {
      this.leaving = true
      this.modalReady = false
    },
    finishLeave () {
      if (!this.leaving) {
        return
      }
      this.leaving = false

      const id = this.pendingId
      this.$nextTick(() => {
        if (this.pendingId !== id || this.modalActive || this.leaving) {
          return
        }
        if (id == null) {
          this.activationDetails = null
          this.activationLoading = false
          return
        }
        this.showActivation(id)
      })
    },
    augmentS2S (response) {
      if (!this.activationDetails || !Array.isArray(this.activationDetails.ActivatorLogs) || !Array.isArray(response)) {
        return
      }

      // Convert date (SOTA API is not consistent with formats)
      let matches = String(this.activationDetails.ActivationDate || '').match(/^(\d\d)\/(\d\d)\/(\d\d\d\d)$/)
      if (!matches) {
        return
      }
      let activationDate = `${matches[3]}-${matches[2]}-${matches[1]}`

      if (!this.activationDetails.Summit) {
        return
      }

      // Extract summit ref.
      let summitRef = this.activationDetails.Summit.split(' ')[0]

      // Augment activation details with S2S info, if available
      response.forEach(s2s => {
        if (s2s.ActivationDate !== activationDate || s2s.Summit2Code !== summitRef) {
          return
        }

        // Find a QSO in the activator log with matching callsign, band, mode and approximate time
        let otherCallsign = this.homeCallsign(s2s.OtherCallsign)
        let s2sTime = moment.utc(activationDate + ' ' + s2s.TimeOfDay)
        let logEntry = this.activationDetails.ActivatorLogs.find(log => {
          if (this.homeCallsign(log.OtherCallsign) !== otherCallsign ||
              log.Band !== s2s.Band ||
              log.Mode !== s2s.Mode) {
            return false
          }

          let logTime = moment.utc(activationDate + ' ' + log.TimeOfDay)
          if (Math.abs(logTime.diff(s2sTime, 'minutes')) > 15) {
            return false
          }

          return true
        })
        if (logEntry) {
          if (logEntry.Notes == null) {
            logEntry.Notes = ''
          }
          // Add to notes if it does not already contain the summit ref
          if (!logEntry.Notes.includes(s2s.SummitCode)) {
            if (logEntry.Notes.length > 0 && logEntry.Notes !== 'S2S') {
              logEntry.Notes += ', '
            }
            if (logEntry.Notes !== 'S2S') {
              logEntry.Notes += 'S2S'
            }
            logEntry.Notes += ' ' + s2s.SummitCode
          }
        }
      })
    }
  },
  data () {
    return {
      modalActive: false,
      activationLoading: false,
      activationDetails: null,
      pendingId: null,
      leaving: false,
      modalReady: false,
      loadToken: 0
    }
  }
}
</script>

<style scoped>
.faicon {
  color: #3273dc;
  float: right;
}
.activation-date {
  white-space: nowrap;
}
.modal-card-body {
  padding: 10px;
  min-height: 6rem;
}
.modal-card-title {
  font-size: 1rem;
  flex-shrink: 1;
  line-height: 1.25;
}
</style>

<style>
/* Until the open animation finishes (and for the whole close animation) the
   modal covers the viewport at partial opacity. Let those clicks reach the
   QSO controls underneath instead of hitting the backdrop. */
.modal.qso-modal-inert {
  pointer-events: none;
}
</style>
