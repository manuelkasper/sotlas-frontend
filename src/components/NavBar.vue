<template>
  <b-navbar wrapper-class="container" :class="{ 'search-focused': searchFocused }" :fixed-top="true" :close-on-click="false" v-model="burgerActive">
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
      <b-navbar-item v-for="link in links" tag="router-link" :key="link.target" :to="link.target" :title="link.title" :active="link.active" @click="closeBurger">
        <b-icon v-if="link.icon" :pack="link.iconPack" :icon="link.icon" />
        {{ link.text }}
      </b-navbar-item>
      <b-navbar-dropdown label="More">
        <b-navbar-item v-for="link in moreLinks" tag="router-link" :key="link.target" :to="link.target" :title="link.title" :active="link.active" @click="closeBurger">
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
      EventBus.emit(this.burgerActive ? 'navbarMenuOpened' : 'navbarMenuClosed')
    }
  },
  unmounted () {
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
          text: 'Map',
          // vue-router 4's RouterLink only auto-highlights a link when the current
          // route's `matched` records include the link's own record (a strict
          // parent/child relationship) — Vue Router 3 instead did a plain string
          // prefix check on `path`, which is what made this "just work" before the
          // migration. /map, /map/summits/:summitCode etc. are separate sibling
          // routes in router.js (not nested via `children`), so router-link-active
          // never applies while browsing a /map/... sub-path; check the path prefix
          // ourselves and feed it to b-navbar-item's own `active` prop instead
          // (mapLink itself is dynamic above, so prefix-check the fixed '/map', not
          // mapLink).
          active: this.$route.path === '/map' || this.$route.path.startsWith('/map/')
        },
        {
          target: '/summits',
          text: 'Summits',
          // Same sibling-routes issue as Map: /summits/, /summits/:associationCode
          // etc. aren't nested under /summits in router.js.
          active: this.$route.path === '/summits' || this.$route.path.startsWith('/summits/')
        },
        {
          target: '/spots',
          text: 'Spots',
          // /spots' sub-routes ARE nested via router.js `children`, so
          // router-link-active already applies here; this is redundant but harmless.
          active: this.$route.path === '/spots' || this.$route.path.startsWith('/spots/')
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
          text: 'Activators',
          // Same sibling-routes issue as Map/Summits: /activators/,
          // /activators/:callsign etc. aren't nested under /activators.
          active: this.$route.path === '/activators' || this.$route.path.startsWith('/activators/')
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
/* .is-active is Buefy's own class from b-navbar-item's `active` prop (set explicitly
   in links()/moreLinks() above for routes vue-router 4 can't auto-highlight); keep
   .router-link-active too for the routes that ARE nested (e.g. /spots) where Buefy's
   `active` prop is redundant with vue-router's own class. Restrict to the <a> links:
   b-navbar-dropdown ("More") also puts `is-active` on its own root div while open,
   and that one should keep Bulma's dropdown styling. */
.router-link-active:not(:focus):not(:hover),
a.navbar-item.is-active:not(:focus):not(:hover) {
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
