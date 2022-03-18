<template>
  <CardPagination v-if="!$mq.desktop" :data="cardSpots" rowKey="_id" :infinite="infinite" :paginated="paginated">
    <template v-slot="{ row }">
      <RBNSpotCard v-slot="{ row }" :class="recentClass(row.timeStamp)" :spot="row" :callsignLink="callsignLink" />
    </template>
  </CardPagination>
  <b-table v-else :default-sort="['timeStamp', 'desc']" :narrowed="true" :striped="true" :data="data" :paginated="paginated" :per-page="perPage" :row-class="rowClass">
    <b-table-column field="timeStamp" class="timestamp" label="Time" sortable v-slot="props">
      <span v-html="formatTimeDay(props.row.timeStamp)" />
    </b-table-column>
    <b-table-column field="callsign" label="Callsign" sortable v-slot="props">
      <CountryFlag :country="country(props.row.callsign)" class="flag" /><template v-if="callsignLink"><router-link :to="makeActivatorLink(props.row.callsign)">{{ props.row.callsign }}</router-link></template><template v-else>{{ props.row.callsign }}</template>
    </b-table-column>
    <b-table-column field="frequency" label="Frequency" sortable numeric v-slot="props">
      {{ props.row.frequency | formatFrequency }}
    </b-table-column>
    <b-table-column field="mode" label="Mode" sortable v-slot="props">
      <ModeLabel :mode="props.row.mode" />
    </b-table-column>
    <b-table-column field="snr" label="SNR" sortable numeric v-slot="props">
      {{ props.row.snr }} dB
    </b-table-column>
    <b-table-column field="speed" label="Speed" sortable numeric v-slot="props">
      {{ props.row.speed }} wpm
    </b-table-column>
    <b-table-column field="spotter" label="Spotter" sortable v-slot="props">
      {{ props.row.spotter }}
    </b-table-column>
    <template v-if="paginated" v-slot:bottom-left>
      <b-select v-model="perPage">
        <option v-for="option in perPageOptions" :key="option" :value="option">{{ option }} per page</option>
      </b-select>
    </template>
</b-table>
</template>

<script>
import prefix from '../prefix.js'
import utils from '../mixins/utils.js'
import prefs from '../mixins/prefs.js'
import nowticker from '../mixins/nowticker.js'
import ModeLabel from '../components/ModeLabel.vue'
import CardPagination from '../components/CardPagination.vue'
import RBNSpotCard from '../components/RBNSpotCard.vue'
import CountryFlag from '../components/CountryFlag.vue'

export default {
  name: 'SpotsList',
  components: {
    ModeLabel, CardPagination, RBNSpotCard, CountryFlag
  },
  mixins: [utils, prefs, nowticker],
  prefs: {
    key: 'rbnSpotListPrefs',
    props: ['perPage']
  },
  props: {
    data: Array,
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
    }
  },
  methods: {
    rowClass (row) {
      return this.recentClass(row.timeStamp)
    },
    country (callsign) {
      return prefix.isoCodeForCallsign(callsign)
    }
  },
  data () {
    return {
      perPage: 15,
      perPageOptions: [10, 15, 20, 30, 50, 100]
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
</style>
