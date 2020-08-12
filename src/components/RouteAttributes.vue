<template>
  <span class="route-attributes">
    <b-tooltip v-if="route.parking && route.parking.available" :active="!$mq.mobile" label="Parking available" type="is-info" position="is-bottom">
      <font-awesome-icon class="fa-icon clickable" :icon="['fas', 'parking']" @click="$emit('mapReposition', route.parking.coordinates)" />
    </b-tooltip>
    <b-tooltip v-if="route.publicTransport && route.publicTransport.available" :active="!$mq.mobile" label="Public transport available" type="is-info" position="is-bottom">
      <font-awesome-layers class="fa-icon clickable" @click="$emit('mapReposition', route.publicTransport.coordinates)">
        <font-awesome-icon class="fa-icon" icon="square" />
        <font-awesome-icon class="fa-icon" :icon="['fas', 'bus']" transform="shrink-6" :style="{ color: 'white' }" />
      </font-awesome-layers>
    </b-tooltip>
    <b-tooltip v-if="route.cableCar" :active="!$mq.mobile" label="Cable car/funicular available" type="is-info" position="is-bottom">
      <svgicon icon="icons8-cable-car" />
    </b-tooltip>
    <b-tooltip v-if="route.track" :active="!$mq.mobile" label="GPS track available" type="is-info" position="is-bottom">
      <TrackLink :route="route" :summit="summit"><font-awesome-icon class="fa-icon" :icon="['far', 'location']" /></TrackLink>
    </b-tooltip>
    <b-tooltip v-if="route.accessibleInWinter" :active="!$mq.mobile" label="Accessible in winter" type="is-info" position="is-bottom">
      <font-awesome-icon class="fa-icon" :icon="['far', 'snowflake']" />
    </b-tooltip>
  </span>
</template>

<script>
import '../compiled-icons'
import TrackLink from './TrackLink.vue'

export default {
  name: 'RouteAttributes',
  props: {
    route: Object,
    summit: Object
  },
  components: { TrackLink },
  computed: {
    icons () {
      let icons = []
      if (this.route.accessibleInWinter) {
        icons.push({
          icon: 'snowflake',
          text: 'Accessible in winter'
        })
      }
      if (this.route.parking && this.route.parking.available) {
        icons.push({
          icon: 'parking',
          text: 'Parking available'
        })
      }
      if (this.route.publicTransport && this.route.publicTransport.available) {
        icons.push({
          icon: 'bus',
          text: 'Public transport available'
        })
      }
      return this.attributeList.filter((attribute) => this.route[attribute.attribute] === true)
    }
  }
}
</script>

<style scoped>
.b-tooltip {
  margin-right: 0.25em;
  display: inline;
}
.fa-icon, .svg-icon {
  width: 1.4em;
  height: 1.4em;
}
.b-tooltip:last-child {
  margin-right: 0;
}
a.track-link {
  color: inherit;
}
</style>
