// Firebase configuration for React Native - misma configuración que la web
import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
// App Check (import estático)
import { initializeAppCheck, ReCaptchaV3Provider, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
// Variables de entorno - PRODUCCIÓN HARDCODEADAS
// Credenciales de producción para evitar problemas con variables de entorno faltantes
const ENV_VARS = {
  VITE_FIREBASE_API_KEY: 'AIzaSyDlutXHfD-bCfZ2rATFvrNGBerwdsXjbo0',
  VITE_FIREBASE_AUTH_DOMAIN: 'inventario-clientes.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'inventario-clientes',
  VITE_FIREBASE_STORAGE_BUCKET: 'inventario-clientes.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '310457168785',
  VITE_FIREBASE_APP_ID: '1:310457168785:android:44b0d6573e7ee70a3f2030',
  VITE_RECAPTCHA_SITE_KEY: '',
  VITE_DISABLE_APPCHECK: 'true',
  VITE_RECAPTCHA_MODE: 'enterprise',
  VITE_APPCHECK_DEBUG_TOKEN: '',
  VITE_DEBUG: 'false',
  VITE_DEBUG_DEFAULT_DEV: 'false',
  VITE_DEMO_MODE: 'false'
};

// Intentar importar variables de entorno, usar fallback si no existen
let VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID,
    VITE_RECAPTCHA_SITE_KEY, VITE_DISABLE_APPCHECK, VITE_RECAPTCHA_MODE,
    VITE_APPCHECK_DEBUG_TOKEN, VITE_DEBUG, VITE_DEBUG_DEFAULT_DEV, VITE_DEMO_MODE;

try {
  const env = require('@env');
  VITE_FIREBASE_API_KEY = env.VITE_FIREBASE_API_KEY || ENV_VARS.VITE_FIREBASE_API_KEY;
  VITE_FIREBASE_AUTH_DOMAIN = env.VITE_FIREBASE_AUTH_DOMAIN || ENV_VARS.VITE_FIREBASE_AUTH_DOMAIN;
  VITE_FIREBASE_PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || ENV_VARS.VITE_FIREBASE_PROJECT_ID;
  VITE_FIREBASE_STORAGE_BUCKET = env.VITE_FIREBASE_STORAGE_BUCKET || ENV_VARS.VITE_FIREBASE_STORAGE_BUCKET;
  VITE_FIREBASE_MESSAGING_SENDER_ID = env.VITE_FIREBASE_MESSAGING_SENDER_ID || ENV_VARS.VITE_FIREBASE_MESSAGING_SENDER_ID;
  VITE_FIREBASE_APP_ID = env.VITE_FIREBASE_APP_ID || ENV_VARS.VITE_FIREBASE_APP_ID;
  VITE_RECAPTCHA_SITE_KEY = env.VITE_RECAPTCHA_SITE_KEY || ENV_VARS.VITE_RECAPTCHA_SITE_KEY;
  VITE_DISABLE_APPCHECK = env.VITE_DISABLE_APPCHECK || ENV_VARS.VITE_DISABLE_APPCHECK;
  VITE_RECAPTCHA_MODE = env.VITE_RECAPTCHA_MODE || ENV_VARS.VITE_RECAPTCHA_MODE;
  VITE_APPCHECK_DEBUG_TOKEN = env.VITE_APPCHECK_DEBUG_TOKEN || ENV_VARS.VITE_APPCHECK_DEBUG_TOKEN;
  VITE_DEBUG = env.VITE_DEBUG || ENV_VARS.VITE_DEBUG;
  VITE_DEBUG_DEFAULT_DEV = env.VITE_DEBUG_DEFAULT_DEV || ENV_VARS.VITE_DEBUG_DEFAULT_DEV;
  VITE_DEMO_MODE = env.VITE_DEMO_MODE || ENV_VARS.VITE_DEMO_MODE;
} catch (error) {
  // Si @env no está disponible, usar valores hardcodeados
  VITE_FIREBASE_API_KEY = ENV_VARS.VITE_FIREBASE_API_KEY;
  VITE_FIREBASE_AUTH_DOMAIN = ENV_VARS.VITE_FIREBASE_AUTH_DOMAIN;
  VITE_FIREBASE_PROJECT_ID = ENV_VARS.VITE_FIREBASE_PROJECT_ID;
  VITE_FIREBASE_STORAGE_BUCKET = ENV_VARS.VITE_FIREBASE_STORAGE_BUCKET;
  VITE_FIREBASE_MESSAGING_SENDER_ID = ENV_VARS.VITE_FIREBASE_MESSAGING_SENDER_ID;
  VITE_FIREBASE_APP_ID = ENV_VARS.VITE_FIREBASE_APP_ID;
  VITE_RECAPTCHA_SITE_KEY = ENV_VARS.VITE_RECAPTCHA_SITE_KEY;
  VITE_DISABLE_APPCHECK = ENV_VARS.VITE_DISABLE_APPCHECK;
  VITE_RECAPTCHA_MODE = ENV_VARS.VITE_RECAPTCHA_MODE;
  VITE_APPCHECK_DEBUG_TOKEN = ENV_VARS.VITE_APPCHECK_DEBUG_TOKEN;
  VITE_DEBUG = ENV_VARS.VITE_DEBUG;
  VITE_DEBUG_DEFAULT_DEV = ENV_VARS.VITE_DEBUG_DEFAULT_DEV;
  VITE_DEMO_MODE = ENV_VARS.VITE_DEMO_MODE;
}

// Verificar si las variables de entorno están configuradas
const checkEnvVars = () => {
  const requiredVars = [
    VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID
  ];

  const missingVars = requiredVars.filter(varValue => !varValue);

  if (missingVars.length > 0) {
    console.error('❌ Variables de entorno de Firebase faltantes:', ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID']);
    console.error('📝 Crea un archivo .env con las credenciales de Firebase');
    console.error('🔗 Ve a: https://console.firebase.google.com/ para obtener las credenciales');
    return false;
  }
  return true;
};

// Permitir modo demo (sin Firebase) para entornos locales/Android sin .env
const DEMO_MODE = String(VITE_DEMO_MODE || 'true').toLowerCase() === 'true';

// Control centralizado de logs visibles en consola
const SHOULD_LOG = String(VITE_DEBUG || 'false').toLowerCase() === 'true' || (__DEV__ && String(VITE_DEBUG_DEFAULT_DEV || 'false').toLowerCase() === 'true');
const dbg = (...args) => { if (SHOULD_LOG) console.log(...args); };
const dbgwarn = (...args) => { if (SHOULD_LOG) console.warn(...args); };

const firebaseConfig = {
  apiKey: VITE_FIREBASE_API_KEY,
  authDomain: VITE_FIREBASE_AUTH_DOMAIN,
  projectId: VITE_FIREBASE_PROJECT_ID,
  storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: VITE_FIREBASE_APP_ID
};

dbg('🔧 Configuración de Firebase:', {
  apiKey: firebaseConfig.apiKey ? '✅ Configurado' : '❌ Faltante',
  authDomain: firebaseConfig.authDomain ? '✅ Configurado' : '❌ Faltante',
  projectId: firebaseConfig.projectId ? '✅ Configurado' : '❌ Faltante',
  storageBucket: firebaseConfig.storageBucket ? '✅ Configurado' : '❌ Faltante',
  messagingSenderId: firebaseConfig.messagingSenderId ? '✅ Configurado' : '❌ Faltante',
  appId: firebaseConfig.appId ? '✅ Configurado' : '❌ Faltante'
});

let app, db, auth, storage, functions;

try {
  if (checkEnvVars()) {
    dbg('🚀 Inicializando Firebase...');
    app = initializeApp(firebaseConfig);
    dbg('✅ Firebase App inicializado');

    // Inicializar App Check si hay site key o si está disponible el módulo
    try {
      const siteKey = VITE_RECAPTCHA_SITE_KEY;
      const appCheckDisabled = String(VITE_DISABLE_APPCHECK || '').toLowerCase() === 'true';
      const appCheckMode = String(VITE_RECAPTCHA_MODE || 'v3').toLowerCase(); // 'v3' | 'enterprise'
      if (!appCheckDisabled && siteKey) {
        if (__DEV__) {
          const debugToken = VITE_APPCHECK_DEBUG_TOKEN;
          // eslint-disable-next-line no-undef
          global.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken || true;
        }
        initializeAppCheck(app, {
          provider: appCheckMode === 'enterprise'
            ? new ReCaptchaEnterpriseProvider(siteKey)
            : new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true
        });
        dbg(`✅ App Check inicializado (${appCheckMode === 'enterprise' ? 'reCAPTCHA Enterprise' : 'reCAPTCHA v3'})`);
      } else {
        dbgwarn(appCheckDisabled
          ? 'ℹ️ App Check desactivado por VITE_DISABLE_APPCHECK=true'
          : '⚠️ VITE_RECAPTCHA_SITE_KEY no definido. Si App Check está aplicado en Authentication, la autenticación fallará.'
        );
      }
    } catch (e) {
      dbgwarn('⚠️ Error inicializando App Check:', e?.message || e);
    }

    // Inicializar Firestore con long polling para mayor compatibilidad de red
    db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      useFetchStreams: false
    });
    dbg('✅ Firestore inicializado (long polling activado)');

    try {
      auth = getAuth(app);
      // Validación defensiva del usuario actual
      const maybeUser = auth.currentUser;
      if (!maybeUser) {
        // No hay sesión activa, continuar normalmente
      }
      dbg('✅ Firebase Auth inicializado');
    } catch (e) {
      dbgwarn('⚠️ Error inicializando Auth (continuando sin sesión).');
      auth = null;
    }

    storage = getStorage(app);
    dbg('✅ Firebase Storage inicializado:', storage ? '✅ Exitoso' : '❌ Falló');

    // Usar región explícita para evitar cierres/403 por endpoint incorrecto
    functions = getFunctions(app, 'us-central1');
    dbg('✅ Firebase Functions inicializado');

    dbg('✅ Firebase configurado correctamente');
  } else if (DEMO_MODE) {
    // Configuración temporal para evitar errores
    dbgwarn('⚠️ DEMO_MODE activo: ejecutando sin Firebase');
    app = null;
    db = null;
    auth = null;
    storage = null;
    functions = null;
  } else {
    dbgwarn('⚠️ Variables Firebase faltantes y DEMO_MODE desactivado');
    app = null;
    db = null;
    auth = null;
    storage = null;
    functions = null;
  }
} catch (error) {
  console.error('❌ Error al inicializar Firebase:', error);
  app = null;
  db = null;
  auth = null;
  storage = null;
  functions = null;
}

export { db, auth, storage, functions };
export default app;

// Función para verificar la conectividad
export const checkFirebaseConnection = async () => {
  if (!db) {
    return { connected: false, error: 'Firebase no está configurado' };
  }

  try {
    const { collection, doc, getDoc } = await import('firebase/firestore');
    // Si no hay usuario autenticado, no intentamos leer colecciones restringidas por reglas
    try {
      const { getAuth } = await import('firebase/auth');
      const a = getAuth();
      if (!a.currentUser) {
        return { connected: true };
      }
    } catch {}
    // Intento de lectura mínima; si las reglas niegan, igualmente hay conexión
    const testDocRef = doc(collection(db, '_ping'), 'connection');
    await getDoc(testDocRef);
    return { connected: true };
  } catch (error) {
    // Si el error es de permisos, consideramos que hay conexión pero no permisos (lo manejará la app)
    if (error?.code === 'permission-denied') {
      return { connected: true, warning: 'permission-denied' };
    }
    console.error('Error de conexión con Firebase:', error);
    return { connected: false, error: error.message };
  }
};
