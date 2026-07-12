const { getDefaultConfig } = require('expo/metro-config');
const { resolveThreeExampleModule } = require('./build/resolveThreeExampleModule.cjs');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Support for CJS and other extensions often used in Web3/3D packages
config.resolver.sourceExts.push('mjs', 'cjs');

config.resolver.resolveRequest = (context, moduleName, platform) => context.resolveRequest(
  context,
  resolveThreeExampleModule(moduleName),
  platform
);

module.exports = config;
