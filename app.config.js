module.exports = function (config) {
  // Ensure scheme is set for Linking (removes "Linking requires a build-time setting scheme" warning)
  if (!config.expo) config.expo = {};
  if (!config.expo.scheme) config.expo.scheme = 'rork-app';
  return config;
};
