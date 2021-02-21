<template>
  <b-dropdown :triggers="['hover']" aria-role="list">
    <template #trigger>
      <b-button icon-left="book-user" icon-right="angle-down"><span class="is-hidden-mobile">Callbooks</span></b-button>
    </template>

    <b-dropdown-item has-link aria-role="listitem"><a :href="'https://www.qrz.com/db/' + callsign" target="_blank"><img class="calldblogo" src="../assets/qrzcom.png" />QRZ.com</a></b-dropdown-item>
    <b-dropdown-item has-link aria-role="listitem"><a :href="'https://www.qrzcq.com/call/' + callsign" target="_blank"><img class="calldblogo" src="../assets/qrzcq.png" />QRZCQ</a></b-dropdown-item>
    <b-dropdown-item has-link aria-role="listitem"><a :href="'https://www.hamqth.com/' + callsign" target="_blank"><img class="calldblogo" src="../assets/hamqth.png" />HamQTH</a></b-dropdown-item>
    <b-dropdown-item has-link aria-role="listitem"><a :href="'https://www.hamcall.net/call/' + callsign" target="_blank"><img class="calldblogo" src="../assets/hamcall.png" />HamCall</a></b-dropdown-item>
  </b-dropdown>
</template>

<script>
export default {
  props: {
    callsign: String
  }
}
</script>

<style scoped>
.calldblogo {
  width: 1.5em;
  vertical-align: middle;
  margin-right: 0.4em;
}
.dropdown {
  margin-left: 1em;
}
</style>
