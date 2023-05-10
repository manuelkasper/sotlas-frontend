const webpack = require('webpack')
const GitRevisionPlugin = require('git-revision-webpack-plugin')

const gitRevisionPlugin = new GitRevisionPlugin()

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
    ]
  },
  publicPath: process.env.PUBLIC_PATH
}
