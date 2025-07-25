<template>
  <div class="solar-container" v-if="latest !== null">
    <div><label>SFI</label>{{ latest.sfi }}</div>
    <div><label>SN</label>{{ latest.r }}</div>
    <div :class="[kAttribute]"><label>K</label>{{ latest.k }}</div>
    <div><label>A</label>{{ latest.a }}</div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'SolarData',
  mounted () {
    this.loadSolarData()
  },
  computed: {
    kAttribute () {
      if (this.latest === null) {
        return ''
      }

      if (this.latest.k <= 2) {
        return 'k-quiet'
      } else if (this.latest.k === 3) {
        return 'k-unsettled'
      } else if (this.latest.k === 4) {
        return 'k-active'
      } else if (this.latest.k <= 7) {
        return 'k-storm'
      } else {
        return 'k-severestorm'
      }
    }
  },
  methods: {
    loadSolarData () {
      axios.get(import.meta.env.VITE_API_URL + '/solardata/latest', { ignoreError: true })
        .then(response => {
          this.latest = response.data
        })
        .catch(() => {})
    }
  },
  data () {
    return {
      latest: null
    }
  }
}
</script>

<style scoped>
.solar-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  grid-column-gap: 0.3rem;
  font-size: 0.8rem;
  line-height: 1.05rem;
  background-color: #eee;
  border-radius: 10px;
  padding: 0.10rem 0.4rem;
  font-weight: bold;
  text-align: right;
}
.solar-container label {
  font-size: 0.7rem;
  margin-right: 0.2rem;
  font-weight: normal;
  opacity: 0.6;
}
.solar-container .k-quiet {
  color: #106f06;
}
.solar-container .k-unsettled {
  color: #817f03;
}
.solar-container .k-active {
  color: #8c5903;
}
.solar-container .k-storm {
  color: #8d0002;
}
.solar-container .k-severestorm {
  color: #7e0053;
}
</style>
