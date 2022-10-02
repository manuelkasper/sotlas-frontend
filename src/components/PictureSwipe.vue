<template>
  <div>
    <div ref="container">
      <draggable v-model="myItems" handle=".handle" @change="dragChange">
        <figure v-for="(item, index) in myItems" :key="item.src">
          <a :href="item.src" :title="item.thumbTitle" @click.prevent="open(index)" @mouseover="$emit('mouseoverPicture', item, index)" @mouseleave="$emit('mouseleavePicture', item, index)">
            <img :src="item.msrc" :width="thumbSize(item).w" :height="thumbSize(item).h" />
          </a>
          <div class="move-button" v-if="item.editable">
            <b-button class="control handle" size="is-small" icon-left="arrows-alt" title="Drag to reorder"></b-button>
          </div>
          <div class="edit-buttons" v-if="item.editable">
            <b-button class="control" size="is-small" icon-left="edit" @click="$emit('editPicture', item, index)" title="Edit"></b-button>
            <b-button class="control" size="is-small" type="is-danger" icon-left="trash-alt" @click="$emit('deletePicture', item, index)" title="Delete"></b-button>
          </div>
          <font-awesome-icon v-if="item.thumbTitle" class="comment-icon" :icon="['far', 'comment']" />
        </figure>
      </draggable>
    </div>

    <div ref="pswp" class="pswp" tabindex="-1" role="dialog" aria-hidden="true">
      <div class="pswp__bg"></div>
      <div class="pswp__scroll-wrap">
        <div class="pswp__container">
          <div class="pswp__item"></div>
          <div class="pswp__item"></div>
          <div class="pswp__item"></div>
        </div>
        <div class="pswp__ui pswp__ui--hidden">
          <div class="pswp__top-bar">
            <div class="pswp__counter"></div>
            <button class="pswp__button pswp__button--close" title="Close (Esc)"></button>

            <button class="pswp__button pswp__button--share" title="Share"></button>
            <button class="pswp__button pswp__button--fs" title="Toggle fullscreen"></button>
            <button class="pswp__button pswp__button--zoom" title="Zoom in/out"></button>
            <div class="pswp__preloader">
              <div class="pswp__preloader__icn">
                <div class="pswp__preloader__cut">
                  <div class="pswp__preloader__donut"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="pswp__share-modal pswp__share-modal--hidden pswp__single-tap">
            <div class="pswp__share-tooltip"></div>
          </div>
          <button class="pswp__button pswp__button--arrow--left" title="Previous (arrow left)">
          </button>
          <button class="pswp__button pswp__button--arrow--right" title="Next (arrow right)">
          </button>
          <div class="pswp__caption">
            <div class="pswp__caption__center"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PhotoSwipe from 'photoswipe/dist/photoswipe'
import PhotoSwipeUIDefault from 'photoswipe/dist/photoswipe-ui-default'
import 'photoswipe/dist/photoswipe.css'
import 'photoswipe/dist/default-skin/default-skin.css'
import draggable from 'vuedraggable'

export default {
  components: {
    draggable
  },
  props: {
    items: {
      type: Array
    },
    options: {
      default: () => ({}),
      type: Object
    }
  },
  methods: {
    open (index, disableAnimation = false) {
      let that = this
      let gallery
      let options = {
        index,
        getThumbBoundsFn (index) {
          let thumbnail = Array.from(that.$refs.container.getElementsByTagName('img')).find(tag => tag.src === that.myItems[index].msrc)
          let pageYScroll = window.pageYOffset || document.documentElement.scrollTop
          let rect = thumbnail.getBoundingClientRect()

          return { x: rect.left, y: rect.top + pageYScroll, w: rect.width }
        },
        shareButtons: [
          { id: 'download', label: 'Download original', url: '{{raw_image_url}}', download: true }
        ],
        getImageURLForShare: () => {
          return gallery.currItem.osrc || ''
        }
      }

      if (disableAnimation) {
        options.showAnimationDuration = 0
        // Hide animation duration not 0 to prevent close click event from bubbling through
        options.hideAnimationDuration = 1
      }

      gallery = new PhotoSwipe(this.$refs.pswp, PhotoSwipeUIDefault, this.myItems, Object.assign(options, this.options))
      gallery.init()
    },
    dragChange (event) {
      // Should not get any other type of event
      if (event.moved) {
        this.$emit('movePicture', event.moved.newIndex, event.moved.oldIndex, event.element)
      }
    },
    thumbSize (item) {
      let thumbW = item.w
      let thumbH = item.h
      if (thumbW > 256) {
        thumbH = (thumbH * 256) / thumbW
        thumbW = 256
      }
      if (thumbH > 128) {
        thumbW = (thumbW * 128) / thumbH
        thumbH = 128
      }
      return { w: Math.round(thumbW), h: Math.round(thumbH) }
    }
  },
  data () {
    return {
      myItems: []
    }
  },
  watch: {
    items: {
      handler (newItems) {
        this.myItems = newItems
      },
      immediate: true
    }
  }
}
</script>
<style>
.pswp__top-bar {
  text-align: right;
}
.pswp__caption__center {
  text-align: center
}
figure {
  display: inline-block;
  margin: 5px;
  position: relative;
}
figure img {
  vertical-align: middle;
}
.pswp__caption__center {
  max-width: 90vw;
}
.move-button {
  position: absolute;
  left: 0.5em;
  top: 0.5em;
}
.edit-buttons {
  position: absolute;
  right: 0.5em;
  bottom: 0.5em;
}
.edit-buttons .button {
  margin-left: 0.5em;
}
.comment-icon {
  position: absolute;
  left: 0.5em;
  bottom: 0.5em;
  color: white;
  filter: drop-shadow(0 0 0.15em #000);
  pointer-events: none;
}
</style>
