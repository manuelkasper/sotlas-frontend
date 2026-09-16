<template>
  <div class="card-list">
    <b-pagination v-if="paginated && !infinite" :total="data.length" v-model="currentCardPage" :simple="true" size="is-small" :per-page="perPage" aria-next-label="Next page" aria-previous-label="Previous page" aria-page-label="Page" aria-current-label="Current page" />
    <template v-for="(row, index) in pageData" :key="row[rowKey]">
      <slot :row="row" :prevRow="(index > 0 ? pageData[index-1] : null)"></slot>
    </template>
  </div>
  <infinite-loading v-if="infinite" :identifier="infiniteIdentifier" :distance="100" @infinite="infiniteHandler">
    <template v-slot:complete><div></div></template>
  </infinite-loading>
</template>

<script>
import InfiniteLoading from 'v3-infinite-loading'
import 'v3-infinite-loading/lib/style.css'

export default {
  name: 'CardPagination',
  components: {
    InfiniteLoading
  },
  props: {
    data: Array,
    paginated: {
      type: Boolean,
      default: true
    },
    infinite: {
      type: Boolean,
      default: false
    },
    perPage: {
      type: Number,
      default: 10
    },
    infiniteBatchSize: {
      type: Number,
      default: 50
    },
    rowKey: {
      type: String,
      default: 'id'
    }
  },
  watch: {
    currentCardPage (newCardPage) {
      if (newCardPage === 0) {
        this.currentCardPage = 1
      }
    },
    data () {
      this.infiniteIdentifier++
    }
  },
  methods: {
    infiniteHandler ($state) {
      if (this.data.length > (this.infiniteBatchCount * this.infiniteBatchSize)) {
        this.infiniteBatchCount++
        $state.loaded()
      } else {
        $state.complete()
      }
    }
  },
  computed: {
    pageData () {
      if (this.infinite) {
        return this.data.slice(0, this.infiniteBatchCount * this.infiniteBatchSize)
      } else if (this.paginated) {
        return this.data.slice((this.currentCardPage - 1) * this.perPage, this.currentCardPage * this.perPage)
      } else {
        return this.data
      }
    }
  },
  data () {
    return {
      currentCardPage: 1,
      infiniteBatchCount: 1,
      infiniteIdentifier: 1
    }
  }
}
</script>

<style scoped>
.card-list {
  margin-top: 1.5em;
}
.pagination {
  margin-bottom: 0.5em;
}
</style>
