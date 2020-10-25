<template>
  <b-modal :active.sync="modalActive" :can-cancel="['escape', 'outside']" has-modal-card>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title"><span v-if="activationDetails"><router-link :to="makeActivatorLinkUserId(activationDetails.UserID)">{{ activationDetails.OwnCallsign }}</router-link> on <router-link :to="makeSummitLink(summitCode)">{{ activationDetails.Summit }}</router-link>, <span class="activation-date">{{ niceActivationDate }}</span></span></p>
        <button class="delete" aria-label="close" @click="modalActive = false"></button>
      </header>
      <section class="modal-card-body">
        <QSOList v-if="activationDetails !== null" :data="activationDetails.ActivatorLogs" />
        <b-loading :is-full-page="false" :active="activationLoading" />
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
      handler () {
        if (this.activationId === null) {
          this.modalActive = false
          return
        }

        this.activationDetails = null
        this.modalActive = true
        this.activationLoading = true
        this.loadActivationDetails(this.activationId)
          .then(activationDetails => {
            this.activationDetails = activationDetails
            this.activationLoading = false

            let matches = activationDetails.ActivationDate.match(/^\d\d\/\d\d\/(\d\d\d\d)$/)
            if (matches) {
              this.loadS2SLog(activationDetails.UserID, matches[1])
                .then(response => {
                  this.augmentS2S(response)
                })
            }
          })
          .catch(() => {
            this.activationLoading = false
          })
      }
    },
    modalActive (newModalActive) {
      if (!newModalActive) {
        this.$emit('modalClosed')
        this.qsoList = null
      }
    }
  },
  computed: {
    niceActivationDate () {
      return moment(this.activationDetails.ActivationDate, 'DD/MM/YYYY').format('DD MMM YYYY')
    },
    summitCode () {
      return this.activationDetails.Summit.substring(0, this.activationDetails.Summit.indexOf(' '))
    }
  },
  methods: {
    augmentS2S (response) {
      // Convert date (SOTA API is not consistent with formats)
      let matches = this.activationDetails.ActivationDate.match(/^(\d\d)\/(\d\d)\/(\d\d\d\d)$/)
      if (!matches) {
        return
      }
      let activationDate = `${matches[3]}-${matches[2]}-${matches[1]}`

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
      activationDetails: null
    }
  }
}
</script>

<style scoped>
.faicon {
  color: #3273dc;
  float: right;
}
.delete {
  left: 10px;
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
