<template>
  <div class="picture-swipe">
    <div ref="container">
      <draggable v-model="myItems" item-key="src" handle=".handle" @change="dragChange">
        <template #item="{ element: item, index }">
          <figure>
            <a :href="item.src" :title="item.thumbTitle" @click.prevent="open(index)" @mouseover="$emit('mouseoverPicture', item, index)" @mouseleave="$emit('mouseleavePicture', item, index)">
              <img :src="item.msrc" :width="thumbSize(item).w" :height="thumbSize(item).h" />
            </a>
            <div class="move-button" v-if="item.editable">
              <b-button class="handle" size="is-small" icon-left="arrows-alt" title="Drag to reorder"></b-button>
            </div>
            <div class="edit-buttons" v-if="item.editable">
              <b-button size="is-small" icon-left="edit" @click="$emit('editPicture', item, index)" title="Edit"></b-button>
              <b-button size="is-small" type="is-danger" icon-left="trash-alt" @click="$emit('deletePicture', item, index)" title="Delete"></b-button>
            </div>
            <font-awesome-icon v-if="item.thumbTitle" class="comment-icon" :icon="['far', 'comment']" />
          </figure>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script>
import PhotoSwipe from 'photoswipe'
import 'photoswipe/style.css'
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
  computed: {
    thumbMaxW () {
      return this.$mq.mobile ? 242 : 300
    },
    thumbMaxH () {
      return this.$mq.mobile ? 104 : 128
    }
  },
  methods: {
    open (index, disableAnimation = false) {
      let options = {
        dataSource: this.myItems.map(item => ({
          src: item.src,
          msrc: item.msrc,
          osrc: item.osrc,
          width: item.width || item.w,
          height: item.height || item.h,
          title: item.title,
          alt: item.thumbTitle || ''
        })),
        index,
        ...this.options
      }

      if (disableAnimation) {
        options.showHideAnimationType = 'none'
        options.showAnimationDuration = 0
        // Hide animation duration not 0 to prevent close click event from bubbling through
        options.hideAnimationDuration = 1
      }

      let gallery = new PhotoSwipe(options)

      gallery.addFilter('thumbEl', (thumbEl, itemData, itemIndex) => {
        return this.thumbnailEl(itemIndex) || thumbEl
      })

      // Allow native text selection/copy in captions. PhotoSwipe otherwise
      // preventDefault()s all pointermove events while the gallery is open.
      gallery.addFilter('preventPointerEvent', (preventPointerEvent, originalEvent) => {
        if (originalEvent.target && originalEvent.target.closest && originalEvent.target.closest('.pswp__custom-caption')) {
          return false
        }
        return preventPointerEvent
      })

      gallery.on('uiRegister', () => {
        gallery.ui.registerElement({
          name: 'download-button',
          ariaLabel: 'Download original',
          title: 'Download original',
          order: 8,
          isButton: true,
          tagName: 'a',
          html: {
            isCustomSVG: true,
            inner: '<path d="M20.5 14.3 17.1 18V10h-2.2v7.9l-3.4-3.6L10 16l6 6.1 6-6.1ZM23 23H9v2h14Z" id="pswp__icn-download"/>',
            outlineID: 'pswp__icn-download'
          },
          onInit: (el, pswp) => {
            el.setAttribute('download', '')
            el.setAttribute('target', '_blank')
            el.setAttribute('rel', 'noopener')
            let setHref = () => {
              el.href = (pswp.currSlide && pswp.currSlide.data.osrc) || (pswp.currSlide && pswp.currSlide.data.src) || ''
            }
            pswp.on('change', setHref)
            setHref()
          }
        })

        gallery.ui.registerElement({
          name: 'custom-caption',
          order: 9,
          isButton: false,
          appendTo: 'root',
          onInit: (el, pswp) => {
            let updateCaption = () => {
              let title = pswp.currSlide && pswp.currSlide.data.title
              el.innerHTML = title || ''
              el.hidden = !title
            }
            pswp.on('change', updateCaption)
            updateCaption()
          }
        })
      })

      gallery.on('destroy', () => {
        if (this.gallery === gallery) {
          this.gallery = null
        }
      })

      this.gallery = gallery
      gallery.init()
    },
    thumbnailEl (index) {
      let images = this.$refs.container && this.$refs.container.getElementsByTagName('img')
      return images && images[index]
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
      if (thumbW > this.thumbMaxW) {
        thumbH = (thumbH * this.thumbMaxW) / thumbW
        thumbW = this.thumbMaxW
      }
      if (thumbH > this.thumbMaxH) {
        thumbW = (thumbW * this.thumbMaxH) / thumbH
        thumbH = this.thumbMaxH
      }
      return { w: Math.round(thumbW), h: Math.round(thumbH) }
    }
  },
  data () {
    return {
      myItems: [],
      gallery: null
    }
  },
  watch: {
    items: {
      handler (newItems) {
        this.myItems = newItems
      },
      immediate: true
    }
  },
  unmounted () {
    if (this.gallery) {
      this.gallery.destroy()
    }
  }
}
</script>
<style>
.picture-swipe figure {
  display: inline-block;
  margin: 5px;
  position: relative;
}
.picture-swipe figure img {
  vertical-align: middle;
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
.pswp__custom-caption {
  position: absolute;
  left: 0;
  bottom: 0;
  z-index: 10;
  width: 100%;
  padding: .75em;
  color: #eee;
  text-align: center;
  font-size: 13px;
  line-height: 20px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  user-select: text;
  -webkit-user-select: text;
  touch-action: auto;
  cursor: text;
}
.pswp__custom-caption .photo-title {
  max-width: 90vw;
  margin: 0 auto;
  font-size: 1rem;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85);
}
.pswp__custom-caption .photo-title .author {
  font-size: 0.8rem;
  margin-top: 0.2em;
  color: #ddd;
}
.pswp__custom-caption a {
  color: #fff;
  cursor: pointer;
}
</style>
