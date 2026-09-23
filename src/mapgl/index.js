import { config } from '@maptiler/sdk'

// SDK 3+ reports usage/API-key metrics to api.maptiler.com/metrics by
// default. master (Vue 2, SDK 2.0.3) never did this, so disable it to keep
// this migration behavior-preserving. See src/mapgl/README.md.
config.telemetry = false

export { mapSymbol } from './keys.js'
export { default as MglMap } from './MglMap.js'
export { default as MglPopup } from './MglPopup.js'
export { default as MglMarker } from './MglMarker.js'
export { MglAttributionControl, MglGeolocateControl, MglNavigationControl, MglScaleControl } from './controls.js'
export { default as MglGeoJsonSource } from './MglGeoJsonSource.js'
export { MglFillLayer, MglLineLayer, MglSymbolLayer } from './layers.js'
