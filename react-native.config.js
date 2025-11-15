// Desactiva el autolink nativo de safe-area-context; usamos un shim JS.
module.exports = {
  dependencies: {
    'react-native-safe-area-context': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};


