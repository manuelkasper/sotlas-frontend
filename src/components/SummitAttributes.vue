<template>
  <div v-if="attributes && Object.keys(attributes).length > 0" class="attribute-list">
    <ul>
      <li v-for="item in attributes" :key="item.icon"><div><svgicon :icon="item.icon" color="#555" />{{ item.text }}</div></li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios'
import '../compiled-icons'

export default {
  name: 'SummitAttributes',
  props: {
    summitCode: String
  },
  mounted () {
    this.loadSummitTags()
  },
  watch: {
    summitCode () {
      this.loadSummitTags()
    }
  },
  computed: {
    attributes () {
      if (this.tagData === null) {
        return []
      }
      return this.tagData.map(tag => {
        return {
          icon: this.tagIconMap[tag.TagID],
          text: tag.Tooltip
        }
      })
    }
  },
  methods: {
    loadSummitTags () {
      if (!this.summitCode) {
        return
      }
      axios.get('https://api-db2.sota.org.uk/summits/tags/' + this.summitCode)
        .then(response => {
          this.tagData = response.data.filter(tag => { return tag.Active && this.tagIconMap[tag.TagID] })
        })
    }
  },
  data () {
    return {
      tagData: null,
      tagIconMap: {
        '1': 'icons8-car',
        '2': 'icons8-bus',
        '3': 'icons8-walking',
        '4': 'icons8-running',
        '5': 'icons8-trekking',
        '6': 'icons8-camping',
        '7': 'icons8-barrier',
        '8': 'icons8-4wd',
        '9': 'icons8-mountain-biking',
        '10': 'icons8-climbing',
        '11': 'icons8-wheelchair',
        '12': 'icons8-road'
      }
    }
  }
}
</script>

<style scoped>
.attribute-list {
  margin: 0.5em 0;
  background: #f7f7f7;
  border-radius: 7px;
  padding: 0.3em 0.5em;
  margin-left: -0.5em;
  display: inline-block;
}
.attribute-list ul li {
  margin: 0.2em 1em 0.2em 0;
  display: inline;
}
.attribute-list ul li:last-child {
  margin-right: 0;
}
.attribute-list ul li div {
  display: inline-block;
  margin-top: 0.1em;
  margin-bottom: 0.1em;
}
.svg-icon {
  vertical-align: bottom;
  margin-right: 0.4em;
  width: 1.5em;
  height: 1.5em;
}
</style>
