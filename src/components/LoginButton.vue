<template>
  <b-dropdown v-if="authenticated" position="is-bottom-left" aria-role="menu">
    <template #trigger="{ active }">
      <b-button class="callsign" :icon-right="active ? 'angle-up' : 'angle-down'" :label="$keycloak.tokenParsed.callsign ? $keycloak.tokenParsed.callsign : $keycloak.userName"></b-button>
    </template>
    <b-dropdown-item v-if="$keycloak.tokenParsed.callsign" has-link><router-link :to="'/activators/' + $keycloak.tokenParsed.callsign" @click.native="$emit('linkClicked')">My activator page</router-link></b-dropdown-item>
    <b-dropdown-item @click="doAccountManagement">Manage account</b-dropdown-item>
    <b-dropdown-item @click="doLogout">Logout</b-dropdown-item>
  </b-dropdown>
  <div v-else>
    <b-button type="is-info" @click="doLogin">Login</b-button>
  </div>
</template>

<script>
import utils from '../mixins/utils.js'

export default {
  mixins: [utils],
  methods: {
    doLogin () {
      this.$emit('linkClicked')
      if (!this.$keycloak) {
        sessionStorage.setItem('wantSso', 'true')
        sessionStorage.setItem('wantSsoLogin', 'true')
        window.location.reload()
      } else {
        this.$keycloak.login()
      }
    },
    doAccountManagement () {
      this.$emit('linkClicked')
      this.$keycloak.accountManagement()
    },
    doLogout () {
      this.$emit('linkClicked')
      localStorage.removeItem('wantSso')
      sessionStorage.removeItem('wantSso')
      this.$keycloak.logoutFn()
    }
  },
  watch: {
    authenticated: {
      immediate: true,
      handler (newAuthenticated) {
        if (newAuthenticated) {
          // Assume that if they have logged on successfully, they will want to do so every time they come back
          localStorage.setItem('wantSso', 'true')
        }
      }
    }
  }
}
</script>

<style scoped>
.callsign {
  font-weight: bold;
}
</style>
