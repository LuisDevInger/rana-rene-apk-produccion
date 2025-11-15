import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  generateAIText,
  verifyIAPassword,
  searchReceipts,
  ocrReceipt,
  indexReceipt,
  searchReceiptsIndexed,
  indexReceiptsBulk,
  getSignedUrl,
  auditCompras,
  auditComprasGlobal,
  fixComprasBatch,
  generateExecutiveReport,
  semanticSearchReceipts,
  analyzeTrends,
  generateBusinessInsights,
  recommendProducts,
} from '../services/aiService';

const { width } = Dimensions.get('window');

interface Tab {
  key: string;
  title: string;
  icon: string;
}

const tabs: Tab[] = [
  { key: 'consultas', title: 'Consultas IA', icon: 'smart_toy' },
  { key: 'recibos', title: 'Recibos', icon: 'receipt' },
  { key: 'auditoria', title: 'Auditoría', icon: 'security' },
  { key: 'reportes', title: 'Reportes', icon: 'analytics' },
  { key: 'tendencias', title: 'Tendencias', icon: 'trending_up' },
];

const AIDashboardScreen: React.FC = () => {
  const { userProfile } = useAuth();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('consultas');
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');

  // Estados para consultas IA
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  // Estados para recibos
  const [receipts, setReceipts] = useState([]);
  const [searchFilters, setSearchFilters] = useState({
    clienteId: '',
    fechaDesde: '',
    fechaHasta: '',
    producto: '',
  });

  // Estados para auditoría
  const [auditResults, setAuditResults] = useState(null);
  const [globalAudit, setGlobalAudit] = useState(null);

  // Estados para reportes
  const [reportUrl, setReportUrl] = useState('');

  // Estados para tendencias
  const [trends, setTrends] = useState('');
  const [insights, setInsights] = useState('');
  const [recommendations, setRecommendations] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      // Reset states when screen comes into focus
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  const verifyAccess = async () => {
    if (!password.trim()) {
      showToast('Ingresa la contraseña de IA', 'warning');
      return;
    }

    setLoading(true);
    try {
      const isValid = await verifyIAPassword(password);
      if (isValid) {
        setAuthorized(true);
        showToast('Acceso autorizado', 'success');
      } else {
        showToast('Contraseña incorrecta', 'error');
      }
    } catch (error) {
      showToast('Error verificando acceso', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAIQuery = async () => {
    if (!question.trim()) {
      showToast('Ingresa una consulta', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await generateAIText(question);
      setAnswer(response);
      showToast('Consulta procesada', 'success');
    } catch (error) {
      showToast('Error procesando consulta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchReceipts = async () => {
    setLoading(true);
    try {
      const results = await searchReceipts(searchFilters);
      setReceipts(results);
      showToast(`Encontrados ${results.length} recibos`, 'success');
    } catch (error) {
      showToast('Error buscando recibos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAuditCompras = async () => {
    if (!searchFilters.clienteId) {
      showToast('Ingresa ID de cliente', 'warning');
      return;
    }

    setLoading(true);
    try {
      const results = await auditCompras(searchFilters.clienteId, searchFilters.producto);
      setAuditResults(results);
      showToast('Auditoría completada', 'success');
    } catch (error) {
      showToast('Error en auditoría', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalAudit = async () => {
    setLoading(true);
    try {
      const results = await auditComprasGlobal();
      setGlobalAudit(results);
      showToast('Auditoría global completada', 'success');
    } catch (error) {
      showToast('Error en auditoría global', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (periodo: string = 'mensual') => {
    setLoading(true);
    try {
      const result = await generateExecutiveReport(periodo);
      setReportUrl(result.url);
      showToast('Reporte generado', 'success');
    } catch (error) {
      showToast('Error generando reporte', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeTrends = async () => {
    setLoading(true);
    try {
      const analysis = await analyzeTrends(searchFilters.clienteId);
      setTrends(analysis);
      showToast('Análisis completado', 'success');
    } catch (error) {
      showToast('Error analizando tendencias', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsights = async () => {
    setLoading(true);
    try {
      const businessInsights = await generateBusinessInsights();
      setInsights(businessInsights);
      showToast('Insights generados', 'success');
    } catch (error) {
      showToast('Error generando insights', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendProducts = async () => {
    if (!searchFilters.clienteId) {
      showToast('Ingresa ID de cliente', 'warning');
      return;
    }

    setLoading(true);
    try {
      const recs = await recommendProducts(searchFilters.clienteId);
      setRecommendations(recs);
      showToast('Recomendaciones generadas', 'success');
    } catch (error) {
      showToast('Error generando recomendaciones', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Panel de IA</Text>
        </View>

        <View style={styles.authContainer}>
          <Icon name="security" size={64} color="#3B82F6" />
          <Text style={styles.authTitle}>Acceso Restringido</Text>
          <Text style={styles.authSubtitle}>
            Ingresa la contraseña para acceder al panel de Inteligencia Artificial
          </Text>

          <TextInput
            style={styles.passwordInput}
            placeholder="Contraseña de IA"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.authButton, loading && styles.buttonDisabled]}
            onPress={verifyAccess}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="lock-open" size={20} color="#fff" />
                <Text style={styles.authButtonText}>Autorizar Acceso</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'consultas':
        return (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Consultas con IA</Text>

            <TextInput
              style={styles.textArea}
              placeholder="Escribe tu consulta aquí..."
              multiline
              numberOfLines={4}
              value={question}
              onChangeText={setQuestion}
            />

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleAIQuery}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="send" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Consultar IA</Text>
                </>
              )}
            </TouchableOpacity>

            {answer ? (
              <View style={styles.responseContainer}>
                <Text style={styles.responseTitle}>Respuesta:</Text>
                <Text style={styles.responseText}>{answer}</Text>
              </View>
            ) : null}
          </ScrollView>
        );

      case 'recibos':
        return (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Gestión de Recibos</Text>

            <TextInput
              style={styles.input}
              placeholder="ID de Cliente"
              value={searchFilters.clienteId}
              onChangeText={(text) => setSearchFilters({...searchFilters, clienteId: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Producto (opcional)"
              value={searchFilters.producto}
              onChangeText={(text) => setSearchFilters({...searchFilters, producto: text})}
            />

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSearchReceipts}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="search" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Buscar Recibos</Text>
                </>
              )}
            </TouchableOpacity>

            {receipts.length > 0 && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Recibos Encontrados ({receipts.length})</Text>
                {receipts.map((receipt: any, index: number) => (
                  <View key={index} style={styles.receiptItem}>
                    <Text style={styles.receiptText}>Cliente: {receipt.cliente}</Text>
                    <Text style={styles.receiptText}>Producto: {receipt.producto}</Text>
                    <Text style={styles.receiptText}>Fecha: {receipt.fecha}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        );

      case 'auditoria':
        return (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Auditoría de Compras</Text>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleGlobalAudit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="security" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Auditoría Global</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, loading && styles.buttonDisabled]}
              onPress={handleAuditCompras}
              disabled={loading}
            >
              <Icon name="person-search" size={20} color="#3B82F6" />
              <Text style={styles.secondaryButtonText}>Auditoría por Cliente</Text>
            </TouchableOpacity>

            {globalAudit && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Auditoría Global</Text>
                <Text style={styles.auditText}>Total de compras: {globalAudit.total}</Text>
                <Text style={styles.auditText}>Compras sospechosas: {globalAudit.suspiciousCount}</Text>
              </View>
            )}

            {auditResults && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Auditoría por Cliente</Text>
                <Text style={styles.auditText}>Deuda después de simulación: S/ {auditResults.deudaPostSim}</Text>
                <Text style={styles.auditText}>Problemas encontrados: {auditResults.issues?.length || 0}</Text>
              </View>
            )}
          </ScrollView>
        );

      case 'reportes':
        return (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Reportes Ejecutivos</Text>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={() => handleGenerateReport('mensual')}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="analytics" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Reporte Mensual</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, loading && styles.buttonDisabled]}
              onPress={() => handleGenerateReport('semanal')}
              disabled={loading}
            >
              <Icon name="date-range" size={20} color="#3B82F6" />
              <Text style={styles.secondaryButtonText}>Reporte Semanal</Text>
            </TouchableOpacity>

            {reportUrl && reportUrl !== '#' && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Reporte Generado</Text>
                <TouchableOpacity style={styles.linkButton}>
                  <Icon name="open-in-new" size={20} color="#3B82F6" />
                  <Text style={styles.linkText}>Ver Reporte PDF</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        );

      case 'tendencias':
        return (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Análisis de Tendencias</Text>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleGenerateInsights}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="insights" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Insights de Negocio</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, loading && styles.buttonDisabled]}
              onPress={handleAnalyzeTrends}
              disabled={loading}
            >
              <Icon name="trending-up" size={20} color="#3B82F6" />
              <Text style={styles.secondaryButtonText}>Análisis de Tendencias</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, loading && styles.buttonDisabled]}
              onPress={handleRecommendProducts}
              disabled={loading}
            >
              <Icon name="recommend" size={20} color="#3B82F6" />
              <Text style={styles.secondaryButtonText}>Recomendaciones</Text>
            </TouchableOpacity>

            {insights && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Insights de Negocio</Text>
                <Text style={styles.responseText}>{insights}</Text>
              </View>
            )}

            {trends && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Análisis de Tendencias</Text>
                <Text style={styles.responseText}>{trends}</Text>
              </View>
            )}

            {recommendations && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Recomendaciones</Text>
                <Text style={styles.responseText}>{recommendations}</Text>
              </View>
            )}
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panel de IA</Text>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Icon
                name={tab.icon}
                size={20}
                color={activeTab === tab.key ? '#3B82F6' : '#666'}
              />
              <Text
                style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {renderTabContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  passwordInput: {
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  responseContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  responseText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  receiptItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  receiptText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  auditText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  linkText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AIDashboardScreen;
