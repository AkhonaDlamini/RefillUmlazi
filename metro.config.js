const { getDefaultConfig } = require("expo/metro-config");
const defaultConfig = getDefaultConfig(__dirname);

if (process.env.PLATFORM === "native") {
  defaultConfig.resolver.assetExts.push("cjs");
  defaultConfig.resolver.unstable_enablePackageExports = false;
}

module.exports = defaultConfig;