import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Compra } from '../types';

const ComprasScreen: React.FC = () => {
  const navigation = useNavigation();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Datos de ejemplo
  const mockCompras: Compra[] = [
    {
      id: '1',
      clienteId: '1',
      productos: [
        { productoId: '1', nombre: 'Laptop Dell', cantidad: 1, precioUnitario: 2500, subtotal: 2500 },
      ],
      total: 2500,
      fecha: new Date('2024-11-08'),
      usuarioRegistro: { uid: 'user1', email: 'admin@test.com' },
    },
    {
      id: '2',
      clienteId: '2',
      productos: [
        { productoId: '2', nombre: 'Mouse Logitech', cantidad: 2, precioUnitario: 50, subtotal: 100 },
      ],
      total: 100,
      fecha: new Date('2024-11-07'),
      usuarioRegistro: { uid: 'user1', email: 'admin@test.com' },
    },
  ];

  useEffect(() => {
    loadCompras();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadCompras();
    }, [])
  );

  const loadCompras = async () => {
    setLoading(true);
    try {
      // Simular carga
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCompras(mockCompras);
    } catch (error) {
      console.error('Error loading compras:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCompras().finally(() => setRefreshing(false));
  };

  const handleNuevaCompra = () => {
    navigation.navigate('CompraForm' as never);
  };

  const renderCompraItem = ({ item }: { item: Compra }) => (
    <TouchableOpacity style={styles.compraCard}>
      <View style={styles.compraHeader}>
        <View style={styles.compraInfo}>
          <Text style={styles.compraId}>Compra #{item.id}</Text>
          <Text style={styles.compraFecha}>
            {item.fecha.toLocaleDateString()} {item.fecha.toLocaleTimeString()}
          </Text>
        </View>
        <View style={styles.compraTotal}>
          <Text style={styles.totalText}>S/ {item.total.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.compraProductos}>
        <Text style={styles.productosLabel}>Productos:</Text>
        {item.productos.map((prod, index) => (
          <Text key={index} style={styles.productoItem}>
            {prod.nombre} x{prod.cantidad} - S/ {prod.subtotal.toFixed(2)}
          </Text>
        ))}
      </View>

      <View style={styles.compraFooter}>
        <Text style={styles.registradoPor}>
          Registrado por: {item.usuarioRegistro.email}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="shopping-cart" size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>Compras</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleNuevaCompra}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{compras.length}</Text>
          <Text style={styles.statLabel}>Total Compras</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            S/ {compras.reduce((sum, c) => sum + c.total, 0).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Total Vendido</Text>
        </View>
      </View>

      {/* Lista de compras */}
      <FlatList
        data={compras}
        renderItem={renderCompraItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="shopping-cart" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No hay compras</Text>
            <Text style={styles.emptyText}>
              Comienza registrando tu primera venta
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  compraCard: {
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
  compraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  compraInfo: {
    flex: 1,
  },
  compraId: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  compraFecha: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  compraTotal: {
    alignItems: 'flex-end',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  compraProductos: {
    marginBottom: 12,
  },
  productosLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  productoItem: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  compraFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  registradoPor: {
    fontSize: 12,
    color: '#9CA3AF',
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

export default ComprasScreen;
