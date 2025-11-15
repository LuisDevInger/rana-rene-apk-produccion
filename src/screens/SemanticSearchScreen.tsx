import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useToast } from '../contexts/ToastContext';
import { semanticSearchReceipts } from '../services/aiService';

// Tipo para resultados de búsqueda semántica
interface SearchResult {
  id: string;
  path: string;
  score: number;
  metadata: {
    clienteId?: string;
    clienteNombre?: string;
    fecha?: string;
    total?: number;
    productos?: string[];
    textoExtraido?: string;
  };
}

const SemanticSearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const { success, error, warning } = useToast();

  // Estados
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Búsqueda semántica
  const performSemanticSearch = async (query: string) => {
    if (!query.trim()) {
      error('Ingresa una consulta de búsqueda');
      return;
    }

    setSearching(true);
    try {
      // Aquí iría la lógica para llamar a Firebase Functions
      // con la búsqueda semántica
      console.log('Realizando búsqueda semántica:', query);

      // Usar la función real de búsqueda semántica
      const searchResults = await semanticSearchReceipts({
        query: query.trim(),
        limit: 20
      });

      // Transformar resultados al formato esperado
      const formattedResults: SearchResult[] = searchResults.map((result: any) => ({
        id: result.id || Math.random().toString(),
        path: result.path || '',
        score: result.score || 0.8,
        metadata: {
          clienteId: result.metadata?.clienteId,
          clienteNombre: result.metadata?.clienteNombre,
          fecha: result.metadata?.fecha,
          total: result.metadata?.total,
          productos: result.metadata?.productos || [],
          textoExtraido: result.metadata?.textoExtraido
        }
      }));

      setResults(formattedResults);

      // Agregar a historial
      const updatedHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
      setSearchHistory(updatedHistory);

      if (mockResults.length === 0) {
        warning('No se encontraron resultados para tu búsqueda');
      } else {
        success(`Encontrados ${mockResults.length} resultados`);
      }

    } catch (err) {
      console.error('Error en búsqueda semántica:', err);
      error('Error al realizar la búsqueda');
    } finally {
      setSearching(false);
    }
  };

  // Buscar desde historial
  const searchFromHistory = (query: string) => {
    setSearchQuery(query);
    setShowHistory(false);
    performSemanticSearch(query);
  };

  // Limpiar resultados
  const clearResults = () => {
    setResults([]);
    setSearchQuery('');
  };

  // Ver detalles del recibo
  const viewReceiptDetails = (result: SearchResult) => {
    Alert.alert(
      'Detalles del Recibo',
      `Cliente: ${result.metadata.clienteNombre || 'N/A'}\n` +
      `Fecha: ${result.metadata.fecha || 'N/A'}\n` +
      `Total: S/ ${result.metadata.total?.toFixed(2) || 'N/A'}\n` +
      `Productos: ${result.metadata.productos?.join(', ') || 'N/A'}\n\n` +
      `Relevancia: ${(result.score * 100).toFixed(1)}%`,
      [
        { text: 'Cerrar', style: 'cancel' },
        {
          text: 'Ver Texto Completo',
          onPress: () => {
            Alert.alert(
              'Texto Extraído',
              result.metadata.textoExtraido || 'No disponible',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  // Renderizar resultado
  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => viewReceiptDetails(item)}
    >
      <View style={styles.resultHeader}>
        <View style={styles.resultInfo}>
          <Text style={styles.resultCliente}>
            {item.metadata.clienteNombre || 'Cliente desconocido'}
          </Text>
          <Text style={styles.resultFecha}>
            {item.metadata.fecha || 'Fecha desconocida'}
          </Text>
        </View>
        <View style={styles.resultScore}>
          <Text style={styles.scoreText}>
            {(item.score * 100).toFixed(0)}%
          </Text>
        </View>
      </View>

      <View style={styles.resultContent}>
        <Text style={styles.resultTotal}>
          Total: S/ {item.metadata.total?.toFixed(2) || 'N/A'}
        </Text>
        <Text style={styles.resultProductos} numberOfLines={2}>
          {item.metadata.productos?.join(' • ') || 'Productos no especificados'}
        </Text>
      </View>

      <View style={styles.resultActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="visibility" size={16} color="#3B82F6" />
          <Text style={styles.actionText}>Ver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="download" size={16} color="#10B981" />
          <Text style={styles.actionText}>Descargar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Renderizar elemento del historial
  const renderHistoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => searchFromHistory(item)}
    >
      <Icon name="history" size={20} color="#6B7280" />
      <Text style={styles.historyText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Búsqueda Semántica</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Información */}
      <View style={styles.infoSection}>
        <Icon name="search" size={24} color="#3B82F6" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Búsqueda Inteligente</Text>
          <Text style={styles.infoText}>
            Describe lo que buscas en lenguaje natural. Por ejemplo:
            "compras de cemento de Juan en noviembre" o "ventas mayores a 100 soles".
          </Text>
        </View>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Describe tu búsqueda..."
            onSubmitEditing={() => performSemanticSearch(searchQuery)}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="clear" size={20} color="#6B7280" />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.searchButtons}>
          <TouchableOpacity
            style={[styles.searchButton, styles.historyButton]}
            onPress={() => setShowHistory(!showHistory)}
          >
            <Icon name="history" size={20} color="#6B7280" />
            <Text style={styles.historyButtonText}>Historial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.searchButton, styles.searchActionButton]}
            onPress={() => performSemanticSearch(searchQuery)}
            disabled={searching || !searchQuery.trim()}
          >
            {searching ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Icon name="search" size={20} color="#FFFFFF" />
                <Text style={styles.searchButtonText}>Buscar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Historial de búsqueda */}
        {showHistory && searchHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Búsquedas recientes</Text>
            <FlatList
              data={searchHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item, index) => index.toString()}
              style={styles.historyList}
            />
          </View>
        )}
      </View>

      {/* Resultados */}
      {results.length > 0 && (
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              Resultados ({results.length})
            </Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearResults}
            >
              <Icon name="clear-all" size={20} color="#6B7280" />
              <Text style={styles.clearButtonText}>Limpiar</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={results}
            renderItem={renderResult}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Estado vacío */}
      {results.length === 0 && !searching && (
        <View style={styles.emptyState}>
          <Icon name="search-off" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No se encontraron resultados' : 'Realiza una búsqueda'}
          </Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Intenta con términos diferentes o revisa tu consulta'
              : 'Usa consultas en lenguaje natural para encontrar recibos específicos'
            }
          </Text>
        </View>
      )}

      {/* Ejemplos de consultas */}
      {!searchQuery && !results.length && (
        <View style={styles.examplesSection}>
          <Text style={styles.examplesTitle}>Ejemplos de consultas</Text>
          <View style={styles.examplesGrid}>
            {[
              'compras de cemento en noviembre',
              'ventas mayores a 100 soles',
              'recibos de Juan Pérez',
              'productos de construcción',
              'ventas de esta semana'
            ].map((example, index) => (
              <TouchableOpacity
                key={index}
                style={styles.exampleChip}
                onPress={() => searchFromHistory(example)}
              >
                <Text style={styles.exampleText}>{example}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    fontSize: 16,
  },
  searchButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  historyButton: {
    backgroundColor: '#F3F4F6',
  },
  searchActionButton: {
    backgroundColor: '#3B82F6',
  },
  historyButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  historyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  historyList: {
    maxHeight: 200,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  resultsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#6B7280',
    fontSize: 14,
    marginLeft: 4,
  },
  resultsList: {
    paddingBottom: 20,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultCliente: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  resultFecha: {
    fontSize: 14,
    color: '#6B7280',
  },
  resultScore: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  resultContent: {
    marginBottom: 12,
  },
  resultTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  resultProductos: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  examplesSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  examplesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  exampleChip: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#0369A1',
    fontWeight: '500',
  },
});

export default SemanticSearchScreen;
