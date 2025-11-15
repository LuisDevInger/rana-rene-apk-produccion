// Servicio para Firebase Cloud Messaging (FCM)
// Maneja notificaciones push en tiempo real

import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { getAuth } from 'firebase/auth';

const FCM_TOKEN_KEY = 'fcm_token';
const DEVICE_TOKENS_COLLECTION = 'device_tokens';

class FCMService {
  private fcmToken: string | null = null;
  private messageListeners: ((message: FirebaseMessagingTypes.RemoteMessage) => void)[] = [];

  constructor() {
    this.initializeFCM();
  }

  // Inicializar FCM
  private async initializeFCM() {
    try {
      // Solicitar permisos para notificaciones
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ Permisos de notificación concedidos');

        // Obtener token FCM
        await this.getFCMToken();

        // Configurar listeners
        this.setupMessageListeners();

      } else {
        console.log('❌ Permisos de notificación denegados');
        Alert.alert(
          'Notificaciones Deshabilitadas',
          'Para recibir alertas del almacén, habilita las notificaciones en la configuración de la app.',
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('❌ Error inicializando FCM:', error);
    }
  }

  // Obtener token FCM del dispositivo
  private async getFCMToken(): Promise<string | null> {
    try {
      // Verificar si ya tenemos un token almacenado
      const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);

      // Obtener token actual del dispositivo
      const fcmToken = await messaging().getToken();

      // Si el token cambió, actualizar
      if (fcmToken !== storedToken) {
        console.log('🔄 Token FCM actualizado');
        await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);

        // Registrar token en Firestore
        await this.registerDeviceToken(fcmToken);

        this.fcmToken = fcmToken;
      } else {
        this.fcmToken = storedToken;
      }

      console.log('📱 Token FCM obtenido:', fcmToken ? '✅' : '❌');
      return fcmToken;

    } catch (error) {
      console.error('❌ Error obteniendo token FCM:', error);
      return null;
    }
  }

  // Registrar token del dispositivo en Firestore
  private async registerDeviceToken(token: string): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.log('⚠️ Usuario no autenticado, token no registrado');
        return;
      }

      const deviceInfo = {
        token,
        userId: user.uid,
        userEmail: user.email,
        platform: Platform.OS,
        lastUpdated: new Date(),
        appVersion: '1.0.0', // TODO: Obtener versión real de la app
      };

      // Usar userId + platform como ID del documento
      const docId = `${user.uid}_${Platform.OS}`;
      await setDoc(doc(db, DEVICE_TOKENS_COLLECTION, docId), deviceInfo);

      console.log('✅ Token FCM registrado en Firestore');

    } catch (error) {
      console.error('❌ Error registrando token FCM:', error);
    }
  }

  // Configurar listeners para mensajes
  private setupMessageListeners() {
    // Listener para mensajes cuando la app está en foreground
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('📨 Mensaje recibido en foreground:', remoteMessage);

      // Mostrar notificación local
      this.showLocalNotification(remoteMessage);

      // Notificar a listeners
      this.messageListeners.forEach(listener => {
        try {
          listener(remoteMessage);
        } catch (error) {
          console.error('❌ Error en listener de mensaje:', error);
        }
      });
    });

    // Listener para mensajes cuando la app está en background
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('📨 Mensaje recibido en background:', remoteMessage);
      // Los mensajes en background se manejan automáticamente por el sistema
    });

    console.log('✅ Listeners de FCM configurados');
  }

  // Mostrar notificación local cuando llega un mensaje FCM
  private showLocalNotification(remoteMessage: FirebaseMessagingTypes.RemoteMessage) {
    try {
      const { title, body } = remoteMessage.notification || {};
      const data = remoteMessage.data || {};

      if (title && body) {
        // Importar aquí para evitar dependencias circulares
        const { sendLocalNotification, vibrateDevice } = require('./notifications');

        // Determinar canal basado en el tipo de mensaje
        let channelId = 'system-alerts';
        if (data.type === 'product_request') {
          channelId = 'stock-alerts';
        } else if (data.type === 'product_ready') {
          channelId = 'sales-alerts';
        }

        sendLocalNotification(title, body, {
          channelId,
          priority: 'high',
          importance: 'high',
          tag: data.tag || 'fcm-message',
          userInfo: data,
        });

        // Vibración intensa para mensajes importantes
        vibrateDevice([300, 150, 300, 150, 300]);
      }

    } catch (error) {
      console.error('❌ Error mostrando notificación local:', error);
    }
  }

  // Enviar notificación push a un usuario específico
  async sendPushNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: { [key: string]: string }
  ): Promise<boolean> {
    try {
      // Obtener tokens del usuario desde Firestore
      const tokens = await this.getUserDeviceTokens(userId);

      if (tokens.length === 0) {
        console.log('⚠️ No hay tokens registrados para el usuario:', userId);
        return false;
      }

      // Enviar notificación a través de Firebase Functions
      const { httpsCallable } = await import('firebase/functions');
      const { getFunctions } = await import('firebase/functions');
      const { getApp } = await import('firebase/app');

      const functions = getFunctions(getApp());
      const sendPushNotification = httpsCallable(functions, 'sendPushNotification');

      await sendPushNotification({
        tokens,
        title,
        body,
        data: data || {},
      });

      console.log('✅ Notificación push enviada a', tokens.length, 'dispositivos');
      return true;

    } catch (error) {
      console.error('❌ Error enviando notificación push:', error);
      return false;
    }
  }

  // Enviar notificación push a todos los almaceneros
  async sendPushNotificationToAlmaceneros(
    title: string,
    body: string,
    data?: { [key: string]: string }
  ): Promise<boolean> {
    try {
      // Obtener tokens de todos los almaceneros desde Firestore
      const almacenerosTokens = await this.getAlmacenerosDeviceTokens();

      if (almacenerosTokens.length === 0) {
        console.log('⚠️ No hay almaceneros con tokens registrados');
        return false;
      }

      // Enviar notificación a través de Firebase Functions
      const { httpsCallable } = await import('firebase/functions');
      const { getFunctions } = await import('firebase/functions');
      const { getApp } = await import('firebase/app');

      const functions = getFunctions(getApp());
      const sendPushNotification = httpsCallable(functions, 'sendPushNotification');

      await sendPushNotification({
        tokens: almacenerosTokens,
        title,
        body,
        data: data || {},
      });

      console.log('✅ Notificación push enviada a', almacenerosTokens.length, 'almaceneros');
      return true;

    } catch (error) {
      console.error('❌ Error enviando notificación a almaceneros:', error);
      return false;
    }
  }

  // Obtener tokens de dispositivo de un usuario
  private async getUserDeviceTokens(userId: string): Promise<string[]> {
    try {
      const q = query(
        collection(db, DEVICE_TOKENS_COLLECTION),
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const tokens: string[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.token) {
          tokens.push(data.token);
        }
      });

      return tokens;

    } catch (error) {
      console.error('❌ Error obteniendo tokens del usuario:', error);
      return [];
    }
  }

  // Obtener tokens de dispositivo de todos los almaceneros
  private async getAlmacenerosDeviceTokens(): Promise<string[]> {
    try {
      // Esta función necesitaría una colección de usuarios con roles
      // Por ahora, devolveremos todos los tokens (temporal)
      const querySnapshot = await getDocs(collection(db, DEVICE_TOKENS_COLLECTION));
      const tokens: string[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.token) {
          tokens.push(data.token);
        }
      });

      return tokens;

    } catch (error) {
      console.error('❌ Error obteniendo tokens de almaceneros:', error);
      return [];
    }
  }

  // Agregar listener para mensajes
  onMessage(listener: (message: FirebaseMessagingTypes.RemoteMessage) => void) {
    this.messageListeners.push(listener);

    // Retornar función para remover listener
    return () => {
      const index = this.messageListeners.indexOf(listener);
      if (index > -1) {
        this.messageListeners.splice(index, 1);
      }
    };
  }

  // Obtener token FCM actual
  getToken(): string | null {
    return this.fcmToken;
  }

  // Verificar si FCM está disponible
  isFCMAvailable(): boolean {
    return !!this.fcmToken;
  }
}

// Instancia singleton
let fcmServiceInstance: FCMService | null = null;

export const getFCMService = (): FCMService => {
  if (!fcmServiceInstance) {
    fcmServiceInstance = new FCMService();
  }
  return fcmServiceInstance;
};

export default getFCMService;
