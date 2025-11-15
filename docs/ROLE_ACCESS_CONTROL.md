# Control de Acceso por Roles - App Móvil

## Sistema de Roles Implementado

La aplicación móvil implementa un sistema de control de acceso basado en roles idéntico al de la versión web, asegurando que cada usuario solo tenga acceso a las funcionalidades correspondientes a su rol.

## Roles Disponibles

### 1. **Usuario Registrador** (`user`)
- **Pestañas visibles**: Dashboard, Clientes, Compras, Productos, Almacén, Auditoría
- **Funcionalidades**:
  - ✅ Ver dashboard completo
  - ✅ Gestionar clientes (CRUD)
  - ✅ Registrar y ver compras
  - ✅ Ver productos
  - ✅ Ver información del almacén (solo lectura)
  - ✅ Ver auditoría
  - ✅ OCR de recibos
  - ✅ Búsqueda semántica
  - ❌ No puede gestionar usuarios
  - ❌ No puede hacer movimientos de stock

### 2. **Almacenero** (`almacenero`)
- **Pestañas visibles**: Solo Almacén
- **Funcionalidades**:
  - ✅ Acceso exclusivo al módulo de almacén
  - ✅ Gestionar movimientos de stock (entrada/salida/venta directa)
  - ✅ Ver productos y stock
  - ✅ Ver alertas de stock
  - ✅ Ver historial de movimientos
  - ✅ WebSocket en tiempo real para almacén
  - ❌ No puede gestionar clientes
  - ❌ No puede registrar compras
  - ❌ No puede acceder a dashboard/auditoría
  - ❌ No puede gestionar usuarios

### 3. **Administrador** (`admin`)
- **Pestañas visibles**: Todas (Dashboard, Clientes, Compras, Productos, Almacén, Auditoría)
- **Funcionalidades**:
  - ✅ Todas las funcionalidades de usuario registrador
  - ✅ Gestionar movimientos de stock (como almacenero)
  - ✅ Gestionar usuarios (crear, editar roles, resetear contraseñas)
  - ✅ Acceder a utilidades administrativas
  - ✅ Backup automático y manual
  - ✅ Sincronización de datos
  - ✅ Optimización de base de datos
  - ✅ Exportar/importar datos

### 4. **Developer** (`developer`)
- **Funcionalidades idénticas al Administrador**
- **Permisos adicionales**:
  - ✅ Puede asignar rol "developer" a otros usuarios
  - ✅ Acceso completo a todas las funcionalidades

## Implementación Técnica

### Navegación Controlada por Roles

```typescript
// En AppNavigator.tsx
const getTabScreens = () => {
  if (isAlmacenero && !isAdmin && !isDeveloper) {
    // Almaceneros solo ven Almacén
    return <Tab.Screen name="Almacen" component={AlmacenScreen} />;
  } else {
    // Admin/Developer/Usuarios ven todo
    return (
      <>
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Clientes" component={ClientesScreen} />
        {/* ... otras pestañas */}
      </>
    );
  }
};
```

### Pantallas Restringidas

```typescript
// Pantallas solo para no almaceneros
{!isAlmacenero && (
  <>
    <Stack.Screen name="ClienteForm" component={ClienteFormScreen} />
    <Stack.Screen name="CompraForm" component={CompraFormScreen} />
  </>
)}

// Pantallas solo para admin/developer
{(isAdmin || isDeveloper) && (
  <>
    <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
    <Stack.Screen name="AdminUtilities" component={AdminUtilitiesScreen} />
  </>
)}
```

### Dashboard Adaptativo

```typescript
// Acciones rápidas según rol
{isAlmacenero && !isAdmin && !isDeveloper ? (
  // Acciones específicas para almaceneros
  <>
    <QuickAction title="Entrada Stock" icon="add-circle" ... />
    <QuickAction title="Salida Stock" icon="remove-circle" ... />
  </>
) : (
  // Acciones para usuarios normales/admin/developer
  <>
    <QuickAction title="Nuevo Cliente" ... />
    <QuickAction title="Nueva Venta" ... />
  </>
)}
```

### Almacén con Control de Acceso

```typescript
// Solo almaceneros pueden hacer movimientos
{(isAlmacenero || isAdmin || isDeveloper) ? (
  <View style={styles.quickActions}>
    {/* Botones de entrada/salida/venta */}
  </View>
) : (
  <View style={styles.permissionMessage}>
    <Text>Solo puedes ver información del almacén...</Text>
  </View>
)}
```

## Seguridad Implementada

### 1. **Navegación Segura**
- Las pantallas restringidas no están disponibles en el navegador para usuarios sin permisos
- Redirección automática basada en roles

### 2. **UI Adaptativa**
- Elementos de interfaz se muestran/ocultan según permisos
- Mensajes informativos para funcionalidades no disponibles

### 3. **Control a Nivel de Componente**
- Cada componente verifica permisos antes de mostrar funcionalidades
- Estados y acciones protegidas por roles

## Flujo de Usuario por Rol

### **Usuario Registrador**
1. Login → Dashboard completo
2. Gestiona clientes y ventas
3. Puede ver almacén pero no modificar stock
4. Acceso a OCR y búsqueda semántica

### **Almacenero**
1. Login → Directamente al almacén
2. Solo puede gestionar stock
3. No ve otras secciones de la app
4. Funcionalidad completa de almacén

### **Administrador/Developer**
1. Login → Dashboard completo
2. Acceso total a todas las funcionalidades
3. Puede gestionar usuarios y sistema
4. Backup, utilidades, etc.

## Consideraciones de UX

### **Almaceneros**
- Interfaz simplificada y enfocada en almacén
- Acceso directo a funciones de stock
- Sin distracciones de otras secciones

### **Usuarios Registradores**
- Interfaz completa pero sin funciones de administración
- Pueden ver información pero no modificar stock

### **Administradores**
- Interfaz completa con acceso administrativo
- Indicadores visuales para funciones de admin (botón rojo con ícono de settings)

## Testing de Roles

Para probar el sistema de roles, crear usuarios con diferentes roles:

```javascript
// Usuario almacenero
{
  email: "almacenero@test.com",
  role: "almacenero"
}

// Usuario registrador
{
  email: "registrador@test.com",
  role: "user"
}

// Administrador
{
  email: "admin@test.com",
  role: "admin"
}
```

Cada rol debe mostrar la interfaz y funcionalidades correctas según la documentación arriba.
