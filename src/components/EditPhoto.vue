<template>
  <div class="modal-card" style="width: auto">
      <header class="modal-card-head">
          <p class="modal-card-title">Edit photo</p>
      </header>
      <section class="modal-card-body">
        <div class="thumb-view">
          <img class="thumb" :src="photoSrc(photo, 'thumb')" />

          <div class="image-info">
            <div>Original size: <strong>{{ photo.width }} x {{ photo.height }}</strong></div>
            <div v-if="photo.camera">Camera: <strong>{{ photo.camera }}</strong></div>
            <div v-if="photo.positioningError">GPS position accuracy: <strong>± {{ photo.positioningError }} m</strong></div>
            <b-checkbox v-model="isCover">Use as cover photo</b-checkbox>
          </div>
        </div>

        <b-field label="Description">
          <b-input type="textarea" class="title-area" v-model="title" />
        </b-field>

        <b-field label="Date/Time">
          <b-datetimepicker v-model="date" rounded editable placeholder="Click to select..." icon="calendar-day" :max-datetime="new Date()" append-to-body open-on-focus horizontal-time-picker />
        </b-field>

        <b-field grouped>
          <b-field label="Latitude">
            <b-input class="coord" v-model="latitude" placeholder="45.6789" />
          </b-field>
          <b-field label="Longitude">
            <b-input class="coord" v-model="longitude" placeholder="-56.789" />
          </b-field>
        </b-field>

        <b-field label="Direction" message="0° = North, 90° = East, 180° = South, 270° = West">
          <b-field>
            <b-input class="coord" v-model="direction" expanded />
            <p class="control">
              <span class="button is-static">°</span>
            </p>
          </b-field>
        </b-field>
      </section>
      <footer class="modal-card-foot">
        <button class="button" type="button" @click="$parent.close()">Cancel</button>
        <button class="button is-info" :disabled="!isInputValid" :loading="saving" @click="save">Save</button>
      </footer>
  </div>
</template>

<script>
import photos from '../mixins/photos.js'
import moment from 'moment'
import api from '../mixins/api.js'

export default {
  props: {
    summitCode: String,
    photo: Object
  },
  mixins: [photos, api],
  computed: {
    isInputValid () {
      if (this.latitude) {
        if (!this.longitude) {
          return false
        }
        let lat = parseFloat(this.latitude)
        if (lat < -90 || lat > 90) {
          return false
        }
      }
      if (this.longitude) {
        if (!this.latitude) {
          return false
        }
        let lon = parseFloat(this.longitude)
        if (lon < -180 || lon > 180) {
          return false
        }
      }
      if (this.direction) {
        let dir = parseFloat(this.direction)
        if (dir < 0 || dir > 360) {
          return false
        }
      }
      return true
    }
  },
  methods: {
    save () {
      let newData = {
        title: this.title,
        date: this.date ? moment(this.date).utcOffset(0, true).toDate() : null,
        isCover: this.isCover
      }
      if (this.latitude && this.longitude) {
        newData.coordinates = {
          latitude: parseFloat(this.latitude),
          longitude: parseFloat(this.longitude)
        }

        if (!this.photo.coordinates ||
            Math.abs(newData.coordinates.latitude - this.photo.coordinates.latitude) > 0.000001 ||
            Math.abs(newData.coordinates.longitude - this.photo.coordinates.longitude) > 0.000001) {
          // Latitude or longitude changed by user; set positioningError to 0
          newData.positioningError = 0
        } else {
          newData.positioningError = parseFloat(this.photo.positioningError)
        }

        newData.direction = parseFloat(this.direction)
      }
      this.saving = true
      this.editPhoto(this.summitCode, this.photo.filename, newData)
        .then(() => {
          this.$emit('photoEdited')
          this.$parent.close()
        })
        .finally(() => {
          this.saving = false
        })
    }
  },
  watch: {
    photo: {
      handler (newPhoto) {
        this.title = newPhoto.title
        if (newPhoto.date) {
          this.date = moment(newPhoto.date.replace('Z', '')).toDate()
        } else {
          this.date = null
        }
        if (newPhoto.coordinates) {
          this.latitude = newPhoto.coordinates.latitude
          this.longitude = newPhoto.coordinates.longitude
        } else {
          this.latitude = null
          this.longitude = null
        }
        this.direction = newPhoto.direction
        this.isCover = newPhoto.isCover
      },
      immediate: true
    },
    latitude (newLatitude) {
      // Catch comma separated lat/lon
      if (newLatitude.includes(',')) {
        let latlon = newLatitude.split(',')
        this.latitude = latlon[0].trim()
        this.longitude = latlon[1].trim()
      }
    }
  },
  data () {
    return {
      title: null,
      date: null,
      latitude: null,
      longitude: null,
      direction: null,
      isCover: null,
      saving: false
    }
  }
}
</script>

<style scoped>
.thumb {
  max-height: 96px;
  margin-right: 1em;
  border: 1px solid #e0e0e0;
}
.thumb-view {
  display: flex;
  margin-bottom: 1em;
}
.title-area >>> .textarea {
  min-height: 5em !important;
}
@media (max-width: 1023px) {
  >>> .datepicker .dropdown.is-mobile-modal .dropdown-menu {
    width: calc(100vw - 40px);
  }
}
@media (min-width: 769px) {
  .title-area >>> .textarea {
    min-width: 24em;
  }
  .image-info {
    font-size: 0.8em;
  }
}
.coord {
  max-width: 8em;
}
.image-info .checkbox {
  margin-top: 0.5em;
}
</style>
