<template>
  <div>
    <MglMarker :coordinates="coordinates">
      <div slot="marker" class="marker-icon" @click="markerClicked">
        <font-awesome-layers slot="marker" class="fa-2x fa-fw">
          <font-awesome-icon icon="circle" />
          <font-awesome-icon :icon="['fas', 'camera-home']" transform="shrink-7 left-0.5" :style="{ color: 'white' }" />
        </font-awesome-layers>
        <div v-if="webcam.clusterSize > 1" class="clustersize">+{{ webcam.clusterSize - 1 }}</div>
      </div>
      <MglPopup :closeButton="false" @added="popupAdded" @open="popupOpened" @close="popupClosed">
        <div :class="['thumbwrapper', size]">
          <a :href="thumbnailHref" target="_blank">
            <img v-if="isPopupOpen && thumbnailSrc" class="thumb" :src="thumbnailSrc" />
            <div v-else class="thumb-placeholder">
              <font-awesome-icon :icon="['far', 'spinner']" spin />
              <span>Loading...</span>
            </div>
          </a>
          <div class="caption">{{ title }}</div>
          <template v-if="webcam.clusterSize > 1 && size != 'is-small'">
            <div class="clustercaption">{{ webcam.clusterSize - 1 }} more webcam{{ webcam.clusterSize > 2 ? 's' : '' }}</div>
            <div class="clusterinfo">zoom in to view</div>
          </template>
          <div class="attribution">Webcams provided by <a href="https://www.windy.com/" target="_blank">windy.com</a></div>
        </div>
      </MglPopup>
    </MglMarker>
  </div>
</template>

<script>
import { MglMarker, MglPopup } from 'vue-mapbox'

export default {
  name: 'MapWebcam',
  props: {
    webcam: Object,
    size: String
  },
  components: {
    MglMarker, MglPopup
  },
  data() {
    return {
      isPopupOpen: false
    }
  },
  computed: {
    coordinates () {
      return [this.webcam.location.longitude, this.webcam.location.latitude]
    },
    title () {
      return this.webcam.title
    },
    thumbnailSrc () {
      return this.$store.state.mapOptions.webcamsType === 'current' ? this.webcam.images.current.preview : this.webcam.images.daylight.preview
    },
    thumbnailHref () {
      return 'https://www.windy.com/webcams/' + this.webcam.webcamId
    }
  },
  methods: {
    markerClicked (e) {
      e.hitMarker = true
    },
    popupAdded (popup) {
      popup.popup.options.focusAfterOpen = false
    },
    popupOpened () {
      this.isPopupOpen = true
    },
    popupClosed () {
      this.isPopupOpen = false
    }
  }
}
</script>

<style scoped>
.marker-icon {
  padding: 4px;
  cursor: pointer;
}
.clustersize {
  display: none;
  position: absolute;
  left: 60%;
  top: 60%;
  font-size: 0.75rem;
  background-color: #1759bd;
  padding: 0 0.3em;
  border-radius: 1em;
  color: white;
}
.marker-icon:hover .clustersize {
  display: block;
}
.clustercaption {
  display: inline-block;
  font-size: 0.75rem;
  background-color: #1759bd;
  padding: 0 0.5em;
  border-radius: 1em;
  color: white;
  margin-top: 0.3em;
  margin-bottom: 0.3em;
}
.clusterinfo {
  display: inline-block;
  font-size: 0.7rem;
  color: #777;
  margin-left: 0.5em;
  font-style: italic;
}
.thumbwrapper {
  max-width: min(50vw, 300px);
}
.thumbwrapper.is-small {
  max-width: 172px;
}
.thumb {
  vertical-align: bottom;
}
.thumb-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 120px;
  background-color: #f5f5f5;
  color: #666;
  font-size: 0.8rem;
  gap: 0.5rem;
}
.caption {
  font-size: 0.75rem;
  margin-top: 0.3rem;
  line-height: 1.4;
  color: #555;
}
.attribution {
  font-size: 0.7rem;
  line-height: 1.4;
  font-style: italic;
  color: #777;
  text-align: right;
}
</style>
