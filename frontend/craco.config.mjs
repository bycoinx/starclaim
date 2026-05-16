// craco.config.mjs
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Check if we're in development/preview mode
const isDevServer = process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== undefined;

export default {
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
        process: require.resolve("process/browser"),
        vm: require.resolve("vm-browserify"),
      };

      // Add ProvidePlugin for Buffer and process
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        })
      );

      return webpackConfig;
    },
  },
};
