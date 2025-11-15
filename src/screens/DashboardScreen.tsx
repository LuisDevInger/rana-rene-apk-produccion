import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { rs } from '../utils/responsive';
import { useOfflineStorage } from '../hooks/useOfflineStorage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Cliente, Compra, Producto } from '../types';
import Logo from '../components/Logo';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalClientes: number;
  totalCompras: number;
  totalProductos: number;
  totalVentas: number;
  ventasHoy: number;
  clientesNuevos: number;
}

const DashboardScreen: React.FC = () => {
  const { userProfile, isAdmin, isDeveloper, isAlmacenero } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { isOnline, pendingSyncCount, syncNow } = useOfflineStorage();
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    totalCompras: 0,
    totalProductos: 0,
    totalVentas: 0,
    ventasHoy: 0,
    clientesNuevos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      // Aquí iría la lógica para cargar datos desde Firebase
      // Por ahora usamos datos de ejemplo
      setStats({
        totalClientes: 45,
        totalCompras: 128,
        totalProductos: 67,
        totalVentas: 15420.50,
        ventasHoy: 1250.00,
        clientesNuevos: 3,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
    subtitle
  }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    subtitle?: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIcon}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const QuickAction = ({
    title,
    icon,
    onPress,
    color = '#3B82F6'
  }: {
    title: string;
    icon: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity
      style={[styles.quickAction, { borderColor: color }]}
      onPress={onPress}
    >
      <Icon name={icon} size={28} color={color} />
      <Text style={[styles.quickActionText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View>
            <Text style={styles.greeting}>¡Hola!</Text>
            <Text style={styles.userName}>
              {userProfile?.displayName || userProfile?.email || 'Usuario'}
            </Text>
          </View>
          <View style={styles.connectivityIndicator}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#EF4444' }]} />
            <Text style={[styles.statusText, { color: isOnline ? '#10B981' : '#EF4444' }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
            {!isOnline && pendingSyncCount > 0 && (
              <Text style={styles.pendingText}> ({pendingSyncCount})</Text>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          {(isAdmin || isDeveloper) && (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => navigation.navigate('AdminUsers')}
            >
              <Icon name="admin-panel-settings" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          {pendingSyncCount > 0 && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={syncNow}
            >
              <Icon name="sync" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <View style={styles.headerIcon}>
            <Logo size={48} />
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Clientes"
          value={stats.totalClientes}
          icon="people"
          color="#10B981"
        />
        <StatCard
          title="Total Compras"
          value={stats.totalCompras}
          icon="shopping-cart"
          color="#F59E0B"
        />
        <StatCard
          title="Productos"
          value={stats.totalProductos}
          icon="inventory"
          color="#8B5CF6"
        />
        <StatCard
          title="Ventas Totales"
          value={`S/ ${stats.totalVentas.toFixed(2)}`}
          icon="attach-money"
          color="#EF4444"
        />
        <StatCard
          title="Ventas Hoy"
          value={`S/ ${stats.ventasHoy.toFixed(2)}`}
          icon="today"
          color="#06B6D4"
          subtitle="Hoy"
        />
        <StatCard
          title="Clientes Nuevos"
          value={stats.clientesNuevos}
          icon="person-add"
          color="#84CC16"
          subtitle="Esta semana"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.quickActionsGrid}>
          {/* Acciones para almaceneros */}
          {isAlmacenero && !isAdmin && !isDeveloper ? (
            <>
              <QuickAction
                title="Entrada Stock"
                icon="add-circle"
                onPress={() => navigation.navigate('MovimientoForm', { type: 'entrada' })}
              />
              <QuickAction
                title="Salida Stock"
                icon="remove-circle"
                onPress={() => navigation.navigate('MovimientoForm', { type: 'salida' })}
              />
              <QuickAction
                title="Venta Directa"
                icon="shopping-cart"
                onPress={() => navigation.navigate('MovimientoForm', { type: 'venta_directa' })}
              />
              <QuickAction
                title="Ver Productos"
                icon="inventory"
                onPress={() => {/* Navigate to products */}}
              />
              <QuickAction
                title="📋 Solicitudes"
                icon="assignment"
                onPress={() => navigation.navigate('Solicitudes')}
              />
            </>
          ) : (
            /* Acciones para usuarios normales, admin y developers */
            <>
              <QuickAction
                title="Nuevo Cliente"
                icon="person-add"
                onPress={() => navigation.navigate('ClienteForm')}
              />
              <QuickAction
                title="Nueva Venta"
                icon="add-shopping-cart"
                onPress={() => navigation.navigate('CompraForm')}
              />
              <QuickAction
                title="Escanear Recibo"
                icon="receipt"
                onPress={() => navigation.navigate('OCRReceipt')}
              />
              <QuickAction
                title="Buscar Recibos"
                icon="search"
                onPress={() => navigation.navigate('SemanticSearch')}
              />
              <QuickAction
                title="Panel IA"
                icon="smart_toy"
                onPress={() => navigation.navigate('AIDashboard')}
              />
              <QuickAction
                title="Reportes PDF"
                icon="analytics"
                onPress={() => navigation.navigate('Reportes')}
              />
              {(isAdmin || isDeveloper) && (
                <QuickAction
                  title="Utilidades"
                  icon="settings"
                  onPress={() => navigation.navigate('AdminUtilities')}
                />
              )}
              <QuickAction
                title="Ver Inventario"
                icon="inventory"
                onPress={() => {/* Navigate to inventory */}}
              />
            </>
          )}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actividad Reciente</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Icon name="shopping-cart" size={20} color="#10B981" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Nueva venta registrada</Text>
              <Text style={styles.activitySubtitle}>Hace 5 minutos - Juan Pérez</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Icon name="person-add" size={20} color="#3B82F6" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Cliente registrado</Text>
              <Text style={styles.activitySubtitle}>Hace 15 minutos - María García</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Icon name="inventory" size={20} color="#F59E0B" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Producto actualizado</Text>
              <Text style={styles.activitySubtitle}>Hace 1 hora - Laptop Dell</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectivityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pendingText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  syncButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  adminButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  greeting: {
    fontSize: 16,
    color: '#6b7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    paddingHorizontal: rs.s(16),
    paddingBottom: rs.vs(12),
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 1,
  },
  section: {
    paddingHorizontal: rs.s(16),
    paddingBottom: rs.vs(12),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: rs.s(8),
  },
  quickAction: {
    width: '48%', // 2 columnas fluidas
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: rs.s(14),
    alignItems: 'center',
    marginBottom: rs.vs(8),
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
});

export default DashboardScreen;
