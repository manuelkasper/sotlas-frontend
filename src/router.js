import Vue from 'vue'
import Router from 'vue-router'
import About from './views/About.vue'
import Settings from './views/Settings.vue'
import Map from './views/Map.vue'
import AssociationList from './views/AssociationList.vue'
import Association from './views/Association.vue'
import Region from './views/Region.vue'
import NotFound from './views/NotFound.vue'
import SearchAnything from './views/SearchAnything.vue'
import Activator from './views/Activator.vue'
import Activators from './views/Activators.vue'
import Summit from './views/Summit.vue'
import Activation from './views/Activation.vue'
import Spots from './views/Spots.vue'
import SotaSpots from './views/SotaSpots.vue'
import RBNSpots from './views/RBNSpots.vue'
import Alerts from './views/Alerts.vue'
import NewPhotos from './views/NewPhotos.vue'
import SolarHistory from './views/SolarHistory.vue'

Vue.use(Router)

let router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      redirect: to => {
        let path = localStorage.getItem('lastPath')
        if (path) {
          return path
        } else {
          return '/map'
        }
      }
    },
    {
      path: '/about',
      component: About
    },
    {
      path: '/settings',
      component: Settings
    },
    {
      path: '/map',
      component: Map
    },
    {
      path: '/map/summits/:summitCode([A-Z0-9]+/[A-Z0-9]{2}-\\d{3})',
      caseSensitive: true,
      component: Map,
      meta: { savePath: '/map' }
    },
    {
      path: '/map/summits/:summitCode([a-zA-Z0-9]+/[a-zA-Z0-9]{2}-\\d{3})',
      redirect: to => {
        return '/map/summits/' + to.params.summitCode.toUpperCase()
      }
    },
    {
      path: '/map/coordinates/:coordinates(-?\\d+\\.\\d+,-?\\d+\\.\\d+)/:zoom(\\d+\\.?\\d*)',
      component: Map,
      meta: { savePath: '/map' }
    },
    {
      path: '/map/regions/:region([A-Z0-9]{1,3}/[A-Z]{2})',
      component: Map,
      meta: { savePath: '/map' }
    },
    {
      path: '/search',
      component: SearchAnything,
      meta: { savePath: null }
    },
    {
      path: '/summits/',
      component: AssociationList,
      meta: { savePath: null }
    },
    {
      path: '/summits/:associationCode([A-Z0-9]+)',
      caseSensitive: true,
      component: Association,
      props: true,
      meta: { savePath: null }
    },
    {
      path: '/summits/:associationCode([a-zA-Z0-9]+)',
      redirect: to => {
        return '/summits/' + to.params.associationCode.toUpperCase()
      }
    },
    {
      path: '/summits/:regionCode([A-Z0-9]+/[A-Z0-9]{2})',
      caseSensitive: true,
      component: Region,
      props: true,
      meta: { savePath: null }
    },
    {
      path: '/summits/:regionCode([a-zA-Z0-9]+/[a-zA-Z0-9]{2})',
      redirect: to => {
        return '/summits/' + to.params.regionCode.toUpperCase()
      }
    },
    {
      path: '/summits/:summitCode([A-Z0-9]+/[A-Z0-9]{2}-\\d{3})',
      caseSensitive: true,
      component: Summit,
      props: true,
      meta: { savePath: null }
    },
    {
      path: '/summits/:summitCode([a-zA-Z0-9]+/[a-zA-Z0-9]{2}-\\d{3})',
      redirect: to => {
        return '/summits/' + to.params.summitCode.toUpperCase()
      }
    },
    {
      path: '/activations/:activationId',
      component: Activation,
      props: true,
      meta: { savePath: null }
    },
    {
      path: '/activators/',
      component: Activators,
      meta: { savePath: null }
    },
    {
      path: '/activators/:callsign([A-Z0-9/]+)',
      caseSensitive: true,
      component: Activator,
      props: true,
      meta: { savePath: null }
    },
    {
      path: '/activators/:callsign([a-zA-Z0-9/]+)',
      redirect: to => {
        return '/activators/' + to.params.callsign.toUpperCase()
      }
    },
    {
      path: '/spots',
      component: Spots,
      children: [
        {
          path: 'sotawatch',
          component: SotaSpots
        },
        {
          path: 'rbn',
          component: RBNSpots
        },
        {
          path: '',
          redirect: '/spots/sotawatch'
        }
      ]
    },
    {
      path: '/alerts',
      component: Alerts
    },
    {
      path: '/new_photos',
      component: NewPhotos
    },
    {
      path: '/solar_history',
      component: SolarHistory
    },
    {
      path: '*',
      component: NotFound,
      meta: { savePath: null }
    }
  ],
  scrollBehavior (to, from, savedPosition) {
    return new Promise(resolve => {
      if (savedPosition) {
        let lastMatchedRoute = to.matched[to.matched.length - 1]
        if (lastMatchedRoute.components.default.delayScroll) {
          this.app.$root.$once('triggerScroll', () => {
            resolve(savedPosition)
          })
        } else {
          resolve(savedPosition)
        }
      } else {
        resolve({ x: 0, y: 0 })
      }
    })
  }
})

router.afterEach((to, from) => {
  let lastMatchedRoute = to.matched[to.matched.length - 1]
  let path = lastMatchedRoute.path
  if (lastMatchedRoute.meta && lastMatchedRoute.meta.savePath !== undefined) {
    path = lastMatchedRoute.meta.savePath
  }
  if (path) {
    localStorage.setItem('lastPath', path)
  }
})

export default router
