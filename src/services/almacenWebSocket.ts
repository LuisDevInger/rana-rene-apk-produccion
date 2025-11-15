// Servicio WebSocket/Socket.io para comunicación en tiempo real con el sistema de almacén
// Configuración por .env: VITE_WS_URL

import { io, Socket } from 'socket.io-client';
// Variables de entorno - PRODUCCIÓN HARDCODEADAS
const ENV_VARS = {
  VITE_WS_URL: 'wss://control-ventas-backend-uterjehelq-uc.a.run.app/ws/stock'
};

// Intentar importar variables de entorno, usar fallback si no existen
let VITE_WS_URL;

try {
  const env = require('@env');
  VITE_WS_URL = env.VITE_WS_URL || ENV_VARS.VITE_WS_URL;
} catch (error) {
  // Si @env no está disponible, usar valores hardcodeados
  VITE_WS_URL = ENV_VARS.VITE_WS_URL;
}

interface WebSocketEventData {
  type: string;
  data: any;
  timestamp: Date;
}

class AlmacenWebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private listeners = new Map<string, ((data: any) => void)[]>();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isReconnecting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastPingTime = 0;
  private minPingInterval = 1000;
  private pingInProgress = false;

  constructor() {
    // Configuración desde variables de entorno
    const envUrl = VITE_WS_URL;
    this.wsUrl = this.resolveWebSocketUrl(envUrl || 'ws://localhost:8000');

    this.connect();
  }

  private wsUrl: string;

  // Resuelve la URL final de WebSocket/Socket.io
  private resolveWebSocketUrl(rawUrl: string): string {
    try {
      if (!rawUrl || typeof rawUrl !== 'string') {
        // Fallback para desarrollo local
        return 'ws://localhost:8000';
      }

      // Si ya incluye protocolo completo
      if (/^https?:\/\//i.test(rawUrl)) {
        return rawUrl.replace(/^http/, 'ws');
      }

      // Si es ruta relativa
      if (rawUrl.startsWith('/')) {
        return `ws://localhost:8000${rawUrl}`;
      }

      // Si es hostname[:puerto][/ruta] sin esquema
      return `ws://${rawUrl}`;
    } catch (e) {
      console.warn('[AlmacenWebSocket] No se pudo resolver la URL, usando valor crudo:', rawUrl, e);
      return rawUrl;
    }
  }

  connect() {
    // Prevenir múltiples conexiones simultáneas
    if (this.isReconnecting) {
      console.log('[AlmacenWebSocket] Ya hay una reconexión en progreso, ignorando...');
      return;
    }

    if (this.socket && this.socket.connected) {
      console.log('[AlmacenWebSocket] Ya hay una conexión activa');
      return;
    }

    try {
      console.log('[AlmacenWebSocket] Conectando a:', this.wsUrl);

      this.socket = io(this.wsUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: false, // Manejamos la reconexión manualmente
      });

      this.socket.on('connect', this.onConnect.bind(this));
      this.socket.on('disconnect', this.onDisconnect.bind(this));
      this.socket.on('connect_error', this.onConnectError.bind(this));
      this.socket.on('stock_update', this.onStockUpdate.bind(this));
      this.socket.on('inventory_alert', this.onInventoryAlert.bind(this));
      this.socket.on('order_status_change', this.onOrderStatusChange.bind(this));
      this.socket.on('warehouse_sync', this.onWarehouseSync.bind(this));

    } catch (error) {
      console.error('[AlmacenWebSocket] Error al crear conexión:', error);
      this.isReconnecting = false;
      this.scheduleReconnect();
    }
  }

  private onConnect() {
    console.log('[AlmacenWebSocket] Conexión establecida');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.isReconnecting = false;

    // Iniciar heartbeat
    this.startHeartbeat();

    // Notificar a todos los listeners de conexión
    this.notifyListeners('connected', { timestamp: new Date() });
  }

  private onDisconnect(reason: string) {
    console.log('[AlmacenWebSocket] Desconectado:', reason);
    this.isConnected = false;
    this.stopHeartbeat();

    if (reason === 'io server disconnect' || reason === 'io client disconnect') {
      // Desconexión intencional, no reconectar automáticamente
      return;
    }

    // Desconexión accidental, intentar reconectar
    this.scheduleReconnect();
  }

  private onConnectError(error: Error) {
    console.error('[AlmacenWebSocket] Error de conexión:', error);
    this.isReconnecting = false;
    this.scheduleReconnect();
  }

  private onStockUpdate(data: any) {
    console.log('[AlmacenWebSocket] Actualización de stock:', data);
    this.notifyListeners('stock_update', data);
  }

  private onInventoryAlert(data: any) {
    console.log('[AlmacenWebSocket] Alerta de inventario:', data);
    this.notifyListeners('inventory_alert', data);
  }

  private onOrderStatusChange(data: any) {
    console.log('[AlmacenWebSocket] Cambio de estado de orden:', data);
    this.notifyListeners('order_status_change', data);
  }

  private onWarehouseSync(data: any) {
    console.log('[AlmacenWebSocket] Sincronización de almacén:', data);
    this.notifyListeners('warehouse_sync', data);
  }

  private startHeartbeat() {
    this.stopHeartbeat(); // Asegurarse de que no hay heartbeat anterior

    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        const now = Date.now();
        if (!this.pingInProgress && (now - this.lastPingTime) >= this.minPingInterval) {
          this.pingInProgress = true;
          this.lastPingTime = now;

          this.socket.emit('ping', { timestamp: now });

          // Timeout para el pong
          setTimeout(() => {
            if (this.pingInProgress) {
              console.warn('[AlmacenWebSocket] Ping timeout, reconectando...');
              this.pingInProgress = false;
              this.disconnect();
              this.scheduleReconnect();
            }
          }, 5000);
        }
      }
    }, 30000); // Ping cada 30 segundos
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[AlmacenWebSocket] Máximo número de intentos de reconexión alcanzado');
      this.notifyListeners('max_reconnect_attempts_reached', {
        attempts: this.reconnectAttempts,
        timestamp: new Date()
      });
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1); // Backoff exponencial

    console.log(`[AlmacenWebSocket] Programando reconexión en ${delay}ms (intento ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.isReconnecting = true;
      this.connect();
    }, delay);
  }

  disconnect() {
    console.log('[AlmacenWebSocket] Desconectando...');

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
    this.isReconnecting = false;
  }

  // Enviar mensaje al servidor
  send(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
      return true;
    } else {
      console.warn('[AlmacenWebSocket] No hay conexión activa, mensaje no enviado:', event, data);
      return false;
    }
  }

  // Escuchar eventos
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  // Dejar de escuchar eventos
  off(event: string, callback?: (data: any) => void) {
    if (!this.listeners.has(event)) return;

    if (callback) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  private notifyListeners(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[AlmacenWebSocket] Error en callback de listener:', error);
        }
      });
    }
  }

  // Getters
  get isConnectedStatus(): boolean {
    return this.isConnected;
  }

  get connectionUrl(): string {
    return this.wsUrl;
  }

  get reconnectAttemptsCount(): number {
    return this.reconnectAttempts;
  }
}

// Instancia singleton
let almacenWebSocketInstance: AlmacenWebSocketService | null = null;

export const getAlmacenWebSocket = (): AlmacenWebSocketService => {
  if (!almacenWebSocketInstance) {
    almacenWebSocketInstance = new AlmacenWebSocketService();
  }
  return almacenWebSocketInstance;
};

export const disconnectAlmacenWebSocket = () => {
  if (almacenWebSocketInstance) {
    almacenWebSocketInstance.disconnect();
    almacenWebSocketInstance = null;
  }
};

export default AlmacenWebSocketService;
