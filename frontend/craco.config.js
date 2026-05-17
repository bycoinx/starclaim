const path = require('path');
const webpack = require('webpack');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // Add polyfills for Node.js core modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        assert: require.resolve("assert"),
        buffer: require.resolve("buffer/"),
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        path: require.resolve("path-browserify"),
        process: require.resolve("process/browser.js"),
        vm: require.resolve("vm-browserify"),
      };

      // Add ProvidePlugin for Buffer and process
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: require.resolve("process/browser.js"),
        })
      );

      return webpackConfig;
    },
  },
};
