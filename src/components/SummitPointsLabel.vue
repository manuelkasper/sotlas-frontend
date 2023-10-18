<template>
  <b-tooltip class="season-tooltip" type="is-light" :position="$mq.mobile ? 'is-bottom' : 'is-right'" :label="seasonLabel">
    <b-taglist v-if="points !== null && points !== undefined" :class="{ ['points-' + points]: true }" attached>
      <b-tag>{{ points }}</b-tag>
      <b-tag class="bonus" v-if="bonus">+{{ bonus }}</b-tag>
    </b-taglist>
  </b-tooltip>
</template>

<script>
export default {
  name: 'SummitPointsLabel',
  props: {
    points: {
      type: Number
    },
    bonus: {
      type: Number
    },
    season: {
      type: String
    }
  },
  computed: {
    seasonLabel: function () {
      if (this.season) {
        return '+ ' + this.season
      } else {
        return null
      }
    }
  }
}
</script>

<style scoped>
.tags {
  display: inline-block;
  margin-bottom: 0 !important;
}
.tag {
  min-width: 2.2em;
  padding: 0.4em;
  color: #fff;
  line-height: 1em;
  height: auto;
  margin-bottom: 0 !important;
}
.season-tooltip {
  cursor: default;
}
@media (max-width: 768px) {
  .tag {
    padding: 0.3em 0.4em;
  }
}
.points-0 .tag {
  background-color: rgba(160, 160, 160, 1);
}
.points-1 .tag {
  background-color: rgba(77, 122, 32, 1);
}
.points-2 .tag {
  background-color: rgba(109, 165, 54, 1);
}
.points-4 .tag {
  background-color: rgba(174, 167, 39, 1);
}
.points-6 .tag {
  background-color: rgba(239, 168, 24, 1);
}
.points-8 .tag {
  background-color: rgba(220, 93, 4, 1);
}
.points-10 .tag {
  background-color: rgba(200, 16, 30, 1);
}
.points-1 .tag.bonus {
  background-color: rgba(51, 81, 21, 1);
}
.points-2 .tag.bonus {
  background-color: rgba(77, 116, 37, 1);
}
.points-4 .tag.bonus {
  background-color: rgba(125, 120, 28, 1);
}
.points-6 .tag.bonus {
  background-color: rgba(167, 115, 12, 1);
}
.points-8 .tag.bonus {
  background-color: rgba(150, 64, 3, 1);
}
.points-10 .tag.bonus {
  background-color: rgba(118, 10, 19, 1);
}
.tag.bonus {
  min-width: 0;
}
</style>
