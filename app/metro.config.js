const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo/workspace root
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// 3. Force Metro to resolve the local package correctly
config.resolver.extraNodeModules = {
  'expo-whisper': path.resolve(workspaceRoot, 'packages/expo-whisper'),
};

// 4. Add .bin as an asset extension so Metro can bundle model files
config.resolver.assetExts.push('bin');

module.exports = config;
