// Utilidades matemáticas para la aplicación

export const calcularTotal = (productos: { subtotal: number }[]): number => {
  return productos.reduce((total, producto) => total + producto.subtotal, 0);
};

export const calcularSubtotal = (cantidad: number, precioUnitario: number): number => {
  return cantidad * precioUnitario;
};

export const formatearMoneda = (monto: number): string => {
  return `S/ ${monto.toFixed(2)}`;
};

export const calcularPorcentaje = (valor: number, total: number): number => {
  if (total === 0) return 0;
  return (valor / total) * 100;
};

export const redondearADosDecimales = (numero: number): number => {
  return Math.round((numero + Number.EPSILON) * 100) / 100;
};

export const validarNumeroPositivo = (numero: number): boolean => {
  return typeof numero === 'number' && numero >= 0 && !isNaN(numero);
};

export const sumarArray = (numeros: number[]): number => {
  return numeros.reduce((suma, numero) => suma + numero, 0);
};

export const encontrarMaximo = (numeros: number[]): number => {
  if (numeros.length === 0) return 0;
  return Math.max(...numeros);
};

export const encontrarMinimo = (numeros: number[]): number => {
  if (numeros.length === 0) return 0;
  return Math.min(...numeros);
};
