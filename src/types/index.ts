// Type definitions for React Native app

export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: 'admin' | 'user' | 'almacenero' | 'developer';
  createdAt: Date;
  lastLogin?: Date;
}

export interface Cliente {
  id: string;
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  dni?: string;
  direccion?: string;
  fechaRegistro: Date;
  totalCompras: number;
  ultimaCompra?: Date;
}

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria: string;
  stock: number;
  stockMinimo: number;
  activo: boolean;
  createdAt: Date;
}

export interface Compra {
  id: string;
  clienteId: string;
  productos: CompraProducto[];
  total: number;
  fecha: Date;
  usuarioRegistro: {
    uid: string;
    email: string;
  };
  metodoPago?: string;
  notas?: string;
}

export interface CompraProducto {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

// Nueva interfaz para solicitudes de productos
export interface SolicitudProducto {
  id: string;
  productoId: string;
  productoNombre: string;
  cantidadSolicitada: number;
  cantidadEntregada?: number; // Nueva: cantidad realmente entregada
  cantidadPendiente?: number; // Nueva: cantidad que aún falta entregar
  solicitanteId: string;
  solicitanteNombre: string;
  solicitanteEmail: string;
  fechaSolicitud: Date;
  estado: 'pendiente' | 'preparando' | 'listo' | 'entregado' | 'parcial' | 'cancelado';
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
  notas?: string;
  ubicacionEntrega?: string;
  almaceneroAsignado?: string;
  fechaPreparacion?: Date;
  fechaEntrega?: Date;
  observacionesAlmacenero?: string;
  entregasParciales?: Array<{ // Nueva: historial de entregas parciales
    fecha: Date;
    cantidad: number;
    observaciones?: string;
  }>;
}

export interface MovimientoStock {
  id: string;
  productoId: string;
  tipo: 'entrada' | 'salida' | 'venta_directa';
  cantidad: number;
  motivo?: string;
  fecha: Date;
  usuarioRegistro: {
    uid: string;
    email: string;
  };
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  ClienteForm: { cliente?: Cliente };
  CompraForm: { clienteId: string };
  ProductoForm: { producto?: Producto };
  MovimientoForm: { productoId: string };
  AdminUsers: undefined;
  AdminUtilities: undefined;
  OCRReceipt: undefined;
  SemanticSearch: undefined;
  AIDashboard: undefined;
  Reportes: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Clientes: undefined;
  Compras: undefined;
  Productos: undefined;
  Almacen: undefined;
  Auditoria: undefined;
};