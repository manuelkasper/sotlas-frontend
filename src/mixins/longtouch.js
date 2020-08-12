export default {
  methods: {
    installLongTouchHandler (map, onLongTouch) {
      let clearLongTouchTimeout = () => { clearTimeout(this.longTouchTimeout) }

      map.on('touchstart', (e) => {
        if (e.originalEvent.touches.length === 1) {
          this.longTouchTimeout = setTimeout(() => {
            onLongTouch(e)
          }, 500)
        }
      })
      map.on('touchend', clearLongTouchTimeout)
      map.on('touchcancel', clearLongTouchTimeout)
      map.on('touchmove', clearLongTouchTimeout)
      map.on('pointerdrag', clearLongTouchTimeout)
      map.on('pointermove', clearLongTouchTimeout)
      map.on('moveend', clearLongTouchTimeout)
      map.on('gesturestart', clearLongTouchTimeout)
      map.on('gesturechange', clearLongTouchTimeout)
      map.on('gestureend', clearLongTouchTimeout)
    }
  }
}
