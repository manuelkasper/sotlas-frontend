import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Buefy from 'buefy'
import MatchMedia from './matchmedia'
import VueKeyCloak from '@dsb-norge/vue-keycloak-js'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faCheck, faCheckCircle, faInfoCircle, faExclamationTriangle, faExclamationCircle, faArrowUp, faPlus, faCheckDouble,
  faAngleRight, faAngleLeft, faAngleDown, faAngleUp, faEye, faEyeSlash, faCaretUp, faUpload, faLink, faHistory, faThList, faImages,
  faQuoteRight, faSearch, faMountains, faUser, faClock, faChevronCircleUp, faChevronCircleDown, faChartBar, faFileDownload,
  faExchange, faGlobe, faCalendarDay, faTrashAlt, faEdit, faClone, faCheckCircle as farCheckCircle, faArrowsH, faArrowsAlt,
  faSnowflake, faWindowMinimize, faWindowMaximize, faWindowClose, faExpandArrows, faLocation, faCalendarCheck, faComment, faSpinner,
  faBookUser, faTimesCircle } from '@fortawesome/pro-regular-svg-icons'
import { faMap, faCheckCircle as fasCheckCircle, faChevronCircleDown as fasChevronCircleDown, faChevronCircleUp as fasChevronCircleUp,
  faParking, faSquare, faBus, faHiking, faCircle, faCamera, faCameraHome, faVolume, faVolumeMute, faCog, faCaretDown as fasCaretDown,
  faLocationArrow as fasLocationArrow, faInfoCircle as fasInfoCircle,
  faFlag, faEnvelope, faLayerGroup, faCity, faBuilding, faHome, faLandmark, faMapMarkerAlt, faUser as fasUser, faMountains as fasMountains,
  faLocation as fasLocation, faWater, faTree, faRoad } from '@fortawesome/pro-solid-svg-icons'
import { faWikipediaW, faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon, FontAwesomeLayers } from '@fortawesome/vue-fontawesome'
import '@/assets/global.css'
import store from './store'
import axios from 'axios'

library.add(faCheck, faCheckCircle, faInfoCircle, faExclamationTriangle, faExclamationCircle, faArrowUp, faPlus, faCheckDouble,
  faAngleRight, faAngleLeft, faAngleDown, faAngleUp, faEye, faEyeSlash, faCaretUp, faUpload, faLink, faHistory, faThList, faImages,
  faQuoteRight, faSearch, faMountains, faUser, faClock, faChevronCircleUp, faChevronCircleDown, faMap, faChartBar, faFileDownload,
  faExchange, faGlobe, faCalendarDay, faTrashAlt, faEdit, faClone, farCheckCircle, faArrowsH, faArrowsAlt,
  faSnowflake, faWindowMinimize, faWindowMaximize, faWindowClose, faExpandArrows, faLocation, faCalendarCheck, faComment, faSpinner,
  faBookUser, faTimesCircle)
library.add(faMap, fasCheckCircle, fasChevronCircleDown, fasChevronCircleUp, faParking, faSquare, faBus, faHiking, faCircle, faCamera,
  faCameraHome, faVolume, faVolumeMute, faCog, fasCaretDown, fasLocationArrow, fasInfoCircle,
  faFlag, faEnvelope, faLayerGroup, faCity, faBuilding, faHome, faLandmark, faMapMarkerAlt, fasUser, fasMountains,
  fasLocation, faWater, faTree, faRoad)
library.add(faWikipediaW, faGoogle, faGithub)

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)
app.component('font-awesome-layers', FontAwesomeLayers)
// Buefy 3 shifted its FontAwesome size table down one notch (default: fa-lg -> none,
// is-medium: 2x -> lg, is-large: 3x -> 2x; buefy/src/utils/icons.ts vs 0.8.20's
// icons.js), so every b-icon / input icon rendered ~25% smaller than on the Vue 2 site.
// Restore 0.8's table for the packs this app uses. Values are FontAwesomeIcon `size`
// props (no "fa-" prefix) because defaultIconComponent is set. `is-small` is left
// out on purpose: it is null in both tables, and Buefy's deep merge turns a null
// merged onto a null into `{}`, which would then be passed as the `size` prop.
const faSizes = { sizes: { default: 'lg', 'is-medium': '2x', 'is-large': '3x' } }
app.use(Buefy, {
  defaultIconComponent: 'font-awesome-icon',
  defaultIconPack: 'far',
  customIconPacks: { far: faSizes, fas: faSizes, fab: faSizes }
})
app.use(MatchMedia)
app.use(store)
app.use(router)

let mounted = false

if (window.performance && performance.navigation.type === 1) {
  // Store last reload timestamp so user reloads can be detected despite SSO redirect
  sessionStorage.setItem('lastReload', new Date().getTime())
}

if (sessionStorage.getItem('wantSso') || localStorage.getItem('wantSso')) {
  app.use(VueKeyCloak, {
    config: {
      realm: 'SOTA',
      url: 'https://sso.sota.org.uk/auth',
      clientId: 'sotlas'
    },
    init: {
      onLoad: 'check-sso',
      checkLoginIframe: false
    },
    onReady: keycloak => {
      if (sessionStorage.getItem('wantSsoLogin')) {
        sessionStorage.removeItem('wantSsoLogin')
        keycloak.login()
      } else {
        mountApp()
      }
    },
    onInitError: error => {
      console.error('Keycloak error: ' + error)
      mountApp()
    },
    autoUpdateToken: false
  })
} else {
  mountApp()
}

// Axios error handling
let lastError = null
axios.interceptors.response.use(response => {
  return response
}, error => {
  if (!error.config.ignoreError && (!lastError || new Date().getTime() - lastError > 9000) && (!error.response || error.response.status !== 404) && mounted) {
    app.config.globalProperties.$buefy.snackbar.open({
      duration: 9000,
      message: 'Network or server error while loading data, try again later',
      type: 'is-danger',
      position: 'is-bottom-left',
      queue: false
    })

    lastError = new Date().getTime()
  }

  return Promise.reject(error)
})

function mountApp () {
  app.mount('#app')
  mounted = true
}
