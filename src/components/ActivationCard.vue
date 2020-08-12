<template>
  <div class="card">
    <div class="card-content">
      <div class="points"><SummitPointsLabel :points="activation.points" :bonus="activation.bonus" /></div>
      <div class="qsos" @click="$emit('openQsoList', activation.id)">
        {{ activation.qsos }} QSOs
        <font-awesome-icon :icon="['far', 'th-list']" class="faicon" />
      </div>
      <div class="date">{{ activation.date | formatActivationDate }}</div>
      <div class="summit"><router-link :class="{ invalid: activation.summit.invalid }" :to="makeSummitLink(activation.summit.code)">{{ activation.summit.name }} ({{ activation.summit.code }})</router-link><font-awesome-icon v-if="hasOwnPhotos(activation.summit)" class="photos-icon" :icon="['far', 'images']" /><font-awesome-icon v-else-if="activation.summit.photoAuthors && activation.summit.photoAuthors.length > 0" class="photos-icon-others" :icon="['far', 'images']" /><AltitudeLabel :altitude="activation.summit.altitude" /><ActivationCount :activationCount="activation.summit.activationCount" /></div>
    </div>
  </div>
</template>

<script>
import utils from '../mixins/utils.js'
import SummitPointsLabel from '../components/SummitPointsLabel.vue'
import ActivationCount from '../components/ActivationCount.vue'
import AltitudeLabel from '../components/AltitudeLabel.vue'

export default {
  name: 'ActivationCard',
  components: {
    SummitPointsLabel, ActivationCount, AltitudeLabel
  },
  mixins: [utils],
  props: {
    activation: {
      type: Object,
      required: true
    },
    ownCallsign: String
  },
  methods: {
    hasOwnPhotos (summit) {
      if (!summit.photoAuthors || !this.ownCallsign) {
        return false
      }

      return summit.photoAuthors.includes(this.ownCallsign)
    }
  }
}
</script>

<style scoped>
.card-content {
  font-size: 0.9rem;
  padding: 0.6rem;
  line-height: 1.3;
  overflow: auto;
}
.card-content .date {
  margin-right: 0.5em;
  min-width: 3.5em;
  display: inline-block;
}
.card-content .points {
  float: right;
}
.card-content .qsos {
  float: right;
  font-size: 0.75rem;
  margin-right: 0.7em;
  color: #3273dc;
  margin-top: 0.15em;
  cursor: pointer;
}
.card-content .summit {
  margin-top: 0.1em;
}
.card-content .invalid {
  opacity: 0.7;
  text-decoration: line-through;
}
.card-content .altitude {
  font-size: 0.75rem;
  color: #777;
  margin-left: 0.3em;
}
.card-content .activation-count {
  font-size: 0.75rem;
  margin-left: 0.3em;
  margin-right: 0.2em;
}
.photos-icon {
  margin-left: 0.5em;
  margin-right: 0.1em;
  color: #777;
}
.photos-icon-others {
  margin-left: 0.5em;
  margin-right: 0.1em;
  color: #aaa;
}
</style>
