import { reactive } from 'vue'

// Minimal Vue 3-native replacement for vue-match-media. Provides the
// $mq.{mobile,desktop,widescreen,fullhd} reactive booleans used across the app,
// plus $mq.dark for prefers-color-scheme (and data-theme / .theme-* overrides).
const queries = {
  mobile: '(max-width: 768px)',
  desktop: '(min-width: 1024px)',
  widescreen: '(min-width: 1216px)',
  fullhd: '(min-width: 1408px)'
}

function isDark (darkMql) {
  const el = document.documentElement
  const theme = el.getAttribute('data-theme')
  if (theme === 'dark' || el.classList.contains('theme-dark')) return true
  if (theme === 'light' || el.classList.contains('theme-light')) return false
  return darkMql.matches
}

export default {
  install (app) {
    const mq = reactive({})
    for (const key in queries) {
      const mql = window.matchMedia(queries[key])
      mq[key] = mql.matches
      mql.addEventListener('change', e => { mq[key] = e.matches })
    }
    const darkMql = window.matchMedia('(prefers-color-scheme: dark)')
    const syncDark = () => { mq.dark = isDark(darkMql) }
    syncDark()
    darkMql.addEventListener('change', syncDark)
    new MutationObserver(syncDark).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    })
    app.config.globalProperties.$mq = mq
  }
}
