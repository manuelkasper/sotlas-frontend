<template>
  <b-navbar wrapper-class="container" :fixed-top="true" :close-on-click="false" :isActive.sync="burgerActive">
    <template #brand>
      <b-navbar-item tag="router-link" to="/about">
        <img v-if="$mq.widescreen" src="../assets/sotlas.svg" alt="Logo">
        <img v-else src="../assets/sotlas-icon.svg" alt="Logo">
      </b-navbar-item>
      <b-navbar-item class="clock" tag="div">
        <font-awesome-icon :icon="['far', 'clock']" class="faicon" /> {{ clock }}
      </b-navbar-item>
      <b-navbar-item tag="router-link" to="/solar_history">
        <SolarData />
      </b-navbar-item>
    </template>
    <template #end>
      <b-navbar-item tag="div">
        <SearchField :query="query" @search="closeBurger" />
      </b-navbar-item>
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
          target: '/user_data',
          text: 'User Data'
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
