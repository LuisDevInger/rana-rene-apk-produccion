// Servicio de IA para React Native - Control de Ventas
// Implementación completa basada en Firebase Functions

import { httpsCallable, getFunctions } from 'firebase/functions';
import { getApp } from 'firebase/app';

const app = getApp();
const functions = getFunctions(app, 'us-central1');

export interface AIResponse {
  text?: string;
  ok?: boolean;
  items?: any[];
  url?: string;
  issues?: any[];
  ajustesSugeridos?: any[];
  deudaPostSim?: number;
  total?: number;
  suspiciousCount?: number;
  suspicious?: any[];
  updated?: number;
  count?: number;
  top?: any[];
}

export interface ReceiptFilters {
  clienteId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  producto?: string;
  dni?: string;
}

export interface SemanticSearchParams {
  query: string;
  limit?: number;
  clienteId?: string;
}

// Generar texto con IA usando Gemini
export async function generateAIText(prompt: string, options: any = {}): Promise<string> {
  try {
    const aiGenerate = httpsCallable(functions, 'aiGenerate');
    const result = await aiGenerate({ prompt, ...options });
    return result?.data?.text || '';
  } catch (error) {
    console.error('Error generando texto con IA:', error);
    throw error;
  }
}

// Verificar contraseña de IA
export async function verifyIAPassword(password: string): Promise<boolean> {
  try {
    const fn = httpsCallable(functions, 'verifyIAPassword');
    const result = await fn({ password });
    return !!result?.data?.ok;
  } catch (error) {
    console.error('Error verificando contraseña IA:', error);
    throw error;
  }
}

// Buscar recibos (sin indexación semántica)
export async function searchReceipts(filters: ReceiptFilters = {}): Promise<any[]> {
  try {
    const fn = httpsCallable(functions, 'searchReceipts');
    const result = await fn(filters);
    return result?.data?.items || [];
  } catch (error) {
    console.error('Error buscando recibos:', error);
    throw error;
  }
}

// OCR de recibo desde imagen
export async function ocrReceipt(path: string): Promise<any> {
  try {
    const fn = httpsCallable(functions, 'ocrReceipt');
    const result = await fn({ path });
    return result?.data || {};
  } catch (error) {
    console.error('Error procesando OCR:', error);
    throw error;
  }
}

// Indexar recibo para búsqueda
export async function indexReceipt(path: string, clienteId: string): Promise<any> {
  try {
    const fn = httpsCallable(functions, 'indexReceipt');
    const result = await fn({ path, clienteId });
    return result?.data || {};
  } catch (error) {
    console.error('Error indexando recibo:', error);
    throw error;
  }
}

// Buscar recibos indexados
export async function searchReceiptsIndexed(filters: ReceiptFilters = {}): Promise<any[]> {
  try {
    const fn = httpsCallable(functions, 'searchReceiptsIndexed');
    const result = await fn(filters);
    return result?.data?.items || [];
  } catch (error) {
    console.error('Error buscando recibos indexados:', error);
    throw error;
  }
}

// Indexar recibos en lote
export async function indexReceiptsBulk(clienteId: string, fechaDesde: string, fechaHasta: string): Promise<number> {
  try {
    const fn = httpsCallable(functions, 'indexReceiptsBulk');
    const result = await fn({ clienteId, fechaDesde, fechaHasta });
    return result?.data?.indexed || 0;
  } catch (error) {
    console.error('Error indexando recibos en lote:', error);
    throw error;
  }
}

// Obtener URL firmada para archivos
export async function getSignedUrl(path: string): Promise<string> {
  try {
    const fn = httpsCallable(functions, 'getSignedUrl');
    const result = await fn({ path });
    return result?.data?.url || '#';
  } catch (error) {
    console.error('Error obteniendo URL firmada:', error);
    throw error;
  }
}

// Auditoría de compras por cliente/producto
export async function auditCompras(clienteId: string, producto?: string): Promise<{
  issues: any[];
  ajustesSugeridos: any[];
  deudaPostSim: number;
}> {
  try {
    const fn = httpsCallable(functions, 'auditCompras');
    const result = await fn({ clienteId, producto });
    return result?.data || { issues: [], ajustesSugeridos: [], deudaPostSim: 0 };
  } catch (error) {
    console.error('Error auditando compras:', error);
    throw error;
  }
}

// Auditoría global de compras
export async function auditComprasGlobal(): Promise<{
  total: number;
  suspiciousCount: number;
  suspicious: any[];
}> {
  try {
    const fn = httpsCallable(functions, 'auditComprasGlobal');
    const result = await fn({});
    return result?.data || { total: 0, suspiciousCount: 0, suspicious: [] };
  } catch (error) {
    console.error('Error auditando compras global:', error);
    throw error;
  }
}

// Corregir compras en lote
export async function fixComprasBatch(ids: string[]): Promise<{ updated: number }> {
  try {
    const fn = httpsCallable(functions, 'fixComprasBatch');
    const result = await fn({ ids });
    return result?.data || { updated: 0 };
  } catch (error) {
    console.error('Error corrigiendo compras:', error);
    throw error;
  }
}

// Asistente de cobranza
export async function collectionsAssistant(params: any = {}): Promise<any> {
  try {
    const fn = httpsCallable(functions, 'collectionsAssistant');
    const result = await fn(params);
    return result?.data || {};
  } catch (error) {
    console.error('Error con asistente de cobranza:', error);
    throw error;
  }
}

// Registrar seguimiento de cobranza
export async function registerCollectionFollowUp(payload: any = {}): Promise<{ ok: boolean }> {
  try {
    const fn = httpsCallable(functions, 'registerCollectionFollowUp');
    const result = await fn(payload);
    return result?.data || { ok: false };
  } catch (error) {
    console.error('Error registrando seguimiento de cobranza:', error);
    throw error;
  }
}

// Generar reporte ejecutivo PDF
export async function generateExecutiveReport(periodo: string = 'mensual'): Promise<{ url: string }> {
  try {
    const fn = httpsCallable(functions, 'generateExecutiveReport');
    const result = await fn({ periodo });
    return result?.data || { url: '#' };
  } catch (error) {
    console.error('Error generando reporte ejecutivo:', error);
    throw error;
  }
}

// Indexar recibo con embeddings semánticos
export async function indexReceiptEmbedding(path: string, clienteId: string): Promise<{ ok: boolean }> {
  try {
    const fn = httpsCallable(functions, 'indexReceiptEmbedding');
    const result = await fn({ path, clienteId });
    return result?.data || { ok: false };
  } catch (error) {
    console.error('Error indexando embedding de recibo:', error);
    throw error;
  }
}

// Búsqueda semántica de recibos
export async function semanticSearchReceipts(params: SemanticSearchParams): Promise<any[]> {
  try {
    const fn = httpsCallable(functions, 'semanticSearchReceipts');
    const result = await fn(params);
    return result?.data?.items || [];
  } catch (error) {
    console.error('Error en búsqueda semántica:', error);
    throw error;
  }
}

// Generar carta de cobranza PDF
export async function generateCollectionLetterPdf(cobranzaId: string): Promise<{ url: string }> {
  try {
    const fn = httpsCallable(functions, 'generateCollectionLetterPdf');
    const result = await fn({ cobranzaId });
    return result?.data || { url: '#' };
  } catch (error) {
    console.error('Error generando carta de cobranza:', error);
    throw error;
  }
}

// Recalcular deuda de cliente
export async function recalcClientDebt(cliente: string, limit?: number): Promise<{ count: number; top: any[] }> {
  try {
    const fn = httpsCallable(functions, 'recalcClientDebt');
    const result = await fn({ cliente, limit });
    return result?.data || { count: 0, top: [] };
  } catch (error) {
    console.error('Error recalculando deuda:', error);
    throw error;
  }
}

// Análisis de tendencias y recomendaciones
export async function analyzeTrends(clienteId?: string): Promise<any> {
  try {
    const prompt = clienteId
      ? `Analiza las tendencias de compra del cliente ${clienteId} y proporciona recomendaciones específicas.`
      : 'Analiza las tendencias generales de ventas y proporciona recomendaciones estratégicas.';

    return await generateAIText(prompt, { context: 'trends_analysis' });
  } catch (error) {
    console.error('Error analizando tendencias:', error);
    throw error;
  }
}

// Generar insights de negocio
export async function generateBusinessInsights(): Promise<any> {
  try {
    const prompt = 'Genera insights estratégicos del negocio basados en los datos de ventas, clientes y productos.';
    return await generateAIText(prompt, { context: 'business_insights' });
  } catch (error) {
    console.error('Error generando insights:', error);
    throw error;
  }
}

// Recomendaciones de productos
export async function recommendProducts(clienteId: string): Promise<any> {
  try {
    const prompt = `Basado en el historial del cliente ${clienteId}, recomienda productos que podrían interesarle.`;
    return await generateAIText(prompt, { context: 'product_recommendations' });
  } catch (error) {
    console.error('Error recomendando productos:', error);
    throw error;
  }
}
