/**
 * Control de Ventas - React Native App
 * Aplicación nativa completa con funcionalidades del almacén
 */

import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';

// Context providers
import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/contexts/ToastContext';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Notifications
import { configureNotifications } from './src/services/notifications';
import { getFCMService } from './src/services/fcmService';

// Theme
const theme = {
  colors: {
    primary: '#3B82F6',
    accent: '#10B981',
  },
};

function App() {
  useEffect(() => {
    // Configurar notificaciones al iniciar la app
    configureNotifications();

    // Inicializar Firebase Cloud Messaging
    getFCMService();
  }, []);

  return (
    <PaperProvider theme={theme}>
      <ToastProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ToastProvider>
    </PaperProvider>
  );
}

export default App;
