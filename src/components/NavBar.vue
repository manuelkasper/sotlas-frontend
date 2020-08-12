<template>
  <nav class="navbar is-fixed-top">
    <div class="container">
      <div class="navbar-brand">
        <div class="navbar-item">
          <router-link to="/about"><img src="../assets/sotlas.svg" alt="Logo"></router-link>
        </div>
        <div class="navbar-item clock">
          <font-awesome-icon :icon="['far', 'clock']" class="faicon" /> {{ clock }}
        </div>
        <a role="button" :class="{ 'navbar-burger': true, 'burger': true, 'is-active': burgerActive }" aria-label="menu" aria-expanded="false" data-target="navbarMenu" @click="burgerClicked">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>
      <div id="navbarMenu" :class="{ 'navbar-menu': true, 'is-active': burgerActive }">
        <div class="navbar-end">
          <div class="navbar-item">
            <SearchField :query="query" @search="closeBurger" />
          </div>
          <router-link v-for="link in links" :key="link.target" :to="link.target" :class="linkClass(link)" :title="link.title" @click.native="closeBurger">
            <b-icon v-if="link.icon" :pack="link.iconPack" :icon="link.icon" />
            {{ link.text }}
            <span v-if="!$mq.desktop">{{ link.mobileText }}</span>
          </router-link>
          <LoginButton @linkClicked="closeBurger" />
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import moment from 'moment'
import SearchField from '../components/SearchField.vue'
import LoginButton from '../components/LoginButton.vue'
import utils from '../mixins/utils.js'
import EventBus from '../event-bus'

export default {
  name: 'NavBar',
  mixins: [ utils ],
  components: {
    SearchField, LoginButton
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
    linkClass (link) {
      let classes = { 'navbar-item': true }
      if (this.$route.path.startsWith(link.target)) {
        classes['is-active'] = true
      }
      return classes
    },
    burgerClicked () {
      this.burgerActive = !this.burgerActive
    },
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
        },
        {
          target: '/activators',
          text: 'Activators'
        },
        {
          target: '/settings',
          mobileText: 'Settings',
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
a.navbar-item.is-active:not(:focus):not(:hover), .navbar-link.is-active:not(:focus):not(:hover) {
  background-color: whitesmoke;
}
.clock {
  opacity: 0.7;
  font-size: 1rem;
}
.clock .faicon {
  margin-right: 0.3em;
}
.navbar-brand .navbar-item {
  line-height: 1;
}
.navbar-menu .navbar-item span {
  vertical-align: middle;
}
</style>
