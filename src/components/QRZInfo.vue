<template>
  <div>
    {{ qrzInfo.fname }} {{ qrzInfo.name }}, {{ qrzInfo.addr1 }}, {{ qrzInfo.addr2 }}, {{ qrzInfo.state }} ({{ qrzInfo.grid }})
  </div>
</template>

<script>
import QRZInterface from '../qrz'

export default {
  name: 'QRZInfo',
  params: {
    callsign: String
  },
  watch: {
    callsign: {
      handler () {
        QRZInterface.lookupCallsign(this.callsign)
      },
      immediate: true
    }
  },
  data: () => {
    return {
      qrzInfo: {}
    }
  }
}
</script>
