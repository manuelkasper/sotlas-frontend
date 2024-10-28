<template>
  <div>
    <CardPagination v-if="!$mq.desktop" :data="cardSpots" :infinite="infinite" :paginated="paginated">
      <template v-slot="{ row }">
        <SpotCard :class="recentClass(row.timeStamp)" :spot="row" :callsignLink="callsignLink" :showSummitInfo="showSummitInfo">
          <template v-slot:actions>
            <div v-if="canEditSpot(row)" class="actions">
              <b-button class="control" size="is-small" outlined icon-left="edit" @click="editSpot(row)">Edit</b-button>
              <b-button class="control" size="is-small" outlined icon-left="clone" @click="cloneSpot(row)">Clone</b-button>
              <b-button class="control" size="is-small" type="is-danger" outlined icon-left="trash-alt" @click="deleteSpot(row)">Delete</b-button>
            </div>
          </template>
        </SpotCard>
      </template>
    </CardPagination>
    <b-table v-else :default-sort="['timeStamp', 'desc']" :narrowed="true" :striped="true" :data="data" :paginated="paginated" :per-page="perPage" :current-page.sync="curPage" :row-class="rowClass">
      <template slot-scope="props">
        <b-table-column field="timeStamp" class="timestamp" label="Time" sortable>
          <span v-html="formatTimeDay(props.row.timeStamp)" />
        </b-table-column>
        <b-table-column v-if="showCallsign" field="activatorCallsign" label="Callsign" sortable>
          <template v-if="callsignLink">
            <router-link :to="makeActivatorLink(props.row.activatorCallsign)">{{ props.row.activatorCallsign }}</router-link>
          </template>
          <template v-else>
            {{ props.row.activatorCallsign }}
          </template>
        </b-table-column>
        <b-table-column field="frequency" label="Frequency" sortable :custom-sort="sortFrequency" numeric>
          <span v-if="!props.row.type || props.row.type === 'NORMAL'">{{ props.row.frequency | formatFrequency }}</span>
        </b-table-column>
        <b-table-column field="mode" label="Mode" sortable>
          <ModeLabel :mode="props.row.mode" :type="props.row.type" />
        </b-table-column>
        <b-table-column v-if="showSummitInfo" field="summit.code" label="Summit Ref." class="nowrap" sortable>
          <CountryFlag v-if="props.row.summit.isoCode && $mq.fullhd" :country="props.row.summit.isoCode" class="flag" />
          <router-link v-if="props.row.summit.name" :to="makeSummitLink(props.row.summit.code)">{{ props.row.summit.code }}</router-link>
          <span v-else>{{ props.row.summit.code }}</span>
        </b-table-column>
        <b-table-column v-if="showSummitInfo" field="summit.name" label="Summit Name" sortable>
          <router-link :to="makeSummitLink(props.row.summit.code)">{{ props.row.summit.name }}</router-link>
        </b-table-column>
        <b-table-column v-if="showSummitInfo" field="summit.altitude" label="Altitude" sortable numeric>
          <template v-if="props.row.summit.altitude"><AltitudeLabel :altitude="props.row.summit.altitude" /></template>
        </b-table-column>
        <b-table-column v-if="showSummitInfo" field="summit.points" label="Points" sortable numeric>
          <SummitPointsLabel v-if="props.row.summit.points" :points="props.row.summit.points" />
        </b-table-column>
        <b-table-column v-if="showSummitInfo" field="summit.activationCount" label="Act." sortable numeric>
          <ActivationCount :activationCount="props.row.summit.activationCount" />
        </b-table-column>
        <b-table-column field="callsign" label="Posted By" sortable>
          {{ props.row.callsign }}
        </b-table-column>
        <b-table-column field="comments" class="comments" label="Comments">
          <div class="comments-cell">
            <b-tooltip class="comments-tooltip" :label="props.row.comments" position="is-left" multilined :active="!$mq.fullhd"><div>{{ props.row.comments }}</div></b-tooltip>
            <b-dropdown v-if="canEditSpot(props.row)" class="actions" aria-role="list">
              <b-button size="is-small" slot="trigger" icon-pack="fas" icon-right="caret-down" outlined>Actions</b-button>

              <b-dropdown-item aria-role="listitem" @click="editSpot(props.row)"><b-icon icon="edit" size="is-small" /><span class="dropdown-label">Edit</span></b-dropdown-item>
              <b-dropdown-item aria-role="listitem" @click="cloneSpot(props.row)"><b-icon icon="clone" size="is-small" /><span class="dropdown-label">Clone</span></b-dropdown-item>
              <b-dropdown-item aria-role="listitem" @click="deleteSpot(props.row)"><b-icon icon="trash-alt" type="is-danger" size="is-small" /><span class="has-text-danger dropdown-label">Delete</span></b-dropdown-item>
            </b-dropdown>
          </div>
        </b-table-column>
      </template>
      <template v-if="paginated" v-slot:bottom-left>
        <b-select v-model="perPage">
          <option v-for="option in perPageOptions" :key="option" :value="option">{{ option }} per page</option>
        </b-select>
      </template>
    </b-table>
    <b-modal v-if="isEditSpotActive" :active="true" has-modal-card :can-cancel="['escape']" @close="isEditSpotActive = false">
      <EditSpot :spot="spotToEdit" />
    </b-modal>
  </div>
</template>

<script>
import utils from '../mixins/utils.js'
import prefs from '../mixins/prefs.js'
import nowticker from '../mixins/nowticker.js'
import sotawatch from '../mixins/sotawatch.js'
import ModeLabel from '../components/ModeLabel.vue'
import SummitPointsLabel from '../components/SummitPointsLabel.vue'
import CardPagination from '../components/CardPagination.vue'
import SpotCard from '../components/SpotCard.vue'
import ActivationCount from '../components/ActivationCount.vue'
import CountryFlag from '../components/CountryFlag.vue'
import AltitudeLabel from '../components/AltitudeLabel.vue'
import EditSpot from '../components/EditSpot.vue'

export default {
  name: 'SpotsList',
  components: {
    ModeLabel, SummitPointsLabel, CardPagination, SpotCard, ActivationCount, CountryFlag, AltitudeLabel, EditSpot
  },
  mixins: [utils, prefs, nowticker, sotawatch],
  prefs: {
    key: 'spotsListPrefs',
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
  computed: {
    cardSpots () {
      return [...this.data].sort((a, b) => {
        if (a.timeStamp > b.timeStamp) {
          return -1
        } else if (a.timeStamp < b.timeStamp) {
          return 1
        } else {
          return 0
        }
      })
    },
    curPage: {
      get () {
        return this.$store.state.spotPage
      },
      set (val) {
        this.$store.commit('setSpotPage', val)
      }
    }
  },
  methods: {
    rowClass (row) {
      return this.recentClass(row.timeStamp)
    },
    sortFrequency (a, b, isAsc) {
      let fa = parseFloat(a.frequency)
      let fb = parseFloat(b.frequency)
      if (fa < fb) {
        return (isAsc ? -1 : 1)
      } else if (fa === fb) {
        return 0
      } else {
        return (isAsc ? 1 : -1)
      }
    },
    canEditSpot (spot) {
      if (!this.myCallsign) {
        return false
      }

      return (spot.callsign === this.myCallsign)
    },
    addSpot () {
      this.spotToEdit = null
      this.isEditSpotActive = true
    },
    editSpot (spot) {
      this.spotToEdit = spot
      this.isEditSpotActive = true
    },
    cloneSpot (spot) {
      let newSpot = Object.assign({}, spot)
      delete newSpot.id
      delete newSpot.frequency
      this.spotToEdit = newSpot
      this.isEditSpotActive = true
    },
    deleteSpot (spot) {
      this.$buefy.dialog.confirm({
        message: 'Are you sure you want to delete this spot?',
        confirmText: 'Delete',
        type: 'is-danger',
        onConfirm: () => {
          this.deleteSotaWatchSpot(spot.id)
            .then(response => {
              this.$store.commit('deleteSpot', spot)
            })
            .catch(err => {
              this.$buefy.dialog.alert({
                title: 'Error',
                message: 'Could not delete spot: ' + err.message,
                type: 'is-danger',
                ariaRole: 'alertdialog',
                ariaModal: true
              })
            })
        }
      })
    }
  },
  data () {
    return {
      perPage: 15,
      perPageOptions: [10, 15, 20, 30, 50, 100],
      isEditSpotActive: false,
      spotToEdit: null
    }
  }
}
</script>

<style scoped>
tr .timestamp {
  border-left: 3px solid #e0e0e0;
}
tr.recent1 .timestamp {
  border-left: 3px solid #f28591;
}
tr.recent2 .timestamp {
  border-left: 3px solid #fbaf63;
}
@media (min-width: 769px) {
  .table .comments-tooltip {
    font-size: 0.8rem;
  }
  .table .comments-tooltip div {
    padding-top: 0.15em;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 10em;
  }
}
@media (min-width: 1408px) {
  .table .comments-tooltip div {
    overflow: visible;
    white-space: normal;
    text-overflow: ellipsis;
    max-width: none;
  }
}
.card {
  border-left: 3px solid #e0e0e0;
}
.card.recent1 {
  border-left: 3px solid #f28591;
}
.card.recent2 {
  border-left: 3px solid #fbaf63;
}
.flag {
  margin-right: 0.4em;
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
>>> .dropdown-item .icon {
  vertical-align: middle;
}
.dropdown-item .dropdown-label {
  margin-left: 0.5em;
}
</style>
