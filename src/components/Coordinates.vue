<template>
  <span class="wrapper">
    <span class="coordinates">{{ latitude }}, {{ longitude }}</span>
    <div class="actions">
      <b-field>
        <p class="control">
          <b-dropdown aria-role="list">
            <b-button type="is-info" outlined size="is-small" icon-right="angle-down" slot="trigger">
              Open
            </b-button>

            <b-dropdown-item v-for="action in filteredActions" :key="action.name" :has-link="true" aria-role="listitem"><a :href="action.url()" target="_blank">{{ action.name }}</a></b-dropdown-item>
          </b-dropdown>
        </p>
        <p class="control">
          <b-button type="is-info" outlined size="is-small" v-clipboard:copy="latitude + ',' + longitude" v-clipboard:success="onCopySuccess" v-clipboard:error="onCopyError">Copy</b-button>
        </p>
        <p v-if="haveAz" class="control">
          <b-dropdown>
            <b-button slot="trigger" type="is-info" outlined size="is-small" icon-left="file-download" icon-right="angle-down">AZ</b-button>
            <b-dropdown-item custom disabled><b>Activation zone</b></b-dropdown-item>
            <b-dropdown-item has-link><a :href="makeAzUrlForType('gpx')">GPX file</a></b-dropdown-item>
            <b-dropdown-item has-link><a :href="makeAzUrlForType('geojson')">GeoJSON file</a></b-dropdown-item>
          </b-dropdown>
        </p>
      </b-field>
    </div>
    <div v-if="showMaidenhead" class="locator">Locator: {{ maidenhead }}</div>
    <div v-if="showElevation" class="elevation">Elevation: <span v-if="elevation"><AltitudeLabel :altitude="elevation" /> (approx.)</span><font-awesome-icon v-else :icon="['far', 'spinner']" spin /></div>
  </span>
</template>

<script>
import Maidenhead from 'maidenhead'
import axios from 'axios'
import AltitudeLabel from './AltitudeLabel.vue'
import proj4 from 'proj4'

export default {
  name: 'Coordinates',
  components: { AltitudeLabel },
  props: {
    latitude: Number,
    longitude: Number,
    altitude: Number,
    reference: String,
    showMaidenhead: Boolean,
    showElevation: Boolean
  },
  computed: {
    filteredActions () {
      return this.actions.filter(action => {
        return (action.url() !== undefined)
      })
    },
    maidenhead () {
      let loc = new Maidenhead(this.latitude, this.longitude, 4)
      return loc.locator
    }
  },
  mounted () {
    this.loadElevation()
    this.checkAz()
  },
  created () {
    proj4.defs('EPSG:29900', '+proj=tmerc +lat_0=53.5 +lon_0=-8 +k=1.000035 +x_0=200000 +y_0=250000 +ellps=mod_airy +towgs84=482.5,-130.6,564.6,-1.042,-0.214,-0.631,8.15 +units=m +no_defs')
    proj4.defs('EPSG:3812', '+proj=lcc +lat_1=49.83333333333334 +lat_2=51.16666666666666 +lat_0=50.797815 +lon_0=4.359215833333333 +x_0=649328 +y_0=665262 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')
    proj4.defs('EPSG:3111', '+proj=lcc +lat_1=-36 +lat_2=-38 +lat_0=-37 +lon_0=145 +x_0=2500000 +y_0=2500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')
    proj4.defs('EPSG:5316', '+proj=tmerc +lat_0=0 +lon_0=-7 +k=0.999997 +x_0=200000 +y_0=-6000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')
    proj4.defs('EPSG:3346', '+proj=tmerc +lat_0=0 +lon_0=24 +k=0.9998 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')
    proj4.defs('EPSG:3057', '+proj=lcc +lat_1=64.25 +lat_2=65.75 +lat_0=65 +lon_0=-19 +x_0=500000 +y_0=500000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')
    proj4.defs('EPSG:3059', '+proj=tmerc +lat_0=0 +lon_0=24 +k=0.9996 +x_0=500000 +y_0=-6000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')
    proj4.defs('EPSG:2056', '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs')
    proj4.defs('EPSG:2039', '+proj=tmerc +lat_0=31.73439361111111 +lon_0=35.20451694444445 +k=1.0000067 +x_0=219529.584 +y_0=626907.39 +ellps=GRS80 +towgs84=-48,55,52,0,0,0,0 +units=m +no_defs')
    proj4.defs('EPSG:3006', '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')
    proj4.defs('EPSG:25832', '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')
  },
  watch: {
    latitude () {
      this.loadElevation()
    },
    longitude () {
      this.loadElevation()
    },
    reference () {
      this.checkAz()
    }
  },
  methods: {
    onCopySuccess () {
      this.$buefy.toast.open({
        message: 'Coordinates copied to clipboard',
        type: 'is-info'
      })
    },
    onCopyError () {
      this.$buefy.toast.open({
        message: 'Could not copy coordinates to clipboard',
        type: 'is-danger'
      })
    },
    loadElevation () {
      this.elevation = null
      if (!this.latitude || !this.longitude || !this.showElevation) {
        return
      }
      axios.post(import.meta.env.VITE_ELEVATION_API_URL, [[this.latitude, this.longitude]])
        .then(result => {
          this.elevation = Math.round(result.data[0])
        })
    },
    convertLatLonToGrid (lat, lon, epsg) {
      let inp = [lon, lat]
      return proj4(epsg, inp)
    },
    checkAz () {
      if (!this.reference) {
        return
      }
      axios.head(this.makeAzUrlForType('gpx'), { ignoreError: true })
        .then(response => {
          if (response.status === 200) {
            this.haveAz = true
          } else {
            this.haveAz = false
          }
        })
        .catch(e => {
          this.haveAz = false
        })
    },
    makeAzUrlForType (type) {
      return import.meta.env.VITE_AZ_URL + '/' + this.reference.replace('-', '/') + '.' + type
    }
  },
  data () {
    return {
      elevation: null,
      haveAz: false,
      actions: [
        {
          name: 'Geoportail (FR)',
          url: () => {
            if (this.reference && this.reference.match('^F[LKR]*/')) {
              return `https://www.geoportail.gouv.fr/carte?c=${this.longitude},${this.latitude}&z=15&l0=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.STANDARD::GEOPORTAIL:OGC:WMTS(1)&l1=GEOGRAPHICALGRIDSYSTEMS.PLANIGN::GEOPORTAIL:OGC:WMTS(1)&l2=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR::GEOPORTAIL:OGC:WMTS(1)&l3=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2::GEOPORTAIL:OGC:WMTS(1)&l4=GEOGRAPHICALGRIDSYSTEMS.MAPS::GEOPORTAIL:OGC:WMTS(1)&permalink=yes`
            }
          }
        },
        {
          name: 'IGN',
          url: () => {
            if (this.reference && this.reference.match('^(EA[1-9]|ZB2)/')) {
              let p = this.convertLatLonToGrid(this.latitude, this.longitude, 'EPSG:3857')
              return `https://componentes.cnig.es/api-core/?center=${p[0]},${p[1]}&zoom=16&controls=scale*true&plugins=toc,zoompanel,measurebar,mousesrs&layers=WMTS*https://www.ign.es/wmts/mapa-raster?*MTN*GoogleMapsCompatible*Map*false*image/jpeg*false*false*true&projection=EPSG:3857*m`
            }
          }
        },
        {
          name: 'GSI Maps',
          url: () => {
            if (this.reference && this.reference.match('^JA[568]*/')) {
              return `https://maps.gsi.go.jp/#16/${this.latitude}/${this.longitude}/`
            }
          }
        },
        {
          name: 'Norgeskart',
          url: () => {
            if (this.reference && this.reference.match('^LA/')) {
              return `https://www.norgeskart.no/#!?project=norgeskart&layers=1004&zoom=12&sok=${this.latitude},${this.longitude}`
            }
          }
        },
        {
          name: 'TopoMap NZ',
          url: () => {
            if (this.reference && this.reference.match('^ZL[13789]/')) {
              return `https://www.topomap.co.nz/NZTopoMap?v=2&ll=${this.latitude},${this.longitude}&z=15`
            }
          }
        },
        {
          name: 'CalTopo (NA)',
          url: () => {
            if (this.reference && this.reference.match('^[WK]|^VE|^XE')) {
              return `https://caltopo.com/map.html#ll=${this.latitude},${this.longitude}&z=15&b=t&o=f16a%2Cr&n=1,0.25`
            }
          }
        },
        {
          name: 'Geoportal Bayern',
          url: () => {
            if (this.reference && this.reference.match('^(DL/|DM/BM)')) {
              let p = this.convertLatLonToGrid(this.latitude, this.longitude, 'EPSG:25832')
              return `https://geoportal.bayern.de/bayernatlas/index.html?zoom=12&lang=de&topic=ba&bgLayer=tk&E=${p[0]}&N=${p[1]}&catalogNodes=122`
            }
          }
        },
        {
          name: 'maps.rlp.de',
          url: () => {
            if (this.reference && this.reference.match('^DM/RP')) {
              let p = this.convertLatLonToGrid(this.latitude, this.longitude, 'EPSG:25832')
              return `https://maps.rlp.de/?layerIDs=152,3&visibility=true,true&transparency=0,0&center=${p[0]},${p[1]}&zoomlevel=8`
            }
          }
        },
        {
          name: 'Karten des BKG',
          url: () => {
            if (this.reference && this.reference.match('^D[LM]/')) {
              let p = this.convertLatLonToGrid(this.latitude, this.longitude, 'EPSG:25832')
              return `https://sg.geodatenzentrum.de/web_bkg_webmap/applications/bkgmaps/minimal.html?zoom=11&lat=${p[1]}&lon=${p[0]}&layers=B000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFT`
            }
          }
        },
        {
          name: 'UK OS Map (Bing)',
          url: () => {
            if (this.reference && this.reference.match('^G$|^G[^IJU]+')) {
              return `https://www.bing.com/maps?osid=93955629-66b5-4407-9864-aff11618f451&cp=${this.latitude}~${this.longitude}&lvl=15&style=s&v=2&sV=2&form=S00027`
            }
          }
        },
        {
          name: 'OSNI',
          url: () => {
            if (this.reference && this.reference.match('^GI/')) {
              let p = this.convertLatLonToGrid(this.latitude, this.longitude, 'EPSG:29900')
              return `https://maps.spatialni.gov.uk/?marker=${p[0]},${p[1]},29900,g,,g&level=7`
            }
          }
        },
        {
          name: 'Geoportail (LX)',
          url: () => {
            if (this.reference && this.reference.match('^LX/')) {
              let p = this.convertLatLonToGrid(this.latitude, this.longitude, 'EPSG:3857')
              return `https://map.geoportail.lu/theme/main?version=3&zoom=16&X=${p[0]}&Y=${p[1]}&lang=fr&rotation=0&layers=206&opacities=1&bgLayer=blank`
            }
          }
        },
        {
          name: 'Geoportal (LT)',
          url: () => {
            if (this.reference && this.reference.match('^LY/')) {
              let p = this.convertLatLonToGrid(this.latitude, this.longitude, 'EPSG:3346')
              return `https://www.geoportal.lt/map/#s=3346&x=${p[0]}&y=${p[1]}&l=8&b=default`
            }
          }
        },
        {
          name: 'SK Geodesy',
          url: () => {
            if (this.reference && this.reference.match('^OM/')) {
              return `https://zbgis.skgeodesy.sk/mkzbgis?bm=zbgis&z=16&c=${this.longitude},${this.latitude}#`
            }
          }
        },
        {
          name: 'NGI',
          url: () => {
            if (this.reference && this.reference.match('^ON/')) {
              let p = this.convertLatLonToGrid(this.latitude, this.longitude, 'EPSG:3812')
              return `https://topomapviewer.ngi.be/?l=en&x=${p[0]}&y=${p[1]}&zoom=9&baseLayer=classic.maps`
            }
          }
        },
        {
          name: 'Austrian Map',
          url: () => {
            if (this.reference && this.reference.match('^OE/')) {
              return `https://maps.bev.gv.at/#/center/${this.longitude},${this.latitude}/zoom/13`
            }
          }
        },
        {
          name: 'Basemap.at',
          url: () => {
            if (this.reference && this.reference.match('^OE/')) {
              let p = this.convertLatLonToGrid(this.latitude, this.longitude, 'EPSG:3857')
              return `https://stp.wien.gv.at/basemap/#{%22center%22:[${p[0]},${p[1]}],%22zoom%22:16,%22rotation%22:0,%22layers%22:%220100000000%22}`
            }
          }
        },
        {
          name: 'Føroyakort',
          url: () => {
            if (this.reference && this.reference.match('^OY/')) {
              let p = this.convertLatLonToGrid(this.latitude, this.longitude, 'EPSG:5316')
              return `https://kort.foroyakort.fo/kort/?center=${p[0]},${p[1]},5316&level=9`
            }
          }
        },
        {
          name: 'Kortasjá',
          url: () => {
            if (this.reference && this.reference.match('^TF/')) {
              let p = this.convertLatLonToGrid(this.latitude, this.longitude, 'EPSG:3057')
              return `https://kortasja.lmi.is/mapview/?application=kortasja&lang=is&center=${p[0]},${p[1]}&zoom=11&layers=219,225,228,286,221 X`
            }
          }
        },
        {
          name: 'SIXmaps',
          url: () => {
            if (this.reference && this.reference.match('^VK[12]/')) {
              let p = this.convertLatLonToGrid(this.latitude, this.longitude, 'EPSG:3857')
              return `https://portal.spatial.nsw.gov.au/portal/apps/webappviewer/index.html?center=${p[0]},${p[1]},102100&level=16`
            }
          }
        },
        {
          name: 'MapshareVIC',
          url: () => {
            if (this.reference && this.reference.match('^VK3/')) {
              let p = this.convertLatLonToGrid(this.latitude, this.longitude, 'EPSG:3111')
              return `https://mapshare.vic.gov.au/MapshareVic/?layerTheme=5&scale=3000&basemap=bWFwc2NhcGUgY29sb3Vy&center=${p[0]},${p[1]}`
            }
          }
        },
        {
          name: 'QTopo',
          url: () => {
            if (this.reference && this.reference.match('^VK4/')) {
              let p = this.convertLatLonToGrid(this.latitude, this.longitude, 'EPSG:3857')
              return `https://qtopo.information.qld.gov.au/?center=${p[0]},${p[1]},102100&level=16`
            }
          }
        },
        {
          name: 'LocationSA',
          url: () => {
            if (this.reference && this.reference.match('^VK5/')) {
              return `https://location.sa.gov.au/viewer/?map=topographic&x=${this.longitude}&y=${this.latitude}&z=16&uids=&pinx=${this.longitude}&piny=${this.latitude}&pinTitle=&pinText=%%sumCode%%`
            }
          }
        },
        {
          name: 'LGIA',
          url: () => {
            if (this.reference && this.reference.match('^YL/')) {
              let p = this.convertLatLonToGrid(this.latitude, this.longitude, 'EPSG:3059')
              return `https://kartes.lgia.gov.lv/karte/?x=${p[1]}&y=${p[0]}&lx=5565.0&ly=3130.313&l=1,8,9,10,13,14,15,40,51,62,63,64,65,66,67,68,69,70`
            }
          }
        },
        {
          name: 'Govmap',
          url: () => {
            if (this.reference && this.reference.match('^4X/')) {
              let p = this.convertLatLonToGrid(this.latitude, this.longitude, 'EPSG:2039')
              return `https://www.govmap.gov.il/?c=${p[0]},${p[1]}&z=4&b=9`
            }
          }
        },
        {
          name: 'Geoportal (HR)',
          url: () => {
            if (this.reference && this.reference.match('^9A/')) {
              return `https://geoportal.dgu.hr/#/?lng=${this.longitude}&lat=${this.latitude}&zoom=7`
            }
          }
        },
        {
          name: 'swisstopo',
          url: () => {
            if (this.latitude >= 45.7 && this.latitude <= 47.85 && this.longitude >= 5.9 && this.longitude <= 10.9) {
              return `https://map.geo.admin.ch/?swisssearch=${this.latitude},${this.longitude}`
            }
          }
        },
        {
          name: 'TopoSvalbard',
          url: () => {
            if (this.latitude >= 74.117 && this.latitude <= 80.948 && this.longitude >= 7.338 && this.longitude <= 33.631) {
              return `https://toposvalbard.npolar.no/?lat=${this.latitude.toFixed(6)}&long=${this.longitude.toFixed(6)}&zoom=8&layer=map`
            }
          }
        },
        {
          name: 'TopoJanMayen',
          url: () => {
            if (this.latitude >= 70.795 && this.latitude <= 71.175 && this.longitude >= -9.253 && this.longitude <= -7.838) {
              return `https://topojanmayen.npolar.no/?lat=${this.latitude.toFixed(6)}&long=${this.longitude.toFixed(6)}&zoom=8&layer=map`
            }
          }
        },
        {
          name: 'Min Karta',
          url: () => {
            if (this.reference && this.reference.match('^SM/')) {
              let p = this.convertLatLonToGrid(this.latitude, this.longitude, 'EPSG:3006')
              return `https://minkarta.lantmateriet.se/plats/3006/v1.0/?e=${p[0].toFixed(0)}&n=${p[1].toFixed(0)}&z=10`
            }
          }
        },
        {
          name: 'Google Maps',
          url: () => {
            return `https://www.google.com/maps/search/?api=1&query=${this.latitude},${this.longitude}`
          }
        },
        {
          name: 'Bing Maps',
          url: () => {
            return `https://www.bing.com/maps?cp=${this.latitude}~${this.longitude}&lvl=15&style=s&v=2`
          }
        },
        {
          name: 'Gaia GPS',
          url: () => {
            return `https://www.gaiagps.com/map/?loc=14/${this.longitude}/${this.latitude}`
          }
        },
        {
          name: 'Mapy.cz',
          url: () => {
            return `https://en.mapy.cz/turisticka?x=${this.longitude}&y=${this.latitude}&z=17`
          }
        },
        {
          name: 'OpenStreetMap',
          url: () => {
            return `https://www.openstreetmap.org/#map=16/${this.latitude}/${this.longitude}`
          }
        },
        {
          name: 'OpenTopoMap',
          url: () => {
            return `https://www.opentopomap.org/#marker=16/${this.latitude}/${this.longitude}`
          }
        },
        {
          name: 'meteoblue',
          url: () => {
            return `https://www.meteoblue.com/en/weather/week/${this.latitude}N${this.longitude}E`
          }
        },
        {
          name: 'Activation Zone Estimator',
          url: () => {
            if (this.reference) {
              return `https://activation.zone/?summitRef=${this.reference}`
            }
          }
        },
        {
          name: 'SummitPost',
          url: () => {
            return `https://www.summitpost.org/object_list.php?object_type=1&distance_lat_1=${this.latitude}&distance_lon_1=${this.longitude}&map_1=1`
          }
        },
        {
          name: 'Peakbagger.com',
          url: () => {
            return `https://peakbagger.com/search.aspx?tid=R&lat=${this.latitude}&lon=${this.longitude}&ss=`
          }
        },
        {
          name: 'SOTA Summits',
          url: () => {
            if (this.reference) {
              return `https://www.sotadata.org.uk/en/summit/${this.reference}`
            }
          }
        },
        {
          name: 'SOTA Map',
          url: () => {
            if (this.reference) {
              return `https://www.sotamaps.org/summit/${this.reference}`
            }
          }
        },
        {
          name: 'pota-map.fr',
          url: () => {
            if (this.reference) {
              return `https://pota-map.fr/?sota=${this.reference}`
            }
          }
        },
        {
          name: 'aprs.fi',
          url: () => {
            return `https://aprs.fi/#!lat=${this.latitude}&lng=${this.longitude}&z=14`
          }
        }
      ]
    }
  }
}
</script>

<style scoped>
.wrapper {
  display: inline-block;
}
.coordinates {
  margin-right: 0.75em;
}
.locator {
  color: #777;
}
.actions {
  display: inline-block;
}
</style>
