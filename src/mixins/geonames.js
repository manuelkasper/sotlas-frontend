import axios from 'axios'
import haversine from 'haversine-distance'

const FEATURE_CLASS_ICONS = {
  A: 'flag',
  H: 'water',
  L: 'map',
  P: 'city',
  S: 'map-marker-alt',
  R: 'road',
  T: 'mountains',
  V: 'tree'
}

export default {
  methods: {
    async searchGeoNames (query, proximity, maxRows = 10) {
      try {
        let params = {
          q: query,
          maxRows: 100,
          username: import.meta.env.VITE_GEONAMES_USERNAME,
          style: 'FULL',
          isNameRequired: true,
          featureClass: Object.keys(FEATURE_CLASS_ICONS)
        }
        
        const response = await axios.get('https://secure.geonames.org/searchJSON', {
          params,
          paramsSerializer: {
            indexes: null
          }
        })

        let results = (response.data.geonames || []).map(place => ({
          type: 'geoname',
          label: place.name,
          detail: this.formatGeoNamesDetail(place),
          coordinates: [parseFloat(place.lng), parseFloat(place.lat)],
          featureClass: place.fcl,
          distance: null
        }))
        
        // If we have proximity coordinates, calculate distances and sort by proximity
        if (proximity) {
          const [proxLon, proxLat] = proximity
          results.forEach(place => {
            place.distance = haversine(
              { lat: proxLat, lon: proxLon },
              { lat: place.coordinates[1], lon: place.coordinates[0] }
            )
          })
          // Sort by distance, closest first
          results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
        }
        
        return results.slice(0, maxRows)
      } catch (error) {
        console.error('GeoNames search error:', error)
        return []
      }
    },
    formatGeoNamesDetail (place) {
      let parts = []
      
      if (place.elevation) {
        if (this.$store.state.altitudeUnits === 'ft') {
          parts.push(Math.round(place.elevation * 3.28084) + ' ft')
        } else {
          parts.push(place.elevation + ' m')
        }
      }
      if (place.adminName1 && place.adminName1 !== place.name) {
        parts.push(place.adminName1)
      }
      if (place.countryName) {
        parts.push(place.countryName)
      }
      
      return parts.join(', ')
    },
    iconForFeatureClass (featureClass) {
      return FEATURE_CLASS_ICONS[featureClass] || 'map-marker-alt'
    }
  }
}
