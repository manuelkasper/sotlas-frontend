import axios from 'axios'

export default {
  watch: {
    summit: {
      immediate: true,
      handler () {
        if (this.summit && this.summit.code) {
          axios.get('https://api-db.sota.org.uk/smp/gpx/summit/' + this.summit.code)
            .then(response => {
              if (Array.isArray(response.data)) {
                this.smpTracks = response.data
              }
            })
        } else {
          this.smpTracks = null
        }
      }
    }
  },
  computed: {
    routes () {
      // Merge summit routes and SMP tracks
      let routes = []
      if (this.summit && this.summit.routes) {
        routes = [...this.summit.routes]
      }
      if (this.smpTracks) {
        this.smpTracks.forEach(track => {
          // Calculate total distance
          let distance = 0
          let ascent
          let minAltitude, maxAltitude
          track.points.forEach(point => {
            distance += parseFloat(point.distance)
            let pointAltitude = parseFloat(point.altitude)
            if (minAltitude === undefined || pointAltitude < minAltitude) {
              minAltitude = pointAltitude
            }
            if (maxAltitude === undefined || pointAltitude > maxAltitude) {
              maxAltitude = pointAltitude
            }
          })
          if (minAltitude !== undefined && maxAltitude !== undefined) {
            ascent = Math.round(maxAltitude - minAltitude)
          }

          routes.push({
            id: track.hdr_id,
            title: track.track_title,
            htmlDescription: '<p>' + this.escapeHtml(track.track_notes) + '</p><p><small>Track imported from <a href="https://www.sotamaps.org" target="_blank">SMP</a></small></p>',
            description: track.track_notes,
            author: track.callsign,
            distance,
            ascent,
            ascentExcludesCounterAscents: (ascent > 0),
            track: {
              points: track.points
            }
          })
        })
      }

      return routes
    }
  },
  data () {
    return {
      smpTracks: null
    }
  }
}
