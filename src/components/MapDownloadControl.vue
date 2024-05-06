<template>
  <div v-if="!$mq.mobile" class="maplibregl-ctrl-group maplibregl-ctrl">
    <button :class="{ 'maplibregl-ctrl-icon': true, 'maplibre-gl-download': true }" type="button" title="Download map" @click="downloadMap" />
  </div>
</template>

<script>
export default {
  name: 'MapDownloadControl',
  inject: ['map'],
  methods: {
    downloadMap () {
      this.map.once('render', () => {
        let link = document.createElement('a')
        link.download = 'map.png'
        link.href = this.map.getCanvas().toDataURL()
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      })
      this.map._render()
    }
  }
}
</script>

<style scoped>
.maplibre-gl-download {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M15.6 11.676v3.613a.52.52 0 01-.52.52H4.89a.52.52 0 01-.52-.52v-3.613H3.33v3.613c0 .86.7 1.56 1.56 1.56h10.19c.86 0 1.56-.7 1.56-1.56v-3.613z'/%3E%3Cpath d='M13.216 10.402l-.735-.735-1.975 1.975V3.54h-1.04v8.103L7.49 9.667l-.735.735 3.23 3.23z'/%3E%3C/svg%3E");
}
</style>
