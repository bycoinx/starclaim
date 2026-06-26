const path = require('path');
const webpack = require('webpack');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      const existingIgnoreWarnings = webpackConfig.ignoreWarnings || [];

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

      // Legacy browser bundles in the wallet/NFT dependency tree include
      // dynamic requires. They build correctly, but webpack cannot statically
      // analyze those expressions and emits this noisy warning without useful
      // module metadata in CRA's build output.
      webpackConfig.ignoreWarnings = [
        ...existingIgnoreWarnings,
        (warning) => {
          const message = warning?.message || "";
          return message === "Critical dependency: the request of a dependency is an expression";
        },
      ];

      return webpackConfig;
    },
  },
};
