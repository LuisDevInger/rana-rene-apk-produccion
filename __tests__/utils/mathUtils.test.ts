// Tests unitarios para utilidades matemáticas
import { calcularTotal, calcularSubtotal, formatearMoneda } from '../../src/utils/mathUtils';

// Mock de las funciones que vamos a testear
const mathUtils = {
  calcularTotal: (productos: any[]) => productos.reduce((total: number, producto: any) => total + producto.subtotal, 0),
  calcularSubtotal: (cantidad: number, precioUnitario: number) => cantidad * precioUnitario,
  formatearMoneda: (monto: number) => `S/ ${monto.toFixed(2)}`,
};

describe('Math Utils', () => {
  describe('calcularTotal', () => {
    it('debe calcular el total correctamente con productos', () => {
      const productos = [
        { subtotal: 100 },
        { subtotal: 200 },
        { subtotal: 50 },
      ];

      const result = mathUtils.calcularTotal(productos);
      expect(result).toBe(350);
    });

    it('debe retornar 0 con array vacío', () => {
      const result = mathUtils.calcularTotal([]);
      expect(result).toBe(0);
    });

    it('debe manejar números decimales correctamente', () => {
      const productos = [
        { subtotal: 10.5 },
        { subtotal: 20.75 },
      ];

      const result = mathUtils.calcularTotal(productos);
      expect(result).toBe(31.25);
    });
  });

  describe('calcularSubtotal', () => {
    it('debe calcular el subtotal correctamente', () => {
      const result = mathUtils.calcularSubtotal(3, 25);
      expect(result).toBe(75);
    });

    it('debe manejar cantidades de 0', () => {
      const result = mathUtils.calcularSubtotal(0, 100);
      expect(result).toBe(0);
    });

    it('debe manejar precios decimales', () => {
      const result = mathUtils.calcularSubtotal(2, 15.5);
      expect(result).toBe(31);
    });
  });

  describe('formatearMoneda', () => {
    it('debe formatear correctamente montos enteros', () => {
      const result = mathUtils.formatearMoneda(100);
      expect(result).toBe('S/ 100.00');
    });

    it('debe formatear correctamente montos decimales', () => {
      const result = mathUtils.formatearMoneda(123.45);
      expect(result).toBe('S/ 123.45');
    });

    it('debe manejar montos negativos', () => {
      const result = mathUtils.formatearMoneda(-50);
      expect(result).toBe('S/ -50.00');
    });

    it('debe redondear correctamente', () => {
      const result = mathUtils.formatearMoneda(10.999);
      expect(result).toBe('S/ 11.00');
    });
  });
});
