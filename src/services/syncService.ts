// Servicio de sincronización con el backend
import axios from 'axios';
import { syncManager } from './offlineStorage';

const API_BASE_URL = 'https://control-ventas-backend-310457168785.us-central1.run.app';

// Configurar axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token JWT si existe
api.interceptors.request.use(async (config) => {
  try {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.warn('Error obteniendo token de autenticación:', error);
  }
  return config;
});

// Servicio de sincronización
export const syncService = {
  // Sincronizar cliente
  async syncCliente(clienteData: any): Promise<boolean> {
    try {
      // TODO: Implementar llamada real a la API
      console.log('Sincronizando cliente:', clienteData);

      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Llamada real sería algo como:
      // await api.post('/warehouse/clients', clienteData);

      return true;
    } catch (error) {
      console.error('Error sincronizando cliente:', error);
      return false;
    }
  },

  // Sincronizar producto
  async syncProducto(productoData: any): Promise<boolean> {
    try {
      console.log('Sincronizando producto:', productoData);

      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Llamada real sería algo como:
      // await api.post('/warehouse/products', productoData);

      return true;
    } catch (error) {
      console.error('Error sincronizando producto:', error);
      return false;
    }
  },

  // Sincronizar compra
  async syncCompra(compraData: any): Promise<boolean> {
    try {
      console.log('Sincronizando compra:', compraData);

      // Llamada real a la API
      await api.post('/warehouse/sales', compraData);

      return true;
    } catch (error) {
      console.error('Error sincronizando compra:', error);
      return false;
    }
  },

  // Sincronizar movimiento de stock
  async syncMovimiento(movimientoData: any): Promise<boolean> {
    try {
      console.log('Sincronizando movimiento:', movimientoData);

      // Determinar endpoint según tipo de movimiento
      let endpoint = '';
      switch (movimientoData.tipo) {
        case 'entrada':
          endpoint = '/warehouse/movements/entry';
          break;
        case 'salida':
          endpoint = '/warehouse/movements/exit';
          break;
        case 'venta_directa':
          endpoint = '/warehouse/sale-direct';
          break;
        default:
          throw new Error(`Tipo de movimiento desconocido: ${movimientoData.tipo}`);
      }

      // Llamada real a la API
      await api.post(endpoint, movimientoData);

      return true;
    } catch (error) {
      console.error('Error sincronizando movimiento:', error);
      return false;
    }
  },

  // Verificar conectividad del backend
  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await api.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Error verificando salud del backend:', error);
      return false;
    }
  },

  // Obtener datos desde el backend (para inicial sync)
  async fetchInitialData(): Promise<any> {
    try {
      console.log('Obteniendo datos iniciales del backend...');

      // En una implementación real, haríamos múltiples llamadas paralelas
      const [clientesResponse, productosResponse, movimientosResponse] = await Promise.allSettled([
        api.get('/warehouse/clients').catch(() => ({ data: [] })),
        api.get('/warehouse/products').catch(() => ({ data: [] })),
        api.get('/warehouse/movements/history').catch(() => ({ data: [] })),
      ]);

      return {
        clientes: clientesResponse.status === 'fulfilled' ? clientesResponse.value.data : [],
        productos: productosResponse.status === 'fulfilled' ? productosResponse.value.data : [],
        movimientos: movimientosResponse.status === 'fulfilled' ? movimientosResponse.value.data : [],
      };
    } catch (error) {
      console.error('Error obteniendo datos iniciales:', error);
      return {
        clientes: [],
        productos: [],
        movimientos: [],
      };
    }
  },
};

// Actualizar el syncManager para usar el syncService real
const originalSyncItem = syncManager.syncItem;
syncManager.syncItem = async function(item: any) {
  try {
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

    return Promise.resolve();
  } catch (error) {
    throw error;
  }
};

// Función para sincronización inicial (primera vez que la app se conecta)
export const performInitialSync = async () => {
  try {
    console.log('Realizando sincronización inicial...');

    // Verificar que el backend esté disponible
    const isHealthy = await syncService.checkBackendHealth();
    if (!isHealthy) {
      console.warn('Backend no disponible, saltando sync inicial');
      return false;
    }

    // Obtener datos del backend
    const backendData = await syncService.fetchInitialData();

    // Aquí podríamos comparar con datos locales y hacer merge
    // Por ahora, solo registramos que obtuvimos los datos
    console.log('Datos iniciales obtenidos:', {
      clientes: backendData.clientes.length,
      productos: backendData.productos.length,
      movimientos: backendData.movimientos.length,
    });

    return true;
  } catch (error) {
    console.error('Error en sincronización inicial:', error);
    return false;
  }
};

export default syncService;
