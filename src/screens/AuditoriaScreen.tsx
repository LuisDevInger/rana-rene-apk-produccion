import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: Date;
  details?: string;
}

const AuditoriaScreen: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Datos de ejemplo
  const mockLogs: AuditLog[] = [
    {
      id: '1',
      action: 'Creación de usuario',
      user: 'admin@test.com',
      timestamp: new Date('2024-11-09T10:30:00'),
      details: 'Usuario "juan.perez" creado',
    },
    {
      id: '2',
      action: 'Nueva venta',
      user: 'vendedor@test.com',
      timestamp: new Date('2024-11-09T09:15:00'),
      details: 'Venta #123 - Total: S/ 450.00',
    },
    {
      id: '3',
      action: 'Actualización de producto',
      user: 'admin@test.com',
      timestamp: new Date('2024-11-08T16:45:00'),
      details: 'Producto "Laptop Dell" actualizado',
    },
    {
      id: '4',
      action: 'Entrada de stock',
      user: 'almacen@test.com',
      timestamp: new Date('2024-11-08T14:20:00'),
      details: 'Producto "Mouse Logitech" +10 unidades',
    },
  ];

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLogs(mockLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLogs().finally(() => setRefreshing(false));
  };

  const getActionIcon = (action: string) => {
    if (action.includes('usuario') || action.includes('Usuario')) return 'person';
    if (action.includes('venta') || action.includes('Venta')) return 'shopping-cart';
    if (action.includes('producto') || action.includes('Producto')) return 'inventory';
    if (action.includes('stock') || action.includes('Stock')) return 'warehouse';
    return 'history';
  };

  const getActionColor = (action: string) => {
    if (action.includes('Creación') || action.includes('Nueva')) return '#10B981';
    if (action.includes('Actualización') || action.includes('Entrada')) return '#3B82F6';
    if (action.includes('Eliminación') || action.includes('Salida')) return '#EF4444';
    return '#6B7280';
  };

  const renderLogItem = ({ item }: { item: AuditLog }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={[styles.logIcon, { backgroundColor: getActionColor(item.action) + '20' }]}>
          <Icon
            name={getActionIcon(item.action)}
            size={20}
            color={getActionColor(item.action)}
          />
        </View>
        <View style={styles.logInfo}>
          <Text style={styles.logAction}>{item.action}</Text>
          <Text style={styles.logUser}>{item.user}</Text>
        </View>
        <View style={styles.logTime}>
          <Text style={styles.timeText}>
            {item.timestamp.toLocaleDateString()}
          </Text>
          <Text style={styles.timeText}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      {item.details && (
        <View style={styles.logDetails}>
          <Text style={styles.detailsText}>{item.details}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="analytics" size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>Auditoría</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{logs.length}</Text>
          <Text style={styles.statLabel}>Total Eventos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {logs.filter(l => {
              const today = new Date();
              const logDate = new Date(l.timestamp);
              return logDate.toDateString() === today.toDateString();
            }).length}
          </Text>
          <Text style={styles.statLabel}>Hoy</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {new Set(logs.map(l => l.user)).size}
          </Text>
          <Text style={styles.statLabel}>Usuarios Activos</Text>
        </View>
      </View>

      {/* Lista de logs */}
      <FlatList
        data={logs}
        renderItem={renderLogItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="history" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No hay registros</Text>
            <Text style={styles.emptyText}>
              Los eventos de auditoría aparecerán aquí
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logInfo: {
    flex: 1,
  },
  logAction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  logUser: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  logTime: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  logDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default AuditoriaScreen;
