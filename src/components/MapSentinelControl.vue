<template>
  <div :class="{ 'maplibregl-ctrl-group': true, 'maplibregl-ctrl': true, 'maplibre-gl-sentinel-container': true }" data-theme="light">
    <button :class="{ 'maplibregl-ctrl-icon': true, 'maplibre-gl-sentinel': true, active: shown }" type="button" title="Sentinel-2" :aria-expanded="open" @click="openClose" />
    <div v-if="open" class="sentinel-options">
      <div class="map-option">
        <b-field grouped>
          <b-checkbox v-model="shown" size="is-small">Show satellite imagery</b-checkbox>
        </b-field>
      </div>
      <div class="map-option">
        <b-field grouped>
          <div class="tlabel">Image date
            <b-icon pack="fas" icon="info-circle" size="is-small" type="is-info" @click="showSentinelInfo" />
          </div>
        </b-field>
        <b-field class="image-date" grouped>
          <b-select v-model="sentinel2Date" size="is-small" title="Sentinel-2 image date">
            <option v-if="!sceneOptions.length" disabled value="">{{ scenesLoading ? 'Loading dates…' : 'No dates' }}</option>
            <option v-for="scene in sceneOptions" :key="scene.date" :value="scene.date">{{ sceneLabel(scene) }}</option>
          </b-select>
          <span v-if="scenesLoading" class="date-spinner" aria-label="Loading cloud cover">
            <font-awesome-icon :icon="['far', 'spinner']" spin />
          </span>
        </b-field>
        <p v-if="scenesError" class="sentinel-note">Couldn't load cloud cover for the map center.</p>
        <p v-else-if="!scenesLoading && !scenes.length" class="sentinel-note">No Sentinel-2 scene at the map center in the last year.</p>
        <p v-else-if="!scenesLoading && !sceneOptions.length" class="sentinel-note">Every pass at the map center in the last year has at least 95% cloud cover.</p>
        <p v-if="$store.state.sentinel2Error" class="sentinel-note">{{ $store.state.sentinel2Error }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import { debounce } from '../debounce.js'
import { scenesAt, preferredScene, formatCloud, isAbort, isTooCloudy } from '../sentinel2.js'

export default {
  name: 'MapSentinelControl',
  inject: ['map'],
  data () {
    return {
      open: false,
      scenes: [],
      scenesLoading: false,
      scenesError: false,
      sceneQueryCenter: null
    }
  },
  computed: {
    shown: {
      get () {
        return this.$store.state.sentinel2
      },
      set (value) {
        this.$store.commit('setSentinel2', value)
      }
    },
    sentinel2Date: {
      get () {
        return this.$store.state.sentinel2Date
      },
      set (date) {
        this.$store.commit('setSentinel2Date', date)
      }
    },
    sceneOptions () {
      const options = this.scenes.filter(scene => !isTooCloudy(scene.cloud))
      const date = this.sentinel2Date
      const known = this.scenes.some(scene => scene.date === date)
      if (date && !known) {
        options.unshift({ date, cloud: null, outside: !this.scenesLoading })
      }
      return options
    }
  },
  watch: {
    open (open) {
      if (open) {
        this.loadScenes()
      }
    },
    shown (shown) {
      if (shown) {
        this.loadScenes()
      }
    }
  },
  mounted () {
    this.onMoveEnd = debounce(() => this.loadScenesIfMoved(), 400)
    if (this.map) {
      this.map.on('moveend', this.onMoveEnd)
    }
    if (this.shown) {
      this.loadScenes()
    }
  },
  beforeUnmount () {
    if (this.onMoveEnd && this.map) {
      this.map.off('moveend', this.onMoveEnd)
      this.onMoveEnd.cancel()
    }
    if (this.scenesAbort) {
      this.scenesAbort.abort()
    }
  },
  methods: {
    openClose () {
      this.open = !this.open
    },
    close () {
      this.open = false
    },
    sceneLabel (scene) {
      const day = moment.utc(scene.date, 'YYYY-MM-DD').format('D MMM YYYY')
      if (scene.outside) {
        return `${day} — no coverage at center`
      }
      if (scene.cloud == null) {
        return day
      }
      return `${day} — ${formatCloud(scene.cloud)}`
    },
    loadScenesIfMoved () {
      if ((!this.shown && !this.open) || !this.map) {
        return
      }
      const center = this.map.getCenter()
      if (this.sceneQueryCenter) {
        const dlon = Math.abs(center.lng - this.sceneQueryCenter.lng)
        const dlat = Math.abs(center.lat - this.sceneQueryCenter.lat)
        if (dlon < 0.2 && dlat < 0.2) {
          return
        }
      }
      this.loadScenes()
    },
    loadScenes () {
      if ((!this.shown && !this.open) || !this.map) {
        return
      }
      const center = this.map.getCenter()
      this.sceneQueryCenter = { lng: center.lng, lat: center.lat }
      if (this.scenesAbort) {
        this.scenesAbort.abort()
      }
      const controller = new AbortController()
      this.scenesAbort = controller
      this.scenesLoading = true
      this.scenesError = false
      scenesAt(center.lng, center.lat, controller.signal).then(scenes => {
        if (controller.signal.aborted) {
          return
        }
        this.scenes = scenes
        const current = this.$store.state.sentinel2Date
        const currentScene = scenes.find(scene => scene.date === current)
        if (!current || (currentScene && isTooCloudy(currentScene.cloud))) {
          const preferred = preferredScene(scenes.filter(scene => !isTooCloudy(scene.cloud)))
          if (preferred && preferred.date !== current) {
            this.$store.commit('setSentinel2Date', preferred.date)
          } else if (!preferred && current) {
            this.$store.commit('setSentinel2Date', null)
          }
        }
      }).catch(error => {
        if (isAbort(error) || controller.signal.aborted) {
          return
        }
        console.error(error)
        this.scenesError = true
      }).finally(() => {
        if (this.scenesAbort === controller) {
          this.scenesLoading = false
        }
      })
    },
    showSentinelInfo (event) {
      event.preventDefault()
      this.$buefy.dialog.alert({
        title: 'Sentinel-2',
        message: '<p>True-color images from the Copernicus Sentinel-2 satellites, at 10 m resolution, for the UTC day you pick. The list shows cloud cover for the scene covering the <strong>map center</strong> — pan to another place to see that place\'s cloud cover before choosing a day. When several scenes overlap on the same day, the percentage is the clearest one, and that scene is drawn on top. Days with 95% cloud cover or more are left out.</p><p style="margin-top: 0.5em">New images usually appear a few days after the satellite pass.</p><p style="margin-top: 0.5em; font-size: 0.8em">Contains modified Copernicus Sentinel data, processed by Microsoft Planetary Computer.</p>',
        type: 'is-info',
        hasIcon: true,
        icon: 'info-circle',
        iconPack: 'fas'
      })
    }
  }
}
</script>

<style scoped>
.maplibre-gl-sentinel-container {
  color-scheme: light;
  color: var(--bulma-text);
}
.maplibre-gl-sentinel {
  background-position: center;
  background-repeat: no-repeat;
  background-size: 24px 24px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xml:space='preserve' style='fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2' viewBox='0 0 20 20'%3E%3Cpath d='m8.514 1.371 2.626 2.626-3.286 3.286-2.626-2.626zm3.502 1.75L9.173.273a.93.93 0 0 0-1.315 0L4.134 3.997a.93.93 0 0 0 0 1.315L6.981 8.16l-.252.252a7.4 7.4 0 0 0-2.246-.345A7.4 7.4 0 0 0 .24 9.393c-.299.21-.319.632-.059.892l4.329 4.329-2.327 2.328a.62.62 0 0 0 0 .877c.24.24.636.24.877 0l2.327-2.328 4.329 4.329c.256.256.683.241.892-.058a7.43 7.43 0 0 0 1.327-4.244c0-.783-.12-1.536-.345-2.246l.252-.252 2.847 2.847a.926.926 0 0 0 1.315 0l3.724-3.724a.926.926 0 0 0 0-1.315l-2.847-2.847 2.133-2.133a1.244 1.244 0 0 0 0-1.758L15.911.987a1.243 1.243 0 0 0-1.757 0L12.02 3.121zM16 8.858l2.626 2.626-3.285 3.286-2.626-2.627zm-.969-6.994 3.103 3.103-7.068 7.068a7.47 7.47 0 0 0-3.103-3.103zm-4.345 13.654a6.2 6.2 0 0 1-.683 2.836l-8.359-8.36a6.16 6.16 0 0 1 2.835-.682 6.204 6.204 0 0 1 6.207 6.206' style='fill-rule:nonzero'/%3E%3C/svg%3E");
}
.maplibre-gl-sentinel.active {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xml:space='preserve' style='fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2' viewBox='0 0 20 20'%3E%3Cpath fill='%2333b5e5' d='M12.016 3.121 9.173.273a.93.93 0 0 0-1.315 0L4.134 3.997a.93.93 0 0 0 0 1.315L6.981 8.16l-.252.252a7.4 7.4 0 0 0-2.246-.345A7.4 7.4 0 0 0 .24 9.393c-.299.21-.319.632-.059.892l4.329 4.329-2.327 2.328a.62.62 0 0 0 0 .877c.24.24.636.24.877 0l2.327-2.328 4.329 4.329c.256.256.683.241.892-.058a7.43 7.43 0 0 0 1.327-4.244c0-.783-.12-1.536-.345-2.246l.252-.252 2.847 2.847a.926.926 0 0 0 1.315 0l3.724-3.724a.926.926 0 0 0 0-1.315l-2.847-2.847 2.133-2.133a1.244 1.244 0 0 0 0-1.758L15.911.987a1.243 1.243 0 0 0-1.757 0L12.02 3.121z' style='fill-rule:nonzero'/%3E%3C/svg%3E");
}
.maplibre-gl-sentinel-container button {
  display: inline-block;
  vertical-align: top;
}
.sentinel-options {
  display: inline-block;
  padding: 0 0.5em 0.5em 0;
}
.map-option {
  margin: 0.3em 0 0.3em 0.5em;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 0.4em;
  background-color: #eee;
  font-size: 0.8rem;
}
.map-option div.tlabel {
  display: inline-block;
}
.map-option .field.image-date :deep(.field-body .field) {
  align-items: center;
}
.date-spinner {
  display: inline-flex;
  margin-left: 0.4em;
  color: #555;
}
.sentinel-note {
  margin: 0.15em 0 0;
  color: #555;
  line-height: 1.3;
}
.icon {
  vertical-align: bottom;
}
</style>
