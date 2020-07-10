module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/vue-image-fade-scroll/' : '/',
  configureWebpack: config => {
    if (process.env.VUE_APP_IS_ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(new BundleAnalyzerPlugin())
    }
  }
}
