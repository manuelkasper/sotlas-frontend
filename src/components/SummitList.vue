<template>
  <b-table :class="{ 'auto-width': autoWidth, summits: true }" default-sort="code" :narrowed="true" :striped="true" :data="data" :mobile-cards="false" :row-class="(row, index) => !row.isValid && 'is-invalid'">
    <template slot-scope="props">
      <b-table-column field="code" label="Reference" class="nowrap" sortable>
        <router-link :to="makeSummitLink(props.row.code)">{{ props.row.code }}</router-link>
      </b-table-column>
      <b-table-column field="name" label="Name" class="summit-name" sortable>
        <router-link :to="makeSummitLink(props.row.code)">{{ props.row.name }}</router-link>
        <font-awesome-icon v-if="props.row.hasPhotos" class="photos-icon" :icon="['far', 'images']" />
      </b-table-column>
      <b-table-column field="altitude" :label="$mq.mobile ? 'Alt.' : 'Altitude'" class="nowrap" sortable numeric>
        <AltitudeLabel :altitude="props.row.altitude" />
      </b-table-column>
      <b-table-column field="points" :label="$mq.mobile ? 'Pts.' : 'Points'" class="nowrap" sortable>
        <SummitPointsLabel :points="props.row.points" :bonus="$mq.mobile ? null : props.row.bonusPoints" class="points" />
      </b-table-column>
      <b-table-column field="activationCount" :label="$mq.mobile ? 'Act.' : 'Activations'" class="nowrap" sortable numeric>
        {{ props.row.activationCount }}
        <font-awesome-icon v-if="myActivatedSummits" :icon="activationIcon(props.row)" :class="activationIconClass(props.row)" :label="activationIconLabel(props.row)" :title="activationIconLabel(props.row)" />
        <font-awesome-icon v-if="myActivatedSummitsThisYear" :icon="['far', 'calendar-check']" :class="calendarIconClass(props.row)" :label="calendarIconLabel(props.row)" :title="calendarIconLabel(props.row)" />
      </b-table-column>
    </template>

    <template v-if="myActivatedSummits" slot="footer">
      <ul class="legend">
        <li><font-awesome-icon :icon="['far', 'chevron-circle-down']" :class="['activation-icon', 'chased']" /> Chased</li>
        <li><font-awesome-icon :icon="['far', 'chevron-circle-up']" :class="['activation-icon', 'activated']" /> Activated</li>
        <li><font-awesome-icon :icon="['fas', 'check-circle']" :class="['activation-icon', 'complete']" /> Complete</li>
        <li v-if="myActivatedSummitsThisYear"><font-awesome-icon :icon="['far', 'calendar-check']" :class="['calendar-icon', 'active']" /> Activated this year</li>
      </ul>
    </template>
  </b-table>
</template>

<script>
import utils from '../mixins/utils.js'
import SummitPointsLabel from '../components/SummitPointsLabel.vue'
import AltitudeLabel from '../components/AltitudeLabel.vue'

export default {
  name: 'SummitList',
  props: {
    data: Array,
    myActivatedSummits: Set,
    myActivatedSummitsThisYear: Set,
    myChasedSummits: Set,
    autoWidth: Boolean
  },
  mixins: [utils],
  components: {
    SummitPointsLabel, AltitudeLabel
  },
  methods: {
    activationIcon (row) {
      if (this.isComplete(row.code)) {
        return ['fas', 'check-circle']
      } else if (this.isActivated(row.code)) {
        return ['far', 'chevron-circle-up']
      } else if (this.isChased(row.code)) {
        return ['far', 'chevron-circle-down']
      } else {
        return ['far', 'check-circle']
      }
    },
    activationIconClass (row) {
      if (this.isComplete(row.code)) {
        return ['activation-icon', 'complete']
      } else if (this.isActivated(row.code)) {
        return ['activation-icon', 'activated']
      } else if (this.isChased(row.code)) {
        return ['activation-icon', 'chased']
      } else {
        return ['activation-icon']
      }
    },
    activationIconLabel (row) {
      if (this.isComplete(row.code)) {
        return 'completed by me'
      } else if (this.isActivated(row.code)) {
        return 'activated by me'
      } else if (this.isChased(row.code)) {
        return 'chased by me'
      } else {
        return 'not activated/chased by me'
      }
    },
    calendarIconClass (row) {
      if (this.isActivatedThisYear(row.code)) {
        return ['calendar-icon', 'active']
      } else {
        return ['calendar-icon']
      }
    },
    calendarIconLabel (row) {
      if (this.isActivatedThisYear(row.code)) {
        return 'activated this year'
      } else {
        return 'not activated this year'
      }
    },
    isActivated (code) {
      if (!this.myActivatedSummits) {
        return false
      }
      return this.myActivatedSummits.has(code)
    },
    isActivatedThisYear (code) {
      if (!this.myActivatedSummitsThisYear) {
        return null
      }
      return this.myActivatedSummitsThisYear.has(code)
    },
    isChased (code) {
      if (!this.myChasedSummits) {
        return false
      }
      return this.myChasedSummits.has(code)
    },
    isComplete (code) {
      if (!this.myActivatedSummits || !this.myChasedSummits) {
        return false
      }
      return this.myActivatedSummits.has(code) && this.myChasedSummits.has(code)
    }
  }
}
</script>

<style scoped>
.summits >>> .is-invalid {
  opacity: 0.5;
}
@media (max-width: 414px) {
  .table .summit-name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: 10em;
  }
}
@media (max-width: 375px) {
  .table td, .table th {
    padding: 0.25em 0.3em;
  }
  .table .summit-name {
    max-width: 8em;
  }
}
.activation-icon {
  color: #e7e7e7;
  margin-left: 0.1em;
}
.activation-icon.activated, .activation-icon.complete {
  color: #406caf;
}
.activation-icon.chased {
  color: #2eaa9b;
}
.calendar-icon {
  color: #e7e7e7;
  margin-left: 0.3em;
}
.calendar-icon.active {
  color: #444;
}
.legend {
  font-weight: normal;
  list-style-type: none;
  margin-top: 0.5em;
  text-align: right;
}
.legend .calendar-icon, .legend .activation-icon {
  margin-left: 0;
  margin-right: 0.1em;
}
.legend li {
  display: inline-block;
  margin-left: 0.75em;
}
.photos-icon {
  margin-left: 0.5em;
  color: #777;
}
</style>
