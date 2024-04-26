<template>
  <span>
    <router-link :to="makeActivatorLinkUserId(userId)"><strong>{{ callsign }}</strong></router-link>{{ databaseCallsign ? ' (' + databaseCallsign + ')' : '' }}
  </span>
</template>

<script>
import api from '../mixins/api.js'
import utils from '../mixins/utils.js'

export default {
  name: 'FirstActivator',
  props: {
    callsign: String,
    userId: Number
  },
  mixins: [utils, api],
  methods: {
    loadDatabaseCallsign () {
      this.loadActivator(this.userId)
        .then(activator => {
          if (this.homeCallsign(this.callsign) !== this.homeCallsign(activator.callsign)) {
            this.databaseCallsign = this.homeCallsign(activator.callsign)
          }
        })
    }
  },
  mounted () {
    this.loadDatabaseCallsign()
  },
  watch: {
    userId () {
      this.loadDatabaseCallsign()
    }
  },
  data () {
    return {
      databaseCallsign: null
    }
  }
}
</script>
