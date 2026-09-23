# src/mapgl

A thin, in-house Vue 3 integration layer for the MapTiler SDK, used in place
of a general-purpose maplibre-gl wrapper. See upstream discussion:
https://github.com/manuelkasper/sotlas-frontend/issues/44

## 1. Why this module exists

SOTLAS' map has gone through three integration layers:

1. `vue-mapbox` (a fork, `manuelkasper/vue-mapbox#sotlas-maptiler`) wrapping
   `@maptiler/sdk`'s `Map` as the GL engine, with three patches to suppress
   SDK-specific behavior (duplicate attribution/logo controls, default
   navigation/geolocate controls, MapTiler-2.0-era API renames).
2. During the Vue 3 migration, `@indoorequal/vue-maplibre-gl` wrapping plain
   `maplibre-gl` (no `@maptiler/sdk`), with a hand-rolled `transformRequest`
   in `src/maptiler.js` reproducing the SDK's session-billing query
   parameter (`mtsid`).
3. This module: a small self-written wrapper (~10 components) around
   `@maptiler/sdk`'s `Map` again, but without a fork and without
   reverse-engineering the session mechanism.

Step 2 raised a MapTiler ToS concern (re-implementing `mtsid` outside the
official SDK, even though the mechanism is documented in the SDK's own type
definitions). The maintainer chose to go back to the SDK as the GL engine
rather than resolve that question, provided the handful of components
SOTLAS actually uses could be reproduced without forking a third-party
wrapper. This module is that reproduction.

## 2. Why the MapTiler SDK Map, not bare maplibre-gl

The SDK's `Map` transparently adds MapTiler's session-billing query
parameter (`mtsid`) and API key to `api.maptiler.com` requests, and exposes
`map.getMaptilerSessionId()` so the app can report a session start via its
own `/mapsession` endpoint (see `src/mapsession.js`). Reproducing this
without the SDK requires either accepting the ToS ambiguity above, or
tracking the SDK's internal mechanism by hand — both worse than depending
on the SDK directly.

## 3. Architecture

- **`mapSymbol`** (in `keys.js`) is a `ShallowRef` provided immediately after
  `new Map()`, before the `load` event fires — same contract as
  `@indoorequal/vue-maplibre-gl`. `MapDraw.vue` relies on this to
  `addControl()` a mapbox-gl-draw control before `load`, so its `onAdd()`
  hook sees `map.loaded() === false` and attaches a `'load'` listener
  instead of falling into a 16ms polling fallback.
- **Popup DOM mounting** (`MglPopup.js`): the default slot renders into a
  plain `<div>` immediately; once mounted, that DOM node is handed to
  `popup.setDOMContent()`. maplibre physically moves the node into its
  popup container, but the node stays under Vue's vnode tree, so
  reactivity inside the slot keeps working.
- **Marker + Popup composition** (`MglMarker.js` / `MglPopup.js`): a marker
  only renders its default slot (used for a nested `MglPopup`) once
  `isMounted` is true, i.e. after the `Marker` instance exists and
  `markerSymbol` has been provided. This guarantees the popup's `setup()`
  finds an existing marker and calls `marker.setPopup()` instead of adding
  a standalone popup.
- **Style-change source/layer re-registration** (`MglGeoJsonSource.js` /
  `layers.js`): `MglMap#setStyle()` wipes all sources and layers. The
  source component re-adds itself on every `'style.load'` event and
  publishes the new `GeoJSONSource` instance via `sourceRefSymbol`; layer
  components watch that ref and re-`addLayer()` whenever it changes.
  `SourceLayerRegistry` (`keys.js`) lets a source remove its child layers
  before removing itself, since Vue runs a parent's `beforeUnmount` before
  its children's.
- **Control prop reactivity** (`controls.js`): unlike
  `@indoorequal/vue-maplibre-gl`'s `useControl` (which reads props once at
  creation), this module's `useControl` deep-watches the full props object
  and removes+recreates the control on any change (e.g. so
  `MglAttributionControl`'s `compact` prop tracks `$mq.mobile` across resizes
  without a `:key` remount). This does NOT change `AttributionControl`'s
  compact-on-load behavior — maplibre-gl always pairs the `compact` class
  with `compact-show` on (re)creation, so the control still renders expanded
  until the map is dragged or the control is clicked, same as upstream.

## 4. SDK behaviors we explicitly suppress or rely on

Set on the `Map` constructor (`MglMap.js`):

| Option | Value | Why |
|---|---|---|
| `navigationControl` | `false` | SDK adds one automatically on `load`; SOTLAS places its own via `MglNavigationControl`. |
| `geolocateControl` | `false` | Same, for geolocate. |
| `forceNoAttributionControl` | `true` when `attributionControl === false` | Also suppresses the SDK's `LogoControl`; SOTLAS places its own attribution via `MglAttributionControl`. |
| `logSDKVersion` | `false` | Suppresses a console banner on every map load. |

Set once at module load (`index.js`):

| `config.*` | Value | Why |
|---|---|---|
| `telemetry` | `false` | SDK 3+ POSTs usage/API-key metrics to `api.maptiler.com/metrics` by default. `master` (Vue 2, SDK 2.0.3) predates this setting and never did this; disabling it keeps the migration behavior-preserving. Revisit if the maintainer wants telemetry on. |
| `session` | left at SDK default (`true`) | Required for `mtsid` billing and `/mapsession` reporting — the whole reason to use the SDK. |
| `caching` | left at SDK default (`true`) | Legitimate SDK feature (Cache API-backed tile caching); no reason to disable. |

Relied on, not configured:

- The SDK's internal `transformRequest` wrapper appends `key` (if missing)
  and `mtsid` to every `api.maptiler.com` request, including local (non-cloud)
  style tile/glyph requests once they're patched with the API key in
  `src/mixins/mapstyle.js`. This replaces the old `src/maptiler.js`.
- `Language.STYLE` (the SDK's default `language` setting) keeps whatever
  language the style itself specifies, so it does not fight with SOTLAS'
  own `applyLanguageToStyle()` / `applyLanguageToMap()` patches.
- On `load`, the SDK fetches the style's `tiles.json` once (for logo
  detection) even with `forceNoAttributionControl: true`. This is a single,
  harmless request — don't mistake it for a leftover attribution/logo call
  when checking the Network tab.

## 5. What to check when upgrading `@maptiler/sdk`

- Whether `navigationControl`/`geolocateControl` are still added on `load`
  (not at construction) and still named the same in `MapOptions`.
  Currently confirmed via `node_modules/@maptiler/sdk/dist/Map.d.ts` and
  the built `maptiler-sdk.mjs`.
- Whether `forceNoAttributionControl` still suppresses both the attribution
  control and the `LogoControl`.
- The internal `transformRequest` wrapper's conditions for appending `key`
  and `mtsid` (currently: `key` only if missing from the URL, `mtsid` only
  when `config.session` is true).
- `config` defaults (`session`, `caching`, `telemetry`) — this file assumes
  `telemetry` needs to be explicitly disabled and the other two are fine
  left at their defaults.
- The maplibre-gl version the SDK pins in its own `dependencies`
  (currently `~5.21.1`, nested under `node_modules/@maptiler/sdk/`) — this
  module imports `Map`, `Marker`, `Popup`, and the controls exclusively
  from `@maptiler/sdk`, never from a direct `maplibre-gl` dependency, to
  avoid bundling two copies.
- That `map.getMaptilerSessionId()` still exists and still returns the ID
  used in the SDK's own `mtsid` parameter (there is no public runtime
  export of the raw session ID; it's only reachable through this method).

## 6. Supported API surface

This is **not a general-purpose maplibre-gl wrapper**. Each component only
implements the props/emits/slots SOTLAS actually uses:

- `MglMap`: `mapStyle`, `bounds`, `fitBoundsOptions`, `center`, `zoom`,
  `dragRotate`, `attributionControl`, `apiKey`; emits `map:load`,
  `map:click`, `map:contextmenu`, `map:moveend`, `map:idle` with payload
  `{ type, map, event }`.
- `MglPopup`: `coordinates`, `closeButton`, `closeOnClick`, `focusAfterOpen`,
  `anchor`, `offset`, `maxWidth`; emits `open`, `close`; default slot.
- `MglMarker`: `coordinates`; `marker` slot (custom icon element), default
  slot (for a nested `MglPopup`).
- `MglNavigationControl`, `MglGeolocateControl`, `MglScaleControl`,
  `MglAttributionControl`: the subset of props SOTLAS passes (see
  `controls.js`).
- `MglGeoJsonSource`: `sourceId`, `data`.
- `MglFillLayer`, `MglLineLayer`, `MglSymbolLayer`: `layerId`, `layout`, `paint`, `before`.

Adding a new prop/emit/component should follow the same pattern as the
existing ones (read the corresponding `@indoorequal/vue-maplibre-gl` source
under `node_modules/@indoorequal/vue-maplibre-gl/lib/` for the reference
behavior, then port only what's needed).
