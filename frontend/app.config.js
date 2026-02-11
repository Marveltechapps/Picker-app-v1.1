module.exports = function (config) {
  if (!config.expo) config.expo = {};
  if (!config.expo.scheme) config.expo.scheme = 'rork-app';

  // Allow HTTP (cleartext) on Android so Expo Go can reach local backend (e.g. http://192.168.x.x:3000)
  if (!config.expo.android) config.expo.android = {};
  config.expo.android.usesCleartextTraffic = true;
  if (!config.expo.android.package) config.expo.android.package = 'com.selorg.packman';

  return config;
};
