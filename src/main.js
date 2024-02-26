import Vue from 'vue'
import App from './App.vue'
import router from './router'
import Buefy from 'buefy'
import VueSVGIcon from 'vue-svgicon'
import vueDebounce from 'vue-debounce'
import VueClipboard from 'vue-clipboard2'
import MatchMedia from 'vue-match-media/src'
import VueKeyCloak from '@dsb-norge/vue-keycloak-js'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faCheck, faCheckCircle, faInfoCircle, faExclamationTriangle, faExclamationCircle, faArrowUp, faPlus, faCheckDouble,
  faAngleRight, faAngleLeft, faAngleDown, faAngleUp, faEye, faEyeSlash, faCaretUp, faUpload, faLink, faHistory, faThList, faImages,
  faQuoteRight, faSearch, faMountains, faUser, faClock, faChevronCircleUp, faChevronCircleDown, faChartBar, faFileDownload,
  faExchange, faGlobe, faCalendarDay, faTrashAlt, faEdit, faClone, faCheckCircle as farCheckCircle, faArrowsH, faArrowsAlt,
  faSnowflake, faWindowMinimize, faWindowMaximize, faWindowClose, faExpandArrows, faLocation, faCalendarCheck, faComment, faSpinner,
  faBookUser } from '@fortawesome/pro-regular-svg-icons'
import { faMap, faCheckCircle as fasCheckCircle, faChevronCircleDown as fasChevronCircleDown, faChevronCircleUp as fasChevronCircleUp,
  faParking, faSquare, faBus, faHiking, faCircle, faCamera, faCameraHome, faVolume, faVolumeMute, faCog, faCaretDown as fasCaretDown,
  faLocationArrow as fasLocationArrow, faInfoCircle as fasInfoCircle } from '@fortawesome/pro-solid-svg-icons'
import { faWikipediaW, faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon, FontAwesomeLayers } from '@fortawesome/vue-fontawesome'
import '@/assets/global.css'
import store from './store'
import axios from 'axios'
import { SnackbarProgrammatic as Snackbar } from 'buefy/dist/components/snackbar'

library.add(faCheck, faCheckCircle, faInfoCircle, faExclamationTriangle, faExclamationCircle, faArrowUp, faPlus, faCheckDouble,
  faAngleRight, faAngleLeft, faAngleDown, faAngleUp, faEye, faEyeSlash, faCaretUp, faUpload, faLink, faHistory, faThList, faImages,
  faQuoteRight, faSearch, faMountains, faUser, faClock, faChevronCircleUp, faChevronCircleDown, faMap, faChartBar, faFileDownload,
  faExchange, faGlobe, faCalendarDay, faTrashAlt, faEdit, faClone, farCheckCircle, faArrowsH, faArrowsAlt,
  faSnowflake, faWindowMinimize, faWindowMaximize, faWindowClose, faExpandArrows, faLocation, faCalendarCheck, faComment, faSpinner,
  faBookUser)
library.add(faMap, fasCheckCircle, fasChevronCircleDown, fasChevronCircleUp, faParking, faSquare, faBus, faHiking, faCircle, faCamera,
  faCameraHome, faVolume, faVolumeMute, faCog, fasCaretDown, fasLocationArrow, fasInfoCircle)
library.add(faWikipediaW, faGoogle, faGithub)
Vue.component('font-awesome-icon', FontAwesomeIcon)
Vue.component('font-awesome-layers', FontAwesomeLayers)
Vue.use(VueSVGIcon)
Vue.use(vueDebounce)
Vue.use(VueClipboard)
Vue.use(Buefy, {
  defaultIconComponent: 'font-awesome-icon',
  defaultIconPack: 'far'
})
Vue.use(MatchMedia)

if (window.performance && performance.navigation.type === 1) {
  // Store last reload timestamp so user reloads can be detected despite SSO redirect
  sessionStorage.setItem('lastReload', new Date().getTime())
}

if (sessionStorage.getItem('wantSso') || localStorage.getItem('wantSso')) {
  Vue.use(VueKeyCloak, {
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
        startVue()
      }
    },
    onInitError: error => {
      console.error('Keycloak error: ' + error)
      startVue()
    },
    autoUpdateToken: false
  })
} else {
  startVue()
}

Vue.config.productionTip = false

// Axios error handling
let lastError = null
axios.interceptors.response.use(response => {
  return response
}, error => {
  if ((!lastError || new Date().getTime() - lastError > 9000) && (!error.response || error.response.status !== 404)) {
    Snackbar.open({
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

axios.post(process.env.VUE_APP_API_URL + '/mapsession', { type: 'init' })

function startVue () {
  new Vue({
    store,
    router,
    render: h => h(App),
    mq: {
      mobile: '(max-width: 768px)',
      desktop: '(min-width: 1024px)',
      widescreen: '(min-width: 1216px)',
      fullhd: '(min-width: 1408px)'
    }
  }).$mount('#app')
}
