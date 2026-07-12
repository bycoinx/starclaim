module.exports = function babelConfig(api) {
  const isMetro = api.caller((caller) => caller?.name === 'metro');

  return {
    presets: isMetro
      ? ['babel-preset-expo']
      : [['@babel/preset-env', { targets: { node: 'current' } }]],
  };
};
