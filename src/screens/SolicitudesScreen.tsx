import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SolicitudProducto } from '../types';
import { getSolicitudesService } from '../services/solicitudesService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const SolicitudesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { userProfile } = useAuth();
  const { success, error } = useToast();

  const [solicitudes, setSolicitudes] = useState<SolicitudProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendiente' | 'preparando' | 'listo' | 'parcial' | 'entregado'>('todos');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Estados para modal de entrega
  const [showEntregaModal, setShowEntregaModal] = useState(false);
  const [solicitudAEntregar, setSolicitudAEntregar] = useState<SolicitudProducto | null>(null);
  const [cantidadAEntregar, setCantidadAEntregar] = useState('');
  const [observacionesEntrega, setObservacionesEntrega] = useState('');

  const solicitudesService = getSolicitudesService();

  useEffect(() => {
    loadSolicitudes();
  }, [filtroEstado]);

  useFocusEffect(
    React.useCallback(() => {
      // Escuchar cambios en tiempo real cuando la pantalla está enfocada
      const unsubscribe = solicitudesService.escucharSolicitudesPendientes((nuevasSolicitudes) => {
        setSolicitudes(nuevasSolicitudes);
      });

      return unsubscribe;
    }, [])
  );

  const loadSolicitudes = async () => {
    try {
      setLoading(true);
      let estado: SolicitudProducto['estado'] | undefined;

      if (filtroEstado !== 'todos') {
        estado = filtroEstado as SolicitudProducto['estado'];
      }

      const data = await solicitudesService.obtenerSolicitudes(estado);
      setSolicitudes(data);
    } catch (err) {
      console.error('Error cargando solicitudes:', err);
      error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSolicitudes();
    setRefreshing(false);
  };

  const handleActualizarEstado = async (solicitudId: string, nuevoEstado: SolicitudProducto['estado']) => {
    const solicitud = solicitudes.find(s => s.id === solicitudId);
    if (!solicitud) return;

    // Si es entrega, abrir modal para especificar cantidad
    if (nuevoEstado === 'entregado') {
      abrirModalEntrega(solicitud);
      return;
    }

    // Para otros estados, confirmar normalmente
    Alert.alert(
      'Confirmar acción',
      `¿Estás seguro de marcar esta solicitud como "${getEstadoTexto(nuevoEstado)}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setUpdatingId(solicitudId);
            try {
              await solicitudesService.actualizarEstadoSolicitud(solicitudId, nuevoEstado);
              success(`Solicitud marcada como ${getEstadoTexto(nuevoEstado)}`);
            } catch (err) {
              console.error('Error actualizando solicitud:', err);
              error('Error al actualizar solicitud');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const abrirModalEntrega = (solicitud: SolicitudProducto) => {
    setSolicitudAEntregar(solicitud);
    const cantidadPendiente = solicitud.cantidadPendiente || solicitud.cantidadSolicitada;
    setCantidadAEntregar(cantidadPendiente.toString());
    setObservacionesEntrega('');
    setShowEntregaModal(true);
  };

  const handleConfirmarEntrega = async () => {
    if (!solicitudAEntregar) return;

    const cantidad = parseInt(cantidadAEntregar);
    if (isNaN(cantidad) || cantidad <= 0) {
      error('Ingresa una cantidad válida');
      return;
    }

    const pendiente = solicitudAEntregar.cantidadPendiente || solicitudAEntregar.cantidadSolicitada;
    if (cantidad > pendiente) {
      error(`No puedes entregar más de ${pendiente} unidades pendientes`);
      return;
    }

    setUpdatingId(solicitudAEntregar.id);
    setShowEntregaModal(false);

    try {
      await solicitudesService.actualizarEstadoSolicitudConCantidad(
        solicitudAEntregar.id,
        'entregado',
        cantidad,
        observacionesEntrega.trim() || undefined
      );
      success(`Entregadas ${cantidad} unidades`);
    } catch (err) {
      console.error('Error confirmando entrega:', err);
      error('Error al confirmar entrega');
    } finally {
      setUpdatingId(null);
      setSolicitudAEntregar(null);
    }
  };

  const cerrarModalEntrega = () => {
    setShowEntregaModal(false);
    setSolicitudAEntregar(null);
    setCantidadAEntregar('');
    setObservacionesEntrega('');
  };

  const getEstadoColor = (estado: SolicitudProducto['estado']) => {
    switch (estado) {
      case 'pendiente': return '#F59E0B';
      case 'preparando': return '#3B82F6';
      case 'listo': return '#10B981';
      case 'parcial': return '#8B5CF6';
      case 'entregado': return '#6B7280';
      case 'cancelado': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getEstadoTexto = (estado: SolicitudProducto['estado']) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'preparando': return 'Preparando';
      case 'listo': return 'Listo para entregar';
      case 'parcial': return 'Entrega Parcial';
      case 'entregado': return 'Entregado';
      case 'cancelado': return 'Cancelado';
      default: return estado;
    }
  };

  const getPrioridadColor = (prioridad: SolicitudProducto['prioridad']) => {
    switch (prioridad) {
      case 'baja': return '#10B981';
      case 'normal': return '#3B82F6';
      case 'alta': return '#F59E0B';
      case 'urgente': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getAccionesDisponibles = (solicitud: SolicitudProducto) => {
    switch (solicitud.estado) {
      case 'pendiente':
        return [{ label: 'Preparar', estado: 'preparando' as const, icon: 'play-arrow' }];
      case 'preparando':
        return [{ label: 'Marcar como listo', estado: 'listo' as const, icon: 'check' }];
      case 'listo':
        return [{ label: 'Entregar', estado: 'entregado' as const, icon: 'local-shipping' }];
      case 'parcial':
        return [{ label: 'Entregar más', estado: 'entregado' as const, icon: 'local-shipping' }];
      default:
        return [];
    }
  };

  const renderSolicitudItem = ({ item }: { item: SolicitudProducto }) => {
    const acciones = getAccionesDisponibles(item);
    const isUpdating = updatingId === item.id;

    return (
      <View style={styles.solicitudCard}>
        <View style={styles.solicitudHeader}>
          <View style={styles.solicitudInfo}>
            <Text style={styles.productoNombre}>{item.productoNombre}</Text>
            <Text style={styles.solicitanteInfo}>
              Solicitado por: {item.solicitanteNombre}
            </Text>
          </View>
          <View style={styles.solicitudEstado}>
            <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(item.estado) + '20' }]}>
              <Text style={[styles.estadoTexto, { color: getEstadoColor(item.estado) }]}>
                {getEstadoTexto(item.estado)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.solicitudDetalles}>
          <View style={styles.detalleRow}>
            <Icon name="shopping-cart" size={16} color="#6B7280" />
            <Text style={styles.detalleTexto}>
              Solicitado: {item.cantidadSolicitada}
              {item.cantidadEntregada ? ` | Entregado: ${item.cantidadEntregada}` : ''}
              {item.cantidadPendiente && item.cantidadPendiente < item.cantidadSolicitada ? ` | Pendiente: ${item.cantidadPendiente}` : ''}
            </Text>
          </View>

          <View style={styles.detalleRow}>
            <Icon name="flag" size={16} color={getPrioridadColor(item.prioridad)} />
            <Text style={[styles.detalleTexto, { color: getPrioridadColor(item.prioridad) }]}>
              Prioridad: {item.prioridad.toUpperCase()}
            </Text>
          </View>

          <View style={styles.detalleRow}>
            <Icon name="schedule" size={16} color="#6B7280" />
            <Text style={styles.detalleTexto}>
              {new Date(item.fechaSolicitud).toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {item.ubicacionEntrega && (
            <View style={styles.detalleRow}>
              <Icon name="location-on" size={16} color="#6B7280" />
              <Text style={styles.detalleTexto}>{item.ubicacionEntrega}</Text>
            </View>
          )}

          {item.notas && (
            <View style={styles.detalleRow}>
              <Icon name="notes" size={16} color="#6B7280" />
              <Text style={styles.detalleTexto} numberOfLines={2}>{item.notas}</Text>
            </View>
          )}
        </View>

        {acciones.length > 0 && (
          <View style={styles.accionesContainer}>
            {acciones.map((accion, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.accionButton,
                  isUpdating && styles.buttonDisabled
                ]}
                onPress={() => handleActualizarEstado(item.id, accion.estado)}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name={accion.icon} size={18} color="#FFFFFF" />
                    <Text style={styles.accionButtonText}>{accion.label}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const getSolicitudesFiltradas = () => {
    if (filtroEstado === 'todos') return solicitudes;
    return solicitudes.filter(s => s.estado === filtroEstado);
  };

  const getEstadisticas = () => {
    const stats = {
      total: solicitudes.length,
      pendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
      preparando: solicitudes.filter(s => s.estado === 'preparando').length,
      listos: solicitudes.filter(s => s.estado === 'listo').length,
      parciales: solicitudes.filter(s => s.estado === 'parcial').length,
      totalEntregados: solicitudes.filter(s => s.estado === 'entregado').length,
    };
    return stats;
  };

  const stats = getEstadisticas();
  const solicitudesFiltradas = getSolicitudesFiltradas();

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando solicitudes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitudes de Productos</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Estadísticas rápidas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' }]}>
          <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{stats.pendientes}</Text>
          <Text style={[styles.statLabel, { color: '#F59E0B' }]}>Pendientes</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' }]}>
          <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{stats.preparando}</Text>
          <Text style={[styles.statLabel, { color: '#3B82F6' }]}>Preparando</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]}>
          <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.listos}</Text>
          <Text style={[styles.statLabel, { color: '#10B981' }]}>Listos</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F3E8FF', borderColor: '#8B5CF6' }]}>
          <Text style={[styles.statNumber, { color: '#8B5CF6' }]}>{stats.parciales}</Text>
          <Text style={[styles.statLabel, { color: '#8B5CF6' }]}>Parciales</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F9FAFB', borderColor: '#6B7280' }]}>
          <Text style={[styles.statNumber, { color: '#6B7280' }]}>{stats.totalEntregados}</Text>
          <Text style={[styles.statLabel, { color: '#6B7280' }]}>Entregados</Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'todos', label: 'Todas', color: '#6B7280' },
            { key: 'pendiente', label: 'Pendientes', color: '#F59E0B' },
            { key: 'preparando', label: 'Preparando', color: '#3B82F6' },
            { key: 'listo', label: 'Listos', color: '#10B981' },
            { key: 'parcial', label: 'Parciales', color: '#8B5CF6' },
            { key: 'entregado', label: 'Entregados', color: '#6B7280' },
          ].map((filtro) => (
            <TouchableOpacity
              key={filtro.key}
              style={[
                styles.filtroButton,
                filtroEstado === filtro.key && { backgroundColor: filtro.color, borderColor: filtro.color }
              ]}
              onPress={() => setFiltroEstado(filtro.key as any)}
            >
              <Text
                style={[
                  styles.filtroText,
                  filtroEstado === filtro.key && { color: '#FFFFFF' }
                ]}
              >
                {filtro.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de solicitudes */}
      <FlatList
        data={solicitudesFiltradas}
        renderItem={renderSolicitudItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="inventory" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No hay solicitudes</Text>
            <Text style={styles.emptyText}>
              {filtroEstado === 'todos'
                ? 'No se encontraron solicitudes en este momento.'
                : `No hay solicitudes en estado "${filtroEstado}".`
              }
            </Text>
          </View>
        }
      />

      {/* Modal de Entrega */}
      <Modal
        visible={showEntregaModal}
        transparent={true}
        animationType="slide"
        onRequestClose={cerrarModalEntrega}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirmar Entrega</Text>
              <TouchableOpacity onPress={cerrarModalEntrega}>
                <Icon name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {solicitudAEntregar && (
              <View style={styles.productoInfo}>
                <Text style={styles.productoNombreModal}>{solicitudAEntregar.productoNombre}</Text>
                <Text style={styles.productoStock}>
                  Solicitado: {solicitudAEntregar.cantidadSolicitada} unidades
                </Text>
                <Text style={styles.productoStock}>
                  Ya entregado: {solicitudAEntregar.cantidadEntregada || 0} unidades
                </Text>
                <Text style={styles.productoStock}>
                  Pendiente: {solicitudAEntregar.cantidadPendiente || solicitudAEntregar.cantidadSolicitada} unidades
                </Text>
              </View>
            )}

            <View style={styles.formContainer}>
              <Text style={styles.label}>Cantidad a entregar ahora</Text>
              <TextInput
                style={styles.input}
                value={cantidadAEntregar}
                onChangeText={(text) => setCantidadAEntregar(text.replace(/[^0-9]/g, ''))}
                placeholder="Ej: 5"
                keyboardType="numeric"
                maxLength={3}
              />

              <Text style={styles.label}>Observaciones (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={observacionesEntrega}
                onChangeText={setObservacionesEntrega}
                placeholder="Notas sobre la entrega..."
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={cerrarModalEntrega}
                disabled={updatingId === solicitudAEntregar?.id}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton, updatingId === solicitudAEntregar?.id && styles.buttonDisabled]}
                onPress={handleConfirmarEntrega}
                disabled={updatingId === solicitudAEntregar?.id}
              >
                {updatingId === solicitudAEntregar?.id ? (
                  <Text style={styles.confirmButtonText}>Procesando...</Text>
                ) : (
                  <>
                    <Icon name="check-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.confirmButtonText}>Confirmar Entrega</Text>
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  filtrosContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filtroButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
  },
  filtroText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  solicitudCard: {
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
  solicitudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  solicitudInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  solicitanteInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  solicitudEstado: {
    alignItems: 'flex-end',
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoTexto: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  solicitudDetalles: {
    marginBottom: 16,
  },
  detalleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detalleTexto: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 8,
    flex: 1,
  },
  accionesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  accionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  accionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 32,
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
    marginBottom: 8,
  },
  productoStock: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
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
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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

export default SolicitudesScreen;
