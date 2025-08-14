<template>
  <b-tooltip type="is-info" position="is-bottom" :active="searchTooltipActive" always animated multilined label="Enter a (partial) callsign, summit name, reference, region or coordinates here">
    <b-autocomplete
      class="search-input"
      ref="query"
      v-model="myQuery"
      :data="autocompleteResults"
      :loading="isLoading"
      :open-on-focus="true"
      :clear-on-select="true"
      :keep-first="false"
      placeholder="Summit, Callsign, Coords, Place..."
      field="label"
      icon-pack="far"
      icon="search"
      rounded
      clearable
      v-debounce:300ms="onInput"
      :debounce-events="'input'"
      @select="onSelect"
      @focus="searchFocus"
      @blur="searchBlur"
      @keydown.native.enter="doSearch"
    >
      <template slot="empty">
        <span v-if="isLoading">Searching...</span>
        <span v-else-if="showNoResults">No results found</span>
        <span v-else>Type some more to search...</span>
      </template>
      <template slot="default" slot-scope="props">
        <span v-if="props.option.type === 'geoname'">
          <b-icon
            :icon="iconForPlaceType(props.option.placeType)"
            size="is-small"
            class="has-text-grey search-result-icon"
            pack="fas"
          />
          <span>{{ props.option.label }}</span>
          <span class="is-size-7 has-text-grey"> ({{ props.option.detail }})</span>
        </span>
        <span v-else-if="props.option.type === 'summit'">
          <b-icon icon="mountains"
                  size="is-small"
                  :class="['search-result-icon', { 'summit-inactive': !isSummitValid(props.option.summit) }]"
                  pack="fas" />
          <span :class="{'summit-inactive': !isSummitValid(props.option.summit)}">{{ props.option.label }}</span>
          <span v-if="props.option.detail" class="is-size-7 has-text-grey"> ({{ props.option.detail }})</span>
        </span>
        <span v-else-if="props.option.type === 'activator'">
          <b-icon icon="user" size="is-small" class="has-text-grey search-result-icon" pack="fas" />
          <span>{{ props.option.label }}</span>
          <span v-if="props.option.detail" class="is-size-7 has-text-grey"> ({{ props.option.detail }})</span>
        </span>
        <span v-else-if="props.option.type === 'coordinates'">
          <b-icon icon="location" size="is-small" class="has-text-grey search-result-icon" pack="fas" />
          <span>{{ props.option.label }}</span>
        </span>
        <span v-else-if="props.option.type === 'region'">
          <b-icon icon="map" size="is-small" class="has-text-grey search-result-icon" pack="fas" />
          <span>{{ props.option.label }}</span>
        </span>
        <hr v-else-if="props.option.type === 'divider'" style="margin: 0.2em 0; border: none; border-top: 1px solid #eee;" />
        <span v-else>
          {{ props.option.label }}
        </span>
      </template>
    </b-autocomplete>
  </b-tooltip>
</template>

<script>
import prefs from '../mixins/prefs.js'
import * as maptilersdk from '@maptiler/sdk'
import axios from 'axios'
import utils from '../mixins/utils.js'
import haversine from 'haversine-distance'

const MIN_QUERY_LENGTH = 4

const PLACE_TYPE_ICONS = {
  country: 'flag',
  region: 'map',
  postcode: 'envelope',
  district: 'layer-group',
  place: 'city',
  locality: 'building',
  neighborhood: 'home',
  address: 'map-marker-alt',
  poi: 'landmark'
}

const COORDINATE_REGEX = /^\s*(-?[0-9.]+)\s*,\s*(-?[0-9.]+)\s*$/
const REGION_REGEX = /^[A-Z0-9]{1,3}\/[A-Z]{2}$/i
const SUMMIT_REF_EXACT_REGEX = /^([A-Z0-9]{1,3})\/([A-Z]{2})-([0-9]{3})$/i
const SUMMIT_REF_RELAXED_REGEX = /^([A-Z0-9]{1,3})[/ ]?([A-Z]{2})[- ]?([0-9]{3})$/i
const REGION_NUM_REGEX = /^([A-Z]{2})[ -]?([0-9]{3})$/i

maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_KEY

export default {
  name: 'NavBar',
  props: {
    query: {
      type: String,
      default: ''
    }
  },
  mixins: [prefs, utils],
  prefs: {
    key: 'searchField',
    props: ['searchTooltipShown']
  },
  data () {
    return {
      myQuery: this.query,
      searchTooltipActive: false,
      searchTooltipShown: false,
      autocompleteResults: [],
      isLoading: false
    }
  },
  computed: {
    showNoResults () {
      return this.myQuery && this.myQuery.length >= MIN_QUERY_LENGTH && this.autocompleteResults.length === 0 && !this.isLoading
    }
  },
  methods: {
    searchFocus () {
      this.$emit('focus')
      if (!this.searchTooltipShown) {
        this.searchTooltipActive = true
      }
    },
    searchBlur () {
      setTimeout(() => {
        this.$emit('blur')
      }, 100)
      if (this.searchTooltipActive) {
        this.searchTooltipActive = false
        this.searchTooltipShown = true
      }
    },
    makeCoordinateResult (value) {
      const coordMatches = value.match(COORDINATE_REGEX)
      if (coordMatches) {
        return {
          type: 'coordinates',
          label: `${coordMatches[1]}, ${coordMatches[2]}`,
          coordinates: [parseFloat(coordMatches[1]), parseFloat(coordMatches[2])]
        }
      }
      return null
    },
    makeRegionResult (value) {
      const regionMatches = value.match(REGION_REGEX)
      if (regionMatches) {
        return {
          type: 'region',
          label: value.toUpperCase(),
          region: value.toUpperCase()
        }
      }
      return null
    },
    makeSummitResults (data, proximity = null) {
      let all = (data || []).map(s => ({
        type: 'summit',
        label: s.name,
        detail: s.code,
        summit: s
      }))
      // If proximity is set, sort by distance
      if (proximity) {
        const [lon, lat] = proximity.map(Number)
        all.forEach(opt => {
          if (opt.summit && opt.summit.coordinates) {
            opt._distance = haversine(
              { lat, lon },
              { lat: opt.summit.coordinates.latitude, lon: opt.summit.coordinates.longitude }
            )
          } else {
            opt._distance = Infinity
          }
        })
        all.sort((a, b) => a._distance - b._distance)
      }
      // Use isSummitValid to split active/inactive
      const active = all.filter(opt => this.isSummitValid(opt.summit))
      const inactive = all.filter(opt => !this.isSummitValid(opt.summit))
      // Cap to 5 total
      const combined = active.concat(inactive).slice(0, 5)
      return combined
    },
    makeActivatorResults (data) {
      return (data.activators || []).map(a => ({
        type: 'activator',
        label: a.callsign,
        detail: a.name,
        activator: a
      }))
    },
    makeGeonameResults (features) {
      return (features || []).map(f => ({
        type: 'geoname',
        label: f.text,
        detail: f.place_name.replace(f.text + ', ', ''),
        coordinates: f.geometry.coordinates,
        placeType: Array.isArray(f.place_type) ? f.place_type[0] : (f.place_type || 'unknown')
      }))
    },
    // Helper to add results and dividers
    addResultsWithDivider (results, newResults) {
      if (newResults && newResults.length > 0) {
        if (results.length > 0) results.push({ type: 'divider' })
        results.push(...newResults)
      }
    },
    // Helper to normalize SOTA summit references
    normalizeSummitRef (value) {
      // Accepts e.g. HBVS123, HB/VS-123, HB VS 123, etc.
      // Converts to HB/VS-123
      let ref = value.trim().toUpperCase()
      let m = ref.match(SUMMIT_REF_RELAXED_REGEX)
      if (m) {
        return `${m[1]}/${m[2]}-${m[3]}`
      }
      return value
    },
    async onInput (value) {
      // Use current map center as proximity if available
      let proximity = null
      if (this.$store.state.mapCenter) {
        proximity = [this.$store.state.mapCenter.longitude, this.$store.state.mapCenter.latitude]
      }

      const coordResult = this.makeCoordinateResult(value)
      const regionResult = this.makeRegionResult(value)
      if (coordResult || !value || value.length < MIN_QUERY_LENGTH) {
        let results = []
        if (coordResult) results.push(coordResult)
        if (regionResult) results.push(regionResult)
        this.autocompleteResults = results
        return
      }
      this.isLoading = true
      try {
        // Parallel: MapTiler geocoding, activator search, and summit search
        let geoResults = []
        let activatorResults = []
        let summitResults = []
        /* try {
          let geoOpts = {
            limit: 5,
            language: 'en',
            proximity
          }
          const geoResp = await maptilersdk.geocoding.forward(value, geoOpts)
          geoResults = this.makeGeonameResults(geoResp.features)
        } catch (e) {
          // Ignore geocoding errors (e.g., coordinates entered)
          geoResults = []
        } */
        const [activatorResp, summitResp] = await Promise.all([
          axios.get(import.meta.env.VITE_API_URL + '/activators/search', { params: { q: value, limit: 5 } }),
          axios.get(import.meta.env.VITE_API_URL + '/summits/search', { params: { q: this.normalizeSummitRef(value), limit: 50 } })
        ])
        activatorResults = this.makeActivatorResults(activatorResp.data)
        summitResults = this.makeSummitResults(summitResp.data, proximity)
        // Compose results
        let results = []
        if (coordResult) results.push(coordResult)
        if (regionResult) results.push(regionResult)
        this.addResultsWithDivider(results, summitResults)
        this.addResultsWithDivider(results, activatorResults)
        this.addResultsWithDivider(results, geoResults)
        this.autocompleteResults = results
      } catch (e) {
        console.error(e)
        // ignore
      } finally {
        this.isLoading = false
      }
    },
    onSelect (option) {
      if (option === null) {
        return
      }
      if (option.type === 'geoname' && option.coordinates) {
        // Go to map at coordinates
        this.$router.push(`/map/coordinates/${option.coordinates[1]},${option.coordinates[0]}/14.0?popup=1`)
      } else if (option.type === 'activator' && option.activator) {
        this.$router.push(`/activators/${option.activator.callsign}`)
      } else if (option.type === 'summit' && option.summit) {
        this.$router.push(`/summits/${option.summit.code}`)
      } else if (option.type === 'coordinates' && option.coordinates) {
        this.$router.push(`/map/coordinates/${option.coordinates[0]},${option.coordinates[1]}/16.0?popup=1`)
      } else if (option.type === 'region' && option.region) {
        this.$router.push(`/summits/${option.region}`)
      }
      this.$emit('search')
      this.autocompleteResults = []
    },
    doSearch () {
      let targetUrl = null
      if (this.myQuery.length > 0) {
        // Coordinates?
        let coordMatches = this.myQuery.match(COORDINATE_REGEX)
        if (coordMatches) {
          targetUrl = '/map/coordinates/' + coordMatches[1] + ',' + coordMatches[2] + '/16.0?popup=1'
        } else {
          // Full summit reference?
          let normalizedRef = this.normalizeSummitRef(this.myQuery)
          if (SUMMIT_REF_EXACT_REGEX.test(normalizedRef)) {
            targetUrl = '/summits/' + normalizedRef
          } else {
            // Region?
            let regionMatches = this.myQuery.match(REGION_REGEX)
            if (regionMatches) {
              targetUrl = '/summits/' + this.myQuery.toUpperCase()
            } else {
              // Region + number without dash (and without association?)
              let regionNumMatches = this.myQuery.match(REGION_NUM_REGEX)
              if (regionNumMatches) {
                this.myQuery = regionNumMatches[1].toUpperCase() + '-' + regionNumMatches[2]
              }
              targetUrl = '/search?q=' + encodeURIComponent(this.myQuery)
            }
          }
        }
        if (targetUrl) {
          this.$refs.query.isActive = false
          this.myQuery = ''
          this.$router.push(targetUrl)
        }
      }
      this.$emit('search')
    },
    iconForPlaceType (type) {
      return PLACE_TYPE_ICONS[type] || 'map-marker-alt'
    }
  }
}
</script>

<style scoped>
.search-result-icon {
  vertical-align: text-bottom;
  margin-right: 0.5em;
}
.summit-inactive {
  color: #bbb;
  text-decoration: line-through;
}
</style>
