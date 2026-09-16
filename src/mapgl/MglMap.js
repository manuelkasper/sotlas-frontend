import { defineComponent, h, markRaw, nextTick, onBeforeUnmount, onMounted, provide, ref, shallowRef, watch } from 'vue'
import { Map as MaptilerMap } from '@maptiler/sdk'
import { isInitializedSymbol, isLoadedSymbol, mapSymbol } from './keys.js'
import { isDeepEqual } from './utils.js'

// Only the events SOTLAS actually listens to. Unlike the general-purpose
// vue-maplibre-gl wrapper, this module isn't meant to forward the full
// maplibre-gl event surface.
const FORWARDED_EVENTS = ['load', 'click', 'contextmenu', 'moveend', 'idle']

export default defineComponent({
  name: 'MglMap',
  props: {
    mapStyle: { type: [String, Object], default: undefined },
    bounds: { type: [Array, Object], default: undefined },
    fitBoundsOptions: { type: Object, default: undefined },
    center: { type: [Array, Object], default: undefined },
    zoom: { type: Number, default: undefined },
    dragRotate: { type: Boolean, default: undefined },
    attributionControl: { type: Boolean, default: undefined },
    apiKey: { type: String, default: undefined }
  },
  emits: FORWARDED_EVENTS.map(event => `map:${event}`),
  setup (props, { emit, slots }) {
    const container = shallowRef()
    const map = shallowRef()
    const isInitialized = ref(false)
    const isLoaded = ref(false)
    const boundEvents = []

    provide(mapSymbol, map)
    provide(isLoadedSymbol, isLoaded)
    provide(isInitializedSymbol, isInitialized)

    watch(() => props.mapStyle, v => {
      if (v) map.value?.setStyle(v)
    })
    watch(() => props.bounds, (v, old) => {
      if (v && !isDeepEqual(v, old)) {
        map.value?.fitBounds(v, props.fitBoundsOptions)
      }
    })
    watch(() => props.center, v => {
      if (v) map.value?.setCenter(v)
    })
    watch(() => props.zoom, v => {
      if (v !== undefined) map.value?.setZoom(v)
    })

    function initialize () {
      const opts = {
        container: container.value,
        style: props.mapStyle,
        bounds: props.bounds,
        fitBoundsOptions: props.fitBoundsOptions,
        center: props.center,
        zoom: props.zoom,
        dragRotate: props.dragRotate,
        apiKey: props.apiKey,
        // The SDK adds its own navigation/geolocate controls and an
        // attribution+logo control by default; SOTLAS places those
        // explicitly via MglNavigationControl etc., so suppress the
        // automatic ones here. See src/mapgl/README.md.
        navigationControl: false,
        geolocateControl: false,
        forceNoAttributionControl: props.attributionControl === false,
        logSDKVersion: false
      }
      for (const key of Object.keys(opts)) {
        if (opts[key] === undefined) delete opts[key]
      }

      map.value = markRaw(new MaptilerMap(opts))

      for (const type of FORWARDED_EVENTS) {
        const handler = (event) => {
          if (type === 'load') isLoaded.value = true
          emit(`map:${type}`, { type, map: map.value, event })
        }
        map.value.on(type, handler)
        boundEvents.push([type, handler])
      }

      isInitialized.value = true
      map.value.getCanvas().addEventListener('webglcontextlost', restart)
    }

    function dispose () {
      if (!isInitialized.value) return
      map.value.getCanvas().removeEventListener('webglcontextlost', restart)
      isInitialized.value = false
      isLoaded.value = false
      boundEvents.forEach(([type, handler]) => map.value.off(type, handler))
      boundEvents.length = 0
      map.value.remove()
    }

    function restart () {
      dispose()
      nextTick(initialize)
    }

    onMounted(initialize)
    onBeforeUnmount(dispose)

    return () => [
      h('div', { ref: container, style: { width: '100%', height: '100%' } }),
      isInitialized.value && slots.default ? slots.default() : undefined
    ]
  }
})
