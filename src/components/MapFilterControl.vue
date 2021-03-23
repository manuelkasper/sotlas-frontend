<template>
  <div :class="{ 'mapboxgl-ctrl-group': true, 'mapboxgl-ctrl': true, 'mapbox-gl-filter-container': true }">
    <button :class="{ 'mapboxgl-ctrl-icon': true, 'mapbox-gl-filter': true, active: active }" type="button" title="Toggle filter" @click="toggleFilter" />
    <div v-if="open" class="filter-container">
      <div class="filter-criterion">
        <b-field>
          <b-checkbox v-model="activationsEnabled" size="is-small">Activations</b-checkbox>
        </b-field>
        <b-field grouped>
          <b-input v-model="activationsFrom" class="count" placeholder="min." size="is-small" :disabled="!activationsEnabled" />
          <div class="tlabel">to</div>
          <b-input v-model="activationsTo" class="count" placeholder="max." size="is-small" :disabled="!activationsEnabled" />
        </b-field>
        <b-field grouped>
          <b-button class="control" size="is-small" @click="setActivations(0, 0)">Never</b-button>
          <b-button class="control" size="is-small" @click="setActivations(0, 3)">Rarely</b-button>
        </b-field>
      </div>
      <div class="filter-criterion">
        <b-field>
          <b-checkbox v-model="pointsEnabled" size="is-small">Points</b-checkbox>
        </b-field>
        <b-field grouped>
          <b-select v-model="pointsFrom" placeholder="min." size="is-small" :disabled="!pointsEnabled">
            <option v-for="point in points" :key="point" :value="point">{{ point }}</option>
          </b-select>
          <div class="tlabel">to</div>
          <b-select v-model="pointsTo" placeholder="max." size="is-small" :disabled="!pointsEnabled">
            <option v-for="point in points" :key="point" :value="point">{{ point }}</option>
          </b-select>
        </b-field>
      </div>
      <div class="filter-criterion">
        <b-field>
          <b-checkbox v-model="altitudeEnabled" size="is-small">Altitude</b-checkbox>
        </b-field>
        <b-field grouped>
          <b-input v-model="altitudeFrom" class="altitude" placeholder="min." size="is-small" :disabled="!altitudeEnabled" />
          <div class="tlabel">to</div>
          <b-input v-model="altitudeTo" class="altitude" placeholder="max." size="is-small" :disabled="!altitudeEnabled" />
          <div class="tlabel">{{ $store.state.altitudeUnits }}</div>
        </b-field>
      </div>
      <div class="filter-criterion">
        <b-field>
          <b-checkbox v-model="activatedByEnabled" size="is-small">Activated by</b-checkbox>
        </b-field>
        <b-field grouped>
          <b-input v-model="activatedBy" class="callsign" placeholder="Callsign, Callsign, ..." size="is-small" :disabled="!activatedByEnabled" />
          <b-button v-if="myCallsign" class="control" size="is-small" @click="activatedBy = myCallsign" :disabled="!activatedByEnabled">Me</b-button>
          <b-checkbox v-model="activatedByThisYear" size="is-small">This year</b-checkbox>
        </b-field>
      </div>
      <div class="filter-criterion">
        <b-field>
          <b-checkbox v-model="notActivatedByEnabled" size="is-small">Not activated by</b-checkbox>
        </b-field>
        <b-field grouped>
          <b-input v-model="notActivatedBy" class="callsign" placeholder="Callsign, Callsign, ..." size="is-small" :disabled="!notActivatedByEnabled" />
          <b-button v-if="myCallsign" class="control" size="is-small" @click="notActivatedBy = myCallsign" :disabled="!notActivatedByEnabled">Me</b-button>
          <b-checkbox v-model="notActivatedByThisYear" size="is-small">This year</b-checkbox>
        </b-field>
      </div>
      <div class="filter-criterion">
        <b-field>
          <b-tooltip label="Only available if logged in" type="is-info" :active="!authenticated"><b-checkbox v-model="completeCandidateEnabled" size="is-small" :disabled="!authenticated">Complete candidate for me</b-checkbox></b-tooltip>
        </b-field>
      </div>
      <div class="action-buttons">
        <b-button type="is-link" size="is-small" :loading="filterLoadingCount > 0" @click="updateFilter">Update</b-button>
        <b-button type="is-danger" size="is-small" @click="clearFilter">Clear</b-button>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import prefs from '../mixins/prefs.js'
import utils from '../mixins/utils.js'
import api from '../mixins/api.js'
import sotadb from '../mixins/sotadb.js'

export default {
  name: 'MapFilterControl',
  inject: ['map'],
  mixins: [prefs, utils, api, sotadb],
  prefs: {
    key: 'mapFilter',
    props: ['activationsEnabled', 'activationsFrom', 'activationsTo', 'pointsEnabled', 'pointsFrom', 'pointsTo',
      'altitudeEnabled', 'altitudeFrom', 'altitudeTo', 'activatedByEnabled', 'activatedBy', 'activatedByThisYear',
      'notActivatedByEnabled', 'notActivatedBy', 'notActivatedByThisYear', 'completeCandidateEnabled']
  },
  data () {
    return {
      open: false,
      active: false,
      activationsEnabled: false,
      activationsFrom: null,
      activationsTo: null,
      pointsEnabled: false,
      pointsFrom: null,
      pointsTo: null,
      altitudeEnabled: false,
      altitudeFrom: null,
      altitudeTo: null,
      activatedByEnabled: false,
      activatedBy: null,
      activatedByThisYear: false,
      notActivatedByEnabled: false,
      notActivatedBy: null,
      notActivatedByThisYear: false,
      completeCandidateEnabled: false,
      points: [1, 2, 4, 6, 8, 10],
      filterLoadingCount: 0
    }
  },
  mounted () {
    this.updateFilter()
  },
  watch: {
    filterLoadingCount (newFilterLoadingCount) {
      if (newFilterLoadingCount > 0) {
        this.$emit('startFiltering')
      } else {
        this.$emit('stopFiltering')
      }
    }
  },
  methods: {
    close () {
      this.open = false
    },
    toggleFilter () {
      this.open = !this.open
    },
    updateFilter () {
      let filterPromises = []

      if (this.activationsEnabled) {
        if (this.activationsFrom && this.activationsTo && this.activationsTo < this.activationsFrom) {
          let tmp = this.activationsFrom
          this.activationsFrom = this.activationsTo
          this.activationsTo = tmp
        }
        if (this.activationsFrom !== null && this.activationsFrom !== '') {
          filterPromises.push(['>=', 'act', parseInt(this.activationsFrom)])
        }
        if (this.activationsTo !== null && this.activationsTo !== '') {
          filterPromises.push(['<=', 'act', parseInt(this.activationsTo)])
        }
      }

      if (this.pointsEnabled) {
        if (this.pointsFrom && this.pointsTo && this.pointsTo < this.pointsFrom) {
          let tmp = this.pointsFrom
          this.pointsFrom = this.pointsTo
          this.pointsTo = tmp
        }
        if (this.pointsFrom) {
          filterPromises.push(['>=', 'points', parseInt(this.pointsFrom)])
        }
        if (this.pointsTo) {
          filterPromises.push(['<=', 'points', parseInt(this.pointsTo)])
        }
      }

      if (this.altitudeEnabled) {
        if (this.altitudeFrom) {
          this.altitudeFrom = parseInt(this.altitudeFrom)
        }
        if (this.altitudeTo) {
          this.altitudeTo = parseInt(this.altitudeTo)
        }
        if (this.altitudeFrom && this.altitudeTo && this.altitudeTo < this.altitudeFrom) {
          let tmp = this.altitudeFrom
          this.altitudeFrom = this.altitudeTo
          this.altitudeTo = tmp
        }
        let mul = 1
        if (this.$store.state.altitudeUnits === 'ft') {
          mul = 1 / 3.28084
        }
        if (this.altitudeFrom) {
          filterPromises.push(['>=', 'alt', Math.round(parseInt(this.altitudeFrom) * mul)])
        }
        if (this.altitudeTo) {
          filterPromises.push(['<=', 'alt', Math.round(parseInt(this.altitudeTo) * mul)])
        }
      }

      filterPromises.push(this.makeActivationsFilter('activatedBy', ['in', 'code']))
      filterPromises.push(this.makeActivationsFilter('notActivatedBy', ['!in', 'code']))

      if (this.completeCandidateEnabled) {
        filterPromises.push(this.makeCompleteCandidateFilter())
      }

      Promise.all(filterPromises).then(filters => {
        let filtersNoNull = filters.filter(el => {
          return el !== null
        })
        if (filtersNoNull.length > 0) {
          this.setSummitFilter(['all'].concat(filtersNoNull))
          this.active = true
        } else {
          this.setSummitFilter(null)
          this.active = false
        }
      })
    },
    setActivations (from, to) {
      this.activationsEnabled = true
      this.activationsFrom = from
      this.activationsTo = to
      this.updateFilter()
    },
    clearFilter () {
      this.$options.prefs.props.forEach(key => {
        this[key] = null
      })
      this.updateFilter()
    },
    setSummitFilter (filter) {
      this.map.setFilter('summits_circles', filter)
      this.map.setFilter('summits_names', filter)
      this.map.setFilter('summits_activations', filter)
      this.map.setFilter('summits_inactive_circles', filter)
      this.map.setFilter('summits_inactive_names', filter)
    },
    makeActivationsFilter (paramField, filterTemplate) {
      if (!this[paramField + 'Enabled'] || !this[paramField]) {
        return null
      }

      let callsigns = this[paramField].trim().split(/\s*,\s*/)

      this.filterLoadingCount++
      return Promise.all(callsigns.map(callsign => {
        return this.loadActivations(callsign.toUpperCase())
      }))
        .then(allActivations => {
          this.filterLoadingCount--
          let summitCodes

          allActivations.forEach(activations => {
            // Filter for this year if necessary
            if (this[paramField + 'ThisYear']) {
              let now = moment.utc()
              activations = activations.filter(activation => {
                return moment.utc(activation.date).isSame(now, 'year')
              })
            }

            let curSummitCodes = new Set(activations.map(activation => activation.summit.code))

            if (summitCodes === undefined) {
              summitCodes = curSummitCodes
            } else {
              // activatedBy: calculate intersection
              // notActivatedBy: calculate union
              if (paramField.startsWith('not')) {
                summitCodes = new Set([...summitCodes, ...curSummitCodes])
              } else {
                summitCodes = new Set([...summitCodes].filter(x => curSummitCodes.has(x)))
              }
            }
          })

          let filter = filterTemplate
          summitCodes.forEach(summitCode => {
            filter.push(summitCode)
          })
          return filter
        })
        .catch((e) => {
          this.$buefy.snackbar.open({
            message: 'SOTA database error, try again later',
            type: 'is-warning',
            position: 'is-bottom'
          })
          this.filterLoadingCount--
        })
    },
    makeCompleteCandidateFilter () {
      if (!this.authenticated) {
        return null
      }

      this.filterLoadingCount++
      return this.loadMyChaserUniques()
        .then(chaserUniques => {
          return this.loadMyActivatorUniques()
            .then(activatorUniques => {
              // Find all summits that have been chased, but not activated
              let completeCandidates = new Set()
              chaserUniques.forEach(ent => {
                completeCandidates.add(ent)
              })
              activatorUniques.forEach(ent => {
                completeCandidates.delete(ent)
              })
              this.filterLoadingCount--
              return ['in', 'code', ...completeCandidates]
            })
        })
    },
    isActive () {
      return this.active
    }
  }
}
</script>

<style scoped>
.mapbox-gl-filter {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M16.93 3.62C16.86 3.47 16.71 3.37 16.54 3.37H3.15c-0.17 0-0.32 0.1-0.39 0.25-0.07 0.15-0.05 0.33 0.06 0.46l5.15 6.24v5.76c0 0.15 0.08 0.29 0.2 0.37 0.07 0.04 0.15 0.06 0.23 0.06 0.07 0 0.13-0.01 0.19-0.04l2.89-1.43c0.15-0.07 0.24-0.22 0.24-0.39l0.01-4.32 5.15-6.24c0.11-0.13 0.13-0.31 0.06-0.46zm-5.97 6.27c-0.06 0.08-0.1 0.17-0.1 0.27l-0.01 4.21-2.03 1.01v-5.21c0-0.1-0.03-0.2-0.1-0.27L4.07 4.23H15.62Z' stroke-width='0.06'/%3E%3C/svg%3E%0A");
}
.mapbox-gl-filter.active {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg' fill-rule='evenodd' clip-rule='evenodd' stroke-linejoin='round' stroke-miterlimit='2'%3E%3Cpath d='M16.93 3.62a.43.43 0 00-.39-.25H3.15c-.17 0-.32.1-.39.25a.43.43 0 00.06.46l5.15 6.24v5.76c0 .15.08.29.2.37.07.04.15.06.23.06.07 0 .13-.01.19-.04l2.89-1.43c.15-.07.24-.22.24-.39l.01-4.32 5.15-6.24a.43.43 0 00.06-.46l-.01-.01z' fill='%2333b5e5' fill-rule='nonzero'/%3E%3C/svg%3E");
}
.filter-criterion {
  margin: 0.3em 0;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 0.2em;
  background-color: #eee;
  font-size: 0.8rem;
}
.filter-criterion div.tlabel {
  margin-right: 0.75rem;
  display: inline-block;
}
.filter-criterion .field {
  margin: 0.2rem 0.2rem 0.5rem 0.2rem;
  line-height: 1;
  align-items: center;
}
.filter-criterion .field:last-child {
  margin-bottom: 0.2rem;
}
.filter-criterion .callsign >>> input {
  text-transform: uppercase;
}
.filter-criterion .count >>> input {
  width: 4em;
}
.filter-criterion .altitude >>> input {
  width: 5em;
}
.filter-criterion .field input, .filter-criterion .field select {
  vertical-align: baseline;
}
/* Fix overrides from mapbox-gl.css */
.filter-container button {
  width: auto;
  height: auto;
  padding-bottom: calc(.375em - 1px);
  padding-left: .75em;
  padding-right: .75em;
  padding-top: calc(.375em - 1px);
}
.filter-criterion button {
  border: 1px solid #dbdbdb;
  background-color: #fff;
}
.action-buttons button {
  float: right;
  margin-left: 0.5em;
  margin-top: 0.2em;
}
.mapbox-gl-filter-container .filter-container {
  display: none;
  padding: 0 0.5em 0.5em 0.5em;
  display: inline-block;
}
.mapbox-gl-filter-container button {
  display: inline-block;
  vertical-align: top;
}
</style>
