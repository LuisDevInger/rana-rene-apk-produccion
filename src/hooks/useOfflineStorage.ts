// Hook personalizado para manejar almacenamiento offline
import { useState, useEffect, useCallback } from 'react';
import {
  offlineData,
  syncManager,
  connectivity,
  syncPendingChanges,
  initializeOfflineStorage,
  cleanupOfflineStorage
} from '../services/offlineStorage';
import { Cliente, Producto, Compra, MovimientoStock } from '../types';

export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(connectivity.isOnline);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  useEffect(() => {
    initializeOfflineStorage();

    // Actualizar estado inicial
    updateSyncStatus();

    return () => {
      cleanupOfflineStorage();
    };
  }, []);

  const updateSyncStatus = useCallback(async () => {
    const count = await syncManager.getPendingSyncCount();
    const lastSync = await syncManager.getLastSyncTime();
    setPendingSyncCount(count);
    setLastSyncTime(lastSync);
  }, []);

  const syncNow = useCallback(async () => {
    const result = await syncPendingChanges();
    await updateSyncStatus();
    return result;
  }, [updateSyncStatus]);

  return {
    isOnline,
    pendingSyncCount,
    lastSyncTime,
    syncNow,
    updateSyncStatus,
  };
};

// Hooks específicos para cada tipo de dato
export const useOfflineClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClientes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await offlineData.getClientes();
      setClientes(data);
    } catch (error) {
      console.error('Error cargando clientes offline:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCliente = useCallback(async (cliente: Cliente) => {
    await offlineData.addCliente(cliente);
    setClientes(prev => [...prev, cliente]);
  }, []);

  const updateCliente = useCallback(async (cliente: Cliente) => {
    await offlineData.updateCliente(cliente);
    setClientes(prev => prev.map(c => c.id === cliente.id ? cliente : c));
  }, []);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  return {
    clientes,
    loading,
    addCliente,
    updateCliente,
    reload: loadClientes,
  };
};

export const useOfflineProductos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProductos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await offlineData.getProductos();
      setProductos(data);
    } catch (error) {
      console.error('Error cargando productos offline:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addProducto = useCallback(async (producto: Producto) => {
    await offlineData.addProducto(producto);
    setProductos(prev => [...prev, producto]);
  }, []);

  const updateProducto = useCallback(async (producto: Producto) => {
    await offlineData.updateProducto(producto);
    setProductos(prev => prev.map(p => p.id === producto.id ? producto : p));
  }, []);

  useEffect(() => {
    loadProductos();
  }, [loadProductos]);

  return {
    productos,
    loading,
    addProducto,
    updateProducto,
    reload: loadProductos,
  };
};

export const useOfflineCompras = () => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCompras = useCallback(async () => {
    try {
      setLoading(true);
      const data = await offlineData.getCompras();
      setCompras(data);
    } catch (error) {
      console.error('Error cargando compras offline:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCompra = useCallback(async (compra: Compra) => {
    await offlineData.addCompra(compra);
    setCompras(prev => [...prev, compra]);
  }, []);

  useEffect(() => {
    loadCompras();
  }, [loadCompras]);

  return {
    compras,
    loading,
    addCompra,
    reload: loadCompras,
  };
};

export const useOfflineMovimientos = () => {
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMovimientos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await offlineData.getMovimientos();
      setMovimientos(data);
    } catch (error) {
      console.error('Error cargando movimientos offline:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addMovimiento = useCallback(async (movimiento: MovimientoStock) => {
    await offlineData.addMovimiento(movimiento);
    setMovimientos(prev => [...prev, movimiento]);
  }, []);

  useEffect(() => {
    loadMovimientos();
  }, [loadMovimientos]);

  return {
    movimientos,
    loading,
    addMovimiento,
    reload: loadMovimientos,
  };
};
