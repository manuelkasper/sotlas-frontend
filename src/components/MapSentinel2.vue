<template>
  <span hidden />
</template>

<script>
import { tilesForDate, MIN_ZOOM } from '../sentinel2.js'

// Same summit-label paint as the swisstopo aerial style.
const LABEL_LAYERS = ['summits_names', 'summits_inactive_names']
const AERIAL_LABEL_PAINT = {
  'text-color': 'rgba(255, 255, 255, 1)',
  'text-halo-color': 'rgba(51, 51, 51, 1)',
  'text-halo-width': 1,
  'text-halo-blur': 1
}

// Draws the selected UTC day's Sentinel-2 mosaic over the base map and under the summit layers.
// The date lives in the store so the main map and the minimap stay in sync.
// The map is passed as a prop: the injected map does not notify watchers when
// the parent assigns it, so the parent renders this only after that assignment.
export default {
  name: 'MapSentinel2',
  props: {
    map: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      generation: 0,
      installedUrl: null
    }
  },
  watch: {
    map () {
      this.bind()
    },
    '$store.state.sentinel2Date' () {
      this.apply()
    }
  },
  mounted () {
    this.bind()
  },
  beforeUnmount () {
    this.generation++
    if (this.boundMap && this.onStyleLoad) {
      this.boundMap.off('style.load', this.onStyleLoad)
      this.boundMap.off('idle', this.onIdle)
      this.boundMap.off('zoom', this.onZoom)
    }
    this.removeImagery()
  },
  methods: {
    bind () {
      const map = this.map
      if (!map || this.boundMap === map) {
        return
      }
      if (this.boundMap && this.onStyleLoad) {
        this.boundMap.off('style.load', this.onStyleLoad)
        this.boundMap.off('idle', this.onIdle)
        this.boundMap.off('zoom', this.onZoom)
      }
      this.boundMap = map
      this.labelPaint = null
      // style.load can fire before this component mounts (the parent creates
      // it from the map's own load handler), and isStyleLoaded() is still
      // false for a moment after that. idle covers that gap. A new style
      // also wipes any label-color override, so forget the saved paint.
      this.onStyleLoad = () => {
        this.labelPaint = null
        this.apply()
      }
      this.onIdle = () => this.apply()
      this.onZoom = () => {
        if (this.map && this.map.getStyle()) {
          this.updateSummitLabels(this.map)
        }
      }
      map.on('style.load', this.onStyleLoad)
      map.on('idle', this.onIdle)
      map.on('zoom', this.onZoom)
      this.apply()
      this.$nextTick(() => this.apply())
    },
    apply () {
      const map = this.map
      const date = this.$store.state.sentinel2Date
      if (!map || !map.isStyleLoaded()) {
        return
      }
      if (date && this.installedDate === date && map.getSource('sentinel2')) {
        this.placeLayer(map)
        this.updateSummitLabels(map)
        return
      }
      const generation = ++this.generation
      if (!date) {
        this.$store.commit('setSentinel2Loading', false)
        return
      }
      this.$store.commit('setSentinel2Loading', true)
      this.$store.commit('setSentinel2Error', null)
      tilesForDate(date).then(url => {
        if (generation !== this.generation || !this.map || !this.map.isStyleLoaded()) {
          return
        }
        this.install(this.map, url, date)
      }).catch(error => {
        if (generation !== this.generation) {
          return
        }
        console.error(error)
        this.$store.commit('setSentinel2Error', 'Could not load Sentinel-2 imagery for this date.')
      }).finally(() => {
        if (generation === this.generation) {
          this.$store.commit('setSentinel2Loading', false)
        }
      })
    },
    install (map, url, date) {
      const year = date.slice(0, 4)
      const attribution = `Contains modified Copernicus Sentinel data ${year}. Processed by <a href="https://planetarycomputer.microsoft.com/" target="_blank">Microsoft Planetary Computer</a>`
      const source = map.getSource('sentinel2')
      if (source) {
        source.attribution = attribution
        if (this.installedUrl !== url) {
          source.setTiles([url])
          this.installedUrl = url
        }
        this.installedDate = date
        this.placeLayer(map)
        this.updateSummitLabels(map)
        return
      }
      map.addSource('sentinel2', {
        type: 'raster',
        tiles: [url],
        tileSize: 256,
        maxzoom: 15,
        attribution
      })
      const layer = {
        id: 'sentinel2',
        type: 'raster',
        source: 'sentinel2',
        minzoom: MIN_ZOOM,
        paint: { 'raster-resampling': 'linear' }
      }
      map.addLayer(layer)
      this.placeLayer(map)
      this.installedUrl = url
      this.installedDate = date
      this.updateSummitLabels(map)
    },
    updateSummitLabels (map, forceOff = false) {
      if (!map || !map.getStyle()) {
        return
      }
      const aerial = !forceOff && !!map.getLayer('sentinel2') && map.getZoom() >= MIN_ZOOM
      if (!this.labelPaint) {
        this.labelPaint = {}
      }
      let pending = false
      for (const id of LABEL_LAYERS) {
        if (map.getLayer(id) && !this.labelPaint[id]) {
          pending = true
        }
      }
      if (this.labelsAerial === aerial && !pending) {
        return
      }
      for (const id of LABEL_LAYERS) {
        if (!map.getLayer(id)) {
          continue
        }
        if (!this.labelPaint[id]) {
          this.labelPaint[id] = {}
          for (const prop of Object.keys(AERIAL_LABEL_PAINT)) {
            this.labelPaint[id][prop] = map.getPaintProperty(id, prop)
          }
        }
        const paint = aerial ? AERIAL_LABEL_PAINT : this.labelPaint[id]
        for (const [prop, value] of Object.entries(paint)) {
          if (value !== undefined) {
            map.setPaintProperty(id, prop, value)
          }
        }
      }
      this.labelsAerial = aerial
    },
    placeLayer (map) {
      const before = ['summits_az', 'summits_circles', 'summits_names'].find(id => map.getLayer(id))
      if (before && map.getLayer('sentinel2')) {
        map.moveLayer('sentinel2', before)
      }
    },
    removeImagery () {
      const map = this.map
      this.installedUrl = null
      this.installedDate = null
      if (!map || !map.getStyle()) {
        return
      }
      this.updateSummitLabels(map, true)
      if (map.getLayer('sentinel2')) {
        map.removeLayer('sentinel2')
      }
      if (map.getSource('sentinel2')) {
        map.removeSource('sentinel2')
      }
    }
  }
}
</script>
