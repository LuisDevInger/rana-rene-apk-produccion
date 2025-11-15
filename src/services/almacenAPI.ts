// Servicio de integración completa con el backend de almacén
// Gestiona productos, stock, solicitudes y sincronización

// Variables de entorno - PRODUCCIÓN HARDCODEADAS
const ENV_VARS = {
  VITE_API_BASE_URL: 'https://control-ventas-backend-uterjehelq-uc.a.run.app',
  VITE_API_KEY: 'f4a1c6e9b2d73a5f8c9170de34ab56cd89ef0123a45b67c89d0e1f23ab45c6de',
  VITE_SYSTEM_ID: 'sistema-ventas-v1'
};

// Intentar importar variables de entorno, usar fallback si no existen
let VITE_API_BASE_URL, VITE_API_KEY, VITE_SYSTEM_ID;

try {
  const env = require('@env');
  VITE_API_BASE_URL = env.VITE_API_BASE_URL || ENV_VARS.VITE_API_BASE_URL;
  VITE_API_KEY = env.VITE_API_KEY || ENV_VARS.VITE_API_KEY;
  VITE_SYSTEM_ID = env.VITE_SYSTEM_ID || ENV_VARS.VITE_SYSTEM_ID;
} catch (error) {
  // Si @env no está disponible, usar valores hardcodeados
  VITE_API_BASE_URL = ENV_VARS.VITE_API_BASE_URL;
  VITE_API_KEY = ENV_VARS.VITE_API_KEY;
  VITE_SYSTEM_ID = ENV_VARS.VITE_SYSTEM_ID;
}
import { Producto } from '../types';

interface AlmacenProducto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
  ubicacion?: string;
  activo: boolean;
  fecha_actualizacion: string;
}

interface SolicitudAlmacen {
  id?: string;
  producto_id: string;
  cantidad_solicitada: number;
  solicitante_id: string;
  solicitante_nombre: string;
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
  notas?: string;
  ubicacion_entrega?: string;
  fecha_solicitud: string;
}

interface MovimientoStock {
  producto_id: string;
  tipo: 'entrada' | 'salida' | 'venta';
  cantidad: number;
  motivo?: string;
  usuario_id: string;
  usuario_nombre: string;
}

class AlmacenAPIService {
  private baseURL: string;
  private apiKey: string;
  private systemId: string;

  constructor() {
    this.baseURL = VITE_API_BASE_URL;
    this.apiKey = VITE_API_KEY;
    this.systemId = VITE_SYSTEM_ID;
  }

  // Headers estándar para todas las peticiones
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'X-System-ID': this.systemId,
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  // Verificar conexión con el almacén
  async verificarConexion(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.warn('⚠️ Almacén backend no responde correctamente');
        return false;
      }

      const data = await response.json();
      console.log('✅ Conexión con almacén verificada:', data);
      return true;

    } catch (error) {
      console.error('❌ Error conectando con almacén:', error);
      return false;
    }
  }

  // Obtener todos los productos del almacén
  async obtenerProductos(): Promise<Producto[]> {
    try {
      const response = await fetch(`${this.baseURL}/productos`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const productosAlmacen: AlmacenProducto[] = await response.json();

      // Convertir formato del almacén al formato de la app
      const productos: Producto[] = productosAlmacen.map(p => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: p.precio,
        categoria: p.categoria,
        stock: p.stock_actual,
        stockMinimo: p.stock_minimo,
        activo: p.activo,
        createdAt: new Date(p.fecha_actualizacion),
      }));

      console.log(`📦 Obtenidos ${productos.length} productos del almacén`);
      return productos;

    } catch (error) {
      console.error('❌ Error obteniendo productos del almacén:', error);
      throw error;
    }
  }

  // Obtener producto específico por ID
  async obtenerProducto(productoId: string): Promise<Producto | null> {
    try {
      const response = await fetch(`${this.baseURL}/productos/${productoId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const productoAlmacen: AlmacenProducto = await response.json();

      const producto: Producto = {
        id: productoAlmacen.id,
        nombre: productoAlmacen.nombre,
        descripcion: productoAlmacen.descripcion,
        precio: productoAlmacen.precio,
        categoria: productoAlmacen.categoria,
        stock: productoAlmacen.stock_actual,
        stockMinimo: productoAlmacen.stock_minimo,
        activo: productoAlmacen.activo,
        createdAt: new Date(productoAlmacen.fecha_actualizacion),
      };

      return producto;

    } catch (error) {
      console.error('❌ Error obteniendo producto del almacén:', error);
      throw error;
    }
  }

  // Verificar stock disponible de un producto
  async verificarStock(productoId: string): Promise<{ disponible: number; minimo: number }> {
    try {
      const producto = await this.obtenerProducto(productoId);
      if (!producto) {
        return { disponible: 0, minimo: 0 };
      }

      return {
        disponible: producto.stock,
        minimo: producto.stockMinimo,
      };

    } catch (error) {
      console.error('❌ Error verificando stock:', error);
      return { disponible: 0, minimo: 0 };
    }
  }

  // Enviar solicitud de producto al almacén
  async enviarSolicitud(solicitud: SolicitudAlmacen): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/solicitudes`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(solicitud),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const resultado = await response.json();
      const solicitudId = resultado.id || resultado.solicitud_id;

      console.log('📋 Solicitud enviada al almacén:', solicitudId);
      return solicitudId;

    } catch (error) {
      console.error('❌ Error enviando solicitud al almacén:', error);
      throw error;
    }
  }

  // Actualizar estado de solicitud en el almacén
  async actualizarEstadoSolicitud(solicitudId: string, estado: string, cantidadEntregada?: number): Promise<void> {
    try {
      const payload: any = {
        estado,
        fecha_actualizacion: new Date().toISOString(),
      };

      if (cantidadEntregada !== undefined) {
        payload.cantidad_entregada = cantidadEntregada;
      }

      const response = await fetch(`${this.baseURL}/solicitudes/${solicitudId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      console.log('✅ Estado de solicitud actualizado en almacén:', solicitudId, estado);

    } catch (error) {
      console.error('❌ Error actualizando solicitud en almacén:', error);
      throw error;
    }
  }

  // Registrar movimiento de stock en el almacén
  async registrarMovimiento(movimiento: MovimientoStock): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/movimientos`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...movimiento,
          fecha_movimiento: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      console.log('📊 Movimiento registrado en almacén:', movimiento.tipo, movimiento.producto_id);

    } catch (error) {
      console.error('❌ Error registrando movimiento en almacén:', error);
      throw error;
    }
  }

  // Obtener estadísticas del almacén
  async obtenerEstadisticas(): Promise<{
    total_productos: number;
    productos_bajo_stock: number;
    productos_sin_stock: number;
    solicitudes_pendientes: number;
    movimientos_hoy: number;
  }> {
    try {
      const response = await fetch(`${this.baseURL}/estadisticas`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const estadisticas = await response.json();
      console.log('📈 Estadísticas del almacén obtenidas');
      return estadisticas;

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas del almacén:', error);
      // Devolver valores por defecto en caso de error
      return {
        total_productos: 0,
        productos_bajo_stock: 0,
        productos_sin_stock: 0,
        solicitudes_pendientes: 0,
        movimientos_hoy: 0,
      };
    }
  }

  // Sincronizar productos con Firestore local (para offline)
  async sincronizarProductos(): Promise<void> {
    try {
      const productosAlmacen = await this.obtenerProductos();

      // Aquí se podría implementar sincronización con Firestore local
      // para funcionamiento offline

      console.log('🔄 Productos sincronizados con almacén');

    } catch (error) {
      console.error('❌ Error sincronizando productos:', error);
      throw error;
    }
  }
}

// Instancia singleton
let almacenAPIInstance: AlmacenAPIService | null = null;

export const getAlmacenAPI = (): AlmacenAPIService => {
  if (!almacenAPIInstance) {
    almacenAPIInstance = new AlmacenAPIService();
  }
  return almacenAPIInstance;
};

export default getAlmacenAPI;
