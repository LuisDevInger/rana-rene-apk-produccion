import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useToast } from '../contexts/ToastContext';

const AdminUtilitiesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { success, error, warning } = useToast();

  // Estados
  const [loading, setLoading] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [cleaningCache, setCleaningCache] = useState(false);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalClientes: 0,
    totalCompras: 0,
    totalProductos: 0,
    dbSize: '0 MB',
    cacheSize: '0 MB',
    lastSync: null
  });

  // Cargar estadísticas del sistema
  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      // Aquí iría la lógica para cargar estadísticas reales del sistema
      // Por ahora usamos datos simulados
      setSystemStats({
        totalUsers: 5,
        totalClientes: 45,
        totalCompras: 128,
        totalProductos: 67,
        dbSize: '2.3 MB',
        cacheSize: '156 KB',
        lastSync: new Date().toISOString()
      });
      setLastBackup(new Date().toISOString());
    } catch (err) {
      console.error('Error loading system stats:', err);
    }
  };

  // Realizar backup manual
  const performManualBackup = async () => {
    Alert.alert(
      'Backup Manual',
      '¿Deseas crear un backup completo de todos los datos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear Backup',
          onPress: async () => {
            setBackupInProgress(true);
            try {
              // Aquí iría la lógica para crear backup
              console.log('Creando backup manual...');

              // Simular proceso de backup
              await new Promise(resolve => setTimeout(resolve, 3000));

              const now = new Date().toISOString();
              setLastBackup(now);
              success('Backup completado exitosamente');
            } catch (err) {
              console.error('Error creating backup:', err);
              error('Error al crear el backup');
            } finally {
              setBackupInProgress(false);
            }
          }
        }
      ]
    );
  };

  // Sincronizar datos
  const syncData = async () => {
    setSyncInProgress(true);
    try {
      // Aquí iría la lógica para sincronizar datos
      console.log('Sincronizando datos...');

      // Simular sincronización
      await new Promise(resolve => setTimeout(resolve, 2000));

      success('Datos sincronizados correctamente');
      loadSystemStats(); // Recargar estadísticas
    } catch (err) {
      console.error('Error syncing data:', err);
      error('Error al sincronizar datos');
    } finally {
      setSyncInProgress(false);
    }
  };

  // Limpiar caché
  const clearCache = async () => {
    Alert.alert(
      'Limpiar Caché',
      '¿Deseas limpiar el caché de la aplicación? Esto puede mejorar el rendimiento.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          onPress: async () => {
            setCleaningCache(true);
            try {
              // Aquí iría la lógica para limpiar caché
              console.log('Limpiando caché...');

              // Simular limpieza
              await new Promise(resolve => setTimeout(resolve, 1500));

              success('Caché limpiado correctamente');
              loadSystemStats(); // Recargar estadísticas
            } catch (err) {
              console.error('Error clearing cache:', err);
              error('Error al limpiar el caché');
            } finally {
              setCleaningCache(false);
            }
          }
        }
      ]
    );
  };

  // Exportar datos
  const exportData = async () => {
    Alert.alert(
      'Exportar Datos',
      '¿Deseas exportar todos los datos a un archivo JSON?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Exportar',
          onPress: async () => {
            setLoading(true);
            try {
              // Aquí iría la lógica para exportar datos
              console.log('Exportando datos...');

              // Simular exportación
              await new Promise(resolve => setTimeout(resolve, 2500));

              success('Datos exportados correctamente');
            } catch (err) {
              console.error('Error exporting data:', err);
              error('Error al exportar datos');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Importar datos
  const importData = () => {
    Alert.alert(
      'Importar Datos',
      'Esta funcionalidad requiere permisos especiales y debe ser realizada por un administrador del sistema.',
      [
        { text: 'Entendido', style: 'default' }
      ]
    );
  };

  // Optimizar base de datos
  const optimizeDatabase = async () => {
    setLoading(true);
    try {
      // Aquí iría la lógica para optimizar la base de datos
      console.log('Optimizando base de datos...');

      // Simular optimización
      await new Promise(resolve => setTimeout(resolve, 2000));

      success('Base de datos optimizada correctamente');
    } catch (err) {
      console.error('Error optimizing database:', err);
      error('Error al optimizar la base de datos');
    } finally {
      setLoading(false);
    }
  };

  // Configurar backup automático
  const toggleAutoBackup = (value: boolean) => {
    setAutoBackupEnabled(value);
    if (value) {
      success('Backup automático habilitado');
    } else {
      warning('Backup automático deshabilitado');
    }
  };

  // Cambiar frecuencia de backup
  const changeBackupFrequency = (frequency: string) => {
    setBackupFrequency(frequency);
    success(`Frecuencia de backup cambiada a ${frequency === 'daily' ? 'diaria' : frequency === 'weekly' ? 'semanal' : 'mensual'}`);
  };

  // Formatear fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Utilidades Administrativas</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Estadísticas del Sistema */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas del Sistema</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="people" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{systemStats.totalUsers}</Text>
            <Text style={styles.statLabel}>Usuarios</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="person" size={24} color="#10B981" />
            <Text style={styles.statValue}>{systemStats.totalClientes}</Text>
            <Text style={styles.statLabel}>Clientes</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="shopping-cart" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{systemStats.totalCompras}</Text>
            <Text style={styles.statLabel}>Compras</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="inventory" size={24} color="#EF4444" />
            <Text style={styles.statValue}>{systemStats.totalProductos}</Text>
            <Text style={styles.statLabel}>Productos</Text>
          </View>
        </View>

        <View style={styles.systemInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tamaño BD:</Text>
            <Text style={styles.infoValue}>{systemStats.dbSize}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tamaño Caché:</Text>
            <Text style={styles.infoValue}>{systemStats.cacheSize}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Última Sincronización:</Text>
            <Text style={styles.infoValue}>{formatDate(systemStats.lastSync)}</Text>
          </View>
        </View>
      </View>

      {/* Backup y Restauración */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backup y Sincronización</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Backup Automático</Text>
            <Text style={styles.settingDescription}>Crear backups automáticamente</Text>
          </View>
          <Switch
            value={autoBackupEnabled}
            onValueChange={toggleAutoBackup}
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {autoBackupEnabled && (
          <View style={styles.frequencyOptions}>
            <Text style={styles.frequencyLabel}>Frecuencia:</Text>
            <View style={styles.frequencyButtons}>
              {[
                { value: 'daily', label: 'Diario' },
                { value: 'weekly', label: 'Semanal' },
                { value: 'monthly', label: 'Mensual' }
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.frequencyButton,
                    backupFrequency === option.value && styles.frequencyButtonActive
                  ]}
                  onPress={() => changeBackupFrequency(option.value)}
                >
                  <Text style={[
                    styles.frequencyButtonText,
                    backupFrequency === option.value && styles.frequencyButtonTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.backupInfo}>
          <Text style={styles.backupInfoLabel}>Último Backup:</Text>
          <Text style={styles.backupInfoValue}>{formatDate(lastBackup)}</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={performManualBackup}
            disabled={backupInProgress}
          >
            {backupInProgress ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name="backup" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Backup Manual</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={syncData}
            disabled={syncInProgress}
          >
            {syncInProgress ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name="sync" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Sincronizar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Mantenimiento */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mantenimiento</Text>

        <TouchableOpacity
          style={styles.utilityButton}
          onPress={clearCache}
          disabled={cleaningCache}
        >
          <View style={styles.utilityButtonContent}>
            <Icon name="cleaning-services" size={24} color="#6B7280" />
            <View style={styles.utilityButtonText}>
              <Text style={styles.utilityButtonTitle}>Limpiar Caché</Text>
              <Text style={styles.utilityButtonDescription}>Libera espacio y mejora rendimiento</Text>
            </View>
          </View>
          {cleaningCache && <ActivityIndicator color="#3B82F6" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.utilityButton}
          onPress={optimizeDatabase}
          disabled={loading}
        >
          <View style={styles.utilityButtonContent}>
            <Icon name="build" size={24} color="#6B7280" />
            <View style={styles.utilityButtonText}>
              <Text style={styles.utilityButtonTitle}>Optimizar Base de Datos</Text>
              <Text style={styles.utilityButtonDescription}>Mejora el rendimiento de consultas</Text>
            </View>
          </View>
          {loading && <ActivityIndicator color="#3B82F6" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.utilityButton}
          onPress={exportData}
          disabled={loading}
        >
          <View style={styles.utilityButtonContent}>
            <Icon name="file-download" size={24} color="#6B7280" />
            <View style={styles.utilityButtonText}>
              <Text style={styles.utilityButtonTitle}>Exportar Datos</Text>
              <Text style={styles.utilityButtonDescription}>Descarga todos los datos en formato JSON</Text>
            </View>
          </View>
          {loading && <ActivityIndicator color="#3B82F6" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.utilityButton}
          onPress={importData}
        >
          <View style={styles.utilityButtonContent}>
            <Icon name="file-upload" size={24} color="#6B7280" />
            <View style={styles.utilityButtonText}>
              <Text style={styles.utilityButtonTitle}>Importar Datos</Text>
              <Text style={styles.utilityButtonDescription}>Carga datos desde archivo JSON</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Información del Sistema */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información del Sistema</Text>

        <View style={styles.systemDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Versión:</Text>
            <Text style={styles.detailValue}>1.0.0</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plataforma:</Text>
            <Text style={styles.detailValue}>React Native</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Base de Datos:</Text>
            <Text style={styles.detailValue}>Firebase Firestore</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Última Actualización:</Text>
            <Text style={styles.detailValue}>{new Date().toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginBottom: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    marginRight: '4%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  systemInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  frequencyOptions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  frequencyLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  frequencyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  frequencyButtonText: {
    fontSize: 12,
    color: '#6B7280',
  },
  frequencyButtonTextActive: {
    color: '#FFFFFF',
  },
  backupInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  backupInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  backupInfoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#10B981',
  },
  secondaryButton: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  utilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  utilityButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  utilityButtonText: {
    marginLeft: 12,
    flex: 1,
  },
  utilityButtonTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  utilityButtonDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  systemDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
});

export default AdminUtilitiesScreen;
