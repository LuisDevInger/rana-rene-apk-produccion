import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getAlmacenWebSocket } from '../services/almacenWebSocket';
import { getAlmacenAPI } from '../services/almacenAPI';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Logo from '../components/Logo';

const { width } = Dimensions.get('window');

interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  type: 'low_stock' | 'out_of_stock';
  currentStock: number;
  minStock: number;
}

interface Product {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  activo: boolean;
}

interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: 'entrada' | 'salida' | 'venta_directa';
  quantity: number;
  fecha: Date;
  usuarioRegistro: {
    uid: string;
    email: string;
  };
  motivo?: string;
}

interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  total: number;
  fecha: Date;
  usuarioRegistro: {
    uid: string;
    email: string;
  };
}

const AlmacenScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isAlmacenero, isAdmin, isDeveloper } = useAuth();
  const { success, error } = useToast();

  // Estado de conexión WebSocket
  const [wsConnected, setWsConnected] = useState(false);

  // Pestañas activas (como la web)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'movements' | 'sales' | 'alerts'>('dashboard');

  // Estados de datos
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);

  // Estados de carga
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([]);

  // Estados de modales
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showExitForm, setShowExitForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // Filtrar productos cuando cambie la búsqueda
  useEffect(() => {
    const filtered = products.filter(product =>
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  // Filtrar movimientos (podríamos agregar más filtros después)
  useEffect(() => {
    setFilteredMovements(movements);
  }, [movements]);

  // WebSocket setup
  useEffect(() => {
    const ws = getAlmacenWebSocket();

    // Configurar listeners de WebSocket
    ws.on('connected', handleWsConnected);
    ws.on('disconnected', handleWsDisconnected);
    ws.on('error', handleWsError);

    // Eventos del almacén
    ws.on('warehouse.entry', handleStockEntry);
    ws.on('warehouse.exit', handleStockExit);
    ws.on('warehouse.sale_direct', handleSaleDirect);
    ws.on('warehouse.alert.low_stock', (data: any) => handleStockAlert({ ...data, type: 'low_stock' }));
    ws.on('warehouse.alert.out_of_stock', (data: any) => handleStockAlert({ ...data, type: 'out_of_stock' }));

    return () => {
      ws.off('connected', handleWsConnected);
      ws.off('disconnected', handleWsDisconnected);
      ws.off('error', handleWsError);
      ws.off('warehouse.entry', handleStockEntry);
      ws.off('warehouse.exit', handleStockExit);
      ws.off('warehouse.sale_direct', handleSaleDirect);
    };
  }, []);

  // Cargar datos iniciales
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const almacenAPI = getAlmacenAPI();

      // Verificar conexión con almacén
      const conectado = await almacenAPI.verificarConexion();
      if (!conectado) {
        error('No se puede conectar con el almacén backend');
        setLoading(false);
        return;
      }

      // Cargar productos reales del almacén
      const productosAlmacen = await almacenAPI.obtenerProductos();
      setProducts(productosAlmacen);

      // Cargar estadísticas del almacén
      const estadisticas = await almacenAPI.obtenerEstadisticas();
      setStockAlerts([
        ...Array.from({ length: estadisticas.productos_sin_stock }, (_, i) => ({
          id: `sin_stock_${i}`,
          productId: `product_${i}`,
          productName: `Producto ${i + 1}`,
          type: 'out_of_stock' as const,
          currentStock: 0,
          minStock: 1,
        })),
        ...Array.from({ length: estadisticas.productos_bajo_stock }, (_, i) => ({
          id: `bajo_stock_${i}`,
          productId: `product_bajo_${i}`,
          productName: `Producto Bajo ${i + 1}`,
          type: 'low_stock' as const,
          currentStock: 2,
          minStock: 5,
        })),
      ]);

      success(`Almacén conectado - ${productosAlmacen.length} productos cargados`);

      // Inicializar arrays vacíos (los movimientos y ventas vendrían del almacén)
      setMovements([]);
      setSales([]);
      setRecentMovements([]);

    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      // Verificar conexión al enfocar la pantalla
      const ws = getAlmacenWebSocket();
      setWsConnected(ws.isConnected);
    }, [])
  );

  const handleWsConnected = useCallback((data: any) => {
    setWsConnected(true);
    console.log('[AlmacenScreen] WebSocket conectado:', data);
  }, []);

  const handleWsDisconnected = useCallback((data: any) => {
    setWsConnected(false);
    console.log('[AlmacenScreen] WebSocket desconectado:', data);
  }, []);

  const handleWsError = useCallback((error: any) => {
    console.error('[AlmacenScreen] Error WebSocket:', error);
    setWsConnected(false);
  }, []);

  const handleStockEntry = useCallback((data: any) => {
    console.log('[AlmacenScreen] Entrada de stock:', data);
    // Agregar a movimientos recientes
    const movement = {
      id: Date.now().toString(),
      type: 'entry',
      productName: data.product_name || 'Producto',
      quantity: data.quantity,
      timestamp: new Date(),
    };
    setRecentMovements(prev => [movement, ...prev.slice(0, 9)]);
  }, []);

  const handleStockExit = useCallback((data: any) => {
    console.log('[AlmacenScreen] Salida de stock:', data);
    const movement = {
      id: Date.now().toString(),
      type: 'exit',
      productName: data.product_name || 'Producto',
      quantity: data.quantity,
      timestamp: new Date(),
    };
    setRecentMovements(prev => [movement, ...prev.slice(0, 9)]);
  }, []);

  const handleSaleDirect = useCallback((data: any) => {
    console.log('[AlmacenScreen] Venta directa:', data);
    const movement = {
      id: Date.now().toString(),
      type: 'sale',
      productName: data.product_name || 'Producto',
      quantity: data.quantity,
      timestamp: new Date(),
    };
    setRecentMovements(prev => [movement, ...prev.slice(0, 9)]);
  }, []);

  const handleStockAlert = useCallback((data: any) => {
    console.log('[AlmacenScreen] Alerta de stock:', data);
    const alert: StockAlert = {
      id: `alert_${Date.now()}`,
      productId: data.productId,
      productName: data.product_name || 'Producto desconocido',
      type: data.type,
      currentStock: data.current_stock || 0,
      minStock: data.min_stock || 0,
    };
    setStockAlerts(prev => [alert, ...prev.slice(0, 9)]);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Recargar datos del almacén
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAddMovement = () => {
    navigation.navigate('MovimientoForm' as never);
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entry': return 'add-circle';
      case 'exit': return 'remove-circle';
      case 'sale': return 'shopping-cart';
      default: return 'inventory';
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'entry': return '#10B981';
      case 'exit': return '#EF4444';
      case 'sale': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getAlertIcon = (type: string) => {
    return type === 'out_of_stock' ? 'error' : 'warning';
  };

  const getAlertColor = (type: string) => {
    return type === 'out_of_stock' ? '#EF4444' : '#F59E0B';
  };

  // Funciones de renderizado para cada pestaña
  const renderDashboardTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Estadísticas principales */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Icon name="inventory" size={32} color="#3B82F6" />
          <Text style={styles.statNumber}>{products.length}</Text>
          <Text style={styles.statLabel}>Productos</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="swap-horiz" size={32} color="#10B981" />
          <Text style={styles.statNumber}>{movements.length}</Text>
          <Text style={styles.statLabel}>Movimientos</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="shopping-cart" size={32} color="#F59E0B" />
          <Text style={styles.statNumber}>{sales.length}</Text>
          <Text style={styles.statLabel}>Ventas</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="warning" size={32} color="#EF4444" />
          <Text style={styles.statNumber}>{stockAlerts.length}</Text>
          <Text style={styles.statLabel}>Alertas</Text>
        </View>
      </View>

      {/* Acciones rápidas - Solo para almaceneros */}
      {(isAlmacenero || isAdmin || isDeveloper) ? (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={() => setShowEntryForm(true)}
          >
            <Icon name="add-circle" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Entrada</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
            onPress={() => setShowExitForm(true)}
          >
            <Icon name="remove-circle" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Salida</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
            onPress={() => setShowSaleForm(true)}
          >
            <Icon name="shopping-cart" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Venta Directa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
            onPress={() => navigation.navigate('Solicitudes' as never)}
          >
            <Icon name="assignment" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Solicitudes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Mensaje para usuarios sin permisos de almacenero */
        <View style={styles.permissionMessage}>
          <Icon name="info" size={24} color="#6B7280" />
          <Text style={styles.permissionText}>
            Solo puedes ver información del almacén. Contacta a un administrador para gestionar stock.
          </Text>
        </View>
      )}

      {/* Movimientos recientes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Movimientos Recientes</Text>
        {recentMovements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="history" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No hay movimientos recientes</Text>
          </View>
        ) : (
          recentMovements.map((movement) => (
            <View key={movement.id} style={styles.movementCard}>
              <View style={styles.movementHeader}>
                <View style={[styles.movementIcon, { backgroundColor: getMovementColor(movement.type) + '20' }]}>
                  <Icon
                    name={getMovementIcon(movement.type)}
                    size={20}
                    color={getMovementColor(movement.type)}
                  />
                </View>
                <View style={styles.movementInfo}>
                  <Text style={styles.movementProduct}>{movement.productName}</Text>
                  <Text style={styles.movementTime}>
                    {movement.timestamp.toLocaleTimeString()}
                  </Text>
                </View>
                <View style={styles.movementQuantity}>
                  <Text style={[styles.quantityText, { color: getMovementColor(movement.type) }]}>
                    {movement.type === 'exit' || movement.type === 'sale' ? '-' : '+'}{movement.quantity}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderProductsTab = () => (
    <View style={styles.fullHeight}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Icon name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchText}
            placeholder="Buscar productos..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Icon name="clear" size={20} color="#6B7280" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Lista de productos */}
      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.nombre}</Text>
              <Text style={styles.productCategory}>{item.categoria}</Text>
              <Text style={styles.productPrice}>S/ {item.precio.toFixed(2)}</Text>
            </View>
            <View style={styles.productStock}>
              <Text style={styles.stockText}>Stock: {item.stock}</Text>
              <View style={[styles.stockBadge, {
                backgroundColor: item.stock <= 0 ? '#EF4444' : item.stock <= 5 ? '#F59E0B' : '#10B981'
              }]}>
                <Text style={styles.stockBadgeText}>
                  {item.stock <= 0 ? 'Sin Stock' : item.stock <= 5 ? 'Stock Bajo' : 'En Stock'}
                </Text>
              </View>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="inventory" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No hay productos</Text>
            <Text style={styles.emptyText}>
              {searchTerm ? 'No se encontraron productos con esa búsqueda' : 'Comienza agregando productos al almacén'}
            </Text>
          </View>
        }
      />
    </View>
  );

  const renderMovementsTab = () => (
    <View style={styles.fullHeight}>
      {/* Lista de movimientos */}
      <FlatList
        data={filteredMovements}
        renderItem={({ item }) => (
          <View style={styles.movementDetailCard}>
            <View style={styles.movementDetailHeader}>
              <View style={[styles.movementTypeIcon, { backgroundColor: getMovementColor(item.type) + '20' }]}>
                <Icon
                  name={getMovementIcon(item.type)}
                  size={24}
                  color={getMovementColor(item.type)}
                />
              </View>
              <View style={styles.movementDetailInfo}>
                <Text style={styles.movementDetailProduct}>{item.productName}</Text>
                <Text style={styles.movementDetailType}>
                  {item.type === 'entrada' ? 'Entrada' :
                   item.type === 'salida' ? 'Salida' :
                   item.type === 'venta_directa' ? 'Venta Directa' : 'Movimiento'}
                </Text>
                <Text style={styles.movementDetailDate}>
                  {item.fecha.toLocaleDateString()} {item.fecha.toLocaleTimeString()}
                </Text>
              </View>
              <View style={styles.movementDetailQuantity}>
                <Text style={[styles.quantityText, { color: getMovementColor(item.type) }]}>
                  {item.type === 'salida' || item.type === 'venta_directa' ? '-' : '+'}{item.quantity}
                </Text>
              </View>
            </View>
            {item.motivo && (
              <View style={styles.movementDetailMotivo}>
                <Text style={styles.motivoText}>{item.motivo}</Text>
              </View>
            )}
            <View style={styles.movementDetailFooter}>
              <Text style={styles.userText}>Por: {item.usuarioRegistro.email}</Text>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="history" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No hay movimientos</Text>
            <Text style={styles.emptyText}>Los movimientos aparecerán aquí</Text>
          </View>
        }
      />
    </View>
  );

  const renderSalesTab = () => (
    <View style={styles.fullHeight}>
      {/* Lista de ventas directas */}
      <FlatList
        data={sales}
        renderItem={({ item }) => (
          <View style={styles.saleCard}>
            <View style={styles.saleHeader}>
              <View style={styles.saleIcon}>
                <Icon name="shopping-cart" size={24} color="#F59E0B" />
              </View>
              <View style={styles.saleInfo}>
                <Text style={styles.saleProduct}>{item.productName}</Text>
                <Text style={styles.saleDate}>
                  {item.fecha.toLocaleDateString()} {item.fecha.toLocaleTimeString()}
                </Text>
              </View>
              <View style={styles.saleAmount}>
                <Text style={styles.amountText}>S/ {item.total.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.saleDetails}>
              <Text style={styles.saleQuantity}>Cantidad: {item.quantity}</Text>
              <Text style={styles.saleUser}>Por: {item.usuarioRegistro.email}</Text>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="shopping-cart" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No hay ventas directas</Text>
            <Text style={styles.emptyText}>Las ventas directas aparecerán aquí</Text>
          </View>
        }
      />
    </View>
  );

  const renderAlertsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Alertas de stock */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alertas de Stock</Text>
        {stockAlerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="check-circle" size={64} color="#10B981" />
            <Text style={styles.emptyTitle}>Sin alertas</Text>
            <Text style={styles.emptyText}>Todos los productos están en niveles óptimos de stock</Text>
          </View>
        ) : (
          stockAlerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <Icon
                  name={getAlertIcon(alert.type)}
                  size={24}
                  color={getAlertColor(alert.type)}
                />
                <Text style={[styles.alertTitle, { color: getAlertColor(alert.type) }]}>
                  {alert.type === 'out_of_stock' ? 'Sin Stock' : 'Stock Bajo'}
                </Text>
              </View>
              <Text style={styles.alertProduct}>{alert.productName}</Text>
              <Text style={styles.alertDetails}>
                Stock actual: {alert.currentStock} | Mínimo requerido: {alert.minStock}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Logo size={32} />
          <Text style={styles.headerTitle}>Almacén</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.connectionStatus}>
            <View style={[styles.statusDot, { backgroundColor: wsConnected ? '#10B981' : '#EF4444' }]} />
            <Text style={[styles.statusText, { color: wsConnected ? '#10B981' : '#EF4444' }]}>
              {wsConnected ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      {/* Pestañas (como la web) */}
      <View style={styles.tabs}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
          { id: 'products', label: 'Productos', icon: 'inventory' },
          { id: 'movements', label: 'Movimientos', icon: 'swap-horiz' },
          { id: 'sales', label: 'Ventas', icon: 'shopping-cart' },
          { id: 'alerts', label: 'Alertas', icon: 'warning' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Icon
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.id ? '#FFFFFF' : '#6B7280'}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenido de cada pestaña */}
      <View style={styles.tabContent}>
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'products' && renderProductsTab()}
        {activeTab === 'movements' && renderMovementsTab()}
        {activeTab === 'sales' && renderSalesTab()}
        {activeTab === 'alerts' && renderAlertsTab()}
      </View>
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
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    marginHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 16,
    borderRadius: 12,
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
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  alertProduct: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  alertDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  movementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  movementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  movementIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  movementInfo: {
    flex: 1,
  },
  movementProduct: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  movementTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  movementQuantity: {
    alignItems: 'flex-end',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
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
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
  },
  fullHeight: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  listContainer: {
    padding: 20,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  productStock: {
    alignItems: 'flex-end',
  },
  stockText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  movementDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  movementDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  movementTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  movementDetailInfo: {
    flex: 1,
  },
  movementDetailProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  movementDetailType: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  movementDetailDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  movementDetailQuantity: {
    alignItems: 'flex-end',
  },
  movementDetailMotivo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  motivoText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  movementDetailFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  userText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  saleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F59E0B20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  saleInfo: {
    flex: 1,
  },
  saleProduct: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  saleDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  saleAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  saleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  saleQuantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  saleUser: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  permissionMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  permissionText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default AlmacenScreen;
