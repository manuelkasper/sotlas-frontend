<template>
  <file-pond name="photo" ref="filePond" class-name="box" :label-idle="labelIdle" :allow-multiple="true" :allow-replace="false" :allow-revert="false" :allow-paste="false" accepted-file-types="image/jpeg, image/png, image/heic" :server="uploadServer()" @processfile="onProcessFile" />
</template>

<script>
import vueFilePond from 'vue-filepond'
import prefs from '../mixins/prefs.js'
import { FileStatus } from 'filepond'
import 'filepond/dist/filepond.min.css'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
import api from '../mixins/api.js'
import axios from 'axios'

const FilePond = vueFilePond(FilePondPluginFileValidateType)

export default {
  props: {
    summitCode: String
  },
  components: {
    FilePond
  },
  prefs: {
    key: 'photosUploaderPrefs',
    props: ['gpsNotificationShown', 'resolutionWarningShown']
  },
  mixins: [api, prefs],
  computed: {
    labelIdle () {
      if (this.$mq.mobile) {
        return '<div>Tap to upload photos</div><div style="font-size: 0.7em">By uploading your photos, you allow SOTLAS to publish them. You can delete your photos at any time.</div>'
      } else {
        return '<div>Drag & Drop your photos or <span class="filepond--label-action">Browse</span> to upload</div><div style="font-size: 0.8em">By uploading your photos, you allow SOTLAS to publish them. You can delete your photos at any time.</div>'
      }
    }
  },
  methods: {
    uploadServer () {
      return {
        process: (fieldName, file, metadata, load, error, progress, abort, transfer, options) => {
          const CancelToken = axios.CancelToken
          const source = CancelToken.source()
          this.uploadPhoto(this.summitCode, file, e => progress(e.lengthComputable, e.loaded, e.total), source.token)
            .then(res => {
              load(res)

              if (res.data.length > 0 && !res.data[0].coordinates && !this.gpsNotificationShown) {
                this.$buefy.dialog.alert({
                  title: 'No GPS information',
                  message: '<p>Your photo has been uploaded successfully, but did not contain GPS coordinates in its metadata (Exif header). If possible, try uploading original full-resolution files from your camera, and use your computer instead of your mobile phone to upload the photos (as mobile browsers will often strip metadata while uploading).</p><p>SOTLAS will automatically reduce the resolution if needed, and will use the GPS coordinates to show the photos on the map if the position is accurate enough.</p><p><small>This alert will not appear again for future uploads with missing GPS information.</small></p>',
                  type: 'is-info',
                  hasIcon: true,
                  icon: 'info-circle',
                  iconPack: 'far'
                })
                this.gpsNotificationShown = true
              }

              if (res.data.length > 0 && res.data[0].width < 1600 && res.data[0].height < 1600 && !this.resolutionWarningShown) {
                this.$buefy.dialog.alert({
                  title: 'Low photo resolution',
                  message: '<p>Your photo has been uploaded successfully, but its resolution is quite low (< 1600 pixels width or height). Please upload original, full resolution photos whenever possible. SOTLAS will automatically resize them as appropriate.</p><p><small>This alert will not appear again for future uploads of low resolution photos.</small></p>',
                  type: 'is-info',
                  hasIcon: true,
                  icon: 'info-circle',
                  iconPack: 'far'
                })
                this.resolutionWarningShown = true
              }
            })
            .catch(err => {
              error(err)
            })

          return {
            abort () {
              source.cancel()
              abort()
            }
          }
        },
        fetch: null,
        revert: null
      }
    },
    onProcessFile () {
      // Check if any other uploads are pending
      if (this.$refs.filePond.getFiles().every(file => file.status === FileStatus.PROCESSING_COMPLETE)) {
        this.$emit('upload')
        this.$refs.filePond.removeFiles()
      }
    }
  },
  data () {
    return {
      gpsNotificationShown: false,
      resolutionWarningShown: false
    }
  }
}
</script>

<style scoped>
>>> .filepond--root {
  margin-bottom: 0;
}
>>> .filepond--panel-root {
  background-color: #f7f7f7;
}
</style>
