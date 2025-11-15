import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Producto } from '../types';
import { getAuth } from 'firebase/auth';
import { getSolicitudesService } from '../services/solicitudesService';
import { getAlmacenAPI } from '../services/almacenAPI';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const ProductosScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const { success, error } = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para modal de solicitud
  const [showSolicitudModal, setShowSolicitudModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidadSolicitada, setCantidadSolicitada] = useState('');
  const [notasSolicitud, setNotasSolicitud] = useState('');
  const [prioridadSolicitud, setPrioridadSolicitud] = useState<'baja' | 'normal' | 'alta' | 'urgente'>('normal');
  const [solicitandoProducto, setSolicitandoProducto] = useState(false);

  // Datos de ejemplo
  const mockProductos: Producto[] = [
    {
      id: '1',
      nombre: 'Laptop Dell Inspiron',
      descripcion: 'Laptop de 15.6" con procesador Intel Core i5',
      precio: 2500,
      categoria: 'Computadoras',
      stock: 5,
      stockMinimo: 2,
      activo: true,
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      nombre: 'Mouse Logitech MX Master',
      descripcion: 'Mouse inalámbrico ergonómico',
      precio: 150,
      categoria: 'Accesorios',
      stock: 12,
      stockMinimo: 5,
      activo: true,
      createdAt: new Date('2024-02-01'),
    },
    {
      id: '3',
      nombre: 'Teclado Mecánico RGB',
      descripcion: 'Teclado gaming con switches mecánicos',
      precio: 300,
      categoria: 'Accesorios',
      stock: 1,
      stockMinimo: 3,
      activo: true,
      createdAt: new Date('2024-03-10'),
    },
  ];

  useEffect(() => {
    loadProductos();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadProductos();
    }, [])
  );

  const loadProductos = async () => {
    setLoading(true);
    try {
      const almacenAPI = getAlmacenAPI();

      // Intentar obtener productos del almacén
      const productosAlmacen = await almacenAPI.obtenerProductos();
      setProductos(productosAlmacen);

      success(`Cargados ${productosAlmacen.length} productos del almacén`);

    } catch (almacenError) {
      console.error('Error obteniendo productos del almacén:', almacenError);

      // Fallback a datos mock si el almacén no está disponible
      console.warn('⚠️ Usando datos de respaldo (almacén no disponible)');
      error('No se pudo conectar con el almacén. Mostrando datos limitados.');

      // Aquí podríamos implementar un fallback a datos cacheados o mock
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProductos().finally(() => setRefreshing(false));
  };

  const handleNuevoProducto = () => {
    navigation.navigate('ProductoForm' as never);
  };

  const handleSolicitarProducto = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setCantidadSolicitada('1');
    setNotasSolicitud('');
    setPrioridadSolicitud('normal');
    setShowSolicitudModal(true);
  };

  const handleEnviarSolicitud = async () => {
    if (!productoSeleccionado || !userProfile) return;

    const cantidad = parseInt(cantidadSolicitada);
    if (isNaN(cantidad) || cantidad <= 0) {
      error('Ingresa una cantidad válida');
      return;
    }

    if (cantidad > productoSeleccionado.stock) {
      error('La cantidad solicitada supera el stock disponible');
      return;
    }

    setSolicitandoProducto(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        error('Usuario no autenticado');
        return;
      }

      const solicitudData = {
        productoId: productoSeleccionado.id,
        productoNombre: productoSeleccionado.nombre,
        cantidadSolicitada: cantidad,
        solicitanteId: user.uid,
        solicitanteNombre: userProfile.displayName || user.email?.split('@')[0] || 'Usuario',
        solicitanteEmail: user.email || '',
        prioridad: prioridadSolicitud,
        notas: notasSolicitud.trim() || undefined,
        ubicacionEntrega: 'Almacén Principal',
      };

      const solicitudesService = getSolicitudesService();
      await solicitudesService.crearSolicitud(solicitudData);

      success(`Solicitud enviada: ${productoSeleccionado.nombre}`);
      setShowSolicitudModal(false);
      setProductoSeleccionado(null);

    } catch (err) {
      console.error('Error enviando solicitud:', err);
      error('Error al enviar la solicitud');
    } finally {
      setSolicitandoProducto(false);
    }
  };

  const cerrarModalSolicitud = () => {
    setShowSolicitudModal(false);
    setProductoSeleccionado(null);
    setCantidadSolicitada('');
    setNotasSolicitud('');
    setPrioridadSolicitud('normal');
  };

  const getStockStatus = (producto: Producto) => {
    if (producto.stock <= 0) return { status: 'Sin Stock', color: '#EF4444' };
    if (producto.stock <= producto.stockMinimo) return { status: 'Stock Bajo', color: '#F59E0B' };
    return { status: 'En Stock', color: '#10B981' };
  };

  const renderProductoItem = ({ item }: { item: Producto }) => {
    const stockStatus = getStockStatus(item);

    return (
      <TouchableOpacity style={styles.productoCard}>
        <View style={styles.productoHeader}>
          <View style={styles.productoInfo}>
            <Text style={styles.productoNombre}>{item.nombre}</Text>
            <Text style={styles.productoCategoria}>{item.categoria}</Text>
          </View>
          <View style={styles.productoPrecio}>
            <Text style={styles.precioText}>S/ {item.precio.toFixed(2)}</Text>
          </View>
        </View>

        {item.descripcion && (
          <Text style={styles.productoDescripcion} numberOfLines={2}>
            {item.descripcion}
          </Text>
        )}

        <View style={styles.productoFooter}>
          <View style={styles.stockContainer}>
            <Icon name="inventory" size={16} color="#6B7280" />
            <Text style={styles.stockText}>Stock: {item.stock}</Text>
            <View style={[styles.stockBadge, { backgroundColor: stockStatus.color + '20' }]}>
              <Text style={[styles.stockBadgeText, { color: stockStatus.color }]}>
                {stockStatus.status}
              </Text>
            </View>
          </View>

          {/* Botón Solicitar Producto - Solo para usuarios no almaceneros con stock disponible */}
          {userProfile?.role !== 'almacenero' && item.stock > 0 && (
            <TouchableOpacity
              style={styles.solicitarButton}
              onPress={() => handleSolicitarProducto(item)}
            >
              <Icon name="shopping-cart" size={16} color="#FFFFFF" />
              <Text style={styles.solicitarButtonText}>Solicitar</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const productosConStockBajo = productos.filter(p => p.stock <= p.stockMinimo);
  const productosSinStock = productos.filter(p => p.stock <= 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="inventory" size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>Productos</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleNuevoProducto}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Alertas de Stock */}
      {(productosConStockBajo.length > 0 || productosSinStock.length > 0) && (
        <View style={styles.alertsContainer}>
          {productosSinStock.length > 0 && (
            <View style={[styles.alertCard, { backgroundColor: '#FEF2F2', borderColor: '#EF4444' }]}>
              <Icon name="error" size={20} color="#EF4444" />
              <Text style={[styles.alertText, { color: '#EF4444' }]}>
                {productosSinStock.length} producto{productosSinStock.length !== 1 ? 's' : ''} sin stock
              </Text>
            </View>
          )}
          {productosConStockBajo.length > 0 && productosSinStock.length === 0 && (
            <View style={[styles.alertCard, { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }]}>
              <Icon name="warning" size={20} color="#F59E0B" />
              <Text style={[styles.alertText, { color: '#F59E0B' }]}>
                {productosConStockBajo.length} producto{productosConStockBajo.length !== 1 ? 's' : ''} con stock bajo
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{productos.length}</Text>
          <Text style={styles.statLabel}>Total Productos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{productos.filter(p => p.activo).length}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {productos.reduce((sum, p) => sum + p.stock, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Stock</Text>
        </View>
      </View>

      {/* Lista de productos */}
      <FlatList
        data={productos}
        renderItem={renderProductoItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="inventory" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No hay productos</Text>
            <Text style={styles.emptyText}>
              Comienza agregando tu primer producto
            </Text>
          </View>
        }
      />

      {/* Modal de Solicitud de Producto */}
      <Modal
        visible={showSolicitudModal}
        transparent={true}
        animationType="slide"
        onRequestClose={cerrarModalSolicitud}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Solicitar Producto</Text>
              <TouchableOpacity onPress={cerrarModalSolicitud}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {productoSeleccionado && (
              <View style={styles.productoInfo}>
                <Text style={styles.productoNombreModal}>{productoSeleccionado.nombre}</Text>
                <Text style={styles.productoStock}>Stock disponible: {productoSeleccionado.stock}</Text>
              </View>
            )}

            <View style={styles.formContainer}>
              <Text style={styles.label}>Cantidad a solicitar</Text>
              <TextInput
                style={styles.input}
                value={cantidadSolicitada}
                onChangeText={(text) => setCantidadSolicitada(text.replace(/[^0-9]/g, ''))}
                placeholder="Ej: 5"
                keyboardType="numeric"
                maxLength={3}
              />

              <Text style={styles.label}>Prioridad</Text>
              <View style={styles.prioridadContainer}>
                {[
                  { key: 'baja', label: 'Baja', color: '#10B981' },
                  { key: 'normal', label: 'Normal', color: '#3B82F6' },
                  { key: 'alta', label: 'Alta', color: '#F59E0B' },
                  { key: 'urgente', label: 'Urgente', color: '#EF4444' },
                ].map((prioridad) => (
                  <TouchableOpacity
                    key={prioridad.key}
                    style={[
                      styles.prioridadButton,
                      prioridadSolicitud === prioridad.key && { backgroundColor: prioridad.color },
                    ]}
                    onPress={() => setPrioridadSolicitud(prioridad.key as any)}
                  >
                    <Text
                      style={[
                        styles.prioridadText,
                        prioridadSolicitud === prioridad.key && { color: '#FFFFFF' },
                      ]}
                    >
                      {prioridad.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Notas adicionales (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notasSolicitud}
                onChangeText={setNotasSolicitud}
                placeholder="Especifica detalles adicionales..."
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={cerrarModalSolicitud}
                disabled={solicitandoProducto}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton, solicitandoProducto && styles.buttonDisabled]}
                onPress={handleEnviarSolicitud}
                disabled={solicitandoProducto}
              >
                {solicitandoProducto ? (
                  <Text style={styles.confirmButtonText}>Enviando...</Text>
                ) : (
                  <>
                    <Icon name="send" size={18} color="#FFFFFF" />
                    <Text style={styles.confirmButtonText}>Enviar Solicitud</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  alertsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
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
  productoCard: {
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
  productoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  productoCategoria: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  productoPrecio: {
    alignItems: 'flex-end',
  },
  precioText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  productoDescripcion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  productoFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    marginRight: 8,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '500',
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
  solicitarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  solicitarButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  productoInfo: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  productoNombreModal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  productoStock: {
    fontSize: 14,
    color: '#6B7280',
  },
  formContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  prioridadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  prioridadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
    marginBottom: 8,
  },
  prioridadText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default ProductosScreen;
