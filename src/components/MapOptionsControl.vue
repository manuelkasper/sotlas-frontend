<template>
  <div class="mapboxgl-ctrl-group mapboxgl-ctrl">
    <button :class="{ 'mapboxgl-ctrl-icon': true, 'mapbox-gl-areas': true, active: areas }" type="button" title="Toggle areas" @click="toggleAreas" />
    <button :class="{ 'mapboxgl-ctrl-icon': true, 'mapbox-gl-contours': true, active: contours }" type="button" title="Toggle contours" @click="toggleContours" />
    <button :class="{ 'mapboxgl-ctrl-icon': true, 'mapbox-gl-hillshading': true, active: hillshading }" type="button" title="Toggle hillshading" @click="toggleHillshading" />
    <button :class="{ 'mapboxgl-ctrl-icon': true, 'mapbox-gl-difficulty': true, active: difficulty }" type="button" title="Toggle trail difficulty" @click="toggleDifficulty" />
    <button :class="{ 'mapboxgl-ctrl-icon': true, 'mapbox-gl-spots': true, active: spots }" type="button" title="Toggle spots" @click="toggleSpots" />
    <button :class="{ 'mapboxgl-ctrl-icon': true, 'mapbox-gl-inactive': true, active: inactive }" type="button" title="Toggle inactive summits" @click="toggleInactive" />
  </div>
</template>

<script>
import moment from 'moment'
import prefs from '../mixins/prefs.js'
import mapstyle from '../mixins/mapstyle.js'

const RECENT_SPOT_AGE = 30 * 60 * 1000

export default {
  name: 'MapOptionsControl',
  inject: ['map'],
  mixins: [mapstyle, prefs],
  prefs: {
    key: 'mapOptions',
    props: ['areas', 'contours', 'hillshading', 'difficulty', 'spots', 'inactive']
  },
  data () {
    return {
      areas: false,
      contours: true,
      hillshading: true,
      difficulty: true,
      spots: false,
      inactive: false
    }
  },
  mounted () {
    this.updateRecentSpots()
    if (this.difficulty === undefined) {
      this.difficulty = true
    }
  },
  computed: {
    recentSpots () {
      let now = moment.utc()
      return this.$store.state.spots.filter(spot => {
        return (now.diff(spot.timeStamp) < RECENT_SPOT_AGE)
      }).map(spot => {
        return spot.summit.code
      })
    }
  },
  watch: {
    areas: {
      handler () {
        this.map.setLayoutProperty('regions_areas', 'visibility', this.areas ? 'visible' : 'none')
        this.map.setLayoutProperty('regions_labels', 'visibility', this.areas ? 'visible' : 'none')
      },
      immediate: true
    },
    contours: {
      handler () {
        this.map.setLayoutProperty('contour', 'visibility', this.contours ? 'visible' : 'none')
        this.map.setLayoutProperty('contour_index', 'visibility', this.contours ? 'visible' : 'none')
        this.map.setLayoutProperty('contour_label', 'visibility', this.contours ? 'visible' : 'none')
      },
      immediate: true
    },
    hillshading: {
      handler () {
        this.map.setLayoutProperty('hillshading', 'visibility', this.hillshading ? 'visible' : 'none')
      },
      immediate: true
    },
    difficulty: {
      handler () {
        this.updateDifficultyLayer()
      },
      immediate: true
    },
    mapServer: {
      handler () {
        this.updateDifficultyLayer()
      }
    },
    inactive: {
      handler () {
        this.map.setLayoutProperty('summits_inactive_circles', 'visibility', this.inactive ? 'visible' : 'none')
        this.map.setLayoutProperty('summits_inactive_names', 'visibility', this.inactive ? 'visible' : 'none')
      },
      immediate: true
    },
    recentSpots: {
      handler () {
        this.updateRecentSpots()
      },
      immediate: true
    },
    spots () {
      this.updateRecentSpots()
    }
  },
  methods: {
    updateDifficultyLayer () {
      this.map.setLayoutProperty('road_path_pedestrian_sac', 'visibility', this.difficulty ? 'visible' : 'none')
      this.map.setLayoutProperty('road_path_pedestrian_sac_label', 'visibility', this.difficulty ? 'visible' : 'none')
    },
    toggleAreas () {
      this.areas = !this.areas
    },
    toggleContours () {
      this.contours = !this.contours
    },
    toggleHillshading () {
      this.hillshading = !this.hillshading
    },
    toggleDifficulty () {
      this.difficulty = !this.difficulty
    },
    toggleSpots () {
      this.spots = !this.spots
    },
    toggleInactive () {
      this.inactive = !this.inactive
    },
    showInactive () {
      this.inactive = true
    },
    updateRecentSpots () {
      if (this.spots) {
        this.map.setFilter('summits_highlight', ['in', 'code', ...this.recentSpots])
      } else {
        this.map.setFilter('summits_highlight', ['in', 'code'])
      }
    },
    spotsShown () {
      return this.spots
    }
  }
}
</script>

<style scoped>
.mapbox-gl-areas {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' class='undefined'%3E%3Cstyle%3E.a%7Bfill:none;%7D.b%7Bfill:none;stroke-linejoin:round;stroke-width:1;stroke:%23000;%7D%3C/style%3E%3Crect width='16.86' height='9.24' x='4.32' y='2.54' rx='1.1' ry='1.1' class='a'/%3E%3Crect width='9.58' height='6.86' x='2.71' y='3.05' rx='1.1' ry='1.1' class='a'/%3E%3Crect width='9.66' height='7.88' x='3.56' y='3.73' rx='1.02' ry='1.02' class='b'/%3E%3Crect ry='1.02' rx='1.02' y='8.22' x='6.78' height='7.88' width='9.66' class='b'/%3E%3C/svg%3E%0A");
}
.mapbox-gl-areas.active {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' class='undefined'%3E%3Cstyle%3E.a%7Bfill:none;%7D.b%7Bfill:none;stroke-linejoin:round;stroke-width:1;stroke:%2333b5e5;%7D%3C/style%3E%3Crect width='16.86' height='9.24' x='4.32' y='2.54' rx='1.1' ry='1.1' class='a'/%3E%3Crect width='9.58' height='6.86' x='2.71' y='3.05' rx='1.1' ry='1.1' class='a'/%3E%3Crect width='9.66' height='7.88' x='3.56' y='3.73' rx='1.02' ry='1.02' class='b'/%3E%3Crect ry='1.02' rx='1.02' y='8.22' x='6.78' height='7.88' width='9.66' class='b'/%3E%3C/svg%3E%0A");
}

.mapbox-gl-contours {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cstyle%3E.a%7Bfill:none;stroke:%23000;%7D%3C/style%3E%3Crect width='16.864' height='9.237' x='-34.746' y='-4.068' rx='1.102' ry='1.102' fill='none'/%3E%3Cpath d='m3.644 12.203c0 0-0.169-6.186 3.898-7.712 4.068-1.525 7.712-2.881 7.712 0.339 0 3.22 2.881 5.678-0.678 7.712-3.559 2.034-3.644 4.237-6.356 4.576-2.712 0.339-4.915 0.593-4.576-0.932 0.339-1.525 0-3.983 0-3.983z' class='a'/%3E%3Cpath d='m5.903 11.25c0 0-0.106-3.859 2.431-4.81 2.537-0.951 4.81-1.797 4.81 0.211 0 2.009 1.797 3.541-0.423 4.81-2.22 1.269-2.273 2.643-3.964 2.854-1.691 0.211-3.066 0.37-2.854-0.581 0.211-0.951 0-2.484 0-2.484z' class='a'/%3E%3Cpath d='m8.206 10.493c0 0-0.044-1.612 1.016-2.009 1.06-0.397 2.009-0.751 2.009 0.088 0 0.839 0.751 1.48-0.177 2.009-0.927 0.53-0.95 1.104-1.656 1.192-0.707 0.088-1.281 0.155-1.192-0.243 0.088-0.397 0-1.038 0-1.038z' style='fill:none;stroke-width:0.71;stroke:%23000'/%3E%3C/svg%3E%0A");
}
.mapbox-gl-contours.active {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cstyle%3E.a%7Bfill:none;stroke:%2333b5e5;%7D%3C/style%3E%3Crect width='16.864' height='9.237' x='-34.746' y='-4.068' rx='1.102' ry='1.102' fill='none'/%3E%3Cpath d='m3.644 12.203c0 0-0.169-6.186 3.898-7.712 4.068-1.525 7.712-2.881 7.712 0.339 0 3.22 2.881 5.678-0.678 7.712-3.559 2.034-3.644 4.237-6.356 4.576-2.712 0.339-4.915 0.593-4.576-0.932 0.339-1.525 0-3.983 0-3.983z' class='a'/%3E%3Cpath d='m5.903 11.25c0 0-0.106-3.859 2.431-4.81 2.537-0.951 4.81-1.797 4.81 0.211 0 2.009 1.797 3.541-0.423 4.81-2.22 1.269-2.273 2.643-3.964 2.854-1.691 0.211-3.066 0.37-2.854-0.581 0.211-0.951 0-2.484 0-2.484z' class='a'/%3E%3Cpath d='m8.206 10.493c0 0-0.044-1.612 1.016-2.009 1.06-0.397 2.009-0.751 2.009 0.088 0 0.839 0.751 1.48-0.177 2.009-0.927 0.53-0.95 1.104-1.656 1.192-0.707 0.088-1.281 0.155-1.192-0.243 0.088-0.397 0-1.038 0-1.038z' style='fill:none;stroke-width:0.71;stroke:%2333b5e5'/%3E%3C/svg%3E%0A");
}

.mapbox-gl-hillshading {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Crect x='-34.7' y='-4.1' width='16.9' height='9.2' rx='1.1' ry='1.1' fill='none'/%3E%3Cpath d='m3.0561 16.464 3.8951-8.9287 2.0974 1.9176 3.2359-5.2134 4.3745 12.284' fill='none' stroke='%23000' stroke-width='1px'/%3E%3Cpath d='m4.8986 16.645 2.7045-6.043 1.6903 1.6058 2.504-3.9553 3.0319 8.308v0.04226' fill='none' stroke='%23808080' stroke-width='.7052px'/%3E%3C/svg%3E%0A");
}
.mapbox-gl-hillshading.active {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Crect x='-34.7' y='-4.1' width='16.9' height='9.2' rx='1.1' ry='1.1' fill='none'/%3E%3Cpath d='m3.0561 16.464 3.8951-8.9287 2.0974 1.9176 3.2359-5.2134 4.3745 12.284' fill='none' stroke='%2333b5e5' stroke-width='1px'/%3E%3Cpath d='m4.8986 16.645 2.7045-6.043 1.6903 1.6058 2.504-3.9553 3.0319 8.308v0.04226' fill='none' stroke='%2389a9fa' stroke-width='.7052px'/%3E%3C/svg%3E%0A");
}

.mapbox-gl-difficulty {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7.056 7.056' height='20pt' width='20pt'%3E%3Cpath transform='skewX(.587) scale(1 .99995)' fill='none' stroke='%23000' stroke-width='.178' d='M3.977 1.708h2.178v3.633H3.977z'/%3E%3Cg style='line-height:1.25'%3E%3Cpath d='M1.988 5.38h.603V2.11h.884v-.508H1.088v.508h.9z' /%3E%3C/g%3E%3C/svg%3E");
}
.mapbox-gl-difficulty.active {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7.056 7.056' height='20pt' width='20pt'%3E%3Cpath transform='skewX(.587) scale(1 .99995)' fill='none' stroke='%2333b5e5' stroke-width='.178' d='M3.977 1.708h2.178v3.633H3.977z'/%3E%3Cg style='line-height:1.25'%3E%3Cpath d='M1.988 5.38h.603V2.11h.884v-.508H1.088v.508h.9z' fill='%2333b5e5' /%3E%3C/g%3E%3C/svg%3E");
}

.mapbox-gl-spots {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M14.6 7.6C15.7 9.5 15.3 12.1 13.7 13.7 12.1 15.4 9.3 15.7 7.3 14.4 5.4 13.3 4.4 10.9 5 8.7 5.5 6.4 7.7 4.7 10.1 4.8 10.9 4.8 11.7 5 12.4 5.4 12.8 5.1 13.1 4.8 13.4 4.5 11.2 3.1 8.2 3.2 6.1 4.8 4.1 6.2 3.1 8.8 3.6 11.2 4.1 13.8 6.3 16 8.8 16.4 11.3 16.9 13.9 15.8 15.3 13.8 16.8 11.7 16.9 8.8 15.5 6.6 15.2 6.9 14.9 7.3 14.6 7.6 14.6 7.6 14.6 7.6 14.6 7.6'/%3E%3Cpath d='M6.1 10C6.1 11.9 7.6 13.6 9.4 13.9 11.2 14.2 13.1 13 13.7 11.3 14 10.4 14 9.4 13.6 8.5 13.3 8.9 12.9 9.2 12.6 9.6 12.9 11.1 11.5 12.7 10 12.6 8.5 12.6 7.2 11.2 7.4 9.7 7.5 8.3 9 7.1 10.4 7.4 10.8 7.1 11.1 6.7 11.5 6.4 9.8 5.6 7.6 6.4 6.7 8 6.3 8.6 6.1 9.3 6.1 10 6.1 10 6.1 10 6.1 10'/%3E%3Cpath d='M16.4 4.5C16.1 4.2 15.8 3.9 15.5 3.6 13.8 5.3 12.1 7 10.3 8.7 9.4 8.5 8.5 9.4 8.7 10.3 8.9 11.2 10.1 11.6 10.8 11 11.4 10.7 11.1 9.9 11.4 9.5 13.1 7.8 14.8 6.2 16.4 4.5 16.4 4.5 16.4 4.5 16.4 4.5'/%3E%3C/svg%3E%0A");
}
.mapbox-gl-spots.active {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M14.6 7.6C15.7 9.5 15.3 12.1 13.7 13.7 12.1 15.4 9.3 15.7 7.3 14.4 5.4 13.3 4.4 10.9 5 8.7 5.5 6.4 7.7 4.7 10.1 4.8 10.9 4.8 11.7 5 12.4 5.4 12.8 5.1 13.1 4.8 13.4 4.5 11.2 3.1 8.2 3.2 6.1 4.8 4.1 6.2 3.1 8.8 3.6 11.2 4.1 13.8 6.3 16 8.8 16.4 11.3 16.9 13.9 15.8 15.3 13.8 16.8 11.7 16.9 8.8 15.5 6.6 15.2 6.9 14.9 7.3 14.6 7.6 14.6 7.6 14.6 7.6 14.6 7.6' fill='%2333b5e5'/%3E%3Cpath d='M6.1 10C6.1 11.9 7.6 13.6 9.4 13.9 11.2 14.2 13.1 13 13.7 11.3 14 10.4 14 9.4 13.6 8.5 13.3 8.9 12.9 9.2 12.6 9.6 12.9 11.1 11.5 12.7 10 12.6 8.5 12.6 7.2 11.2 7.4 9.7 7.5 8.3 9 7.1 10.4 7.4 10.8 7.1 11.1 6.7 11.5 6.4 9.8 5.6 7.6 6.4 6.7 8 6.3 8.6 6.1 9.3 6.1 10 6.1 10 6.1 10 6.1 10' fill='%2333b5e5'/%3E%3Cpath d='M16.4 4.5C16.1 4.2 15.8 3.9 15.5 3.6 13.8 5.3 12.1 7 10.3 8.7 9.4 8.5 8.5 9.4 8.7 10.3 8.9 11.2 10.1 11.6 10.8 11 11.4 10.7 11.1 9.9 11.4 9.5 13.1 7.8 14.8 6.2 16.4 4.5 16.4 4.5 16.4 4.5 16.4 4.5' fill='%2333b5e5' /%3E%3C/svg%3E%0A");
}

.mapbox-gl-inactive {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' focusable='false' role='img' viewBox='0 0 20 20' %3E%3Cpath d='M7.98 5.79C7.98 5.79 7.83 5.85 7.83 5.85 7.83 5.85 7.71 5.96 7.71 5.96 7.71 5.96 7.66 6.03 7.66 6.03 7.66 6.03 6.81 7.37 6.81 7.37 6.81 7.37 7.72 7.94 7.72 7.94 7.72 7.94 8.13 7.31 8.13 7.31 8.13 7.31 8.58 7.99 8.58 7.99 8.58 7.99 9.48 7.39 9.48 7.39 9.48 7.39 8.56 6.01 8.56 6.01 8.56 6.01 8.45 5.89 8.45 5.89 8.45 5.89 8.31 5.81 8.31 5.81 8.31 5.81 8.15 5.78 8.15 5.78 8.15 5.78 7.98 5.79 7.98 5.79'/%3E%3Cpath d='M4.51 11.02C4.51 11.02 5.42 11.6 5.42 11.6 5.42 11.6 7.15 8.86 7.15 8.86 7.15 8.86 6.23 8.28 6.23 8.28 6.23 8.28 4.51 11.02 4.51 11.02'/%3E%3Cpath d='M9.18 8.89C9.18 8.89 10.98 11.58 10.98 11.58 10.98 11.58 11.87 10.98 11.87 10.98 11.87 10.98 10.08 8.29 10.08 8.29 10.08 8.29 9.18 8.89 9.18 8.89'/%3E%3Cpath d='M11.57 12.48C11.57 12.48 11.8 12.82 11.8 12.82 11.8 12.82 11.01 12.82 11.01 12.82 11.01 12.82 11 13.9 11 13.9 11 13.9 12.81 13.91 12.81 13.91 12.81 13.91 12.97 13.88 12.97 13.88 12.97 13.88 13.12 13.81 13.12 13.81 13.12 13.81 13.24 13.7 13.24 13.7 13.24 13.7 13.32 13.55 13.32 13.55 13.32 13.55 13.35 13.39 13.35 13.39 13.35 13.39 13.34 13.23 13.34 13.23 13.34 13.23 13.27 13.08 13.27 13.08 13.27 13.08 13.26 13.07 13.26 13.07 13.26 13.07 12.47 11.88 12.47 11.88 12.47 11.88 11.57 12.48 11.57 12.48'/%3E%3Cpath d='M6.68 13.87C6.68 13.87 9.92 13.89 9.92 13.89 9.92 13.89 9.93 12.81 9.93 12.81 9.93 12.81 6.69 12.79 6.69 12.79 6.69 12.79 6.68 13.87 6.68 13.87'/%3E%3Cpath d='M11.86 6.47C11.86 6.47 11.71 6.53 11.71 6.53 11.71 6.53 11.58 6.64 11.58 6.64 11.58 6.64 11.55 6.67 11.55 6.67 11.55 6.67 10.51 8.07 10.51 8.07 10.51 8.07 11.38 8.72 11.38 8.72 11.38 8.72 11.96 7.93 11.96 7.93 11.96 7.93 12.36 8.53 12.36 8.53 12.36 8.53 13.26 7.93 13.26 7.93 13.26 7.93 12.44 6.69 12.44 6.69 12.44 6.69 12.32 6.57 12.32 6.57 12.32 6.57 12.18 6.49 12.18 6.49 12.18 6.49 12.02 6.46 12.02 6.46 12.02 6.46 11.86 6.47 11.86 6.47M12.96 9.43C12.96 9.43 14.76 12.12 14.76 12.12 14.76 12.12 15.66 11.53 15.66 11.53 15.66 11.53 13.86 8.83 13.86 8.83 13.86 8.83 12.96 9.43 12.96 9.43M15.65 12.83C15.65 12.83 13.79 12.83 13.79 12.83 13.79 12.83 13.79 13.91 13.79 13.91 13.79 13.91 16.24 13.91 16.24 13.91 16.24 13.91 16.41 13.89 16.41 13.89 16.41 13.89 16.55 13.81 16.55 13.81 16.55 13.81 16.67 13.7 16.67 13.7 16.67 13.7 16.75 13.56 16.75 13.56 16.75 13.56 16.78 13.4 16.78 13.4 16.78 13.4 16.77 13.23 16.77 13.23 16.77 13.23 16.7 13.08 16.7 13.08 16.7 13.08 16.69 13.07 16.69 13.07 16.69 13.07 16.26 12.42 16.26 12.42 16.26 12.42 15.65 12.83 15.65 12.83'/%3E%3Cpath d='M4.9 12.44C4.9 12.44 4.67 12.78 4.67 12.78 4.67 12.78 5.47 12.78 5.47 12.78 5.47 12.78 5.48 13.86 5.48 13.86 5.48 13.86 3.66 13.87 3.66 13.87 3.66 13.87 3.5 13.84 3.5 13.84 3.5 13.84 3.35 13.77 3.35 13.77 3.35 13.77 3.23 13.66 3.23 13.66 3.23 13.66 3.16 13.52 3.16 13.52 3.16 13.52 3.12 13.35 3.12 13.35 3.12 13.35 3.14 13.19 3.14 13.19 3.14 13.19 3.21 13.04 3.21 13.04 3.21 13.04 3.21 13.03 3.21 13.03 3.21 13.03 4 11.84 4 11.84 4 11.84 4.9 12.44 4.9 12.44'/%3E%3C/svg%3E%0A");
}
.mapbox-gl-inactive.active {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' focusable='false' role='img' viewBox='0 0 20 20' %3E%3Cpath d='M7.98 5.79C7.98 5.79 7.83 5.85 7.83 5.85 7.83 5.85 7.71 5.96 7.71 5.96 7.71 5.96 7.66 6.03 7.66 6.03 7.66 6.03 6.81 7.37 6.81 7.37 6.81 7.37 7.72 7.94 7.72 7.94 7.72 7.94 8.13 7.31 8.13 7.31 8.13 7.31 8.58 7.99 8.58 7.99 8.58 7.99 9.48 7.39 9.48 7.39 9.48 7.39 8.56 6.01 8.56 6.01 8.56 6.01 8.45 5.89 8.45 5.89 8.45 5.89 8.31 5.81 8.31 5.81 8.31 5.81 8.15 5.78 8.15 5.78 8.15 5.78 7.98 5.79 7.98 5.79' fill='%2333b5e5'/%3E%3Cpath d='M4.51 11.02C4.51 11.02 5.42 11.6 5.42 11.6 5.42 11.6 7.15 8.86 7.15 8.86 7.15 8.86 6.23 8.28 6.23 8.28 6.23 8.28 4.51 11.02 4.51 11.02' fill='%2333b5e5'/%3E%3Cpath d='M9.18 8.89C9.18 8.89 10.98 11.58 10.98 11.58 10.98 11.58 11.87 10.98 11.87 10.98 11.87 10.98 10.08 8.29 10.08 8.29 10.08 8.29 9.18 8.89 9.18 8.89' fill='%2333b5e5'/%3E%3Cpath d='M11.57 12.48C11.57 12.48 11.8 12.82 11.8 12.82 11.8 12.82 11.01 12.82 11.01 12.82 11.01 12.82 11 13.9 11 13.9 11 13.9 12.81 13.91 12.81 13.91 12.81 13.91 12.97 13.88 12.97 13.88 12.97 13.88 13.12 13.81 13.12 13.81 13.12 13.81 13.24 13.7 13.24 13.7 13.24 13.7 13.32 13.55 13.32 13.55 13.32 13.55 13.35 13.39 13.35 13.39 13.35 13.39 13.34 13.23 13.34 13.23 13.34 13.23 13.27 13.08 13.27 13.08 13.27 13.08 13.26 13.07 13.26 13.07 13.26 13.07 12.47 11.88 12.47 11.88 12.47 11.88 11.57 12.48 11.57 12.48' fill='%2333b5e5'/%3E%3Cpath d='M6.68 13.87C6.68 13.87 9.92 13.89 9.92 13.89 9.92 13.89 9.93 12.81 9.93 12.81 9.93 12.81 6.69 12.79 6.69 12.79 6.69 12.79 6.68 13.87 6.68 13.87' fill='%2333b5e5'/%3E%3Cpath d='M11.86 6.47C11.86 6.47 11.71 6.53 11.71 6.53 11.71 6.53 11.58 6.64 11.58 6.64 11.58 6.64 11.55 6.67 11.55 6.67 11.55 6.67 10.51 8.07 10.51 8.07 10.51 8.07 11.38 8.72 11.38 8.72 11.38 8.72 11.96 7.93 11.96 7.93 11.96 7.93 12.36 8.53 12.36 8.53 12.36 8.53 13.26 7.93 13.26 7.93 13.26 7.93 12.44 6.69 12.44 6.69 12.44 6.69 12.32 6.57 12.32 6.57 12.32 6.57 12.18 6.49 12.18 6.49 12.18 6.49 12.02 6.46 12.02 6.46 12.02 6.46 11.86 6.47 11.86 6.47M12.96 9.43C12.96 9.43 14.76 12.12 14.76 12.12 14.76 12.12 15.66 11.53 15.66 11.53 15.66 11.53 13.86 8.83 13.86 8.83 13.86 8.83 12.96 9.43 12.96 9.43M15.65 12.83C15.65 12.83 13.79 12.83 13.79 12.83 13.79 12.83 13.79 13.91 13.79 13.91 13.79 13.91 16.24 13.91 16.24 13.91 16.24 13.91 16.41 13.89 16.41 13.89 16.41 13.89 16.55 13.81 16.55 13.81 16.55 13.81 16.67 13.7 16.67 13.7 16.67 13.7 16.75 13.56 16.75 13.56 16.75 13.56 16.78 13.4 16.78 13.4 16.78 13.4 16.77 13.23 16.77 13.23 16.77 13.23 16.7 13.08 16.7 13.08 16.7 13.08 16.69 13.07 16.69 13.07 16.69 13.07 16.26 12.42 16.26 12.42 16.26 12.42 15.65 12.83 15.65 12.83' fill='%2333b5e5'/%3E%3Cpath d='M4.9 12.44C4.9 12.44 4.67 12.78 4.67 12.78 4.67 12.78 5.47 12.78 5.47 12.78 5.47 12.78 5.48 13.86 5.48 13.86 5.48 13.86 3.66 13.87 3.66 13.87 3.66 13.87 3.5 13.84 3.5 13.84 3.5 13.84 3.35 13.77 3.35 13.77 3.35 13.77 3.23 13.66 3.23 13.66 3.23 13.66 3.16 13.52 3.16 13.52 3.16 13.52 3.12 13.35 3.12 13.35 3.12 13.35 3.14 13.19 3.14 13.19 3.14 13.19 3.21 13.04 3.21 13.04 3.21 13.04 3.21 13.03 3.21 13.03 3.21 13.03 4 11.84 4 11.84 4 11.84 4.9 12.44 4.9 12.44' fill='%2333b5e5'/%3E%3C/svg%3E%0A");
}
</style>
