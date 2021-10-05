<template>
  <b-table :narrowed="true" :paginated="true" :striped="true" :default-sort="['activationDate', 'desc']" :per-page="15" :data="data" :mobile-cards="false">
    <template slot-scope="props">
      <b-table-column field="activationDate" label="Date" sortable>
        {{ props.row.activationDate | formatActivationDate }}
      </b-table-column>
      <b-table-column field="otherCallsign" label="Activator" sortable>
        <router-link :to="makeActivatorLink(props.row.otherCallsign.toUpperCase())">{{ props.row.otherCallsign.toUpperCase() }}</router-link>
      </b-table-column>
      <b-table-column field="band" label="Band" :custom-sort="sortBand" sortable numeric>
        {{ bandForDbFrequency(props.row.band) }}
      </b-table-column>
      <b-table-column field="mode" label="Mode" sortable>
        <ModeLabel :mode="props.row.mode" />
      </b-table-column>
    </template>
  </b-table>
</template>

<script>
import utils from '../mixins/utils.js'
import ModeLabel from '../components/ModeLabel.vue'

export default {
  props: {
    data: Array
  },
  mixins: [utils],
  components: {
    ModeLabel
  },
  methods: {
    sortBand (a, b, isAsc) {
      let fa = this.dbFrequencyToMHz(a.band)
      let fb = this.dbFrequencyToMHz(b.band)
      if (fa < fb) {
        return (isAsc ? -1 : 1)
      } else if (fa === fb) {
        return 0
      } else {
        return (isAsc ? 1 : -1)
      }
    }
  }
}
</script>
