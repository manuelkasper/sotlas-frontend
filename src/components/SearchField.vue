<template>
  <b-tooltip type="is-info" position="is-bottom" :active="searchTooltipActive" always animated multilined label="Enter a (partial) callsign, summit name, reference, region or coordinates here">
    <b-autocomplete
      class="search-input"
      ref="query"
      v-model="myQuery"
      :data="autocompleteResults"
      :loading="isLoading"
      :open-on-focus="true"
      :clear-on-select="false"
      :keep-first="true"
      placeholder="Summit, Callsign, Coords, Placename..."
      field="label"
      icon-pack="far"
      icon="search"
      rounded
      @input="debouncedOnInput"
      @select="onSelect"
      @focus="searchFocus"
      @blur="searchBlur"
    >
      <template slot="empty">
        <span v-if="showNoResults">No results found</span>
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
          <b-icon icon="mountains" size="is-small" class="has-text-grey search-result-icon" pack="fas" />
          <span>{{ props.option.label }}</span>
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
import debounce from 'lodash.debounce'

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

maptilersdk.config.apiKey = process.env.VUE_APP_MAPTILER_KEY

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
      searchTooltipShown: false,
      autocompleteResults: [],
      isLoading: false
    }
  },
  created () {
    this.debouncedOnInput = debounce(this.onInput, 300)
  },
  computed: {
    showNoResults () {
      return this.myQuery && this.myQuery.length >= MIN_QUERY_LENGTH && this.autocompleteResults.length === 0 && !this.isLoading
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
    makeCoordinateResult (value) {
      const coordMatches = value.match(/^\s*(-?[0-9.]+)\s*,\s*(-?[0-9.]+)\s*$/)
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
      const regionMatches = value.match(/^[A-Z0-9]{1,3}\/[A-Z]{2}$/i)
      if (regionMatches) {
        return {
          type: 'region',
          label: value.toUpperCase(),
          region: value.toUpperCase()
        }
      }
      return null
    },
    makeSummitResults (data) {
      return (data || []).map(s => ({
        type: 'summit',
        label: s.name,
        detail: s.code,
        summit: s
      }))
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
    async onInput (value) {
      this.myQuery = value
      this.autocompleteResults = []
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
        try {
          const geoResp = await maptilersdk.geocoding.forward(value, {
            limit: 5,
            language: 'en'
          })
          geoResults = this.makeGeonameResults(geoResp.features)
        } catch (e) {
          // Ignore geocoding errors (e.g., coordinates entered)
          geoResults = []
        }
        const [activatorResp, summitResp] = await Promise.all([
          axios.get(process.env.VUE_APP_API_URL + '/activators/search', { params: { q: value, limit: 5 } }),
          axios.get(process.env.VUE_APP_API_URL + '/summits/search', { params: { q: value, limit: 5 } })
        ])
        activatorResults = this.makeActivatorResults(activatorResp.data)
        summitResults = this.makeSummitResults(summitResp.data)
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
      if (option.type === 'geoname' && option.coordinates) {
        // Go to map at coordinates
        this.$router.push(`/map/coordinates/${option.coordinates[1]},${option.coordinates[0]}/14.0?popup=1`)
        this.myQuery = ''
        this.$emit('search')
        return
      }
      if (option.type === 'activator' && option.activator) {
        this.$router.push(`/activators/${option.activator.callsign}`)
        this.myQuery = ''
        this.$emit('search')
        return
      }
      if (option.type === 'summit' && option.summit) {
        this.$router.push(`/summits/${option.summit.code}`)
        this.myQuery = ''
        this.$emit('search')
        return
      }
      if (option.type === 'coordinates' && option.coordinates) {
        this.$router.push(`/map/coordinates/${option.coordinates[0]},${option.coordinates[1]}/16.0?popup=1`)
        this.myQuery = ''
        this.$emit('search')
        return
      }
      if (option.type === 'region' && option.region) {
        this.$router.push(`/summits/${option.region}`)
        this.myQuery = ''
        this.$emit('search')
        return
      }
      // fallback: treat as normal search
      this.doSearch(option.label || this.myQuery)
    },
    iconForPlaceType (type) {
      return PLACE_TYPE_ICONS[type] || 'map-marker-alt'
    }
  }
}
</script>

<style scoped>
.search-input {
  width: 22rem;
}
@media screen and (max-width: 1023px) {
  .search-input {
    width: 100%;
  }
}
@media screen and (min-width: 1024px) and (max-width: 1215px) {
  .search-input {
    max-width: 14rem;
  }
}
@media screen and (min-width: 1216px) and (max-width: 1360px) {
  .search-input {
    max-width: 18rem;
  }
}
.search-result-icon {
  vertical-align: text-bottom;
  margin-right: 0.5em;
}
</style>
