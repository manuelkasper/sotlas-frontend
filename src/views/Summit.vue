<template>
  <SummitDatabasePageLayout :association="association" :region="region" :summit="summit">
    <template v-slot:title>
      <h1 class="title is-size-1 is-size-3-mobile">
        {{ summit.name }}

        <div class="action-button">
          <b-field>
            <p class="control">
              <b-button :type="bookmarkButtonType" icon-left="bookmark" :outlined="!isBookmarkedActive" @click="toggleBookmark()" :disabled="!authenticated">Bookmark</b-button>
            </p>
          </b-field>
        </div>

        <div class="action-button">
          <b-field>
            <p class="control">
              <b-button type="is-info" size="is-small" outlined icon-left="plus" @click="addAlert()" :disabled="!authenticated">Alert</b-button>
            </p>
            <p class="control">
              <b-button type="is-info" size="is-small" outlined icon-left="plus" @click="addSpot()" :disabled="!authenticated">Spot</b-button>
            </p>
          </b-field>
        </div>
      </h1>
    </template>
    <template v-slot:subtitle>
      <p class="subtitle is-size-7-mobile">
        <span class="summit-info"><strong>{{ summit.code }}</strong></span>
        <span class="summit-info"><AltitudeLabel :altitude="summit.altitude" /></span>
        <span class="summit-info"><SummitPointsLabel class="points" :points="summit.points" :bonus="summit.bonusPoints" /> {{ summit.points > 1 ? 'points' : 'point' }}</span>
        <span v-if="activations !== null" class="summit-info"><font-awesome-icon :icon="['far', 'chevron-circle-up']" class="faicon" /> {{ activations.length }} {{ activations.length === 1 ? 'activation' : 'activations' }}<span v-if="myActivations && myActivations.length > 0"> ({{ myActivations.length }} by me)</span></span>
        <span v-if="myChases !== null && myChases.length > 0" class="summit-info"><font-awesome-icon :icon="['far', 'chevron-circle-down']" class="faicon" /> {{ myChases.length }} {{ myChases.length === 1 ? 'chase' : 'chases' }} by me</span>
        <span v-if="isComplete" class="summit-info"><font-awesome-icon :icon="['far', 'check-double']" class="faicon" /> Complete</span>
      </p>

      <b-message v-if="!isValid" type="is-warning" has-icon>
        This summit is currently not valid (valid from {{ summit.validFrom | formatActivationDate }} to {{ summit.validTo | formatActivationDate }}).
      </b-message>

      <b-message v-else-if="activations !== null && activations.length == 0" type="is-info" has-icon>
        No activations have been logged for this summit yet.
      </b-message>
    </template>

    <section class="section">
      <div class="container">

        <div class="columns">
          <div v-if="coverPhoto && !enlargeMap" class="photo-column column is-narrow">
            <div class="photo">
              <div style="text-align: center">
                <a v-if="coverPhoto.photo" href="#" @click="photoClicked(coverPhoto.photo)"><img :src="coverPhoto.src" /></a>
                <a v-else :href="coverPhoto.mediaLink" target="_blank"><img :src="coverPhoto.src" /></a>
              </div>
              <div v-if="coverPhoto.description" class="description">{{ coverPhoto.description }}</div>
              <div v-if="coverPhoto.attribution" class="attribution" v-html="coverPhoto.attribution"></div>
            </div>
          </div>
          <div v-if="!enlargeMap" class="column">
            <div>Coordinates: <Coordinates v-if="summit.coordinates" :latitude="summit.coordinates.latitude" :longitude="summit.coordinates.longitude" :reference="summit.code" /></div>
            <div>Locator: <span class="locator">{{ locator }}</span></div>
            <div v-if="$keycloak && $keycloak.authenticated && summit.coordinates">Distance/Bearing: <Bearing :latitude="summit.coordinates.latitude" :longitude="summit.coordinates.longitude" /></div>
            <div v-if="firstActivations">First activation:
              <span v-for="(activator, index) in firstActivations.activators" :key="activator.userId"><router-link :to="makeActivatorLinkUserId(activator.userId)"><strong>{{ activator.callsign }}</strong></router-link>{{ index !== firstActivations.activators.length - 1 ? ' & ' : '' }}</span>
            <span class="has-text-grey"> on {{ firstActivations.date | formatActivationDate }}</span></div>

            <SummitAttributes :attributes="summit.attributes" />

            <div v-if="authenticated">
              <h6 class="title is-6">Tags</h6>
              <div class="taginput-wrapper">
                <b-taginput v-model="summitTags" ref="summitTagInput" autocomplete open-on-focus allow-new :data="filteredSummitTagsExisting" :confirm-key-codes="[9,13,32,188]" @typing="getFilteredSummitTags" @input="onSummitTagsInput" size="is-small" rounded append-to-body />
              </div>
            </div>

            <template v-if="resources.length > 0">
              <h6 class="title is-6">Resources</h6>
              <ResourceList :resources="resources" />
            </template>

          </div>
          <div class="column">
            <MiniMap :class="{ map: true, enlarge: enlargeMap }" :summit="summit" :routes="routes" :canEnlarge="true" :isEnlarged="enlargeMap" :showInactiveSummits="!isValid" ref="map" @enlarge="toggleEnlargeMap" @photoClicked="photoClicked" />
            <div v-if="authenticated">
              <h6 class="title is-6">Notes</h6>
              <div>
                <b-input type="textarea" class="summit-notes" id="textarea-summit-notes" v-model="summitNotes" v-on:change="savePersonalSummitData" placeholder="Your personal summit notes" size="is-small" rows="3"></b-input>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="recentSpots.length > 0" class="section">
      <div class="container">
        <h4 class="title is-4">Recent spots</h4>
        <SpotsList class="auto-width" :data="recentSpots" :showSummitInfo="false" :paginated="false" />
      </div>
    </section>

    <section v-if="alerts.length > 0" class="section">
      <div class="container">
        <h4 class="title is-4">Alerts</h4>
        <AlertsList class="auto-width" :data="alerts" :showSummitInfo="false" :paginated="false" />
      </div>
    </section>

    <section v-if="routes.length > 0" class="section">
      <div class="container">
        <h4 class="title is-4">Routes</h4>
        <SummitRoutes :summit="summit" :routes="routes" @detailsOpen="routeDetailsOpen" @detailsClose="routeDetailsClose" @mapReposition="mapReposition" />
      </div>
    </section>

    <section v-if="summit" class="section">
      <div class="container">
        <h4 class="title is-4">Photos</h4>
        <SummitPhotos ref="summitPhotos" :summit="summit" :editable="true" :showWaypointButton="true" @photoDeleted="reloadPhotos" @photoEdited="reloadPhotos" @photosReordered="reloadPhotos" />

        <PhotosUploader v-if="$keycloak && $keycloak.authenticated" :summitCode="summitCode" @upload="reloadPhotos" />
        <div v-else class="uploader-placeholder box"><font-awesome-icon :icon="['far', 'images']" size="lg" /> Log in and upload your photos of this summit!</div>
      </div>
    </section>

    <section v-if="videos !== null && videos.length > 0" class="section">
      <div class="container">
        <h4 class="title is-4">Videos</h4>
        <SummitVideos :videos="videos" />
      </div>
    </section>

    <SummitActivations :summitCode="summitCode" :activations="activations" :myActivations="myActivations" :myChases="myChases" />

    <b-modal v-if="isAddAlertActive" :active="true" has-modal-card :can-cancel="['escape']" @close="isAddAlertActive = false">
      <EditAlert :defaultSummitCode="summitCode" />
    </b-modal>
    <b-modal v-if="isAddSpotActive" :active="true" has-modal-card :can-cancel="['escape']" @close="isAddSpotActive = false">
      <EditSpot :defaultSummitCode="summitCode" />
    </b-modal>
  </SummitDatabasePageLayout>
</template>

<script>
import axios from 'axios'
import utils from '../mixins/utils.js'
import smptracks from '../mixins/smptracks.js'
import coverphoto from '../mixins/coverphoto.js'
import Maidenhead from 'maidenhead'

import SummitDatabasePageLayout from '../components/SummitDatabasePageLayout.vue'
import MiniMap from '../components/MiniMap.vue'
import SummitActivations from '../components/SummitActivations.vue'
import SummitAttributes from '../components/SummitAttributes.vue'
import ResourceList from '../components/ResourceList.vue'
import SummitRoutes from '../components/SummitRoutes.vue'
import SummitPhotos from '../components/SummitPhotos.vue'
import SummitVideos from '../components/SummitVideos.vue'
import PhotosUploader from '../components/PhotosUploader.vue'
import Coordinates from '../components/Coordinates.vue'
import Bearing from '../components/Bearing.vue'
import SummitPointsLabel from '../components/SummitPointsLabel.vue'
import AltitudeLabel from '../components/AltitudeLabel.vue'
import SpotsList from '../components/SpotsList.vue'
import AlertsList from '../components/AlertsList.vue'
import EditAlert from '../components/EditAlert.vue'
import EditSpot from '../components/EditSpot.vue'
import HikrIcon from '../assets/hikr.png'
import SotatrailsIcon from '../assets/sotatrails.png'
import EventBus from '../event-bus'
import api from '../mixins/api.js'

export default {
  name: 'Summit',
  props: {
    summitCode: String
  },
  components: {
    SummitDatabasePageLayout, MiniMap, SummitActivations, SummitAttributes, ResourceList, SummitRoutes, SummitPhotos, SummitVideos, PhotosUploader, Coordinates, Bearing, SummitPointsLabel, AltitudeLabel, SpotsList, AlertsList, EditAlert, EditSpot
  },
  mixins: [api, utils, smptracks, coverphoto],
  computed: {
    locator () {
      if (!this.summit.coordinates) {
        return null
      }
      let summitMaidenhead = new Maidenhead(this.summit.coordinates.latitude, this.summit.coordinates.longitude, 3)
      return summitMaidenhead.locator
    },
    firstActivations () {
      if (!this.activations || this.activations.length === 0) {
        return null
      }

      let firstActivationDate = this.activations[this.activations.length - 1].activationDate
      let firstActivationCallsigns = []
      for (let i = this.activations.length - 1; i >= 0 && this.activations[i].activationDate === firstActivationDate; i--) {
        firstActivationCallsigns.push({
          callsign: this.activations[i].ownCallsign,
          userId: this.activations[i].userId
        })
      }
      firstActivationCallsigns.sort((a, b) => (a.callsign > b.callsign) ? 1 : -1)
      return { activators: firstActivationCallsigns, date: firstActivationDate }
    },
    region () {
      let regionCode = this.summitCode.substring(this.summitCode.indexOf('/') + 1, this.summitCode.indexOf('-'))
      if (!this.association || !this.association.regions) {
        return null
      }
      return this.association.regions.find((el) => {
        return el.code === regionCode
      })
    },
    isValid () {
      return this.isSummitValid(this.summit)
    },
    resources () {
      let resources = []
      if (this.summit.resources && this.summit.resources.sotatrails) {
        resources.push({
          iconImg: SotatrailsIcon,
          prefix: 'SOTA Trails',
          title: this.summit.name,
          suffix: this.summit.resources.sotatrails.details ? '(with report)' : '',
          url: this.summit.resources.sotatrails.url
        })
      }
      if (this.wikipediaPhoto) {
        resources.push({
          icon: 'wikipedia-w',
          iconPack: 'fab',
          prefix: 'Wikipedia',
          title: this.wikipediaPhoto.title,
          url: this.wikipediaPhoto.link
        })
      }
      if (this.summit.code && this.summit.code.match(/^(HB|OE|DL|DM)/)) {
        let hikrSummitName = this.summit.name.replace(/\/.*$/, '')
        resources.push({
          iconImg: HikrIcon,
          prefix: 'Hikr.org',
          title: hikrSummitName + ' (' + this.summit.altitude + ' m)',
          url: 'http://www.hikr.org/dir/?adv=1&piz_name=' + encodeURIComponent(hikrSummitName) + '&piz_height_min=' + (this.summit.altitude - 50) + '&piz_height_max=' + (this.summit.altitude + 50) + '&piz_type=peak&piz_order=piz_name&action=search'
        })
      }
      resources.push({
        icon: 'google',
        iconPack: 'fab',
        prefix: 'Google',
        title: this.summit.name,
        url: 'https://www.google.com/search?q=' + encodeURIComponent(this.summit.name)
      })
      if (this.summit.links) {
        this.summit.links.forEach(link => {
          resources.push({
            title: link.title,
            url: link.url,
            icon: 'link'
          })
        })
      }
      if (this.sotaResources) {
        resources = resources.concat(this.sotaResources)
      }
      return resources
    },
    recentSpots () {
      if (!this.summit.code) {
        return []
      }
      return this.$store.state.spots.filter(spot => {
        return (spot.summit.code === this.summit.code)
      })
    },
    alerts () {
      if (!this.summit.code) {
        return []
      }
      return this.$store.state.alerts.filter(alert => {
        return (alert.summit.code === this.summit.code)
      })
    },
    myActivations () {
      if (!this.activations || !this.myUserId) {
        return null
      }

      let myActivations = []
      this.activations.forEach(activation => {
        if (activation.userId === this.myUserId) {
          myActivations.push(activation)
        }
      })
      return myActivations
    },
    isComplete () {
      if (!this.myActivations || !this.myChases) {
        return null
      }

      return (this.myActivations.length > 0 && this.myChases.length > 0)
    },
    videos () {
      if (!this.sotaResources) {
        return null
      }

      // Look for YouTube links in resources
      let videos = []
      let youTubeUrlRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)(\S+)?$/
      this.sotaResources.forEach(resource => {
        let matches = youTubeUrlRegex.exec(resource.url)
        if (matches) {
          videos.push({
            src: 'https://www.youtube.com/embed/' + matches[5],
            author: resource.author,
            date: resource.date
          })
        }
      })
      return videos
    }
  },
  watch: {
    summitCode () {
      this.updateSummit()
    }
  },
  mounted () {
    this.updateSummit()
    EventBus.$on('navbarMenuOpened', this.navbarMenuOpened)
  },
  destroyed () {
    EventBus.$off('navbarMenuOpened', this.navbarMenuOpened)
  },
  methods: {
    updateSummit (force = false) {
      let loads = []
      this.activations = null
      this.myChases = null
      this.sotaResources = null
      this.enlargeMap = false
      this.$refs.map.resize()
      this.loadingComponent = this.$buefy.loading.open({ canCancel: true })

      let options = {}

      // Force reload?
      if (force ||
          (window.performance && performance.navigation.type === 1) ||
          (sessionStorage.getItem('lastReload') && (new Date().getTime() - sessionStorage.getItem('lastReload') < 10000))) {
        options.params = {
          t: new Date().getTime()
        }

        // Make a dummy POST to the summit URL to invalidate the browser's cache for future page loads
        axios.post('https://api.sotl.as/summits/' + this.summitCode)

        this.getPersonalSummitData(this.summitCode)
          .then(response => {
            const personalSummitData = response.data.summit

            this.isBookmarkedActive = personalSummitData.isBookmarked ? personalSummitData.isBookmarked : false
            this.summitNotes = personalSummitData.notes ? personalSummitData.notes : ''
            this.summitTags = personalSummitData.tags ? personalSummitData.tags : []
            this.toggleBookmarkButtonType()
          })

        this.getPersonalSummitTags().then(response => {
          this.summitTagsExisting = response.map(item => {
            return item.tag
          })
          this.filteredSummitTagsExisting = this.summitTagsExisting
        })
      }

      loads.push(axios.get('https://api.sotl.as/summits/' + this.summitCode, options)
        .then(response => {
          this.summit = response.data
          document.title = this.summit.name + ' (' + this.summit.code + ') - SOTLAS'
        })
        .catch(error => {
          if (error.response && error.response.status === 404) {
            this.$router.replace('/notfound')
          }
        }))

      loads.push(axios.get('https://api.sotl.as/associations/' + this.summitCode.substr(0, this.summitCode.indexOf('/')))
        .then(response => {
          this.association = response.data
        }))

      loads.push(axios.get('https://api2.sota.org.uk/api/activations/' + this.summitCode)
        .then(response => {
          this.activations = response.data
        }))

      loads.push(axios.get('https://api2.sota.org.uk/api/resources/' + this.summitCode)
        .then(response => {
          this.sotaResources = response.data.map(resource => {
            return {
              title: resource.title,
              url: resource.url ? resource.url : ('https://summits.sota.org.uk/article/' + resource.resourceId + '/view'),
              author: resource.callsign,
              date: resource.dateSubmitted,
              icon: resource.url ? 'link' : 'quote-right'
            }
          })
        }))

      if (this.myUserId) {
        loads.push(axios.get('https://api2.sota.org.uk/api/qsos/user-chases-by-summit/' + this.summitCode + '/' + this.myUserId)
          .then(response => {
            this.myChases = response.data
          }))
      }

      Promise.all(loads)
        .finally(() => {
          this.loadingComponent.close()
        })
    },
    reloadPhotos () {
      this.loadingComponent = this.$buefy.loading.open({ canCancel: false })

      // Make a dummy POST to the summit URL to invalidate the browser's cache for future page loads
      axios.post('https://api.sotl.as/summits/' + this.summitCode)

      axios.get('https://api.sotl.as/summits/' + this.summitCode, { params: { t: new Date().getTime() } })
        .then(response => {
          this.summit = response.data
        })
        .finally(() => {
          this.loadingComponent.close()
        })
    },
    toggleBookmarkButtonType () {
      this.bookmarkButtonType = this.isBookmarkedActive ? 'is-success' : 'is-info'
    },
    savePersonalSummitData () {
      this.postPersonalSummitData(
        this.summitCode,
        this.isBookmarkedActive,
        this.summitNotes,
        this.summitTags
      ).then(response => {
        this.toggleBookmarkButtonType()
      }).catch(error => {
        console.log(error)
      })
    },
    toggleBookmark () {
      this.isBookmarkedActive = !this.isBookmarkedActive
      this.savePersonalSummitData()
    },
    addAlert () {
      this.isAddAlertActive = true
    },
    addSpot () {
      this.isAddSpotActive = true
    },
    routeDetailsOpen (route) {
      this.$set(route, 'highlight', true)
    },
    routeDetailsClose (route) {
      this.$set(route, 'highlight', false)
    },
    mapReposition (coordinates) {
      if (coordinates) {
        this.$refs.map.easeTo([coordinates.longitude, coordinates.latitude], 14)
      }
    },
    toggleEnlargeMap () {
      this.enlargeMap = !this.enlargeMap
      this.$refs.map.resize()
    },
    photoClicked (photo) {
      this.$refs.summitPhotos.openPhoto(photo, true)
    },
    navbarMenuOpened () {
      this.enlargeMap = false
    },
    getFilteredSummitTags (input) {
      this.filteredSummitTagsExisting = this.summitTagsExisting
        .filter(element => {
          return !this.summitTags.includes(element)
        })
        .filter(element => {
          return element
            .toString()
            .toLowerCase()
            .indexOf(input.toLowerCase()) >= 0
        })
    },
    onSummitTagsInput () {
      this.filteredSummitTagsExisting = this.summitTagsExisting
        .filter(element => {
          return !this.summitTags.includes(element)
        })
      this.savePersonalSummitData()
    }
  },
  data () {
    return {
      summit: { attributes: {} },
      association: {},
      sotaResources: null,
      activations: null,
      myChases: null,
      isAddAlertActive: false,
      isAddSpotActive: false,
      enlargeMap: false,
      alwaysLoadWikipedia: true,
      isBookmarkedActive: false,
      bookmarkButtonType: 'is-info',
      summitNotes: null,
      summitTags: [],
      summitTagsExisting: [],
      filteredSummitTagsExisting: this.summitTagsExisting
    }
  }
}
</script>

<style scoped>
.map {
  width: 100%;
  height: 300px;
  border: 1px solid #ccc;
}
@media (min-width: 769px) {
  .map.enlarge {
    height: calc(100vh - 20rem);
  }
}
@media (max-width: 768px) {
  .map.enlarge {
    position: fixed;
    touch-action: manipulation;
    top: 3.25rem;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 100;
    height: calc(100vh - 3.25rem);
  }
}
.summit-info {
  display: inline-block;
}
.summit-info::after {
  content: '|';
  color: #ccc;
  padding: 0 0.4em;
}
.summit-info:last-child::after {
  content: '';
}
.summit-info .points {
  margin-right: 0.3em;
}
.summit-info .points >>> .tag {
  vertical-align: baseline;
  padding-top: 0.15em;
  padding-bottom: 0.15em;
  font-size: inherit;
}
.summit-info .faicon {
  margin-right: 0.1em;
  opacity: 0.5;
}

>>> .coordinates {
  font-weight: bold;
}
>>> .coordinates + .actions {
  margin-top: -0.375em;
  margin-bottom: -0.375em;
}
.locator {
  font-weight: bold;
}
.routes img.icon {
  width: 24px;
  height: 24px;
}
.subtitle {
  margin-top: 0.3rem;
}
.photo-column {
  padding: 0;
}
.photo {
  width: 320px;
  background-color: whitesmoke;
  margin-right: 0.5em;
  margin-top: 0.5em;
  padding: 0.75rem;
}
@media (min-width: 768px) and (max-width: 1407px) {
  .photo {
    width: 240px;
  }
}
@media (min-width: 1900px) {
  .photo {
    max-width: calc(322px + 1.5rem);
    width: calc((100vw - 1344px) / 2 - 50px);
    position: absolute;
    right: 1360px;
  }
}
.photo img {
  border: 1px solid #aaa;
  text-align: center;
}
.photo .description {
  font-size: 9pt;
  line-height: 1.4;
  color: #777;
  margin-top: 0.5em;
}
.photo a {
  color: #3f5da7;
}
.photo .attribution {
  font-size: 8pt;
  line-height: 1.4;
  font-style: italic;
  color: #777;
  text-align: right;
}
>>> .mapboxgl-canvas-container.mapboxgl-interactive {
  cursor: auto;
}
.uploader-placeholder {
  background: #f7f7f7;
  color: #999;
  height: 3em;
  border-radius: 0.5em;
  display: flex;
  justify-content: center;
  align-items: center;
}
.uploader-placeholder .fa-images {
  margin-right: 0.5em;
}
</style>
