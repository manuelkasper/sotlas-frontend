# SOTLAS

This is the Vue.js based frontend for SOTLAS (https://sotl.as), an interactive atlas of summits for the [Summits On The Air](https://www.sota.org.uk/) amateur radio program.

## Project setup
```
npm install
```

### FontAwesome Pro (optional)
This project uses a few [FontAwesome Pro](https://fontawesome.com/) icons. A Pro
subscription is **not required** to build or develop: if the `NPM_FONTAWESOME_TOKEN`
environment variable is not set, `npm install` automatically falls back to
equivalent free icons (see `src/fa-pro-fallback/`) instead of failing.

If you do have a Pro subscription, set `NPM_FONTAWESOME_TOKEN` to your token
before running `npm install` and the Pro icons will be installed and used as normal.

### Compiles and hot-reloads for development
```
npm run dev
```

### Compiles and minifies for production
```
npm run build
```

### Lints files
```
npm run lint
```

### Customize configuration
See [Vite Configuration Reference](https://vite.dev/config/).
