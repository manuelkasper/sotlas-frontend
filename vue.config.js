const webpack = require('webpack')
const { GitRevisionPlugin } = require('git-revision-webpack-plugin')

const gitRevisionPlugin = new GitRevisionPlugin({ branch: true })

module.exports = {
  productionSourceMap: false,
  transpileDependencies: ['vue-lazy-youtube-video', 'vue-mapbox'],
  configureWebpack: {
    plugins: [
      gitRevisionPlugin,
      new webpack.DefinePlugin({
        'VERSION': JSON.stringify(gitRevisionPlugin.version()),
        'COMMITHASH': JSON.stringify(gitRevisionPlugin.commithash()),
        'BRANCH': JSON.stringify(gitRevisionPlugin.branch())
      })
    ],
    resolve: {
      fallback: {
        fs: false,
        path: false
      }
    }
  },
  publicPath: process.env.PUBLIC_PATH
}
