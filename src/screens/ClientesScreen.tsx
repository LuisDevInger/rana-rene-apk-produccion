import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Cliente } from '../types';

const { width } = Dimensions.get('window');

const ClientesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Datos de ejemplo - en producción vendrían de Firebase
  const mockClientes: Cliente[] = [
    {
      id: '1',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@email.com',
      telefono: '+51 999 123 456',
      dni: '12345678',
      fechaRegistro: new Date('2024-01-15'),
      totalCompras: 5,
      ultimaCompra: new Date('2024-11-05'),
    },
    {
      id: '2',
      nombre: 'María',
      apellido: 'García',
      email: 'maria.garcia@email.com',
      telefono: '+51 999 654 321',
      dni: '87654321',
      fechaRegistro: new Date('2024-02-20'),
      totalCompras: 3,
      ultimaCompra: new Date('2024-11-03'),
    },
    {
      id: '3',
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      email: 'carlos.rodriguez@email.com',
      telefono: '+51 999 789 012',
      dni: '11223344',
      fechaRegistro: new Date('2024-03-10'),
      totalCompras: 8,
      ultimaCompra: new Date('2024-11-08'),
    },
  ];

  useEffect(() => {
    loadClientes();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadClientes();
    }, [])
  );

  useEffect(() => {
    filterClientes();
  }, [clientes, searchText]);

  const loadClientes = async () => {
    setLoading(true);
    try {
      // Simular carga desde Firebase
      await new Promise(resolve => setTimeout(resolve, 1000));
      setClientes(mockClientes);
    } catch (error) {
      console.error('Error loading clientes:', error);
      Alert.alert('Error', 'No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const filterClientes = () => {
    if (!searchText.trim()) {
      setFilteredClientes(clientes);
      return;
    }

    const filtered = clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
      cliente.apellido?.toLowerCase().includes(searchText.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      cliente.dni?.includes(searchText)
    );
    setFilteredClientes(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadClientes().finally(() => setRefreshing(false));
  };

  const handleAddCliente = () => {
    navigation.navigate('ClienteForm' as never);
  };

  const handleEditCliente = (cliente: Cliente) => {
    navigation.navigate('ClienteForm' as never, { cliente } as never);
  };

  const handleViewCompras = (cliente: Cliente) => {
    // Navigate to client's purchases
    Alert.alert('Compras', `Ver compras de ${cliente.nombre} ${cliente.apellido || ''}`);
  };

  const renderClienteItem = ({ item }: { item: Cliente }) => (
    <TouchableOpacity
      style={styles.clienteCard}
      onPress={() => handleViewCompras(item)}
    >
      <View style={styles.clienteHeader}>
        <View style={styles.clienteAvatar}>
          <Text style={styles.avatarText}>
            {item.nombre.charAt(0)}{item.apellido?.charAt(0) || ''}
          </Text>
        </View>
        <View style={styles.clienteInfo}>
          <Text style={styles.clienteName}>
            {item.nombre} {item.apellido || ''}
          </Text>
          <Text style={styles.clienteEmail}>{item.email}</Text>
          <Text style={styles.clientePhone}>{item.telefono}</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditCliente(item)}
        >
          <Icon name="edit" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={styles.clienteStats}>
        <View style={styles.statItem}>
          <Icon name="shopping-cart" size={16} color="#6B7280" />
          <Text style={styles.statText}>{item.totalCompras} compras</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="schedule" size={16} color="#6B7280" />
          <Text style={styles.statText}>
            {item.ultimaCompra ? new Date(item.ultimaCompra).toLocaleDateString() : 'Sin compras'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="people" size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>Clientes</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddCliente}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Icon name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchText}
            placeholder="Buscar por nombre, email o DNI..."
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="clear" size={20} color="#6B7280" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{filteredClientes.length}</Text>
          <Text style={styles.statLabel}>Total Clientes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {filteredClientes.reduce((sum, c) => sum + c.totalCompras, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Compras</Text>
        </View>
      </View>

      {/* Client List */}
      <FlatList
        data={filteredClientes}
        renderItem={renderClienteItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No hay clientes</Text>
            <Text style={styles.emptyText}>
              {searchText ? 'No se encontraron clientes con esa búsqueda' : 'Comienza agregando tu primer cliente'}
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  clienteCard: {
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
  clienteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clienteAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  clienteInfo: {
    flex: 1,
  },
  clienteName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  clienteEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  clientePhone: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 1,
  },
  editButton: {
    padding: 8,
  },
  clienteStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
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

export default ClientesScreen;
