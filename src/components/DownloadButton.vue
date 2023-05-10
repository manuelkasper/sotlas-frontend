<template>
  <div class="action-button download-button">
    <b-dropdown>
      <b-button slot="trigger" type="is-info" size="is-small" outlined icon-left="file-download" icon-right="angle-down">Download</b-button>
      <b-dropdown-item has-link><a :href="makeUrlForType('gpx')">GPX file</a></b-dropdown-item>
      <b-dropdown-item has-link><a :href="makeUrlForType('kml')">KML file</a></b-dropdown-item>
      <b-dropdown-item has-link><a :href="makeUrlForType('geojson')">GeoJSON file</a></b-dropdown-item>
      <b-dropdown-item separator />
      <b-dropdown-item custom disabled><b>Label options</b></b-dropdown-item>
      <b-dropdown-item custom><b-checkbox v-model="nameopts" native-value="name">Summit Name</b-checkbox></b-dropdown-item>
      <b-dropdown-item custom><b-checkbox v-model="nameopts" native-value="altitude">Summit Altitude</b-checkbox></b-dropdown-item>
      <b-dropdown-item custom><b-checkbox v-model="nameopts" native-value="points">Summit Points</b-checkbox></b-dropdown-item>
    </b-dropdown>
  </div>
</template>

<script>
export default {
  props: {
    exportUrlPrefix: String,
    exportUrlParams: {
      type: Object
    }
  },
  methods: {
    makeUrlForType (type) {
      let params = {}
      if (this.exportUrlParams !== null) {
        params = { ...this.exportUrlParams }
      }
      if (this.nameopts.length > 0) {
        params.nameopts = this.nameopts.join(',')
      }

      let url = this.exportUrlPrefix + '.' + type
      if (Object.keys(params).length > 0) {
        url += '?' + Object.entries(params).map(kv => kv.map(encodeURIComponent).join('=')).join('&')
      }
      return url
    }
  },
  data () {
    return {
      nameopts: []
    }
  }
}
</script>

<style scoped>
>>> .checkbox .control-label {
  white-space: nowrap;
}
</style>
