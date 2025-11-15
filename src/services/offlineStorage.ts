// Servicio de almacenamiento offline para React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Cliente, Producto, Compra, MovimientoStock } from '../types';

const STORAGE_KEYS = {
  CLIENTES: '@clientes',
  PRODUCTOS: '@productos',
  COMPRAS: '@compras',
  MOVIMIENTOS: '@movimientos',
  SYNC_QUEUE: '@sync_queue',
  LAST_SYNC: '@last_sync',
  USER_DATA: '@user_data',
  APP_SETTINGS: '@app_settings',
} as const;

interface SyncItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

// Estado de conectividad
let isOnline = true;
let connectionListener: any = null;

// Inicializar el listener de conectividad
export const initializeConnectivity = () => {
  if (connectionListener) return;

  connectionListener = NetInfo.addEventListener(state => {
    const wasOnline = isOnline;
    isOnline = state.isConnected && state.isInternetReachable;

    // Si acaba de volver la conexión, intentar sincronizar
    if (!wasOnline && isOnline) {
      console.log('[OfflineStorage] Conexión recuperada, iniciando sincronización...');
      syncPendingChanges();
    }
  });
};

// Utilidades de almacenamiento básico
export const storage = {
  async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`[OfflineStorage] Error guardando ${key}:`, error);
      throw error;
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`[OfflineStorage] Error obteniendo ${key}:`, error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`[OfflineStorage] Error eliminando ${key}:`, error);
      throw error;
    }
  },

  async mergeItem(key: string, value: any): Promise<void> {
    try {
      const existing = await this.getItem(key) || {};
      const merged = { ...existing, ...value };
      await this.setItem(key, merged);
    } catch (error) {
      console.error(`[OfflineStorage] Error mezclando ${key}:`, error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log('[OfflineStorage] Almacenamiento limpiado');
    } catch (error) {
      console.error('[OfflineStorage] Error limpiando almacenamiento:', error);
      throw error;
    }
  },
};

// Gestión de datos offline
export const offlineData = {
  // Clientes
  async saveClientes(clientes: Cliente[]): Promise<void> {
    await storage.setItem(STORAGE_KEYS.CLIENTES, clientes);
  },

  async getClientes(): Promise<Cliente[]> {
    return await storage.getItem<Cliente[]>(STORAGE_KEYS.CLIENTES) || [];
  },

  async addCliente(cliente: Cliente): Promise<void> {
    const clientes = await this.getClientes();
    const updated = [...clientes, cliente];
    await this.saveClientes(updated);
    await addToSyncQueue('create', 'clientes', cliente);
  },

  async updateCliente(cliente: Cliente): Promise<void> {
    const clientes = await this.getClientes();
    const updated = clientes.map(c => c.id === cliente.id ? cliente : c);
    await this.saveClientes(updated);
    await addToSyncQueue('update', 'clientes', cliente);
  },

  // Productos
  async saveProductos(productos: Producto[]): Promise<void> {
    await storage.setItem(STORAGE_KEYS.PRODUCTOS, productos);
  },

  async getProductos(): Promise<Producto[]> {
    return await storage.getItem<Producto[]>(STORAGE_KEYS.PRODUCTOS) || [];
  },

  async addProducto(producto: Producto): Promise<void> {
    const productos = await this.getProductos();
    const updated = [...productos, producto];
    await this.saveProductos(updated);
    await addToSyncQueue('create', 'productos', producto);
  },

  async updateProducto(producto: Producto): Promise<void> {
    const productos = await this.getProductos();
    const updated = productos.map(p => p.id === producto.id ? producto : p);
    await this.saveProductos(updated);
    await addToSyncQueue('update', 'productos', producto);
  },

  // Compras
  async saveCompras(compras: Compra[]): Promise<void> {
    await storage.setItem(STORAGE_KEYS.COMPRAS, compras);
  },

  async getCompras(): Promise<Compra[]> {
    return await storage.getItem<Compra[]>(STORAGE_KEYS.COMPRAS) || [];
  },

  async addCompra(compra: Compra): Promise<void> {
    const compras = await this.getCompras();
    const updated = [...compras, compra];
    await this.saveCompras(updated);
    await addToSyncQueue('create', 'compras', compra);
  },

  // Movimientos
  async saveMovimientos(movimientos: MovimientoStock[]): Promise<void> {
    await storage.setItem(STORAGE_KEYS.MOVIMIENTOS, movimientos);
  },

  async getMovimientos(): Promise<MovimientoStock[]> {
    return await storage.getItem<MovimientoStock[]>(STORAGE_KEYS.MOVIMIENTOS) || [];
  },

  async addMovimiento(movimiento: MovimientoStock): Promise<void> {
    const movimientos = await this.getMovimientos();
    const updated = [...movimientos, movimiento];
    await this.saveMovimientos(updated);
    await addToSyncQueue('create', 'movimientos', movimiento);
  },
};

// Cola de sincronización
export const syncQueue = {
  async add(item: Omit<SyncItem, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const syncItem: SyncItem = {
      ...item,
      id: `${item.collection}_${item.type}_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const queue = await this.getAll();
    queue.push(syncItem);
    await storage.setItem(STORAGE_KEYS.SYNC_QUEUE, queue);

    console.log(`[OfflineStorage] Agregado a cola de sync: ${syncItem.type} ${syncItem.collection}`);

    // Si estamos online, intentar sincronizar inmediatamente
    if (isOnline) {
      syncPendingChanges();
    }
  },

  async getAll(): Promise<SyncItem[]> {
    return await storage.getItem<SyncItem[]>(STORAGE_KEYS.SYNC_QUEUE) || [];
  },

  async remove(id: string): Promise<void> {
    const queue = await this.getAll();
    const filtered = queue.filter(item => item.id !== id);
    await storage.setItem(STORAGE_KEYS.SYNC_QUEUE, filtered);
  },

  async updateRetryCount(id: string): Promise<void> {
    const queue = await this.getAll();
    const updated = queue.map(item =>
      item.id === id ? { ...item, retryCount: item.retryCount + 1 } : item
    );
    await storage.setItem(STORAGE_KEYS.SYNC_QUEUE, updated);
  },

  async clear(): Promise<void> {
    await storage.setItem(STORAGE_KEYS.SYNC_QUEUE, []);
  },
};

// Función auxiliar para agregar a cola de sync
async function addToSyncQueue(type: 'create' | 'update' | 'delete', collection: string, data: any) {
  await syncQueue.add({ type, collection, data });
}

// Sincronización
export const syncManager = {
  async syncAll(): Promise<{ success: number; failed: number; total: number }> {
    if (!isOnline) {
      console.log('[OfflineStorage] Sin conexión, saltando sincronización');
      return { success: 0, failed: 0, total: 0 };
    }

    const queue = await syncQueue.getAll();
    let success = 0;
    let failed = 0;

    console.log(`[OfflineStorage] Iniciando sincronización de ${queue.length} elementos`);

    for (const item of queue) {
      try {
        await this.syncItem(item);
        await syncQueue.remove(item.id);
        success++;
        console.log(`[OfflineStorage] ✅ Sincronizado: ${item.type} ${item.collection}`);
      } catch (error) {
        console.error(`[OfflineStorage] ❌ Error sincronizando ${item.id}:`, error);

        // Incrementar contador de reintentos
        await syncQueue.updateRetryCount(item.id);

        // Si ha fallado más de 3 veces, remover de la cola
        const updatedItem = { ...item, retryCount: item.retryCount + 1 };
        if (updatedItem.retryCount >= 3) {
          await syncQueue.remove(item.id);
          console.log(`[OfflineStorage] 🗑️ Removido de cola después de ${updatedItem.retryCount} intentos: ${item.id}`);
        }

        failed++;
      }
    }

    // Actualizar timestamp de última sincronización
    await storage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now());

    console.log(`[OfflineStorage] Sincronización completada: ${success} exitosos, ${failed} fallidos`);

    return { success, failed, total: queue.length };
  },

  async syncItem(item: SyncItem): Promise<void> {
    // Importar dinámicamente para evitar dependencias circulares
    const { syncService } = await import('./syncService');

    let success = false;

    switch (item.collection) {
      case 'clientes':
        success = await syncService.syncCliente(item.data);
        break;
      case 'productos':
        success = await syncService.syncProducto(item.data);
        break;
      case 'compras':
        success = await syncService.syncCompra(item.data);
        break;
      case 'movimientos':
        success = await syncService.syncMovimiento(item.data);
        break;
      default:
        console.warn(`Tipo de colección desconocido para sync: ${item.collection}`);
        success = false;
    }

    if (!success) {
      throw new Error(`Fallo al sincronizar ${item.collection}`);
    }
  },

  async getLastSyncTime(): Promise<number | null> {
    return await storage.getItem<number>(STORAGE_KEYS.LAST_SYNC);
  },

  async getPendingSyncCount(): Promise<number> {
    const queue = await syncQueue.getAll();
    return queue.length;
  },
};

// Función principal para sincronizar cambios pendientes
export const syncPendingChanges = async () => {
  try {
    const result = await syncManager.syncAll();
    return result;
  } catch (error) {
    console.error('[OfflineStorage] Error en sincronización:', error);
    return { success: 0, failed: 0, total: 0 };
  }
};

// Configuración de la app
export const appSettings = {
  async save(settings: any): Promise<void> {
    await storage.setItem(STORAGE_KEYS.APP_SETTINGS, settings);
  },

  async get(): Promise<any> {
    return await storage.getItem(STORAGE_KEYS.APP_SETTINGS) || {};
  },
};

// Estado de conectividad
export const connectivity = {
  get isOnline(): boolean {
    return isOnline;
  },

  async checkConnection(): Promise<boolean> {
    const state = await NetInfo.fetch();
    isOnline = state.isConnected && state.isInternetReachable;
    return isOnline;
  },
};

// Inicialización
export const initializeOfflineStorage = () => {
  initializeConnectivity();
  console.log('[OfflineStorage] Inicializado');
};

// Cleanup
export const cleanupOfflineStorage = () => {
  if (connectionListener) {
    connectionListener();
    connectionListener = null;
  }
};
