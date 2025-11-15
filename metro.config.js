const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration for Control de Ventas RN
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Resolver para dependencias que pueden tener problemas
    alias: {
      'socket.io-client': 'socket.io-client/dist/socket.io.js',
      'react-native-safe-area-context': require('path').resolve(__dirname, 'shims/safe-area-context.js'),
    },
    // Excluir node_modules que no son compatibles con RN
    blockList: [
      /node_modules\/.*\/node_modules\/react\/.*/,
      /node_modules\/.*\/node_modules\/react-native\/.*/,
    ],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
