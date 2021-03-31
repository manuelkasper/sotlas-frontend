<template>
  <div>
    <MglMarker :coordinates="photoCoordinates">
      <div slot="marker" class="marker-icon" @click="markerClicked">
        <font-awesome-layers slot="marker" class="fa-2x fa-fw">
          <font-awesome-icon v-if="photo.direction" class="direction" :icon="['fas', 'location-arrow']" :transform="{ rotate: photo.direction - 45 }" :style="{ color: photo.highlight ? '#bb0000' : undefined, display: photo.highlight ? 'block' : undefined }" />
          <font-awesome-icon icon="circle" :style="{ color: photo.highlight ? 'red' : undefined }" />
          <font-awesome-icon :icon="['fas', 'camera']" transform="shrink-7" :style="{ color: 'white' }" />
        </font-awesome-layers>
      </div>
      <MglPopup :closeButton="false" @added="popupAdded">
        <div class="thumbwrapper">
          <img class="thumb" :src="photoSrc(photo, 'thumb')" @click="$emit('photoClicked', photo)" />
          <div v-if="photo.title" class="caption">{{ photo.title }}</div>
        </div>
      </MglPopup>
    </MglMarker>
  </div>
</template>

<script>
import { MglMarker, MglPopup } from 'vue-mapbox'
import photos from '../mixins/photos.js'

export default {
  name: 'MapPhoto',
  props: {
    summit: Object,
    photo: Object
  },
  components: {
    MglMarker, MglPopup
  },
  mixins: [photos],
  computed: {
    photoCoordinates () {
      return [this.photo.coordinates.longitude, this.photo.coordinates.latitude]
    }
  },
  methods: {
    markerClicked (e) {
      e.hitMarker = true
    },
    popupAdded (popup) {
      popup.popup.options.focusAfterOpen = false
    }
  }
}
</script>

<style scoped>
.marker-icon {
  padding: 4px;
  cursor: pointer;
}
.thumbwrapper {
  max-width: 172px;
}
.thumb {
  max-height: 128px;
  vertical-align: bottom;
}
.caption {
  font-size: 0.75rem;
  margin-top: 0.3rem;
  line-height: 1.4;
  color: #555;
}
.direction {
  display: none;
  color: #777;
  transform: scale(1.8);
}
.marker-icon:hover .direction {
  display: block;
}
</style>
