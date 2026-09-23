import { defineComponent, inject, onBeforeUnmount, watch } from 'vue'
import { isLoadedSymbol, mapSymbol, sourceIdSymbol, sourceLayerRegistrySymbol, sourceRefSymbol } from './keys.js'

function createLayerComponent (type, name) {
  return defineComponent({
    name,
    props: {
      layerId: { type: String, required: true },
      layout: { type: Object, default: undefined },
      paint: { type: Object, default: undefined },
      before: { type: String, default: undefined }
    },
    setup (props) {
      const map = inject(mapSymbol)
      const isLoaded = inject(isLoadedSymbol)
      const sourceId = inject(sourceIdSymbol)
      const sourceRef = inject(sourceRefSymbol)
      const registry = inject(sourceLayerRegistrySymbol)

      function addLayer () {
        if (!isLoaded.value || !sourceRef.value) return
        // MapLibre's style validator rejects a present `layout`/`paint` key
        // whose value is `undefined` ("object expected, undefined found"),
        // so omit each key entirely rather than setting it to undefined.
        const layer = { id: props.layerId, type, source: sourceId }
        if (props.layout) layer.layout = props.layout
        if (props.paint) layer.paint = props.paint
        map.value.addLayer(layer, props.before)
      }

      function removeLayer () {
        if (isLoaded.value && map.value.getLayer(props.layerId)) {
          map.value.removeLayer(props.layerId)
        }
      }

      // Re-adds the layer whenever the source is (re)created, which
      // happens on initial load and again after every style.load.
      watch([isLoaded, sourceRef], addLayer, { immediate: true })
      registry.registerUnmountHandler(props.layerId, removeLayer)

      watch(() => props.layout, layout => {
        if (layout) {
          for (const [property, value] of Object.entries(layout)) {
            map.value.setLayoutProperty(props.layerId, property, value)
          }
        }
      }, { deep: true })
      watch(() => props.paint, paint => {
        if (paint) {
          for (const [property, value] of Object.entries(paint)) {
            map.value.setPaintProperty(props.layerId, property, value)
          }
        }
      }, { deep: true })

      onBeforeUnmount(() => {
        registry.unregisterUnmountHandler(props.layerId)
        removeLayer()
      })

      return () => null
    }
  })
}

export const MglLineLayer = createLayerComponent('line', 'MglLineLayer')
export const MglSymbolLayer = createLayerComponent('symbol', 'MglSymbolLayer')
export const MglFillLayer = createLayerComponent('fill', 'MglFillLayer')
