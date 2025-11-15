import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ClientesScreen from '../screens/ClientesScreen';
import ComprasScreen from '../screens/ComprasScreen';
import ProductosScreen from '../screens/ProductosScreen';
import AlmacenScreen from '../screens/AlmacenScreen';
import AuditoriaScreen from '../screens/AuditoriaScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AdminUtilitiesScreen from '../screens/AdminUtilitiesScreen';
import OCRReceiptScreen from '../screens/OCRReceiptScreen';
import SemanticSearchScreen from '../screens/SemanticSearchScreen';
import AIDashboardScreen from '../screens/AIDashboardScreen';
import ReportesScreen from '../screens/ReportesScreen';
import SolicitudesScreen from '../screens/SolicitudesScreen';
import ClienteFormScreen from '../screens/ClienteFormScreen';
import CompraFormScreen from '../screens/CompraFormScreen';
import ProductoFormScreen from '../screens/ProductoFormScreen';
import MovimientoFormScreen from '../screens/MovimientoFormScreen';

import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList, MainTabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const Drawer = createDrawerNavigator();

const MainTabNavigator = () => {
  const { isAlmacenero, isAdmin, isDeveloper } = useAuth();

  // Configurar pestañas basadas en el rol del usuario
  const getTabScreens = () => {
    if (isAlmacenero && !isAdmin && !isDeveloper) {
      // Almaceneros solo ven Almacén
      return (
        <>
          <Tab.Screen name="Almacen" component={AlmacenScreen} />
        </>
      );
    } else {
      // Administradores, developers y usuarios normales ven todo
      return (
        <>
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Clientes" component={ClientesScreen} />
          <Tab.Screen name="Compras" component={ComprasScreen} />
          <Tab.Screen name="Productos" component={ProductosScreen} />
          <Tab.Screen name="Almacen" component={AlmacenScreen} />
          <Tab.Screen name="Auditoria" component={AuditoriaScreen} />
        </>
      );
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Clientes':
              iconName = 'people';
              break;
            case 'Compras':
              iconName = 'shopping-cart';
              break;
            case 'Productos':
              iconName = 'inventory';
              break;
            case 'Almacen':
              iconName = 'warehouse';
              break;
            case 'Auditoria':
              iconName = 'analytics';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      {getTabScreens()}
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, loading, isAdmin, isDeveloper, isAlmacenero } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            {/* Pantallas accesibles para todos los usuarios autenticados */}
            <Stack.Screen name="OCRReceipt" component={OCRReceiptScreen} />
            <Stack.Screen name="SemanticSearch" component={SemanticSearchScreen} />
            <Stack.Screen name="AIDashboard" component={AIDashboardScreen} />
            <Stack.Screen name="Reportes" component={ReportesScreen} />
            <Stack.Screen name="Solicitudes" component={SolicitudesScreen} />

            {/* Pantallas solo para no almaceneros (usuarios normales, admin, developer) */}
            {!isAlmacenero && (
              <>
                <Stack.Screen name="ClienteForm" component={ClienteFormScreen} />
                <Stack.Screen name="CompraForm" component={CompraFormScreen} />
                <Stack.Screen name="ProductoForm" component={ProductoFormScreen} />
              </>
            )}

            {/* Pantallas accesibles para almaceneros y admin/developer */}
            {(isAlmacenero || isAdmin || isDeveloper) && (
              <Stack.Screen name="MovimientoForm" component={MovimientoFormScreen} />
            )}

            {/* Pantallas solo para admin y developer */}
            {(isAdmin || isDeveloper) && (
              <>
                <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
                <Stack.Screen name="AdminUtilities" component={AdminUtilitiesScreen} />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
