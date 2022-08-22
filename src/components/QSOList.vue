<template>
  <b-table class="auto-width" :narrowed="true" :striped="true" :data="data" :mobile-cards="false">
    <template slot-scope="props">
      <b-table-column field="TimeOfDay" label="Time" class="nowrap" sortable>
        {{ props.row.TimeOfDay }}
      </b-table-column>
      <b-table-column field="OtherCallsign" label="Callsign" class="nowrap" sortable>
        <CountryFlag :country="isoCodeForCallsign(props.row.OtherCallsign.trim())" class="flag" />
        <router-link :to="makeActivatorLink(props.row.OtherCallsign.trim())">{{ props.row.OtherCallsign.trim() }}</router-link>
      </b-table-column>
      <b-table-column field="Band" label="Band" :custom-sort="sortBand" class="nowrap" sortable numeric>
        {{ bandForDbFrequency(props.row.Band) }}
      </b-table-column>
      <b-table-column field="Mode" label="Mode" class="mode nowrap" sortable>
        <ModeLabel :mode="props.row.Mode" />
      </b-table-column>
      <b-table-column field="Notes" label="Notes" class="nowrap">
        <span v-html="formatNotes(props.row.Notes)" />
      </b-table-column>
    </template>
  </b-table>
</template>

<script>
import utils from '../mixins/utils.js'
import prefix from '../prefix.js'
import ModeLabel from '../components/ModeLabel.vue'
import CountryFlag from '../components/CountryFlag.vue'

export default {
  props: {
    data: {
      type: Array,
      required: true
    }
  },
  components: {
    ModeLabel, CountryFlag
  },
  mixins: [utils],
  methods: {
    sortBand (a, b, isAsc) {
      let fa = this.dbFrequencyToMHz(a.Band)
      let fb = this.dbFrequencyToMHz(b.Band)
      if (fa < fb) {
        return (isAsc ? -1 : 1)
      } else if (fa === fb) {
        return 0
      } else {
        return (isAsc ? 1 : -1)
      }
    },
    isoCodeForCallsign (callsign) {
      return prefix.isoCodeForCallsign(callsign)
    },
    formatNotes (notes) {
      // Detect summit references and link them
      let doc = new DOMParser().parseFromString(notes, 'text/html')
      let notesText = doc.body.textContent || ''
      return notesText.replace(/[A-Z0-9]{1,8}\/[A-Z]{2}-[0-9]{3}/gi, match => {
        return '<a href="/summits/' + match.toUpperCase() + '">' + match.toUpperCase() + '</a>'
      })
    }
  }
}
</script>

<style scoped>
.flag {
  margin-right: 0.4em;
}
.mode .tag {
  padding-top: 0.3em;
  padding-bottom: 0.3em;
}
</style>
