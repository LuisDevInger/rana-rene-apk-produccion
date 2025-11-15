// Servicio de almacén con WebSocket para React Native
import io from 'socket.io-client';
// Variables de entorno - PRODUCCIÓN HARDCODEADAS
const ENV_VARS = {
  VITE_WS_URL: 'wss://control-ventas-backend-uterjehelq-uc.a.run.app/ws/stock',
  VITE_API_BASE_URL: 'https://control-ventas-backend-uterjehelq-uc.a.run.app',
  VITE_API_KEY: 'f4a1c6e9b2d73a5f8c9170de34ab56cd89ef0123a45b67c89d0e1f23ab45c6de',
  VITE_SYSTEM_ID: 'sistema-ventas-v1'
};

// Intentar importar variables de entorno, usar fallback si no existen
let VITE_WS_URL, VITE_API_BASE_URL, VITE_API_KEY, VITE_SYSTEM_ID;

try {
  const env = require('@env');
  VITE_WS_URL = env.VITE_WS_URL || ENV_VARS.VITE_WS_URL;
  VITE_API_BASE_URL = env.VITE_API_BASE_URL || ENV_VARS.VITE_API_BASE_URL;
  VITE_API_KEY = env.VITE_API_KEY || ENV_VARS.VITE_API_KEY;
  VITE_SYSTEM_ID = env.VITE_SYSTEM_ID || ENV_VARS.VITE_SYSTEM_ID;
} catch (error) {
  // Si @env no está disponible, usar valores hardcodeados
  VITE_WS_URL = ENV_VARS.VITE_WS_URL;
  VITE_API_BASE_URL = ENV_VARS.VITE_API_BASE_URL;
  VITE_API_KEY = ENV_VARS.VITE_API_KEY;
  VITE_SYSTEM_ID = ENV_VARS.VITE_SYSTEM_ID;
}

class AlmacenWebSocketService {
  private socket: any = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private listeners: Map<string, Function[]> = new Map();
  private heartbeatInterval: any = null;
  private reconnectTimeout: any = null;
  private isReconnecting = false;

  private wsUrl = VITE_WS_URL || 'ws://localhost:8000/ws/stock';

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isReconnecting) {
      console.log('[AlmacenWebSocket] Ya hay una reconexión en progreso');
      return;
    }

    try {
      console.log('[AlmacenWebSocket] Conectando a:', this.wsUrl);
      this.socket = io(this.wsUrl, {
        transports: ['websocket'],
        timeout: 5000,
      });

      this.socket.on('connect', this.onConnect.bind(this));
      this.socket.on('disconnect', this.onDisconnect.bind(this));
      this.socket.on('connect_error', this.onError.bind(this));

      // Eventos específicos del almacén
      this.socket.on('warehouse.entry', (data: any) => this.emit('warehouse.entry', data));
      this.socket.on('warehouse.exit', (data: any) => this.emit('warehouse.exit', data));
      this.socket.on('warehouse.sale_direct', (data: any) => this.emit('warehouse.sale_direct', data));
      this.socket.on('warehouse.alert.low_stock', (data: any) => this.emit('warehouse.alert.low_stock', data));
      this.socket.on('warehouse.alert.out_of_stock', (data: any) => this.emit('warehouse.alert.out_of_stock', data));

    } catch (error) {
      console.error('[AlmacenWebSocket] Error al crear conexión:', error);
      this.scheduleReconnect();
    }
  }

  private onConnect() {
    console.log('[AlmacenWebSocket] Conexión establecida');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.isReconnecting = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.startHeartbeat();
    this.emit('connected', { timestamp: new Date().toISOString() });
  }

  private onDisconnect(reason: string) {
    console.log('[AlmacenWebSocket] Desconectado:', reason);
    this.isConnected = false;
    this.stopHeartbeat();

    if (reason !== 'io client disconnect') {
      this.scheduleReconnect();
    }
  }

  private onError(error: any) {
    console.error('[AlmacenWebSocket] Error de conexión:', error);
    this.emit('error', error);
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.isReconnecting) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[AlmacenWebSocket] Máximo número de intentos alcanzado');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`[AlmacenWebSocket] Reintentando en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.isReconnecting = false;
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    const heartbeatIntervalMs = 30000;

    this.heartbeatInterval = setInterval(() => {
      if (!this.isConnected || !this.socket) {
        console.warn('[AlmacenWebSocket] No se puede enviar ping: conexión no activa');
        this.stopHeartbeat();
        return;
      }

      try {
        this.socket.emit('ping');
      } catch (error) {
        console.error('[AlmacenWebSocket] Error enviando ping:', error);
      }
    }, heartbeatIntervalMs);

    console.log(`[AlmacenWebSocket] Heartbeat iniciado con intervalo de ${heartbeatIntervalMs}ms`);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('[AlmacenWebSocket] Heartbeat detenido');
    }
  }

  // Sistema de eventos
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[AlmacenWebSocket] Error en callback de listener:', error);
        }
      });
    }
  }

  // Métodos públicos
  subscribeToStockUpdates(productId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe', { resource: 'stock', productId });
    }
  }

  unsubscribeFromStockUpdates(productId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe', { resource: 'stock', productId });
    }
  }

  send(data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('message', data);
      return true;
    }
    return false;
  }

  disconnect() {
    this.stopHeartbeat();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.isConnected = false;
    this.listeners.clear();
    console.log('[AlmacenWebSocket] Desconectado y recursos limpiados');
  }

  get isConnected() {
    return this.isConnected;
  }
}

// Singleton
let almacenWebSocketInstance: AlmacenWebSocketService | null = null;

export const getAlmacenWebSocket = () => {
  if (!almacenWebSocketInstance) {
    almacenWebSocketInstance = new AlmacenWebSocketService();
  }
  return almacenWebSocketInstance;
};

export default getAlmacenWebSocket;
