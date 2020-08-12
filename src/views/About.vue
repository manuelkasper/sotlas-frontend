<template>
  <PageLayout>
    <template v-slot:title>About</template>

    <template>
      <section class="section">
        <div class="container content">
          <p>SOTA Atlas (SOTLAS) is created and maintained by Manuel Kasper, HB9DQM (<a href="mailto:mk@neon1.net">mk@neon1.net</a>).</p>

          <p>
            Summit database © 2002-2020 Summits on the Air.<br />
            Summits on the Air, SOTA and the SOTA Logo are trademarks of the Programme.
          </p>

          <p>
            The source code of SOTLAS is available on <a href="https://github.com/manuelkasper/sotlas-frontend"><font-awesome-icon :icon="['fab', 'github']" size="lg" /> GitHub</a>.
          </p>

          <p>Data sourced from:
            <ul>
              <li><a href="https://www.sotadata.org.uk">SOTA Database</a></li>
              <li><a href="https://sotawatch.sota.org.uk">SOTAwatch</a></li>
              <li><a href="https://www.sotamaps.org">SOTA Maps</a></li>
              <li><a href="https://en.wikipedia.org">Wikipedia</a></li>
              <li><a href="http://reversebeacon.net">Reverse Beacon Network</a></li>
            </ul>
          </p>

          <p>
            Icons made by <a href="https://www.flaticon.com/authors/nikita-golubev" title="Nikita Golubev">Nikita Golubev</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a> are licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a>
          </p>

          <p>Technologies used:
            <ul>
              <li><a href="https://openmaptiles.org">OpenMapTiles</a></li>
              <li><a href="https://docs.mapbox.com/mapbox-gl-js/overview/">Mapbox GL JS</a>
              <li><a href="https://nodejs.org/">Node.js</a> server</li>
              <li>SPA built with <a href="https://vuejs.org">Vue.js</a>, <a href="https://vuex.vuejs.org">Vuex</a> and <a href="https://router.vuejs.org">Vue Router</a></li>
              <li><a href="https://buefy.org">Buefy</a> UI framework</li>
              <li>WebSocket</li>
            </ul>
          </p>

          <p><strong>All information on this web site is provided “as is” without warranty of any kind. The operator of this web site makes no representations and disclaims all express, implied, and statutory warranties of any kind to any user and/or any third party, including as to accuracy, timeliness, completeness, merchantability, or fitness for any particular purpose. Use of this web site and the information contained therein is at the user’s sole risk.</strong></p>
        </div>
      </section>
    </template>
  </PageLayout>
</template>

<script>
import PageLayout from '../components/PageLayout.vue'

export default {
  components: { PageLayout },
  mounted () {
    document.title = 'About - SOTLAS'
  }
}
</script>
