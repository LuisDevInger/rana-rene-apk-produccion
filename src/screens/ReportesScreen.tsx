import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useToast } from '../contexts/ToastContext';
import { generateExecutiveReport } from '../services/aiService';

type ReportesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ReportesScreen: React.FC = () => {
  const navigation = useNavigation<ReportesScreenNavigationProp>();
  const { success, error } = useToast();

  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [reportsHistory, setReportsHistory] = useState<Array<{
    id: string;
    tipo: string;
    fecha: Date;
    url: string;
  }>>([]);

  const reportTypes = [
    {
      key: 'mensual',
      title: 'Reporte Ejecutivo Mensual',
      description: 'Análisis completo del mes actual con métricas clave',
      icon: 'calendar_view_month',
    },
    {
      key: 'semanal',
      title: 'Reporte Ejecutivo Semanal',
      description: 'Resumen de la semana con tendencias y KPIs',
      icon: 'calendar_view_week',
    },
    {
      key: 'diario',
      title: 'Reporte Ejecutivo Diario',
      description: 'Resumen del día con ventas y clientes',
      icon: 'today',
    },
    {
      key: 'productos',
      title: 'Análisis de Productos',
      description: 'Ranking de productos más vendidos y tendencias',
      icon: 'inventory',
    },
    {
      key: 'clientes',
      title: 'Análisis de Clientes',
      description: 'Segmentación y comportamiento de clientes',
      icon: 'people',
    },
    {
      key: 'financiero',
      title: 'Reporte Financiero',
      description: 'Estados financieros y proyecciones',
      icon: 'account_balance',
    },
  ];

  const generateReport = async (tipo: string) => {
    setGeneratingReport(tipo);

    try {
      console.log(`Generando reporte ${tipo}...`);

      // Mapear tipos de reporte a parámetros de la función
      const periodoMap: { [key: string]: string } = {
        mensual: 'mensual',
        semanal: 'semanal',
        diario: 'diario',
        productos: 'productos',
        clientes: 'clientes',
        financiero: 'financiero',
      };

      const result = await generateExecutiveReport(periodoMap[tipo]);

      if (result.url && result.url !== '#') {
        // Agregar a historial
        const newReport = {
          id: Date.now().toString(),
          tipo: tipo,
          fecha: new Date(),
          url: result.url,
        };

        setReportsHistory(prev => [newReport, ...prev.slice(0, 9)]); // Mantener últimos 10

        success('Reporte generado exitosamente');

        // Preguntar si quiere abrir el reporte
        Alert.alert(
          'Reporte Generado',
          '¿Deseas abrir el reporte PDF ahora?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir',
              onPress: () => openReport(result.url)
            },
          ]
        );
      } else {
        error('No se pudo generar el reporte');
      }

    } catch (err) {
      console.error('Error generando reporte:', err);
      error('Error al generar el reporte');
    } finally {
      setGeneratingReport(null);
    }
  };

  const openReport = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No se puede abrir el enlace del reporte');
      }
    } catch (err) {
      console.error('Error abriendo reporte:', err);
      error('Error al abrir el reporte');
    }
  };

  const getReportTypeTitle = (tipo: string) => {
    const reportType = reportTypes.find(r => r.key === tipo);
    return reportType?.title || tipo;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportes Ejecutivos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Información */}
        <View style={styles.infoSection}>
          <Icon name="analytics" size={24} color="#3B82F6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Genera reportes inteligentes</Text>
            <Text style={styles.infoText}>
              Crea reportes ejecutivos con análisis avanzado usando inteligencia artificial.
              Los reportes incluyen métricas clave, tendencias y recomendaciones estratégicas.
            </Text>
          </View>
        </View>

        {/* Tipos de Reportes */}
        <Text style={styles.sectionTitle}>Tipos de Reportes</Text>

        {reportTypes.map((reportType) => (
          <View key={reportType.key} style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <View style={styles.reportIcon}>
                <Icon name={reportType.icon} size={24} color="#3B82F6" />
              </View>
              <View style={styles.reportInfo}>
                <Text style={styles.reportTitle}>{reportType.title}</Text>
                <Text style={styles.reportDescription}>{reportType.description}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.generateButton,
                generatingReport === reportType.key && styles.buttonDisabled
              ]}
              onPress={() => generateReport(reportType.key)}
              disabled={generatingReport === reportType.key}
            >
              {generatingReport === reportType.key ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Icon name="file_download" size={20} color="#fff" />
                  <Text style={styles.generateButtonText}>Generar PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ))}

        {/* Historial de Reportes */}
        {reportsHistory.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Reportes Recientes</Text>

            {reportsHistory.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.historyItem}
                onPress={() => openReport(report.url)}
              >
                <View style={styles.historyIcon}>
                  <Icon name="description" size={20} color="#10B981" />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>
                    {getReportTypeTitle(report.tipo)}
                  </Text>
                  <Text style={styles.historyDate}>
                    {formatDate(report.fecha)}
                  </Text>
                </View>
                <Icon name="open_in_new" size={20} color="#6B7280" />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 8,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default ReportesScreen;
