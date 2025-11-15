import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Cliente } from '../types';
import { useToast } from '../contexts/ToastContext';

const ClienteFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const cliente = (route.params as any)?.cliente as Cliente | undefined;
  const { success, error } = useToast();

  const [form, setForm] = useState({
    nombre: cliente?.nombre || '',
    apellido: cliente?.apellido || '',
    email: cliente?.email || '',
    telefono: cliente?.telefono || '',
    dni: cliente?.dni || '',
    direccion: cliente?.direccion || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    if (!form.apellido.trim()) {
      Alert.alert('Error', 'El apellido es obligatorio');
      return;
    }

    if (!form.dni.trim()) {
      Alert.alert('Error', 'El DNI es obligatorio');
      return;
    }

    // Validación de formato de DNI (8 dígitos)
    if (!/^\d{8}$/.test(form.dni.trim())) {
      Alert.alert('Error', 'El DNI debe tener exactamente 8 dígitos');
      return;
    }

    if (!form.telefono.trim()) {
      Alert.alert('Error', 'El teléfono es obligatorio');
      return;
    }

    // Validación de formato de teléfono (9 dígitos)
    if (!/^\d{9}$/.test(form.telefono.replace(/[^0-9]/g, ''))) {
      Alert.alert('Error', 'El teléfono debe tener exactamente 9 dígitos');
      return;
    }

    setSaving(true);
    try {
      // Aquí iría la lógica para guardar en Firebase
      await new Promise(resolve => setTimeout(resolve, 1000));

      success(cliente ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      error('No se pudo guardar el cliente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            value={form.nombre}
            onChangeText={(text) => setForm(f => ({ ...f, nombre: text }))}
            placeholder="Ingrese el nombre"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Apellido</Text>
          <TextInput
            style={styles.input}
            value={form.apellido}
            onChangeText={(text) => setForm(f => ({ ...f, apellido: text }))}
            placeholder="Ingrese el apellido"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(text) => setForm(f => ({ ...f, email: text }))}
            placeholder="cliente@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Teléfono *</Text>
          <TextInput
            style={styles.input}
            value={form.telefono}
            onChangeText={(text) => setForm(f => ({ ...f, telefono: text.replace(/[^0-9]/g, '') }))}
            placeholder="999123456"
            keyboardType="phone-pad"
            maxLength={9}
          />
          <Text style={styles.helperText}>
            • El teléfono debe tener exactamente 9 dígitos
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>DNI *</Text>
          <TextInput
            style={styles.input}
            value={form.dni}
            onChangeText={(text) => setForm(f => ({ ...f, dni: text.replace(/[^0-9]/g, '') }))}
            placeholder="12345678"
            keyboardType="numeric"
            maxLength={8}
          />
          <Text style={styles.helperText}>
            • El DNI debe tener exactamente 8 dígitos{'\n'}
            • El DNI debe ser único en el sistema
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.direccion}
            onChangeText={(text) => setForm(f => ({ ...f, direccion: text }))}
            placeholder="Dirección completa"
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <View style={styles.loadingContainer}>
              <Icon name="hourglass-empty" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Guardando...</Text>
            </View>
          ) : (
            <View style={styles.saveButtonContent}>
              <Icon name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {cliente ? 'Actualizar' : 'Crear'} Cliente
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
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
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ClienteFormScreen;
