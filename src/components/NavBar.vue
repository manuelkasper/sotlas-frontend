<template>
  <b-navbar wrapper-class="container" :class="{ 'search-focused': searchFocused }" :fixed-top="true" :close-on-click="false" :isActive.sync="burgerActive">
    <template #brand>
      <b-navbar-item tag="router-link" to="/about">
        <img v-if="$mq.widescreen" src="../assets/sotlas.svg" alt="Logo">
        <img v-else src="../assets/sotlas-icon.svg" alt="Logo">
      </b-navbar-item>
      <b-navbar-item class="clock" tag="div">
        <font-awesome-icon :icon="['far', 'clock']" class="faicon" /> {{ clock }}
      </b-navbar-item>
      <b-navbar-item class="solar-data" tag="router-link" to="/solar_history">
        <SolarData />
      </b-navbar-item>
    </template>
    <template #start>
      <b-navbar-item tag="div">
        <SearchField class="search-field" :query="query" @search="closeBurger" @focus="searchFocused = true" @blur="searchFocused = false" />
      </b-navbar-item>
    </template>
    <template #end>
      <b-navbar-item v-for="link in links" tag="router-link" :key="link.target" :to="link.target" :title="link.title" @click.native="closeBurger">
        <b-icon v-if="link.icon" :pack="link.iconPack" :icon="link.icon" />
        {{ link.text }}
      </b-navbar-item>
      <b-navbar-dropdown label="More">
        <b-navbar-item v-for="link in moreLinks" tag="router-link" :key="link.target" :to="link.target" :title="link.title" @click.native="closeBurger">
          <b-icon v-if="link.icon" :pack="link.iconPack" :icon="link.icon" />{{ link.text }}
        </b-navbar-item>
      </b-navbar-dropdown>
      <b-navbar-item tag="div">
        <LoginButton @linkClicked="closeBurger" />
      </b-navbar-item>
    </template>
  </b-navbar>
</template>

<script>
import moment from 'moment'
import SearchField from '../components/SearchField.vue'
import LoginButton from '../components/LoginButton.vue'
import SolarData from '../components/SolarData.vue'
import utils from '../mixins/utils.js'
import EventBus from '../event-bus'

export default {
  name: 'NavBar',
  mixins: [ utils ],
  components: {
    SearchField, LoginButton, SolarData
  },
  props: {
    query: {
      type: String,
      default: ''
    }
  },
  mounted () {
    this.updateClock()
    this.clockInterval = setInterval(() => {
      this.updateClock()
    }, 1000)
  },
  watch: {
    burgerActive () {
      EventBus.$emit(this.burgerActive ? 'navbarMenuOpened' : 'navbarMenuClosed')
    }
  },
  destroyed () {
    clearInterval(this.clockInterval)
  },
  methods: {
    closeBurger () {
      this.burgerActive = false
    },
    updateClock () {
      let newClock = this.formatTime(moment.utc())
      if (newClock !== this.clock) {
        this.clock = newClock
      }
    }
  },
  computed: {
    links () {
      let mapLink = '/map'
      if (this.$route.path.match(/^\/summits\/\S+\/\S+-\d+$/)) {
        mapLink = this.$route.path.replace('/summits/', '/map/summits/')
      }
      return [
        {
          target: mapLink,
          text: 'Map'
        },
        {
          target: '/summits',
          text: 'Summits'
        },
        {
          target: '/spots',
          text: 'Spots'
        },
        {
          target: '/alerts',
          text: 'Alerts'
        }
      ]
    },
    moreLinks () {
      return [
        {
          target: '/new_photos',
          text: 'New Photos'
        },
        {
          target: '/activators',
          text: 'Activators'
        },
        {
          target: '/settings',
          text: 'Settings',
          title: 'Settings',
          icon: 'cog',
          iconPack: 'fas'
        }
      ]
    }
  },
  data () {
    return {
      burgerActive: false,
      searchFocused: false,
      clock: ''
    }
  }
}
</script>

<style scoped>
.navbar {
  background-color: #ddd;
  border-bottom: 1px solid #ccc;
}
@media print {
  .navbar {
    display: none;
  }
}
@media (max-width: 320px) {
  .navbar-brand img {
    max-height: 1.5rem;
  }
}
@media (max-width: 768px) {
  .navbar {
    font-size: 1rem !important;
  }
}
@media screen and (min-width: 1024px) and (max-width: 1440px) {
  .search-focused .clock, .search-focused .solar-data {
    display: none;
  }
}
.search-field {
  width: 26rem;
  max-width: calc(50vw - 24rem);
}
@media screen and (max-width: 1023px) {
  .search-field {
    width: 100%;
    max-width: 100%;
  }
}
@media screen and (min-width: 1024px) and (max-width: 1215px) {
  .search-field {
    max-width: calc(50vw - 21rem);
  }
  .search-focused .search-field {
    max-width: calc(50vw - 6rem);
  }
}
@media screen and (min-width: 1216px) and (max-width: 1439px) {
  .search-field {
    max-width: calc(50vw - 24rem);
  }
  .search-focused .search-field {
    max-width: calc(50vw - 6rem);
  }
}
@media screen and (min-width: 1440px) {
  .search-field {
    max-width: 26rem;
  }
}
.router-link-active:not(:focus):not(:hover) {
  background-color: whitesmoke;
}
.navbar-item .icon {
  margin-right: 0.25em !important;
  vertical-align: middle;
}
.clock {
  opacity: 0.7;
  font-size: 1rem;
}
.clock .faicon {
  margin-right: 0.3em;
}
</style>
