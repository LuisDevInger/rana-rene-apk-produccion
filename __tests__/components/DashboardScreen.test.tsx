// Tests de componente para DashboardScreen
import React from 'react';
import { render } from '@testing-library/react-native';
import DashboardScreen from '../../src/screens/DashboardScreen';

// Mock de navegación
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
  useFocusEffect: jest.fn((callback) => callback()),
}));

// Mock de hooks
jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../src/hooks/useOfflineStorage', () => ({
  useOfflineStorage: () => ({
    isOnline: true,
    pendingSyncCount: 0,
    syncNow: jest.fn(),
  }),
}));

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra acciones para almaceneros', () => {
    // Mock del hook de auth para almacenero
    const mockUseAuth = require('../../src/contexts/AuthContext').useAuth;
    mockUseAuth.mockReturnValue({
      userProfile: { displayName: 'Almacenero Test' },
      isAlmacenero: true,
      isAdmin: false,
      isDeveloper: false,
    });

    const { getByText, queryByText } = render(<DashboardScreen />);

    // Verificar que se muestran acciones específicas de almacenero
    expect(getByText('Entrada Stock')).toBeTruthy();
    expect(getByText('Salida Stock')).toBeTruthy();
    expect(getByText('Venta Directa')).toBeTruthy();

    // Verificar que NO se muestran acciones de usuario normal
    expect(queryByText('Nuevo Cliente')).toBeNull();
    expect(queryByText('Nueva Venta')).toBeNull();
  });

  it('muestra acciones para usuarios normales', () => {
    // Mock del hook de auth para usuario normal
    const mockUseAuth = require('../../src/contexts/AuthContext').useAuth;
    mockUseAuth.mockReturnValue({
      userProfile: { displayName: 'Usuario Test' },
      isAlmacenero: false,
      isAdmin: false,
      isDeveloper: false,
    });

    const { getByText, queryByText } = render(<DashboardScreen />);

    // Verificar que se muestran acciones de usuario normal
    expect(getByText('Nuevo Cliente')).toBeTruthy();
    expect(getByText('Nueva Venta')).toBeTruthy();
    expect(getByText('Escanear Recibo')).toBeTruthy();

    // Verificar que NO se muestran acciones de almacenero
    expect(queryByText('Entrada Stock')).toBeNull();
    expect(queryByText('Salida Stock')).toBeNull();
  });

  it('muestra botón de utilidades para administradores', () => {
    // Mock del hook de auth para admin
    const mockUseAuth = require('../../src/contexts/AuthContext').useAuth;
    mockUseAuth.mockReturnValue({
      userProfile: { displayName: 'Admin Test' },
      isAlmacenero: false,
      isAdmin: true,
      isDeveloper: false,
    });

    const { getByText } = render(<DashboardScreen />);

    // Verificar que se muestra el botón de utilidades
    expect(getByText('Utilidades')).toBeTruthy();
  });

  it('no muestra botón de utilidades para usuarios normales', () => {
    // Mock del hook de auth para usuario normal
    const mockUseAuth = require('../../src/contexts/AuthContext').useAuth;
    mockUseAuth.mockReturnValue({
      userProfile: { displayName: 'Usuario Test' },
      isAlmacenero: false,
      isAdmin: false,
      isDeveloper: false,
    });

    const { queryByText } = render(<DashboardScreen />);

    // Verificar que NO se muestra el botón de utilidades
    expect(queryByText('Utilidades')).toBeNull();
  });
});