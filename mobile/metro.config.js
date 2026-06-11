const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Support for CJS and other extensions often used in Web3/3D packages
config.resolver.sourceExts.push('mjs', 'cjs');

module.exports = config;
