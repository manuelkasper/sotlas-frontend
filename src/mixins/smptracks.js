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
          let ascent = 0
          let lastAltitude
          track.points.forEach(point => {
            distance += parseFloat(point.distance)
            let pointAltitude = parseFloat(point.altitude)
            if (lastAltitude !== undefined && lastAltitude < pointAltitude) {
              ascent += (pointAltitude - lastAltitude)
            }
            lastAltitude = pointAltitude
          })
          ascent = Math.round(ascent)

          routes.push({
            id: track.hdr_id,
            title: track.track_title,
            htmlDescription: '<p>' + this.escapeHtml(track.track_notes).replace(/\n/g, '<br />') + '</p><p><small>Track imported from <a href="https://www.sotamaps.org" target="_blank">SMP</a></small></p>',
            description: track.track_notes,
            author: track.callsign,
            postedDate: track.posted_date,
            distance,
            ascent,
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
