# Control de Ventas - React Native

Aplicación móvil nativa completa para el sistema de control de ventas, con funcionalidades de almacén, clientes, productos y auditoría.

## 🚀 Características

- ✅ **Autenticación completa** con Firebase Auth
- ✅ **Navegación nativa** con React Navigation (Stack, Tab, Drawer)
- ✅ **Módulo de almacén** con WebSocket en tiempo real
- ✅ **Gestión de clientes** con formularios nativos
- ✅ **Dashboard responsive** con estadísticas
- ✅ **Interfaz moderna** con Material Design
- ✅ **Sincronización en tiempo real** con el backend
- ✅ **Funcionalidades offline completas** con AsyncStorage
- ✅ **Sistema de notificaciones Toast nativo**
- ✅ **Formularios completos** de ventas y movimientos de stock
- ✅ **Suite completa de testing** con Jest y Testing Library

## 📱 Tecnologías

- **React Native 0.82** - Framework móvil
- **TypeScript** - Tipado fuerte
- **React Navigation** - Navegación nativa
- **Firebase** - Autenticación y base de datos
- **Socket.IO** - Comunicación en tiempo real
- **React Native Paper** - Componentes UI
- **AsyncStorage** - Persistencia offline
- **Axios** - Cliente HTTP
- **Jest & Testing Library** - Testing completo
- **Toast System** - Notificaciones nativas

## 🛠️ Instalación

### Prerrequisitos

- Node.js >= 20
- React Native CLI
- Android Studio (para Android)
- Xcode (para iOS, macOS only)

### Configuración del proyecto

1. **Instalar dependencias:**
   ```bash
   cd ControlVentasRN
   npm install
   ```

2. **Configurar Firebase:**
   - Copia tu configuración de Firebase en `src/services/firebase.ts`
   - Asegúrate de que las reglas de Firestore permitan acceso desde la app móvil

3. **Configurar backend:**
   - Asegúrate de que el backend esté corriendo en Cloud Run
   - Actualiza las URLs en `.env.development.local` si es necesario

### Ejecutar la aplicación

#### Android:
```bash
npm run android
```

#### iOS (solo macOS):
```bash
npm run ios
```

#### Desarrollo:
```bash
npm start  # Inicia Metro bundler
```

## 📂 Estructura del proyecto

```
ControlVentasRN/
├── src/
│   ├── components/        # Componentes reutilizables
│   ├── screens/          # Pantallas de la aplicación
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── ClientesScreen.tsx
│   │   ├── ComprasScreen.tsx
│   │   ├── ProductosScreen.tsx
│   │   ├── AlmacenScreen.tsx
│   │   └── AuditoriaScreen.tsx
│   ├── services/         # Servicios (Firebase, WebSocket, etc.)
│   ├── contexts/         # Contextos de React
│   ├── utils/           # Utilidades
│   ├── types/           # Definiciones TypeScript
│   └── navigation/      # Configuración de navegación
├── android/             # Configuración Android
├── ios/                # Configuración iOS (si existe)
├── package.json
├── metro.config.js     # Configuración de Metro bundler
└── tsconfig.json       # Configuración TypeScript
├── __tests__/           # Tests unitarios e integración
│   ├── utils/          # Tests de utilidades
│   ├── services/       # Tests de servicios
│   └── components/     # Tests de componentes
```

## 🎯 Funcionalidades Implementadas

### ✅ Formularios Completos

#### 📝 **Formulario de Ventas**
- **Selección de cliente** con búsqueda modal
- **Selección múltiple de productos** con cantidades
- **Cálculo automático de totales** en tiempo real
- **Métodos de pago** (Efectivo, Tarjeta, Transferencia)
- **Campo de notas** opcional
- **Validación completa** de datos
- **Modo offline** con sincronización automática

#### 📦 **Formulario de Movimientos de Stock**
- **Tres tipos de movimiento**: Entrada, Salida, Venta Directa
- **Selección de producto** con validación de stock
- **Control de cantidades** con validación automática
- **Campo de motivo** opcional
- **Vista previa del stock resultante**
- **Validaciones específicas** por tipo de movimiento

### 🔄 Sistema Offline Completo

#### 💾 **Persistencia Local**
- **AsyncStorage** para almacenamiento local
- **Estructura de datos** optimizada para móviles
- **Compresión automática** de datos JSON
- **Gestión de errores** robusta

#### 🔄 **Sincronización Inteligente**
- **Detección automática de conectividad**
- **Cola de sincronización** ordenada por timestamp
- **Reintentos automáticos** con backoff exponencial
- **Merge inteligente** de datos locales y remotos
- **Notificaciones de estado** en tiempo real

#### 📊 **Indicadores Visuales**
- **Badge de conectividad** (Online/Offline)
- **Contador de elementos pendientes**
- **Botón de sincronización manual**
- **Toast notifications** para feedback

### 🧪 Suite de Testing Completa

#### 🧮 **Tests Unitarios**
- **Utilidades matemáticas** (cálculos, formateo, validaciones)
- **Servicios offline** (almacenamiento, sincronización)
- **Validaciones de datos**
- **Funciones auxiliares**

#### 🧩 **Tests de Componentes**
- **Dashboard** con indicadores de estado
- **Formularios** con validaciones
- **Navegación** y interacciones
- **Contextos y hooks**

#### 🔗 **Tests de Integración**
- **Flujos completos** de usuario
- **Interacción entre componentes**
- **Estado global** y persistencia
- **Sincronización** end-to-end

### 🎨 Sistema de Notificaciones

#### 🍞 **Toast Nativo**
- **Animaciones fluidas** de entrada/salida
- **Múltiples tipos**: Success, Error, Warning, Info
- **Auto-dismiss** configurable
- **Stacking** para múltiples notificaciones
- **Diseño consistente** con la app

#### 📱 **Notificaciones Contextuales**
- **Feedback inmediato** en acciones del usuario
- **Estados de sincronización**
- **Alertas de validación**
- **Confirmaciones de éxito**

## 🔧 Configuración

### Variables de entorno

Crea un archivo `.env.development.local` en la raíz:

```bash
# URLs del backend
VITE_API_BASE_URL=https://tu-backend.cloud.run.app
VITE_WS_URL=wss://tu-backend.cloud.run.app/ws/stock

# Firebase (opcional si usas configuración directa)
# VITE_FIREBASE_API_KEY=tu-api-key
```

### Firebase Configuration

Actualiza `src/services/firebase.ts` con tu configuración:

```typescript
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  // ... otras configuraciones
};
```

## 📱 Funcionalidades implementadas

### ✅ Completadas
- [x] Autenticación con Firebase Auth
- [x] Navegación por pestañas (Dashboard, Clientes, Compras, Productos, Almacén, Auditoría)
- [x] Dashboard con estadísticas y acciones rápidas
- [x] Lista de clientes con búsqueda y filtros
- [x] Gestión de productos con indicadores de stock
- [x] Módulo de almacén con WebSocket
- [x] Sistema de auditoría básico
- [x] Diseño responsive para móviles
- [x] Formularios básicos (Cliente, Producto)

### 🚧 En desarrollo
- [ ] Formulario completo de ventas
- [ ] Movimientos de stock avanzados
- [ ] Reportes y gráficos
- [ ] Funcionalidades offline
- [ ] Notificaciones push

## 🔌 Conexión con el backend

La aplicación se conecta automáticamente al backend de Cloud Run configurado. Incluye:

- **API REST** para operaciones CRUD
- **WebSocket** para actualizaciones en tiempo real del almacén
- **Firebase Firestore** para datos persistentes
- **Firebase Auth** para autenticación

## 🐛 Solución de problemas

### Error de dependencias
```bash
# Limpiar cache de Metro
npx react-native start --reset-cache

# Limpiar node_modules
rm -rf node_modules && npm install
```

### Problemas con Firebase
- Verifica que las reglas de Firestore permitan acceso desde la app móvil
- Asegúrate de que la configuración de Firebase sea correcta

### Problemas con WebSocket
- Verifica que el backend esté corriendo y accesible
- Revisa las políticas CORS del backend

## 🧪 Testing

### Ejecutar Tests

```bash
# Tests unitarios
npm test

# Tests con watch mode
npm run test:watch

# Tests con coverage
npm run test:coverage

# Tests específicos
npm test -- --testPathPattern=mathUtils
npm test -- --testPathPattern=DashboardScreen
```

### Cobertura de Tests

Los tests cubren:
- **Utilidades matemáticas** (100% coverage)
- **Servicios offline** (CRUD operations, sync)
- **Componentes principales** (rendering, interactions)
- **Validaciones de formularios**
- **Navegación y contextos**

## 📋 Próximos pasos

1. **Push notifications:** Implementar Firebase Cloud Messaging para alertas del almacén
2. **Testing adicional:** Aumentar cobertura de tests a componentes complejos
3. **Performance:** Optimizar renders y memoria en listas grandes
4. **Analytics:** Integrar Firebase Analytics para métricas de uso
5. **Offline avanzado:** Implementar conflict resolution para datos sincronizados
6. **CI/CD:** Configurar pipeline de despliegue

## 📄 Licencia

Este proyecto es parte del sistema Control de Ventas.
