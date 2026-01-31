const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const config = getDefaultConfig(__dirname);

// Ensure web platform is properly configured
if (!config.resolver) {
  config.resolver = {};
}
// Exclude native build artifacts (.cxx, CMake) - prevents ENOENT watcher crash on react-native-vision-camera
const defaultBlock = config.resolver.blockList;
const extraBlocks = [/[\/\\]\.cxx[\/\\].*/, /[\/\\]CMakeFiles[\/\\]CMakeTmp[\/\\].*/];
config.resolver.blockList = Array.isArray(defaultBlock)
  ? [...defaultBlock, ...extraBlocks]
  : defaultBlock
    ? [defaultBlock, ...extraBlocks]
    : extraBlocks;
config.resolver.sourceExts = [
  ...(config.resolver.sourceExts || []),
  "web.js",
  "web.ts",
  "web.tsx",
];
config.resolver.platforms = ["ios", "android", "native", "web"];

// Ensure transformer handles web
if (!config.transformer) {
  config.transformer = {};
}
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

const finalConfig = withRorkMetro(config);
module.exports = finalConfig;
