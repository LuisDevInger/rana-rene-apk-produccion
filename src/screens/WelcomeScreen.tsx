import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const WelcomeScreen = ({ navigation }: any) => {
  const handleBegin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Gradient */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.emoji}>🏪</Text>
            <Text style={styles.title}>Rana René</Text>
            <Text style={styles.subtitle}>Control de Ventas</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Welcome Message */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>¡Bienvenido!</Text>
            <Text style={styles.welcomeDesc}>
              Sistema integral de gestión de ventas y almacén
            </Text>
          </View>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            <FeatureCard
              icon="dashboard"
              title="Dashboard"
              desc="Estadísticas en tiempo real"
            />
            <FeatureCard
              icon="people"
              title="Clientes"
              desc="Gestión completa"
            />
            <FeatureCard
              icon="shopping-cart"
              title="Ventas"
              desc="Registro de compras"
            />
            <FeatureCard
              icon="inventory"
              title="Productos"
              desc="Control de inventario"
            />
            <FeatureCard
              icon="warehouse"
              title="Almacén"
              desc="Movimientos de stock"
            />
            <FeatureCard
              icon="analytics"
              title="Reportes"
              desc="Análisis y métricas"
            />
          </View>

          {/* Benefits Section */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>¿Por qué elegirnos?</Text>
            <BenefitRow icon="check-circle" text="Interfaz moderna y fácil de usar" />
            <BenefitRow icon="check-circle" text="Datos sincronizados en tiempo real" />
            <BenefitRow icon="check-circle" text="Reportes detallados y precisos" />
            <BenefitRow icon="check-circle" text="Acceso desde cualquier dispositivo" />
          </View>

          {/* CTA Button */}
          <TouchableOpacity style={styles.button} onPress={handleBegin}>
            <Icon name="arrow-forward" size={24} color="white" />
            <Text style={styles.buttonText}>Comenzar</Text>
          </TouchableOpacity>

          {/* Version Info */}
          <View style={styles.versionInfo}>
            <Text style={styles.version}>Versión 1.0.0</Text>
            <Text style={styles.copyright}>© 2025 Rana René</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const FeatureCard = ({ icon, title, desc }: any) => (
  <View style={styles.featureCard}>
    <View style={styles.iconContainer}>
      <Icon name={icon} size={32} color="#3B82F6" />
    </View>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDesc}>{desc}</Text>
  </View>
);

const BenefitRow = ({ icon, text }: any) => (
  <View style={styles.benefitRow}>
    <Icon name={icon} size={24} color="#10B981" />
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#3B82F6',
    paddingVertical: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  content: {
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 10,
  },
  welcomeDesc: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  featureCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  benefitsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  versionInfo: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  version: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 11,
    color: '#d1d5db',
  },
});

export default WelcomeScreen;

