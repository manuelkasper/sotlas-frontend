<template>
  <div>
    <CardPagination v-if="!$mq.desktop" :data="cardActivations" :paginated="true" :infinite="infinite">
      <template v-slot="{ row }">
        <ActivationCard v-slot="{ row }" :activation="row" :ownCallsign="ownCallsign" @openQsoList="openQsoList" />
      </template>
    </CardPagination>
    <b-table v-else class="auto-width" :narrowed="true" :paginated="true" :striped="true" :default-sort="['date', 'desc']" :per-page="perPage" :data="data" :row-class="rowClass">
      <b-table-column field="date" label="Date" sortable v-slot="props">
        {{ formatActivationDate(props.row.date) }}
      </b-table-column>
      <b-table-column field="summit.code" label="Summit" cell-class="code" sortable v-slot="props">
        <CountryFlag v-if="props.row.summit.isoCode" :country="props.row.summit.isoCode" class="flag" />
        <router-link :to="makeSummitLink(props.row.summit.code)">{{ props.row.summit.code }}</router-link>
      </b-table-column>
      <b-table-column field="summit.name" label="Name" cell-class="name" sortable v-slot="props">
        <router-link :to="makeSummitLink(props.row.summit.code)">{{ props.row.summit.name }}</router-link>
        <font-awesome-icon v-if="hasOwnPhotos(props.row.summit)" class="photos-icon" :icon="['far', 'images']" />
        <font-awesome-icon v-else-if="props.row.summit.photoAuthors && props.row.summit.photoAuthors.length > 0" class="photos-icon-others" :icon="['far', 'images']" />
      </b-table-column>
      <b-table-column field="summit.altitude" label="Altitude" class="altitude" sortable numeric v-slot="props">
        <AltitudeLabel :altitude="props.row.summit.altitude" />
      </b-table-column>
      <b-table-column field="points" label="Points" sortable v-slot="props">
        <SummitPointsLabel :points="props.row.points" :bonus="props.row.bonus" />
      </b-table-column>
      <b-table-column field="summit.activationCount" label="Activations" sortable numeric v-slot="props">
        <ActivationCount :activationCount="props.row.summit.activationCount" />
      </b-table-column>
      <b-table-column field="callsignUsed" label="Callsign used" sortable v-slot="props">
        {{ props.row.callsignUsed.toUpperCase() }}
      </b-table-column>
      <b-table-column field="qsos" label="QSOs" cell-class="qsos-cell" sortable numeric v-slot="props">
        <button type="button" class="qsos" @click="openQsoList(props.row.id)">
          {{ props.row.qsos }}
          <font-awesome-icon :icon="['far', 'th-list']" class="faicon" />
        </button>
      </b-table-column>
      <template v-slot:bottom-left>
        <b-select v-model="perPage">
          <option v-for="option in perPageOptions" :key="option" :value="option">{{ option }} per page</option>
        </b-select>
      </template>
    </b-table>

    <ModalQSOList :activationId="modalActivationId" @modalClosed="modalActivationId = null" />
  </div>
</template>

<script>
import utils from '../mixins/utils.js'
import prefs from '../mixins/prefs.js'
import SummitPointsLabel from '../components/SummitPointsLabel.vue'
import CardPagination from '../components/CardPagination.vue'
import ActivationCard from '../components/ActivationCard.vue'
import ActivationCount from '../components/ActivationCount.vue'
import AltitudeLabel from '../components/AltitudeLabel.vue'
import CountryFlag from '../components/CountryFlag.vue'
import ModalQSOList from '../components/ModalQSOList.vue'

export default {
  name: 'ActivationsList',
  mixins: [utils, prefs],
  prefs: {
    key: 'activationsListPrefs',
    props: ['perPage']
  },
  props: {
    data: Array,
    infinite: Boolean,
    ownCallsign: String
  },
  components: {
    SummitPointsLabel, CardPagination, ActivationCard, ActivationCount, AltitudeLabel, CountryFlag, ModalQSOList
  },
  methods: {
    openQsoList (activationId) {
      if (!this.authenticated) {
        this.$buefy.dialog.alert('Please log in to view QSOs.')
        return
      }
      this.modalActivationId = activationId
    },
    rowClass (row) {
      return { invalid: row.summit.invalid }
    },
    hasOwnPhotos (summit) {
      if (!summit.photoAuthors || !this.ownCallsign) {
        return false
      }

      return summit.photoAuthors.includes(this.ownCallsign)
    }
  },
  computed: {
    cardActivations () {
      return [...this.data].sort((a, b) => {
        if (a.date > b.date) {
          return -1
        } else if (a.date < b.date) {
          return 1
        } else {
          return 0
        }
      })
    }
  },
  data () {
    return {
      modalActivationId: null,
      perPage: 15,
      perPageOptions: [10, 15, 20, 30, 50, 100]
    }
  }
}
</script>

<style scoped>
.flag {
  margin-right: 0.4em;
}
.qsos {
  color: #3273dc;
  cursor: pointer;
  appearance: none;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  line-height: inherit;
  white-space: nowrap;
  touch-action: manipulation;
}
.qsos::after {
  content: "";
  position: absolute;
  inset: 0;
}
.faicon {
  margin-left: 0.4em;
}
/* See LoggedActivationsList: stretch the QSO control across the <td> so iOS
   taps on cell padding open the list instead of only highlighting the cell. */
:deep(.qsos-cell) {
  position: relative;
  cursor: pointer;
}
.photos-icon {
  margin-left: 0.5em;
  color: var(--bulma-text-weak);
}
.photos-icon-others {
  margin-left: 0.5em;
  color: #aaa;
}
/* :deep() is required because <tr>/<td> are rendered by Buefy's <b-table>, not by
   this component's template, so Vue's scoped-CSS data-v-* attribute is never applied
   to them (only to elements written directly in the v-slot content). */
:deep(.invalid .code), :deep(.invalid .name) {
  opacity: 0.7;
  text-decoration: line-through;
}
</style>
