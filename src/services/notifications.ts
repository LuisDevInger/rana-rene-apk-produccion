import { Platform, Vibration } from 'react-native';
import PushNotification from 'react-native-push-notification';

// Configuración inicial de notificaciones
export const configureNotifications = () => {
  PushNotification.configure({
    // (required) Called when a remote or local notification is opened or received
    onNotification: function (notification) {
      console.log('NOTIFICATION:', notification);

      // Process the notification here
      // required on iOS only
      notification.finish(PushNotificationIOS.FetchResult.NoData);
    },

    // (optional) Called when the user fails to register for remote notifications. Typically occurs when APNS is having issues, or the device is a simulator. (iOS)
    onRegistrationError: function(err) {
      console.error('NOTIFICATION REGISTRATION ERROR:', err.message, err);
    },

    // IOS ONLY (optional): default: all - Permissions to register.
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },

    // Should the initial notification be popped automatically
    // default: true
    popInitialNotification: true,

    /**
     * (optional) default: true
     * - Specified if permissions (ios) and token (android and ios) will requested or not,
     * - if not, you must call PushNotificationsHandler.requestPermissions() later
     */
    requestPermissions: Platform.OS === 'ios',
  });

  // Crear canal de notificaciones para Android
  if (Platform.OS === 'android') {
    PushNotification.createChannel(
      {
        channelId: 'stock-alerts', // (required)
        channelName: 'Alertas de Stock', // (required)
        channelDescription: 'Notificaciones sobre stock disponible y pedidos pendientes', // (optional) default: undefined.
        soundName: 'default', // (optional) See `soundName` parameter of `localNotification` function
        importance: 4, // (optional) default: 4. Int value of the Android notification importance
        vibrate: true, // (optional) default: true. Creates the default vibration pattern if true.
      },
      (created) => console.log(`createChannel returned '${created}'`) // (optional) callback returns whether the channel was created, false means it already existed.
    );

    PushNotification.createChannel(
      {
        channelId: 'sales-alerts',
        channelName: 'Alertas de Ventas',
        channelDescription: 'Notificaciones sobre ventas y clientes',
        soundName: 'default',
        importance: 3,
        vibrate: true,
      },
      (created) => console.log(`createChannel sales returned '${created}'`)
    );

    PushNotification.createChannel(
      {
        channelId: 'system-alerts',
        channelName: 'Alertas del Sistema',
        channelDescription: 'Notificaciones del sistema y mantenimiento',
        soundName: 'default',
        importance: 2,
        vibrate: true,
      },
      (created) => console.log(`createChannel system returned '${created}'`)
    );
  }
};

// Solicitar permisos de notificación
export const requestNotificationPermission = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    PushNotification.requestPermissions()
      .then((permissions) => {
        const granted = Platform.OS === 'ios'
          ? permissions.alert && permissions.badge && permissions.sound
          : true; // Android maneja permisos automáticamente
        resolve(granted);
      })
      .catch((error) => {
        console.error('Error requesting permissions:', error);
        resolve(false);
      });
  });
};

// Vibrar el dispositivo
export const vibrateDevice = (pattern: number[] = [200, 100, 200]) => {
  try {
    Vibration.vibrate(pattern);
    return true;
  } catch (error) {
    console.warn('Error al vibrar dispositivo:', error);
    return false;
  }
};

// Enviar notificación local
export const sendLocalNotification = (
  title: string,
  message: string,
  options: {
    channelId?: string;
    id?: number;
    userInfo?: any;
    playSound?: boolean;
    soundName?: string;
    vibrate?: boolean;
    vibration?: number;
    number?: number;
    repeatType?: 'week' | 'day' | 'hour' | 'minute' | 'time';
    repeatTime?: number;
    priority?: 'max' | 'high' | 'low' | 'min' | 'default';
    importance?: 'max' | 'high' | 'low' | 'min' | 'default' | 'none' | 'unspecified';
    visibility?: 'private' | 'public' | 'secret';
    ignoreInForeground?: boolean;
    onlyAlertOnce?: boolean;
    ongoing?: boolean;
    allowWhileIdle?: boolean;
    timeoutAfter?: number;
    when?: number;
    usesChronometer?: boolean;
    invokeApp?: boolean;
    tag?: string;
    group?: string;
    groupSummary?: boolean;
    setDefaults?: boolean;
    color?: string;
    largeIcon?: string;
    smallIcon?: string;
    bigText?: string;
    subText?: string;
    bigPictureUrl?: string;
    customNotificationType?: string;
    contentInfo?: string;
    progress?: {
      max: number;
      current: number;
      indeterminate?: boolean;
    };
  } = {}
) => {
  const defaultOptions = {
    channelId: 'default',
    playSound: true,
    soundName: 'default',
    vibrate: true,
    vibration: 300,
    ...options,
  };

  PushNotification.localNotification({
    title,
    message,
    ...defaultOptions,
  });

  // Vibrar adicionalmente
  vibrateDevice([300, 150, 300]);
};

// Notificar stock disponible para pedidos pendientes
export const notifyPendingOrdersAvailable = ({
  producto,
  stockDisponible,
  pedidosCompletables
}: {
  producto: string;
  stockDisponible: number;
  pedidosCompletables: Array<{
    clienteNombre: string;
    cantidad: number;
    clienteId: string;
  }>;
}) => {
  const cantidadPedidos = pedidosCompletables.length;
  const clienteInfo = cantidadPedidos === 1
    ? pedidosCompletables[0].clienteNombre
    : `${cantidadPedidos} clientes`;

  const titulo = cantidadPedidos === 1
    ? `✅ Stock disponible para ${pedidosCompletables[0].clienteNombre}`
    : `✅ Stock disponible para ${cantidadPedidos} pedidos pendientes`;

  const mensaje = cantidadPedidos === 1
    ? `Producto: ${producto}\nCantidad solicitada: ${pedidosCompletables[0].cantidad} unidades\nStock actual: ${stockDisponible} unidades`
    : `Producto: ${producto}\nStock actual: ${stockDisponible} unidades\nPuedes completar ${cantidadPedidos} pedidos pendientes`;

  sendLocalNotification(titulo, mensaje, {
    channelId: 'stock-alerts',
    priority: 'high',
    importance: 'high',
    tag: `pending-order-${producto}`,
    userInfo: {
      type: 'stock_available',
      producto,
      stockDisponible,
      pedidosCompletables,
    },
  });
};

// Notificar venta realizada
export const notifySaleCompleted = ({
  clienteNombre,
  producto,
  cantidad,
  total
}: {
  clienteNombre: string;
  producto: string;
  cantidad: number;
  total: number;
}) => {
  const titulo = '💰 Venta realizada';
  const mensaje = `Cliente: ${clienteNombre}\nProducto: ${producto}\nCantidad: ${cantidad}\nTotal: S/ ${total}`;

  sendLocalNotification(titulo, mensaje, {
    channelId: 'sales-alerts',
    priority: 'default',
    importance: 'default',
    tag: 'sale-completed',
    userInfo: {
      type: 'sale_completed',
      clienteNombre,
      producto,
      cantidad,
      total,
    },
  });
};

// Notificar alerta de stock bajo
export const notifyLowStock = ({
  producto,
  stockActual,
  stockMinimo
}: {
  producto: string;
  stockActual: number;
  stockMinimo: number;
}) => {
  const titulo = '⚠️ Stock bajo';
  const mensaje = `Producto: ${producto}\nStock actual: ${stockActual}\nStock mínimo: ${stockMinimo}\n¡Es necesario reabastecer!`;

  sendLocalNotification(titulo, mensaje, {
    channelId: 'stock-alerts',
    priority: 'high',
    importance: 'high',
    tag: `low-stock-${producto}`,
    userInfo: {
      type: 'low_stock',
      producto,
      stockActual,
      stockMinimo,
    },
  });
};

// Notificar backup completado
export const notifyBackupCompleted = ({
  tipo,
  fecha
}: {
  tipo: string;
  fecha: Date;
}) => {
  const titulo = '💾 Backup completado';
  const mensaje = `Tipo: ${tipo}\nFecha: ${fecha.toLocaleString()}\nLos datos están seguros.`;

  sendLocalNotification(titulo, mensaje, {
    channelId: 'system-alerts',
    priority: 'low',
    importance: 'low',
    tag: 'backup-completed',
    userInfo: {
      type: 'backup_completed',
      backupTipo: tipo,
      fecha: fecha.toISOString(),
    },
  });
};

// Notificar error del sistema
export const notifySystemError = ({
  error,
  descripcion
}: {
  error: string;
  descripcion: string;
}) => {
  const titulo = '❌ Error del sistema';
  const mensaje = `Error: ${error}\nDescripción: ${descripcion}`;

  sendLocalNotification(titulo, mensaje, {
    channelId: 'system-alerts',
    priority: 'max',
    importance: 'max',
    tag: 'system-error',
    userInfo: {
      type: 'system_error',
      error,
      descripcion,
    },
  });
};

// Limpiar todas las notificaciones
export const clearAllNotifications = () => {
  PushNotification.cancelAllLocalNotifications();
};

// Limpiar notificaciones por tag
export const clearNotificationsByTag = (tag: string) => {
  PushNotification.cancelLocalNotifications({ tag });
};

// Obtener todas las notificaciones programadas
export const getScheduledNotifications = (callback: (notifications: any[]) => void) => {
  PushNotification.getScheduledLocalNotifications(callback);
};

// Programar notificación
export const scheduleNotification = (
  title: string,
  message: string,
  date: Date,
  options: any = {}
) => {
  PushNotification.localNotificationSchedule({
    title,
    message,
    date,
    ...options,
  });
};

// Cancelar notificación programada
export const cancelScheduledNotification = (id: string) => {
  PushNotification.cancelLocalNotification(id);
};
