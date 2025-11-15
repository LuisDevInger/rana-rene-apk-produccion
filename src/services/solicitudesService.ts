// Servicio para gestionar solicitudes de productos al almacén
// Incluye notificaciones push a almaceneros

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { SolicitudProducto } from '../types';
import { sendLocalNotification, notifyLowStock, vibrateDevice } from './notifications';
import { getFCMService } from './fcmService';
import { getAlmacenAPI } from './almacenAPI';
import { getAuth } from 'firebase/auth';

const SOLICITUDES_COLLECTION = 'solicitudes_productos';

class SolicitudesService {
  // Crear una nueva solicitud de producto
  async crearSolicitud(solicitudData: Omit<SolicitudProducto, 'id' | 'fechaSolicitud'>): Promise<string> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar conexión con almacén antes de proceder
      const almacenAPI = getAlmacenAPI();
      const almacenConectado = await almacenAPI.verificarConexion();

      if (!almacenConectado) {
        throw new Error('No se puede conectar con el almacén. Verifica la conexión.');
      }

      // Verificar stock disponible antes de crear solicitud
      const stockInfo = await almacenAPI.verificarStock(solicitudData.productoId);
      if (stockInfo.disponible < solicitudData.cantidadSolicitada) {
        throw new Error(`Stock insuficiente. Disponible: ${stockInfo.disponible}, Solicitado: ${solicitudData.cantidadSolicitada}`);
      }

      const nuevaSolicitud: Omit<SolicitudProducto, 'id'> = {
        ...solicitudData,
        fechaSolicitud: new Date(),
        estado: 'pendiente',
        prioridad: solicitudData.prioridad || 'normal',
      };

      // 1. Crear solicitud en Firestore local (para UI y backup)
      const docRef = await addDoc(collection(db, SOLICITUDES_COLLECTION), {
        ...nuevaSolicitud,
        fechaSolicitud: Timestamp.fromDate(nuevaSolicitud.fechaSolicitud),
      });

      // 2. Enviar solicitud al almacén backend
      try {
        const solicitudAlmacen = {
          producto_id: solicitudData.productoId,
          cantidad_solicitada: solicitudData.cantidadSolicitada,
          solicitante_id: user.uid,
          solicitante_nombre: solicitudData.solicitanteNombre,
          prioridad: solicitudData.prioridad || 'normal',
          notas: solicitudData.notas,
          ubicacion_entrega: solicitudData.ubicacionEntrega || 'Almacén Principal',
          fecha_solicitud: new Date().toISOString(),
        };

        await almacenAPI.enviarSolicitud(solicitudAlmacen);
        console.log('✅ Solicitud enviada al almacén backend');

      } catch (almacenError) {
        console.warn('⚠️ Error enviando solicitud al almacén, pero guardada localmente:', almacenError);
        // No lanzamos error aquí, la solicitud se guardó localmente
      }

      // 3. Enviar notificaciones push a almaceneros
      await this.notificarAlmaceneros(nuevaSolicitud);

      console.log('✅ Solicitud creada completamente:', docRef.id);
      return docRef.id;

    } catch (error) {
      console.error('❌ Error creando solicitud:', error);
      throw error;
    }
  }

  // Obtener solicitudes por estado y usuario
  async obtenerSolicitudes(
    estado?: SolicitudProducto['estado'],
    usuarioId?: string
  ): Promise<SolicitudProducto[]> {
    try {
      let q = collection(db, SOLICITUDES_COLLECTION);

      if (estado || usuarioId) {
        const conditions = [];
        if (estado) conditions.push(where('estado', '==', estado));
        if (usuarioId) conditions.push(where('solicitanteId', '==', usuarioId));

        q = query(q, ...conditions);
      }

      q = query(q, orderBy('fechaSolicitud', 'desc'));

      const querySnapshot = await getDocs(q);
      const solicitudes: SolicitudProducto[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        solicitudes.push({
          id: docSnap.id,
          ...data,
          fechaSolicitud: data.fechaSolicitud?.toDate() || new Date(),
          fechaPreparacion: data.fechaPreparacion?.toDate(),
          fechaEntrega: data.fechaEntrega?.toDate(),
        } as SolicitudProducto);
      });

      return solicitudes;

    } catch (error) {
      console.error('❌ Error obteniendo solicitudes:', error);
      throw error;
    }
  }

  // Actualizar estado de solicitud
  async actualizarEstadoSolicitud(
    solicitudId: string,
    nuevoEstado: SolicitudProducto['estado'],
    observaciones?: string
  ): Promise<void> {
    await this.actualizarEstadoSolicitudConCantidad(solicitudId, nuevoEstado, undefined, observaciones);
  }

  // Actualizar estado con cantidad específica (para entregas)
  async actualizarEstadoSolicitudConCantidad(
    solicitudId: string,
    nuevoEstado: SolicitudProducto['estado'],
    cantidadEntregada?: number,
    observaciones?: string
  ): Promise<void> {
    try {
      // Obtener la solicitud actual para calcular cantidades
      const solicitudDoc = await getDoc(doc(db, SOLICITUDES_COLLECTION, solicitudId));
      if (!solicitudDoc.exists()) {
        throw new Error('Solicitud no encontrada');
      }

      const solicitudActual = solicitudDoc.data() as SolicitudProducto;
      const cantidadSolicitada = solicitudActual.cantidadSolicitada;
      const cantidadYaEntregada = solicitudActual.cantidadEntregada || 0;

      const updateData: any = {
        estado: nuevoEstado,
      };

      // Lógica específica para entregas
      if (nuevoEstado === 'entregado' || nuevoEstado === 'parcial') {
        if (cantidadEntregada === undefined || cantidadEntregada <= 0) {
          throw new Error('Debe especificar una cantidad válida para la entrega');
        }

        // Validar que no se entregue más de lo solicitado
        if (cantidadYaEntregada + cantidadEntregada > cantidadSolicitada) {
          throw new Error(`No puede entregar más de ${cantidadSolicitada - cantidadYaEntregada} unidades pendientes`);
        }

        // Calcular nueva cantidad entregada y pendiente
        const nuevaCantidadEntregada = cantidadYaEntregada + cantidadEntregada;
        const nuevaCantidadPendiente = cantidadSolicitada - nuevaCantidadEntregada;

        updateData.cantidadEntregada = nuevaCantidadEntregada;
        updateData.cantidadPendiente = nuevaCantidadPendiente;

        // Registrar entrega parcial en el historial
        const entregaParcial = {
          fecha: new Date(),
          cantidad: cantidadEntregada,
          observaciones: observaciones || undefined,
        };

        const entregasActuales = solicitudActual.entregasParciales || [];
        updateData.entregasParciales = [...entregasActuales, entregaParcial];

        // Determinar estado final
        if (nuevaCantidadEntregada >= cantidadSolicitada) {
          updateData.estado = 'entregado';
          updateData.fechaEntrega = Timestamp.fromDate(new Date());
        } else {
          updateData.estado = 'parcial';
        }
      } else {
        // Estados normales (sin entrega específica)
        if (nuevoEstado === 'preparando') {
          updateData.fechaPreparacion = Timestamp.fromDate(new Date());
        } else if (nuevoEstado === 'listo') {
          // Inicializar contadores cuando está listo para entregar
          updateData.cantidadEntregada = 0;
          updateData.cantidadPendiente = cantidadSolicitada;
        }
      }

      if (observaciones && nuevoEstado !== 'entregado' && nuevoEstado !== 'parcial') {
        updateData.observacionesAlmacenero = observaciones;
      }

      await updateDoc(doc(db, SOLICITUDES_COLLECTION, solicitudId), updateData);

      // Actualizar también en el almacén backend si es una entrega
      if (nuevoEstado === 'entregado' || nuevoEstado === 'parcial') {
        try {
          const almacenAPI = getAlmacenAPI();
          const estadoAlmacen = nuevoEstado === 'entregado' ? 'completada' : 'parcial';
          await almacenAPI.actualizarEstadoSolicitud(solicitudId, estadoAlmacen, cantidadEntregada);

          // Registrar movimiento de salida en el almacén
          if (cantidadEntregada && cantidadEntregada > 0) {
            await almacenAPI.registrarMovimiento({
              producto_id: solicitudActual.productoId,
              tipo: 'salida',
              cantidad: cantidadEntregada,
              motivo: `Entrega de solicitud ${solicitudId}`,
              usuario_id: user.uid,
              usuario_nombre: user.displayName || user.email?.split('@')[0] || 'Almacenero',
            });
          }

          console.log('✅ Actualización enviada al almacén backend');

        } catch (almacenError) {
          console.warn('⚠️ Error actualizando almacén backend, pero guardado localmente:', almacenError);
        }
      }

      // Notificaciones apropiadas
      if (nuevoEstado === 'listo') {
        await this.notificarSolicitanteListo(solicitudId);
      } else if (nuevoEstado === 'entregado') {
        await this.notificarSolicitanteEntregado(solicitudId, cantidadEntregada || cantidadSolicitada);
      } else if (nuevoEstado === 'parcial') {
        await this.notificarSolicitanteParcial(solicitudId, cantidadEntregada || 0);
      }

      console.log('✅ Estado de solicitud actualizado completamente:', solicitudId, nuevoEstado, {
        entregada: cantidadEntregada,
        totalEntregada: updateData.cantidadEntregada,
        pendiente: updateData.cantidadPendiente,
      });

    } catch (error) {
      console.error('❌ Error actualizando solicitud con cantidad:', error);
      throw error;
    }
  }

  // Escuchar cambios en tiempo real (para almaceneros)
  escucharSolicitudesPendientes(callback: (solicitudes: SolicitudProducto[]) => void) {
    const q = query(
      collection(db, SOLICITUDES_COLLECTION),
      where('estado', 'in', ['pendiente', 'preparando']),
      orderBy('fechaSolicitud', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const solicitudes: SolicitudProducto[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        solicitudes.push({
          id: docSnap.id,
          ...data,
          fechaSolicitud: data.fechaSolicitud?.toDate() || new Date(),
          fechaPreparacion: data.fechaPreparacion?.toDate(),
          fechaEntrega: data.fechaEntrega?.toDate(),
        } as SolicitudProducto);
      });

      callback(solicitudes);
    });
  }

  // Notificar a todos los almaceneros sobre nueva solicitud
  private async notificarAlmaceneros(solicitud: Omit<SolicitudProducto, 'id' | 'fechaSolicitud'>): Promise<void> {
    try {
      const titulo = `🚚 Nueva solicitud: ${solicitud.productoNombre}`;
      const mensaje = `${solicitud.solicitanteNombre} solicita ${solicitud.cantidadSolicitada} unidades\nPrioridad: ${solicitud.prioridad.toUpperCase()}`;

      // Datos adicionales para la notificación
      const notificationData = {
        type: 'product_request',
        solicitudId: 'pending', // Se actualizará cuando se cree la solicitud
        productoId: solicitud.productoId,
        productoNombre: solicitud.productoNombre,
        cantidadSolicitada: solicitud.cantidadSolicitada.toString(),
        solicitanteNombre: solicitud.solicitanteNombre,
        prioridad: solicitud.prioridad,
      };

      // 1. Enviar notificación push a través de FCM (si está disponible)
      const fcmService = getFCMService();
      if (fcmService.isFCMAvailable()) {
        try {
          await fcmService.sendPushNotificationToAlmaceneros(
            titulo,
            mensaje,
            notificationData
          );
          console.log('📲 Notificación FCM enviada a almaceneros');
        } catch (fcmError) {
          console.warn('⚠️ Error enviando FCM, usando notificación local:', fcmError);
        }
      }

      // 2. Siempre enviar notificación local (como respaldo)
      sendLocalNotification(titulo, mensaje, {
        channelId: 'stock-alerts',
        priority: 'high',
        importance: 'high',
        tag: `solicitud-${solicitud.productoId}`,
        userInfo: notificationData,
      });

      // 3. Vibración intensa para alertas de almacén
      vibrateDevice([300, 150, 300, 150, 300, 150, 300]);

      console.log('✅ Notificaciones enviadas a almaceneros (FCM + Local)');

    } catch (error) {
      console.error('❌ Error notificando almaceneros:', error);
    }
  }

  // Notificar al solicitante que el producto está listo para recoger
  private async notificarSolicitanteListo(solicitudId: string): Promise<void> {
    try {
      const solicitudDoc = await getDoc(doc(db, SOLICITUDES_COLLECTION, solicitudId));
      if (!solicitudDoc.exists()) return;

      const solicitud = solicitudDoc.data() as SolicitudProducto;

      const titulo = `✅ Producto listo: ${solicitud.productoNombre}`;
      const mensaje = `Tu solicitud de ${solicitud.cantidadSolicitada} unidades está preparada y lista para recoger en ${solicitud.ubicacionEntrega || 'Almacén'}`;

      const notificationData = {
        type: 'product_ready',
        solicitudId,
        productoNombre: solicitud.productoNombre,
        cantidadSolicitada: solicitud.cantidadSolicitada.toString(),
      };

      // FCM al solicitante específico
      const fcmService = getFCMService();
      if (fcmService.isFCMAvailable()) {
        try {
          await fcmService.sendPushNotificationToUser(
            solicitud.solicitanteId,
            titulo,
            mensaje,
            notificationData
          );
          console.log('📲 Notificación FCM enviada al solicitante (listo)');
        } catch (fcmError) {
          console.warn('⚠️ Error enviando FCM al solicitante:', fcmError);
        }
      }

      // Notificación local como respaldo
      sendLocalNotification(titulo, mensaje, {
        channelId: 'sales-alerts',
        priority: 'default',
        importance: 'default',
        tag: `listo-${solicitudId}`,
        userInfo: notificationData,
      });

      console.log('✅ Notificación enviada al solicitante (producto listo)');

    } catch (error) {
      console.error('❌ Error notificando solicitante listo:', error);
    }
  }

  // Notificar entrega completa
  private async notificarSolicitanteEntregado(solicitudId: string, cantidadEntregada: number): Promise<void> {
    try {
      const solicitudDoc = await getDoc(doc(db, SOLICITUDES_COLLECTION, solicitudId));
      if (!solicitudDoc.exists()) return;

      const solicitud = solicitudDoc.data() as SolicitudProducto;

      const titulo = `📦 Producto entregado: ${solicitud.productoNombre}`;
      const mensaje = `Se han entregado ${cantidadEntregada} unidades de ${solicitud.cantidadSolicitada} solicitadas. ¡Entrega completada!`;

      const notificationData = {
        type: 'product_delivered',
        solicitudId,
        productoNombre: solicitud.productoNombre,
        cantidadEntregada: cantidadEntregada.toString(),
        cantidadSolicitada: solicitud.cantidadSolicitada.toString(),
      };

      // FCM al solicitante
      const fcmService = getFCMService();
      if (fcmService.isFCMAvailable()) {
        try {
          await fcmService.sendPushNotificationToUser(
            solicitud.solicitanteId,
            titulo,
            mensaje,
            notificationData
          );
          console.log('📲 Notificación FCM enviada al solicitante (entregado)');
        } catch (fcmError) {
          console.warn('⚠️ Error enviando FCM al solicitante:', fcmError);
        }
      }

      // Notificación local
      sendLocalNotification(titulo, mensaje, {
        channelId: 'sales-alerts',
        priority: 'high',
        importance: 'high',
        tag: `entregado-${solicitudId}`,
        userInfo: notificationData,
      });

      console.log('✅ Notificación enviada al solicitante (producto entregado)');

    } catch (error) {
      console.error('❌ Error notificando solicitante entregado:', error);
    }
  }

  // Notificar entrega parcial
  private async notificarSolicitanteParcial(solicitudId: string, cantidadEntregada: number): Promise<void> {
    try {
      const solicitudDoc = await getDoc(doc(db, SOLICITUDES_COLLECTION, solicitudId));
      if (!solicitudDoc.exists()) return;

      const solicitud = solicitudDoc.data() as SolicitudProducto;

      const titulo = `📦 Entrega parcial: ${solicitud.productoNombre}`;
      const entregado = solicitud.cantidadEntregada || 0;
      const pendiente = solicitud.cantidadPendiente || 0;
      const mensaje = `Se entregaron ${cantidadEntregada} unidades. Total entregado: ${entregado}/${solicitud.cantidadSolicitada}. Pendiente: ${pendiente} unidades.`;

      const notificationData = {
        type: 'product_partial_delivery',
        solicitudId,
        productoNombre: solicitud.productoNombre,
        cantidadEntregada: cantidadEntregada.toString(),
        totalEntregado: entregado.toString(),
        cantidadSolicitada: solicitud.cantidadSolicitada.toString(),
        pendiente: pendiente.toString(),
      };

      // FCM al solicitante
      const fcmService = getFCMService();
      if (fcmService.isFCMAvailable()) {
        try {
          await fcmService.sendPushNotificationToUser(
            solicitud.solicitanteId,
            titulo,
            mensaje,
            notificationData
          );
          console.log('📲 Notificación FCM enviada al solicitante (parcial)');
        } catch (fcmError) {
          console.warn('⚠️ Error enviando FCM al solicitante:', fcmError);
        }
      }

      // Notificación local
      sendLocalNotification(titulo, mensaje, {
        channelId: 'sales-alerts',
        priority: 'default',
        importance: 'default',
        tag: `parcial-${solicitudId}`,
        userInfo: notificationData,
      });

      console.log('✅ Notificación enviada al solicitante (entrega parcial)');

    } catch (error) {
      console.error('❌ Error notificando solicitante parcial:', error);
    }
  }

  // Notificar al solicitante que el producto está listo
  private async notificarSolicitanteListo(solicitudId: string): Promise<void> {
    try {
      const solicitudDoc = await getDoc(doc(db, SOLICITUDES_COLLECTION, solicitudId));
      if (!solicitudDoc.exists()) return;

      const solicitud = solicitudDoc.data() as SolicitudProducto;

      const titulo = `✅ Producto listo: ${solicitud.productoNombre}`;
      const mensaje = `Tu solicitud de ${solicitud.cantidadSolicitada} unidades está preparada y lista para recoger`;

      const notificationData = {
        type: 'product_ready',
        solicitudId,
        productoNombre: solicitud.productoNombre,
        cantidadSolicitada: solicitud.cantidadSolicitada.toString(),
      };

      // 1. Enviar notificación push FCM al solicitante específico
      const fcmService = getFCMService();
      if (fcmService.isFCMAvailable()) {
        try {
          await fcmService.sendPushNotificationToUser(
            solicitud.solicitanteId,
            titulo,
            mensaje,
            notificationData
          );
          console.log('📲 Notificación FCM enviada al solicitante');
        } catch (fcmError) {
          console.warn('⚠️ Error enviando FCM al solicitante, usando local:', fcmError);
        }
      }

      // 2. Siempre enviar notificación local (como respaldo)
      sendLocalNotification(titulo, mensaje, {
        channelId: 'sales-alerts',
        priority: 'default',
        importance: 'default',
        tag: `listo-${solicitudId}`,
        userInfo: notificationData,
      });

      console.log('✅ Notificación enviada al solicitante (FCM + Local)');

    } catch (error) {
      console.error('❌ Error notificando solicitante:', error);
    }
  }

  // Obtener estadísticas de solicitudes
  async obtenerEstadisticas(): Promise<{
    totalPendientes: number;
    totalPreparando: number;
    totalListos: number;
    totalEntregados: number;
  }> {
    try {
      const solicitudes = await this.obtenerSolicitudes();

      return {
        totalPendientes: solicitudes.filter(s => s.estado === 'pendiente').length,
        totalPreparando: solicitudes.filter(s => s.estado === 'preparando').length,
        totalListos: solicitudes.filter(s => s.estado === 'listo').length,
        totalEntregados: solicitudes.filter(s => s.estado === 'entregado').length,
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return {
        totalPendientes: 0,
        totalPreparando: 0,
        totalListos: 0,
        totalEntregados: 0,
      };
    }
  }
}

// Instancia singleton
let solicitudesServiceInstance: SolicitudesService | null = null;

export const getSolicitudesService = (): SolicitudesService => {
  if (!solicitudesServiceInstance) {
    solicitudesServiceInstance = new SolicitudesService();
  }
  return solicitudesServiceInstance;
};

export default getSolicitudesService;
