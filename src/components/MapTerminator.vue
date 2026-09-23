<template>
  <div>
    <MglGeoJsonSource v-for="band in bands" :key="band" :source-id="'terminator_' + band" :data="bandData[band]">
      <MglFillLayer :layer-id="'terminator_' + band" :paint="paint" before="summits_selected" />
    </MglGeoJsonSource>
  </div>
</template>

<script>
import { MglGeoJsonSource, MglFillLayer } from '../mapgl'
import { nightPolygon, DEPRESSION_ANGLES } from '../utils/terminator.js'
import nowticker from '../mixins/nowticker.js'

const BANDS = Object.keys(DEPRESSION_ANGLES)

export default {
  name: 'MapTerminator',
  components: {
    MglGeoJsonSource, MglFillLayer
  },
  mixins: [nowticker],
  data () {
    return {
      bands: BANDS,
      paint: {
        'fill-color': 'rgb(0, 0, 30)',
        'fill-opacity': 0.09,
        // The polygons get artificial edges: MapLibre clips them at ±180°
        // when wrapping them onto adjacent world copies, and polygons that
        // contain a pole are closed along it. With the default outline (same
        // color as the fill) these edges show up as lines, so make the
        // outline transparent.
        'fill-outline-color': 'rgba(0, 0, 0, 0)'
      }
    }
  },
  computed: {
    bandData () {
      const date = this.now.toDate()
      const data = {}
      for (const band of this.bands) {
        data[band] = nightPolygon(date, DEPRESSION_ANGLES[band])
      }
      return data
    }
  }
}
</script>
