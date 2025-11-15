// Polyfill ligero de react-native-safe-area-context para entornos donde la lib nativa no está disponible.
// Proporciona una API compatible básica para que la app arranque sin el módulo nativo.
const React = require('react');
const { View } = require('react-native');

const defaultInsets = { top: 0, bottom: 0, left: 0, right: 0 };

const SafeAreaInsetsContext = React.createContext(defaultInsets);

function SafeAreaProvider({ children, initialMetrics }) {
  const value =
    (initialMetrics && initialMetrics.insets) ? initialMetrics.insets : defaultInsets;
  return React.createElement(SafeAreaInsetsContext.Provider, { value }, children);
}

function useSafeAreaInsets() {
  return React.useContext(SafeAreaInsetsContext);
}

function useSafeAreaFrame() {
  // Retorna un frame ficticio; los consumidores suelen usar solo insets
  return { x: 0, y: 0, width: 0, height: 0 };
}

const SafeAreaView = (props) => React.createElement(View, props);

const initialWindowMetrics = { insets: defaultInsets, frame: { x: 0, y: 0, width: 0, height: 0 } };

module.exports = {
  SafeAreaProvider,
  SafeAreaView,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
  useSafeAreaFrame,
  initialWindowMetrics,
};


