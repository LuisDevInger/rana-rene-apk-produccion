import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { rs } from '../utils/responsive';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Cliente, Producto, Compra, CompraProducto } from '../types';
import { useOfflineStorage, useOfflineClientes, useOfflineProductos, useOfflineCompras } from '../hooks/useOfflineStorage';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { syncService } from '../services/syncService';

type ProductoSeleccionado = CompraProducto;

const CompraFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const clienteInicial = (route.params as any)?.clienteId;

  // Hooks
  const { isOnline, pendingSyncCount, syncNow } = useOfflineStorage();
  const { clientes: clientesDisponibles, addCliente: addClienteOffline } = useOfflineClientes();
  const { productos: productosDisponibles, addProducto: addProductoOffline } = useOfflineProductos();
  const { addCompra: addCompraOffline } = useOfflineCompras();
  const { success, error, warning } = useToast();
  const { user } = useAuth();

  // Estados locales
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    // Si viene clienteId desde params, buscarlo
    if (clienteInicial && clientesDisponibles.length > 0) {
      const cliente = clientesDisponibles.find(c => c.id === clienteInicial);
      if (cliente) {
        setClienteSeleccionado(cliente);
      }
    }
  }, [clienteInicial, clientesDisponibles]);

  const agregarProducto = (producto: Producto, cantidad: number = 1) => {
    const productoExistente = productosSeleccionados.find(p => p.productoId === producto.id);

    if (productoExistente) {
      // Actualizar cantidad
      setProductosSeleccionados(prev =>
        prev.map(p =>
          p.productoId === producto.id
            ? { ...p, cantidad: p.cantidad + cantidad, subtotal: (p.cantidad + cantidad) * p.precioUnitario }
            : p
        )
      );
    } else {
      // Agregar nuevo producto
      const nuevoProducto: ProductoSeleccionado = {
        productoId: producto.id,
        nombre: producto.nombre,
        cantidad: cantidad,
        precioUnitario: producto.precio,
        subtotal: cantidad * producto.precio,
      };
      setProductosSeleccionados(prev => [...prev, nuevoProducto]);
    }
    setShowProductoModal(false);
  };

  const removerProducto = (productoId: string) => {
    setProductosSeleccionados(prev => prev.filter(p => p.productoId !== productoId));
  };

  const actualizarCantidad = (productoId: string, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      removerProducto(productoId);
      return;
    }

    setProductosSeleccionados(prev =>
      prev.map(p =>
        p.productoId === productoId
          ? { ...p, cantidad: nuevaCantidad, subtotal: nuevaCantidad * p.precioUnitario }
          : p
      )
    );
  };

  const calcularTotal = () => {
    return productosSeleccionados.reduce((total, producto) => total + producto.subtotal, 0);
  };

  const handleGuardarVenta = async () => {
    if (!clienteSeleccionado) {
      error('Debe seleccionar un cliente');
      return;
    }

    if (productosSeleccionados.length === 0) {
      error('Debe agregar al menos un producto');
      return;
    }

    setSaving(true);
    try {
      const ventaData: Compra = {
        id: `compra_${Date.now()}_${Math.random()}`,
        clienteId: clienteSeleccionado.id,
        productos: productosSeleccionados.map(p => ({
          productoId: p.productoId,
          nombre: p.nombre,
          cantidad: p.cantidad,
          precioUnitario: p.precioUnitario,
          subtotal: p.subtotal,
        })),
        total: calcularTotal(),
        fecha: new Date(),
        usuarioRegistro: {
          uid: user?.uid || 'unknown-user',
          email: user?.email || 'unknown@email.com',
        },
        metodoPago,
        notas: notas.trim() || undefined,
      };

      if (isOnline) {
        // Intentar guardar en el servidor
        try {
          // Llamar a API del backend
          const syncSuccess = await syncService.syncCompra(ventaData);
          if (!syncSuccess) {
            throw new Error('Error al sincronizar con el servidor');
          }

          // También guardar localmente
          await addCompraOffline(ventaData);

          success('Venta registrada correctamente en el servidor');
          setTimeout(() => navigation.goBack(), 1500);
        } catch (e) {
          // Si falla online, guardar offline
          await addCompraOffline(ventaData);
          warning('Venta guardada localmente. Se sincronizará cuando haya conexión.');
          setTimeout(() => navigation.goBack(), 2000);
        }
      } else {
        // Modo offline
        await addCompraOffline(ventaData);

        warning(`Venta guardada localmente. ${pendingSyncCount > 0 ? `${pendingSyncCount} elementos pendientes de sincronización.` : ''}`);
        setTimeout(() => navigation.goBack(), 2000);
      }
    } catch (e) {
      error('No se pudo guardar la venta');
    } finally {
      setSaving(false);
    }
  };

  const renderProductoSeleccionado = ({ item }: { item: ProductoSeleccionado }) => (
    <View style={styles.productoItem}>
      <View style={styles.productoInfo}>
        <Text style={styles.productoNombre}>{item.nombre}</Text>
        <Text style={styles.productoPrecio}>S/ {item.precioUnitario.toFixed(2)} c/u</Text>
      </View>

      <View style={styles.productoControles}>
        <TouchableOpacity
          onPress={() => actualizarCantidad(item.productoId, item.cantidad - 1)}
          style={styles.cantidadButton}
        >
          <Icon name="remove" size={16} color="#6B7280" />
        </TouchableOpacity>

        <Text style={styles.cantidadText}>{item.cantidad}</Text>

        <TouchableOpacity
          onPress={() => actualizarCantidad(item.productoId, item.cantidad + 1)}
          style={styles.cantidadButton}
        >
          <Icon name="add" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.productoSubtotal}>
        <Text style={styles.subtotalText}>S/ {item.subtotal.toFixed(2)}</Text>
        <TouchableOpacity
          onPress={() => removerProducto(item.productoId)}
          style={styles.removeButton}
        >
          <Icon name="delete" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProductoDisponible = ({ item }: { item: Producto }) => (
    <TouchableOpacity
      style={styles.productoDisponible}
      onPress={() => agregarProducto(item)}
    >
      <View style={styles.productoDisponibleInfo}>
        <Text style={styles.productoDisponibleNombre}>{item.nombre}</Text>
        <Text style={styles.productoDisponiblePrecio}>S/ {item.precio.toFixed(2)}</Text>
        <Text style={styles.productoDisponibleStock}>Stock: {item.stock}</Text>
      </View>
      <Icon name="add-circle" size={24} color="#10B981" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nueva Venta</Text>
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
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Selección de Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowClienteModal(true)}
          >
            {clienteSeleccionado ? (
              <View style={styles.clienteSeleccionado}>
                <Text style={styles.clienteNombre}>
                  {clienteSeleccionado.nombre} {clienteSeleccionado.apellido || ''}
                </Text>
                <Text style={styles.clienteEmail}>{clienteSeleccionado.email}</Text>
              </View>
            ) : (
              <Text style={styles.selectorPlaceholder}>Seleccionar cliente</Text>
            )}
            <Icon name="expand-more" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Productos Seleccionados */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Productos</Text>
            <TouchableOpacity
              style={styles.addProductButton}
              onPress={() => setShowProductoModal(true)}
            >
              <Icon name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addProductText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {productosSeleccionados.length === 0 ? (
            <View style={styles.emptyProductos}>
              <Icon name="shopping-cart" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No hay productos seleccionados</Text>
            </View>
          ) : (
            <FlatList
              data={productosSeleccionados}
              renderItem={renderProductoSeleccionado}
              keyExtractor={(item) => item.productoId}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Total y Método de Pago */}
        <View style={styles.section}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>S/ {calcularTotal().toFixed(2)}</Text>
          </View>

          <View style={styles.pagoContainer}>
            <Text style={styles.sectionTitle}>Método de Pago</Text>
            <View style={styles.pagoOpciones}>
              {[
                { value: 'efectivo', label: 'Efectivo', icon: 'payments' },
                { value: 'tarjeta', label: 'Tarjeta', icon: 'credit-card' },
                { value: 'transferencia', label: 'Transferencia', icon: 'account-balance' },
              ].map((opcion) => (
                <TouchableOpacity
                  key={opcion.value}
                  style={[
                    styles.pagoOpcion,
                    metodoPago === opcion.value && styles.pagoOpcionSeleccionada,
                  ]}
                  onPress={() => setMetodoPago(opcion.value)}
                >
                  <Icon
                    name={opcion.icon as any}
                    size={20}
                    color={metodoPago === opcion.value ? '#FFFFFF' : '#6B7280'}
                  />
                  <Text
                    style={[
                      styles.pagoOpcionText,
                      metodoPago === opcion.value && styles.pagoOpcionTextSeleccionada,
                    ]}
                  >
                    {opcion.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.notasContainer}>
            <Text style={styles.sectionTitle}>Notas (opcional)</Text>
            <TextInput
              style={styles.notasInput}
              value={notas}
              onChangeText={setNotas}
              placeholder="Notas adicionales sobre la venta..."
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Botón Guardar */}
        <View style={styles.saveContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleGuardarVenta}
            disabled={saving}
          >
            {saving ? (
              <View style={styles.loadingContainer}>
                <Icon name="hourglass-empty" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Guardando...</Text>
              </View>
            ) : (
              <View style={styles.saveButtonContent}>
                <Icon name="save" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Registrar Venta</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Seleccionar Cliente */}
      <Modal
        visible={showClienteModal}
        animationType="slide"
        onRequestClose={() => setShowClienteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
            <TouchableOpacity onPress={() => setShowClienteModal(false)}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={clientesDisponibles}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setClienteSeleccionado(item);
                  setShowClienteModal(false);
                }}
              >
                <View style={styles.clienteAvatar}>
                  <Text style={styles.avatarText}>
                    {item.nombre.charAt(0)}{item.apellido?.charAt(0) || ''}
                  </Text>
                </View>
                <View style={styles.modalItemInfo}>
                  <Text style={styles.modalItemTitle}>
                    {item.nombre} {item.apellido || ''}
                  </Text>
                  <Text style={styles.modalItemSubtitle}>{item.email}</Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </View>
      </Modal>

      {/* Modal Agregar Producto */}
      <Modal
        visible={showProductoModal}
        animationType="slide"
        onRequestClose={() => setShowProductoModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar Producto</Text>
            <TouchableOpacity onPress={() => setShowProductoModal(false)}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={productosDisponibles}
            renderItem={renderProductoDisponible}
            keyExtractor={(item) => item.id}
          />
        </View>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs.s(16),
    paddingTop: rs.vs(14),
    paddingBottom: rs.vs(10),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  connectivityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: rs.s(16),
    paddingVertical: rs.vs(12),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: rs.s(12),
    backgroundColor: '#F9FAFB',
  },
  selectorPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  clienteSeleccionado: {
    flex: 1,
  },
  clienteNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  clienteEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: rs.s(12),
    paddingVertical: rs.vs(8),
    borderRadius: 8,
  },
  addProductText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyProductos: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  productoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  productoPrecio: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  productoControles: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  cantidadButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cantidadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  productoSubtotal: {
    alignItems: 'flex-end',
  },
  subtotalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  removeButton: {
    marginTop: 4,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  pagoContainer: {
    marginBottom: 16,
  },
  pagoOpciones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  pagoOpcion: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  pagoOpcionSeleccionada: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  pagoOpcionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  pagoOpcionTextSeleccionada: {
    color: '#FFFFFF',
  },
  notasContainer: {
    marginBottom: 16,
  },
  notasInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    textAlignVertical: 'top',
  },
  saveContainer: {
    paddingHorizontal: rs.s(16),
    paddingVertical: rs.vs(14),
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: rs.vs(14),
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  clienteAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  productoDisponible: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: rs.s(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productoDisponibleInfo: {
    flex: 1,
  },
  productoDisponibleNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  productoDisponiblePrecio: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 2,
  },
  productoDisponibleStock: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default CompraFormScreen;
