<template>
  <a class="track-link" :href="href" :download="filename"><slot></slot></a>
</template>

<script>
import tracks from '../mixins/tracks.js'
import utils from '../mixins/utils.js'

export default {
  name: 'TrackLink',
  mixins: [tracks, utils],
  props: {
    route: Object,
    summit: Object
  },
  watch: {
    route: {
      immediate: true,
      handler () {
        if (this.route.track.points) {
          let trkpts = this.route.track.points.map(point => {
            if (point.altitude !== undefined) {
              return `<trkpt lat="${point.latitude}" lon="${point.longitude}"><ele>${Math.round(point.altitude)}</ele></trkpt>`
            } else {
              return `<trkpt lat="${point.latitude}" lon="${point.longitude}"></trkpt>`
            }
          })

          let gpx = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<gpx version="1.1"
     creator="SOTLAS"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xmlns="http://www.topografix.com/GPX/1/1"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>Track for SOTA Summit ${this.summit.code} - ${this.summit.name}</name>
    <desc>Imported from SMP</desc>
    <author>
      <name>${this.route.author}</name>
    </author>
    <link href="https://sotl.as/summits/${this.summit.code}">
      <text>SOTLAS</text>
    </link>
  </metadata>
  <trk>
    <name>${this.escapeHtml(this.route.title)}</name>
    <src>${this.route.author}</src>
    <desc>${this.escapeHtml(this.route.description)}</desc>
    <trkseg>
    ${trkpts.join('\n')}
    </trkseg>
  </trk>
</gpx>`

          let blob = new Blob([gpx], { type: 'application/gpx+xml' })
          if (this.objectUrl) {
            URL.revokeObjectURL(this.objectUrl)
          }
          this.objectUrl = URL.createObjectURL(blob)
        }
      }
    }
  },
  computed: {
    filename () {
      return this.summit.code.replace('/', '_') + '_' + this.route.id.substr(-8) + '.gpx'
    },
    href () {
      if (this.route.track.filename) {
        return this.trackUrl(this.route.track)
      } else {
        return this.objectUrl
      }
    }
  },
  destroyed () {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl)
      this.objectUrl = null
    }
  },
  data () {
    return {
      objectUrl: null
    }
  }
}
</script>
