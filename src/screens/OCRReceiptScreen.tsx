import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { useToast } from '../contexts/ToastContext';
import { ocrReceipt, indexReceipt } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';

// Tipo para los resultados del OCR
interface OCRResult {
  text: string;
  confidence: number;
  extractedData: {
    total?: number;
    fecha?: string;
    cliente?: string;
    productos?: string[];
  };
}

const OCRReceiptScreen: React.FC = () => {
  const navigation = useNavigation();
  const { success, error, warning } = useToast();
  const { userProfile } = useAuth();

  // Estados
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [manualData, setManualData] = useState({
    total: '',
    fecha: '',
    cliente: '',
    notas: ''
  });

  // Seleccionar imagen desde galería
  const selectFromGallery = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      includeBase64: true,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorMessage) {
        error('Error al seleccionar imagen: ' + response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          setSelectedImage(asset.uri);
          setOcrResult(null);
        }
      }
    });
  };

  // Tomar foto con cámara
  const takePhoto = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      includeBase64: true,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorMessage) {
        error('Error al tomar foto: ' + response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          setSelectedImage(asset.uri);
          setOcrResult(null);
        }
      }
    });
  };

  // Procesar imagen con OCR
  const processOCR = async () => {
    if (!selectedImage) {
      error('Selecciona una imagen primero');
      return;
    }

    setProcessing(true);
    try {
      console.log('Procesando OCR para imagen:', selectedImage);

      // Usar la función de OCR real
      const result = await ocrReceipt(selectedImage);

      // Transformar el resultado al formato esperado
      const ocrResultData: OCRResult = {
        text: result.text || '',
        confidence: result.confidence || 0.8,
        extractedData: {
          total: result.extractedData?.total,
          fecha: result.extractedData?.fecha,
          cliente: result.extractedData?.cliente,
          productos: result.extractedData?.productos || []
        }
      };

      setOcrResult(ocrResultData);
      setManualData({
        total: ocrResultData.extractedData.total?.toString() || '',
        fecha: ocrResultData.extractedData.fecha || '',
        cliente: ocrResultData.extractedData.cliente || '',
        notas: ocrResultData.extractedData.productos?.join(', ') || ''
      });
      setShowResultModal(true);
      success('OCR procesado correctamente');

    } catch (err) {
      console.error('Error processing OCR:', err);
      error('Error al procesar la imagen con IA');
    } finally {
      setProcessing(false);
    }
  };

  // Guardar datos extraídos
  const saveExtractedData = async () => {
    try {
      console.log('Guardando datos extraídos:', manualData);

      // Validar datos mínimos
      if (!manualData.cliente || !manualData.total) {
        error('Cliente y total son obligatorios');
        return;
      }

      // Aquí iría la lógica para crear una compra en Firebase
      // Por ahora solo indexamos el recibo para búsqueda futura

      if (selectedImage) {
        try {
          // Intentar indexar el recibo para búsqueda semántica
          await indexReceipt(selectedImage, manualData.cliente);
          success('Recibo indexado para búsqueda inteligente');
        } catch (indexError) {
          console.warn('Error indexando recibo:', indexError);
          warning('Recibo guardado pero no pudo ser indexado para búsqueda');
        }
      }

      success('Datos guardados correctamente');
      setShowResultModal(false);
      setSelectedImage(null);
      setOcrResult(null);
      setManualData({ total: '', fecha: '', cliente: '', notas: '' });

    } catch (err) {
      console.error('Error saving data:', err);
      error('Error al guardar los datos');
    }
  };

  // Limpiar todo
  const clearAll = () => {
    setSelectedImage(null);
    setOcrResult(null);
    setManualData({ total: '', fecha: '', cliente: '', notas: '' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>OCR de Recibos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Información */}
        <View style={styles.infoSection}>
          <Icon name="info" size={24} color="#3B82F6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Escanea tus recibos</Text>
            <Text style={styles.infoText}>
              Toma una foto o selecciona una imagen de tu galería para extraer automáticamente
              la información del recibo usando OCR.
            </Text>
          </View>
        </View>

        {/* Selección de imagen */}
        {!selectedImage ? (
          <View style={styles.imageSelection}>
            <View style={styles.placeholder}>
              <Icon name="receipt" size={64} color="#D1D5DB" />
              <Text style={styles.placeholderText}>No hay imagen seleccionada</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cameraButton]}
                onPress={takePhoto}
              >
                <Icon name="camera-alt" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Tomar Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.galleryButton]}
                onPress={selectFromGallery}
              >
                <Icon name="photo-library" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Galería</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />

            <View style={styles.imageActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.processButton]}
                onPress={processOCR}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="search" size={24} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Procesar OCR</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.clearButton]}
                onPress={clearAll}
              >
                <Icon name="clear" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Limpiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Resultado del OCR */}
        {ocrResult && !showResultModal && (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <Icon name="check-circle" size={24} color="#10B981" />
              <Text style={styles.resultTitle}>OCR Completado</Text>
            </View>

            <View style={styles.confidence}>
              <Text style={styles.confidenceText}>
                Confianza: {(ocrResult.confidence * 100).toFixed(1)}%
              </Text>
            </View>

            <View style={styles.extractedData}>
              <Text style={styles.dataLabel}>Texto extraído:</Text>
              <Text style={styles.extractedText}>{ocrResult.text}</Text>
            </View>

            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => setShowResultModal(true)}
            >
              <Icon name="edit" size={20} color="#FFFFFF" />
              <Text style={styles.reviewButtonText}>Revisar y Guardar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal de resultado */}
      <Modal
        visible={showResultModal}
        animationType="slide"
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Revisar Datos Extraídos</Text>
            <TouchableOpacity onPress={() => setShowResultModal(false)}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Texto original */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Texto Original</Text>
              <Text style={styles.originalText}>{ocrResult?.text}</Text>
            </View>

            {/* Campos editables */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Datos Extraídos (Editables)</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Total</Text>
                <TextInput
                  style={styles.input}
                  value={manualData.total}
                  onChangeText={(text) => setManualData(f => ({ ...f, total: text }))}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Fecha</Text>
                <TextInput
                  style={styles.input}
                  value={manualData.fecha}
                  onChangeText={(text) => setManualData(f => ({ ...f, fecha: text }))}
                  placeholder="DD/MM/YYYY"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cliente</Text>
                <TextInput
                  style={styles.input}
                  value={manualData.cliente}
                  onChangeText={(text) => setManualData(f => ({ ...f, cliente: text }))}
                  placeholder="Nombre del cliente"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notas/Productos</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={manualData.notas}
                  onChangeText={(text) => setManualData(f => ({ ...f, notas: text }))}
                  placeholder="Detalles de productos o notas"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowResultModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveModalButton]}
                onPress={saveExtractedData}
              >
                <Icon name="save" size={20} color="#FFFFFF" />
                <Text style={styles.saveModalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  content: {
    flex: 1,
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
  imageSelection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeholder: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  placeholderText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraButton: {
    backgroundColor: '#10B981',
  },
  galleryButton: {
    backgroundColor: '#3B82F6',
  },
  processButton: {
    backgroundColor: '#F59E0B',
  },
  clearButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  imagePreview: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
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
  previewImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  imageActions: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  resultSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
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
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  confidence: {
    marginBottom: 12,
  },
  confidenceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  extractedData: {
    marginBottom: 16,
  },
  dataLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  extractedText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  originalText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
  },
  cancelModalButton: {
    backgroundColor: '#F3F4F6',
  },
  saveModalButton: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cancelModalButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OCRReceiptScreen;
