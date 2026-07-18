const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

// Support for CJS and other extensions often used in Web3/3D packages
config.resolver.sourceExts.push('mjs', 'cjs');

module.exports = config;