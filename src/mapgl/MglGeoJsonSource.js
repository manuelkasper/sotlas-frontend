import { defineComponent, inject, onBeforeUnmount, provide, shallowRef, watch } from 'vue'
import { isLoadedSymbol, mapSymbol, sourceIdSymbol, sourceLayerRegistrySymbol, sourceRefSymbol, SourceLayerRegistry } from './keys.js'

// Re-adds the source on every 'style.load' (i.e. after MglMap#setStyle),
// since setStyle wipes all sources/layers. Layers watch `source` (provided
// via sourceRefSymbol) and re-addLayer whenever it points to a fresh
// GeoJSONSource instance. See src/mapgl/README.md.
export default defineComponent({
  name: 'MglGeoJsonSource',
  props: {
    sourceId: { type: String, required: true },
    data: { type: [Object, String], required: true }
  },
  setup (props, { slots }) {
    const map = inject(mapSymbol)
    const isLoaded = inject(isLoadedSymbol)
    const source = shallowRef()
    const registry = new SourceLayerRegistry()

    provide(sourceIdSymbol, props.sourceId)
    provide(sourceRefSymbol, source)
    provide(sourceLayerRegistrySymbol, registry)

    function addSource () {
      if (!isLoaded.value) return
      // A style swap clears sources before the new style has loaded. Adding
      // during that gap throws; the style.load listener below retries.
      try {
        if (!map.value.getSource(props.sourceId)) {
          map.value.addSource(props.sourceId, { type: 'geojson', data: props.data })
        }
      } catch (e) {
        if (!/not done loading/i.test(e && e.message)) throw e
        return
      }
      const next = map.value.getSource(props.sourceId)
      // Same instance means the style diff kept this source; assigning it
      // again would not re-run the layer watchers.
      if (next && source.value !== next) source.value = next
    }

    // Register before the immediate watch so a failed first attempt still
    // retries when the style finishes loading.
    map.value.on('style.load', addSource)
    watch(isLoaded, addSource, { immediate: true })

    watch(() => props.data, data => {
      source.value?.setData(data)
    })

    onBeforeUnmount(() => {
      map.value?.off('style.load', addSource)
      if (isLoaded.value) {
        registry.unmount()
        if (map.value.getSource(props.sourceId)) {
          map.value.removeSource(props.sourceId)
        }
      }
    })

    return () => source.value && slots.default ? slots.default() : null
  }
})
