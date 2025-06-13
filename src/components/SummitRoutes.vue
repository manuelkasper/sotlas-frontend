<template>
  <b-table ref="routesTable" :data="routes" :narrowed="true" :striped="true" detailed @details-open="detailsOpen" @details-close="detailsClose">
    <template slot-scope="props">
      <b-table-column field="title" label="Title" :sortable="routes.length > 1">
        <span><a @click="toggle(props.row)"><strong>{{ props.row.title }}</strong></a> <RouteAttributes class="route-attributes" :route="props.row" :summit="summit" @mapReposition="coordinates => $emit('mapReposition', coordinates)" /></span>
      </b-table-column>
      <b-table-column field="difficulty" label="Difficulty" :sortable="routes.length > 1">
        {{ renderDifficulty(props.row) }}
      </b-table-column>
      <b-table-column field="ascent" label="Ascent" numeric :sortable="routes.length > 1">
        <span><AltitudeLabel v-if="props.row.ascent" :altitude="props.row.ascent" /></span>
      </b-table-column>
      <b-table-column field="distance" label="Distance" numeric :sortable="routes.length > 1">
        <DistanceLabel v-if="props.row.distance" :distance="props.row.distance" />
      </b-table-column>
    </template>

    <template slot="detail" slot-scope="props">
      <div v-if="(props.row.parking && props.row.parking.description) || (props.row.publicTransport && props.row.publicTransport.description)" class="add-description-wrapper">
        <div v-if="props.row.parking && props.row.parking.description" class="add-description">
          <font-awesome-icon class="fa-icon clickable" :icon="['fas', 'parking']" @click="$emit('mapReposition', props.row.parking.coordinates)" />
          {{ props.row.parking.description }}
        </div>
        <div v-if="props.row.publicTransport && props.row.publicTransport.description" class="add-description">
          <font-awesome-layers class="fa-icon clickable" @click="$emit('mapReposition', props.row.publicTransport.coordinates)">
            <font-awesome-icon class="fa-subicon" icon="square" />
            <font-awesome-icon class="fa-subicon" :icon="['fas', 'bus']" transform="shrink-6" :style="{ color: 'white' }" />
          </font-awesome-layers>
          {{ props.row.publicTransport.description }}
        </div>
      </div>
      <article class="routeDescr" v-html="linkifyCoordinates(props.row.htmlDescription ? props.row.htmlDescription : props.row.description)" />
      <div class="author">Posted on {{ props.row.postedDate | formatActivationDate }} by {{ props.row.author }}</div>
      <div class="track-download" v-if="props.row.track">
        <TrackLink :route="props.row" :summit="summit"><font-awesome-icon :icon="['far', 'file-download']" class="fa-icon" /> Download track (.gpx)</TrackLink>
      </div>
    </template>
  </b-table>
</template>

<script>
import RouteAttributes from './RouteAttributes.vue'
import AltitudeLabel from './AltitudeLabel.vue'
import DistanceLabel from './DistanceLabel.vue'
import TrackLink from './TrackLink.vue'
import utils from '../mixins/utils.js'

export default {
  name: 'SummitRoutes',
  props: {
    summit: Object,
    routes: Array
  },
  components: {
    RouteAttributes, AltitudeLabel, DistanceLabel, TrackLink
  },
  mixins: [utils],
  methods: {
    toggle (row) {
      this.$refs.routesTable.toggleDetails(row)
    },
    detailsOpen (row) {
      this.$emit('detailsOpen', row)
    },
    detailsClose (row) {
      this.$emit('detailsClose', row)
    },
    renderDifficulty (row) {
      let fields = ['hikingDifficulty', 'snowshoeDifficulty', 'alpineDifficulty', 'skiDifficulty', 'climbingDifficulty']
      let difficulties = []
      fields.forEach(field => {
        if (row[field]) {
          difficulties.push(row[field])
        }
      })
      return difficulties.join(' ')
    },
    linkifyCoordinates (description) {
      return description.replace(/(?:^|\s)([-+]?[1-8]?\d\.\d+),\s*([-+]?(?:(?:1[0-7]\d)|(?:[1-9]?\d))\.\d+)\b/g, '<a href="/map/coordinates/$1,$2/16.0?popup=1">$&</a>')
    }
  }
}
</script>

<style scoped>
>>> .routeDescr p, >>> .routeDescr ul {
  margin-bottom: 1em;
}
>>> .routeDescr ul {
  list-style-type: disc;
  margin-left: 1.5em;
}
>>> .table-wrapper {
  overflow-x: initial;
}
.route-attributes {
  display: inline-block;
  vertical-align: middle;
  margin-left: 0.5em;
}
.add-description-wrapper {
  margin-bottom: 1em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5em;
  opacity: 0.75;
}
.add-description {
  margin-bottom: 0.3em;
  font-style: italic;
}
.add-description .fa-icon {
  width: 1.25em;
  height: 1.25em;
  vertical-align: text-bottom;
  margin-right: 0.3em;
}
.add-description .fa-subicon {
  width: 1.25em;
  height: 1.25em;
}
.track-download .fa-icon {
  margin-right: 0.3em;
}
.author {
  float: right;
  color: #7a7a7a;
  font-size: 95%;
  font-style: italic;
}
>>> .table-footer th {
  font-weight: normal;
  font-size: 0.9em;
  padding-top: 0.5em;
  color: #7a7a7a;
  text-align: right;
}
.star {
  color: #7a7a7a;
}
</style>
