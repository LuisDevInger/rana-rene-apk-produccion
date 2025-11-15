// Tests unitarios para el servicio de offline storage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineData } from '../../src/services/offlineStorage';
import { Cliente, Producto } from '../../src/types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('Offline Storage Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Clientes', () => {
    const mockCliente: Cliente = {
      id: '1',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@test.com',
      telefono: '+51 999 123 456',
      fechaRegistro: new Date(),
      totalCompras: 5,
      ultimaCompra: new Date(),
    };

    it('debe guardar clientes correctamente', async () => {
      const clientes = [mockCliente];
      mockAsyncStorage.setItem.mockResolvedValue();

      await offlineData.saveClientes(clientes);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@clientes',
        JSON.stringify(clientes)
      );
    });

    it('debe obtener clientes correctamente', async () => {
      const clientes = [mockCliente];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(clientes));

      const result = await offlineData.getClientes();

      expect(result).toEqual(clientes);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@clientes');
    });

    it('debe retornar array vacío si no hay clientes', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await offlineData.getClientes();

      expect(result).toEqual([]);
    });

    it('debe agregar cliente correctamente', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));

      await offlineData.addCliente(mockCliente);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@clientes',
        JSON.stringify([mockCliente])
      );
    });
  });

  describe('Productos', () => {
    const mockProducto: Producto = {
      id: '1',
      nombre: 'Laptop Dell',
      precio: 2500,
      stock: 5,
      categoria: 'Computadoras',
      activo: true,
      createdAt: new Date(),
    };

    it('debe guardar productos correctamente', async () => {
      const productos = [mockProducto];
      mockAsyncStorage.setItem.mockResolvedValue();

      await offlineData.saveProductos(productos);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@productos',
        JSON.stringify(productos)
      );
    });

    it('debe obtener productos correctamente', async () => {
      const productos = [mockProducto];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(productos));

      const result = await offlineData.getProductos();

      expect(result).toEqual(productos);
    });

    it('debe agregar producto correctamente', async () => {
      mockAsyncStorage.setItem.mockResolvedValue();
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));

      await offlineData.addProducto(mockProducto);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@productos',
        JSON.stringify([mockProducto])
      );
    });
  });

  describe('Manejo de errores', () => {
    it('debe manejar errores de AsyncStorage en getClientes', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await offlineData.getClientes();

      expect(result).toEqual([]);
    });

    it('debe manejar errores de AsyncStorage en saveClientes', async () => {
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      await expect(offlineData.saveClientes([])).rejects.toThrow('Storage error');
    });
  });
});
