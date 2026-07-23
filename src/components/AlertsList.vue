<template>
  <div>
    <CardPagination v-if="!$mq.desktop && cardAlerts.length > 0" :data="cardAlerts" :infinite="infinite" :paginated="paginated">
      <template v-slot="{ row, prevRow }">
        <AlertCard :alert="row" :callsignLink="callsignLink" :showSummitInfo="showSummitInfo">
          <template v-if="needDateHeader(row, prevRow)" v-slot:header>
            {{ formatAlertDate(row.dateActivated) }}
          </template>
          <template v-if="canEditAlert(row)" v-slot:actions>
            <div class="actions">
              <b-button class="control" size="is-small" outlined icon-left="edit" @click="editAlert(row)">Edit</b-button>
              <b-button class="control" size="is-small" outlined icon-left="plus" @click="makeSpot(row)">Spot</b-button>
              <b-button class="control" size="is-small" type="is-danger" outlined icon-left="trash-alt" @click="deleteAlert(row)">Delete</b-button>
            </div>
          </template>
        </AlertCard>
      </template>
    </CardPagination>
    <p v-else-if="!$mq.desktop && cardAlerts.length === 0">No matching alerts found.</p>
    <b-table v-else default-sort="dateActivated" :narrowed="true" :striped="true" :data="data" :paginated="paginated" :per-page="perPage" v-model:current-page="curPage" :row-class="rowClass">
      <b-table-column field="dateActivated" cell-class="timestamp" label="Date/Time" sortable v-slot="props">
        <span v-html="formatDateTimeRelative(props.row.dateActivated)" />
      </b-table-column>
      <b-table-column v-if="showCallsign" field="activatorCallsign" label="Callsign" sortable v-slot="props">
        <template v-if="callsignLink">
          <router-link :to="makeActivatorLink(props.row.activatorCallsign)">{{ props.row.activatorCallsign }}</router-link>
        </template>
        <template v-else>
          {{ props.row.activatorCallsign }}
        </template>
      </b-table-column>
      <b-table-column v-if="showSummitInfo" field="summit.code" label="Summit Ref." cell-class="nowrap" sortable v-slot="props">
        <CountryFlag v-if="props.row.summit.isoCode && $mq.fullhd" :country="props.row.summit.isoCode" class="flag" />
        <router-link v-if="props.row.summit.name" :to="makeSummitLink(props.row.summit.code)">{{ props.row.summit.code }}</router-link>
        <span v-else>{{ props.row.summit.code }}</span>
      </b-table-column>
      <b-table-column v-if="showSummitInfo" field="summit.name" label="Summit Name" sortable v-slot="props">
        <router-link :to="makeSummitLink(props.row.summit.code)">{{ props.row.summit.name }}</router-link>
      </b-table-column>
      <b-table-column v-if="showSummitInfo" field="summit.altitude" label="Altitude" sortable numeric v-slot="props">
        <template v-if="props.row.summit.altitude"><AltitudeLabel :altitude="props.row.summit.altitude" /></template>
      </b-table-column>
      <b-table-column v-if="showSummitInfo" field="summit.points" label="Points" sortable numeric v-slot="props">
        <SummitPointsLabel v-if="props.row.summit.points" :points="props.row.summit.points" />
      </b-table-column>
      <b-table-column v-if="showSummitInfo" field="summit.activationCount" label="Act." sortable numeric v-slot="props">
        <ActivationCount :activationCount="props.row.summit.activationCount" />
      </b-table-column>
      <b-table-column class="comments" label="Frequencies/Comments" v-slot="props">
        <div class="comments-cell">
          <div>
            {{ props.row.frequency }}<br />
            <span class="comments-text">{{ props.row.comments }} ({{ props.row.posterCallsign }})</span>
          </div>
          <b-dropdown v-if="canEditAlert(props.row)" class="actions" aria-role="list">
            <template v-slot:trigger>
              <b-button size="is-small" icon-pack="fas" icon-right="caret-down" outlined>Actions</b-button>
            </template>

            <b-dropdown-item aria-role="listitem" @click="editAlert(props.row)"><b-icon icon="edit" size="is-small" /><span class="dropdown-label">Edit</span></b-dropdown-item>
            <b-dropdown-item aria-role="listitem" @click="makeSpot(props.row)"><b-icon icon="plus" size="is-small" /><span class="dropdown-label">Spot</span></b-dropdown-item>
            <b-dropdown-item aria-role="listitem" @click="deleteAlert(props.row)"><b-icon icon="trash-alt" type="is-danger" size="is-small" /><span class="has-text-danger dropdown-label">Delete</span></b-dropdown-item>
          </b-dropdown>
        </div>
      </b-table-column>
      <template v-if="paginated" v-slot:bottom-left>
        <b-select v-model="perPage">
          <option v-for="option in perPageOptions" :key="option" :value="option">{{ option }} per page</option>
        </b-select>
      </template>
    </b-table>
    <b-modal v-model="isEditAlertActive" has-modal-card :can-cancel="['escape']">
      <EditAlert :alert="alertToEdit" @close="isEditAlertActive = false" />
    </b-modal>
    <b-modal v-model="isEditSpotActive" has-modal-card :can-cancel="['escape']">
      <EditSpot :spot="spotToMake" @close="isEditSpotActive = false" />
    </b-modal>
  </div>
</template>

<script>
import moment from 'moment'
import utils from '../mixins/utils.js'
import prefs from '../mixins/prefs.js'
import nowticker from '../mixins/nowticker.js'
import sotawatch from '../mixins/sotawatch.js'
import SummitPointsLabel from '../components/SummitPointsLabel.vue'
import CardPagination from '../components/CardPagination.vue'
import AlertCard from '../components/AlertCard.vue'
import ActivationCount from '../components/ActivationCount.vue'
import CountryFlag from '../components/CountryFlag.vue'
import AltitudeLabel from '../components/AltitudeLabel.vue'
import EditAlert from '../components/EditAlert.vue'
import EditSpot from '../components/EditSpot.vue'

export default {
  name: 'AlertsList',
  components: {
    SummitPointsLabel, CardPagination, AlertCard, ActivationCount, CountryFlag, AltitudeLabel, EditAlert, EditSpot
  },
  mixins: [utils, prefs, nowticker, sotawatch],
  prefs: {
    key: 'alertsListPrefs',
    props: ['perPage']
  },
  props: {
    data: Array,
    showCallsign: {
      type: Boolean,
      default: true
    },
    showSummitInfo: {
      type: Boolean,
      default: true
    },
    paginated: {
      type: Boolean,
      default: true
    },
    infinite: {
      type: Boolean,
      default: false
    },
    callsignLink: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    formatAlertDate (date) {
      return moment.utc(date).format('dddd, DD MMM YYYY')
    },
    needDateHeader (row, prevRow) {
      return (!prevRow || !moment.utc(prevRow.dateActivated).isSame(moment.utc(row.dateActivated), 'day'))
    },
    rowClass (row, index) {
      let realIndex = (this.curPage - 1) * this.perPage + index
      if (index === 0 || realIndex === 0 || realIndex === this.data.length) {
        return ''
      }
      if (!moment.utc(this.data[realIndex - 1].dateActivated).isSame(moment.utc(row.dateActivated), 'day')) {
        return 'date-change'
      } else {
        return ''
      }
    },
    canEditAlert (alert) {
      if (!this.myUserId) {
        return false
      }

      return (alert.userID === this.myUserId)
    },
    addAlert () {
      this.alertToEdit = null
      this.isEditAlertActive = true
    },
    editAlert (alert) {
      this.alertToEdit = alert
      this.isEditAlertActive = true
    },
    makeSpot (alert) {
      this.spotToMake = {
        activatorCallsign: alert.activatorCallsign,
        summit: alert.summit,
        comments: alert.comments,
        mode: ''
      }
      this.isEditSpotActive = true
    },
    deleteAlert (alert) {
      this.$buefy.dialog.confirm({
        message: 'Are you sure you want to delete this alert?',
        confirmText: 'Delete',
        type: 'is-danger',
        onConfirm: () => {
          this.deleteSotaWatchAlert(alert.id)
            .then(response => {
              this.$store.dispatch('reloadAlerts')
            })
            .catch(err => {
              this.$buefy.dialog.alert({
                title: 'Error',
                message: 'Could not delete alert: ' + err.message,
                type: 'is-danger',
                ariaRole: 'alertdialog',
                ariaModal: true
              })
            })
        }
      })
    }
  },
  computed: {
    cardAlerts () {
      return [...this.data].sort((a, b) => {
        if (a.dateActivated > b.dateActivated) {
          return 1
        } else if (a.dateActivated < b.dateActivated) {
          return -1
        } else {
          return 0
        }
      })
    },
    curPage: {
      get () {
        return this.$store.state.alertPage
      },
      set (val) {
        this.$store.commit('setAlertPage', val)
      }
    }
  },
  data () {
    return {
      perPage: 15,
      perPageOptions: [10, 15, 20, 30, 50, 100],
      isEditAlertActive: false,
      isEditSpotActive: false,
      alertToEdit: null,
      spotToMake: null
    }
  }
}
</script>

<style scoped>
@media (min-width: 769px) {
  /* Targeting the .comments-cell element directly (rather than the .comments class
     passed to <b-table-column>) because Buefy 3's table rendering no longer forwards
     that class onto the rendered <td> (only a data-label attribute is), unlike
     Buefy 0.8. SpotsList.vue's equivalent column doesn't have this problem because it
     already targets .comments-tooltip, a real rendered element. */
  .comments-cell {
    font-size: 0.8rem;
    max-width: 30em;
  }
}
.flag {
  margin-right: 0.4em;
}
.comments-text {
  color: #777;
}
.comments-cell {
  display: flex;
}
.actions {
  margin-left: auto;
}
.card .actions {
  float: right;
  clear: right;
}
.actions .button {
  margin-left: 1em;
}
.card .actions {
  margin-top: 0.5em;
}
.date-change td {
  border-top: 3px solid #dbdbdb;
}
:deep(.dropdown-item .icon) {
  vertical-align: middle;
}
.dropdown-item .dropdown-label {
  margin-left: 0.5em;
}
</style>
