<template>
  <div v-if="attributes && Object.keys(attributes).length > 0" class="attribute-list">
    <ul>
      <li v-for="item in summitAttributes" :key="item.attribute"><div><svgicon :icon="item.icon" color="#555" />{{ item.text }}</div></li>
      <li v-if="attributes['mobileSignal'] !== undefined"><div><svgicon :icon="this.signalList[attributes['mobileSignal']].icon" :color="attributes['mobileSignal'] > 0 ? '#555' : '#aaa'" />{{ this.signalList[attributes['mobileSignal']].text }}</div></li>
    </ul>
    <div class="pole-support" v-if="attributes.poleSupport && attributes.poleSupport.length > 0">
      Pole support:
      <b-tooltip v-for="(val, key) in poleSupport" :key="key" :label="val.text" type="is-info" position="is-bottom"><svgicon :icon="val.icon" color="#555" /></b-tooltip>
    </div>
  </div>
</template>

<script>
import '../compiled-icons'

export default {
  name: 'SummitAttributes',
  props: ['attributes'],
  computed: {
    summitAttributes () {
      return this.attributeList.filter((attribute) => this.attributes[attribute.attribute] === true)
    },
    poleSupport () {
      return this.attributes.poleSupport.map(el => this.poleSupportList[el])
    }
  },
  data () {
    return {
      attributeList: [
        {
          attribute: 'driveUp',
          icon: 'icons8-car',
          text: 'Drive up'
        },
        {
          attribute: 'cableCar',
          icon: 'icons8-cable-car',
          text: 'Cable car/Funicular available'
        },
        {
          attribute: 'seating',
          icon: 'icons8-bench-filled',
          text: 'Seating/Bench'
        },
        {
          attribute: 'summitCross',
          icon: 'icons8-cross',
          text: 'Summit cross'
        },
        {
          attribute: 'summitBook',
          icon: 'icons8-open-book',
          text: 'Summit book'
        },
        {
          attribute: 'shelter',
          icon: 'icons8-home',
          text: 'Shelter'
        },
        {
          attribute: 'views',
          icon: 'icons8-binoculars',
          text: 'Views'
        }
      ],
      poleSupportList: {
        summitCross: {
          icon: 'icons8-cross',
          text: 'Summit cross'
        },
        bench: {
          icon: 'icons8-bench-filled',
          text: 'Bench'
        },
        signpost: {
          icon: 'icons8-signpost',
          text: 'Signpost'
        },
        cairn: {
          icon: 'icons8-rock',
          text: 'Cairn'
        },
        fencePost: {
          icon: 'icons8-fence',
          text: 'Fence post'
        }
      },
      signalList: [
        {
          icon: 'icons8-signal0',
          text: 'No signal'
        },
        {
          icon: 'icons8-signal1',
          text: 'Weak signal'
        },
        {
          icon: 'icons8-signal2',
          text: 'Average signal'
        },
        {
          icon: 'icons8-signal3',
          text: 'Good signal'
        }
      ]
    }
  }
}
</script>

<style scoped>
.attribute-list {
  margin: 0.5em 0;
  background: #f7f7f7;
  border-radius: 7px;
  padding: 0.4em 0.5em;
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
}
.svg-icon {
  vertical-align: bottom;
  margin-right: 0.4em;
  width: 1.5em;
  height: 1.5em;
}
.pole-support {
  margin-left: 0.2em;
  margin-top: 0.5em;
  border-top: 1px solid #ccc;
  padding-top: 0.5em;
}
.pole-support .svg-icon {
  margin-left: 0.3em;
  margin-right: 0;
}
.pole-support .b-tooltip {
  display: inline;
}
</style>
