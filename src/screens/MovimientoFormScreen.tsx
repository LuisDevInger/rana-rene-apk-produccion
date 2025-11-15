import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Producto, MovimientoStock } from '../types';
import { useOfflineStorage, useOfflineProductos, useOfflineMovimientos } from '../hooks/useOfflineStorage';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { syncService } from '../services/syncService';

const MovimientoFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const productoInicial = (route.params as any)?.productoId;

  // Hooks de almacenamiento offline
  const { isOnline, pendingSyncCount, syncNow } = useOfflineStorage();
  const { productos: productosDisponibles } = useOfflineProductos();
  const { addMovimiento: addMovimientoOffline } = useOfflineMovimientos();
  const { user } = useAuth();
  const { success, error, warning } = useToast();

  // Estados locales
  const [tipoMovimiento, setTipoMovimiento] = useState<'entrada' | 'salida' | 'venta_directa'>('entrada');
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    // Si viene productoId desde params, buscarlo
    if (productoInicial && productosDisponibles.length > 0) {
      const producto = productosDisponibles.find(p => p.id === productoInicial);
      if (producto) {
        setProductoSeleccionado(producto);
      }
    }
  }, [productoInicial, productosDisponibles]);

  const getTipoMovimientoInfo = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return {
          label: 'Entrada de Stock',
          icon: 'add-circle',
          color: '#10B981',
          description: 'Agregar productos al inventario'
        };
      case 'salida':
        return {
          label: 'Salida de Stock',
          icon: 'remove-circle',
          color: '#EF4444',
          description: 'Quitar productos del inventario'
        };
      case 'venta_directa':
        return {
          label: 'Venta Directa',
          icon: 'shopping-cart',
          color: '#F59E0B',
          description: 'Registrar venta directa sin cliente'
        };
      default:
        return {
          label: 'Movimiento',
          icon: 'inventory',
          color: '#6B7280',
          description: ''
        };
    }
  };

  const validarMovimiento = () => {
    if (!productoSeleccionado) {
      Alert.alert('Error', 'Debe seleccionar un producto');
      return false;
    }

    const cantidadNum = parseInt(cantidad);
    if (!cantidad || cantidadNum <= 0) {
      Alert.alert('Error', 'Debe ingresar una cantidad válida');
      return false;
    }

    if (tipoMovimiento === 'salida' || tipoMovimiento === 'venta_directa') {
      if (cantidadNum > productoSeleccionado.stock) {
        Alert.alert('Error', `No hay suficiente stock. Disponible: ${productoSeleccionado.stock}`);
        return false;
      }
    }

    return true;
  };

  const handleGuardarMovimiento = async () => {
    if (!validarMovimiento()) return;

    setSaving(true);
    try {
      const movimientoData: MovimientoStock = {
        id: `mov_${Date.now()}_${Math.random()}`,
        productoId: productoSeleccionado!.id,
        tipo: tipoMovimiento,
        cantidad: parseInt(cantidad),
        fecha: new Date(),
        usuarioRegistro: {
          uid: user?.uid || 'unknown-user',
          email: user?.email || 'unknown@email.com',
        },
        motivo: motivo.trim() || undefined,
      };

      if (isOnline) {
        // Intentar guardar en el servidor
        try {
          // Llamar a API del backend
          const syncSuccess = await syncService.syncMovimiento(movimientoData);
          if (!syncSuccess) {
            throw new Error('Error al sincronizar con el servidor');
          }

          // También guardar localmente
          await addMovimientoOffline(movimientoData);

          success('Movimiento registrado correctamente en el servidor');
          setTimeout(() => navigation.goBack(), 1500);
        } catch (error) {
          // Si falla online, guardar offline
          await addMovimientoOffline(movimientoData);
          warning('Movimiento guardado localmente. Se sincronizará cuando haya conexión.');
          setTimeout(() => navigation.goBack(), 2000);
        }
      } else {
        // Modo offline
        await addMovimientoOffline(movimientoData);

        warning(`Movimiento guardado localmente. ${pendingSyncCount > 0 ? `${pendingSyncCount} elementos pendientes de sincronización.` : ''}`);
        setTimeout(() => navigation.goBack(), 2000);
      }
    } catch (error) {
      error('No se pudo guardar el movimiento');
    } finally {
      setSaving(false);
    }
  };

  const renderProductoDisponible = ({ item }: { item: Producto }) => (
    <TouchableOpacity
      style={styles.productoDisponible}
      onPress={() => {
        setProductoSeleccionado(item);
        setShowProductoModal(false);
      }}
    >
      <View style={styles.productoDisponibleInfo}>
        <Text style={styles.productoDisponibleNombre}>{item.nombre}</Text>
        <Text style={styles.productoDisponiblePrecio}>S/ {item.precio.toFixed(2)}</Text>
        <Text style={styles.productoDisponibleStock}>Stock actual: {item.stock}</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#6B7280" />
    </TouchableOpacity>
  );

  const tipoInfo = getTipoMovimientoInfo(tipoMovimiento);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Nuevo Movimiento</Text>
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
        {/* Tipo de Movimiento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Movimiento</Text>
          <View style={styles.tipoContainer}>
            {[
              { value: 'entrada', label: 'Entrada', icon: 'add-circle', color: '#10B981' },
              { value: 'salida', label: 'Salida', icon: 'remove-circle', color: '#EF4444' },
              { value: 'venta_directa', label: 'Venta Directa', icon: 'shopping-cart', color: '#F59E0B' },
            ].map((tipo) => (
              <TouchableOpacity
                key={tipo.value}
                style={[
                  styles.tipoOpcion,
                  tipoMovimiento === tipo.value && { borderColor: tipo.color, backgroundColor: tipo.color + '10' },
                ]}
                onPress={() => setTipoMovimiento(tipo.value as any)}
              >
                <Icon
                  name={tipo.icon as any}
                  size={24}
                  color={tipoMovimiento === tipo.value ? tipo.color : '#6B7280'}
                />
                <Text
                  style={[
                    styles.tipoOpcionText,
                    tipoMovimiento === tipo.value && { color: tipo.color, fontWeight: '600' },
                  ]}
                >
                  {tipo.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.tipoDescription}>{tipoInfo.description}</Text>
        </View>

        {/* Selección de Producto */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Producto</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowProductoModal(true)}
          >
            {productoSeleccionado ? (
              <View style={styles.productoSeleccionado}>
                <Text style={styles.productoNombre}>{productoSeleccionado.nombre}</Text>
                <Text style={styles.productoStock}>Stock actual: {productoSeleccionado.stock}</Text>
              </View>
            ) : (
              <Text style={styles.selectorPlaceholder}>Seleccionar producto</Text>
            )}
            <Icon name="expand-more" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Cantidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cantidad</Text>
          <TextInput
            style={styles.input}
            value={cantidad}
            onChangeText={setCantidad}
            placeholder={`Cantidad a ${tipoMovimiento === 'entrada' ? 'ingresar' : 'extraer'}`}
            keyboardType="numeric"
          />
          {productoSeleccionado && tipoMovimiento !== 'entrada' && (
            <Text style={styles.stockWarning}>
              Stock disponible: {productoSeleccionado.stock}
            </Text>
          )}
        </View>

        {/* Motivo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motivo (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={motivo}
            onChangeText={setMotivo}
            placeholder="Describa el motivo del movimiento..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Resumen */}
        {productoSeleccionado && cantidad && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumen</Text>
            <View style={styles.resumenCard}>
              <View style={styles.resumenRow}>
                <Text style={styles.resumenLabel}>Producto:</Text>
                <Text style={styles.resumenValue}>{productoSeleccionado.nombre}</Text>
              </View>
              <View style={styles.resumenRow}>
                <Text style={styles.resumenLabel}>Tipo:</Text>
                <Text style={[styles.resumenValue, { color: tipoInfo.color }]}>
                  {tipoInfo.label}
                </Text>
              </View>
              <View style={styles.resumenRow}>
                <Text style={styles.resumenLabel}>Cantidad:</Text>
                <Text style={styles.resumenValue}>{cantidad} unidades</Text>
              </View>
              <View style={styles.resumenRow}>
                <Text style={styles.resumenLabel}>Stock resultante:</Text>
                <Text style={[styles.resumenValue, { fontWeight: 'bold' }]}>
                  {tipoMovimiento === 'entrada'
                    ? productoSeleccionado.stock + parseInt(cantidad || '0')
                    : productoSeleccionado.stock - parseInt(cantidad || '0')
                  } unidades
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Botón Guardar */}
        <View style={styles.saveContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleGuardarMovimiento}
            disabled={saving || !productoSeleccionado || !cantidad}
          >
            {saving ? (
              <View style={styles.loadingContainer}>
                <Icon name="hourglass-empty" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Guardando...</Text>
              </View>
            ) : (
              <View style={styles.saveButtonContent}>
                <Icon name={tipoInfo.icon as any} size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Registrar Movimiento</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Seleccionar Producto */}
      <Modal
        visible={showProductoModal}
        animationType="slide"
        onRequestClose={() => setShowProductoModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Producto</Text>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tipoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipoOpcion: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  tipoOpcionText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  tipoDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  selectorPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  productoSeleccionado: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  productoStock: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  stockWarning: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
  },
  resumenCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
  },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resumenLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  resumenValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  saveContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
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
  productoDisponible: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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

export default MovimientoFormScreen;
