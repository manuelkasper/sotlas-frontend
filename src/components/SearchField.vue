<template>
  <b-tooltip type="is-info" position="is-bottom" :active="searchTooltipActive" always animated multilined label="Enter a (partial) callsign, summit name, reference, region or coordinates here">
    <b-input class="search-input" ref="query" v-model="myQuery" placeholder="Summit, Callsign, Coords..." autocorrect="off" autocapitalize="off" spellcheck="false" type="search" icon-pack="far" icon="search" rounded @keydown.native.enter="doSearch" @focus="searchFocus" @blur="searchBlur" />
  </b-tooltip>
</template>

<script>
import prefs from '../mixins/prefs.js'

export default {
  name: 'NavBar',
  props: {
    query: {
      type: String,
      default: ''
    }
  },
  mixins: [prefs],
  prefs: {
    key: 'searchField',
    props: ['searchTooltipShown']
  },
  data () {
    return {
      myQuery: this.query,
      searchTooltipActive: false,
      searchTooltipShown: false
    }
  },
  methods: {
    searchFocus () {
      if (!this.searchTooltipShown) {
        this.searchTooltipActive = true
      }
    },
    searchBlur () {
      if (this.searchTooltipActive) {
        this.searchTooltipActive = false
        this.searchTooltipShown = true
      }
    },
    doSearch () {
      if (this.myQuery.length > 0) {
        // Coordinates?
        let coordMatches = this.myQuery.match(/^\s*(-?[0-9.]+)\s*,\s*(-?[0-9.]+)\s*$/)
        if (coordMatches) {
          this.$router.push('/map/coordinates/' + coordMatches[1] + ',' + coordMatches[2] + '/16.0?popup=1')
        } else {
          // Full summit reference?
          let summitRefMatches = this.myQuery.match(/^([A-Z0-9]{1,3})[ /]([A-Z]{2})[ -]?([0-9]{3})$/i)
          if (summitRefMatches) {
            this.$router.push('/summits/' + summitRefMatches[1].toUpperCase() + '/' + summitRefMatches[2].toUpperCase() + '-' + summitRefMatches[3])
          } else {
            // Region?
            let regionMatches = this.myQuery.match(/^[A-Z0-9]{1,3}\/[A-Z]{2}$/i)
            if (regionMatches) {
              this.$router.push('/summits/' + this.myQuery.toUpperCase())
            } else {
              // Region + number without dash (and without association?)
              let regionNumMatches = this.myQuery.match(/^([A-Z]{2})[ -]?([0-9]{3})$/i)
              if (regionNumMatches) {
                this.myQuery = regionNumMatches[1].toUpperCase() + '-' + regionNumMatches[2]
              }
              this.$router.push('/search?q=' + encodeURIComponent(this.myQuery))
            }
          }
        }

        this.myQuery = ''
        this.$refs.query.$el.querySelector('input').blur()
        this.$emit('search')
      }
    }
  }
}
</script>

<style scoped>
.search-input {
  width: 18rem;
}
@media screen and (min-width: 1024px) and (max-width: 1215px) {
  .search-input {
    max-width: 11rem;
  }
}
</style>
