import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// Tipos de roles
const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  ALMACENERO: 'almacenero',
  DEVELOPER: 'developer'
};

const ROLE_LABELS = {
  [ROLES.USER]: 'Registrador',
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.ALMACENERO]: 'Almacenero',
  [ROLES.DEVELOPER]: 'Developer'
};

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt?: Date;
  lastLogin?: Date;
}

const AdminUsersScreen: React.FC = () => {
  const navigation = useNavigation();
  const { isDeveloper, user: currentUser } = useAuth();
  const { success, error, warning } = useToast();

  // Estados
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('todos');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  // Formulario para crear usuario
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    displayName: '',
    role: ROLES.USER
  });

  // Cargar usuarios
  const loadUsers = async () => {
    setLoading(true);
    try {
      // Aquí iría la lógica para cargar usuarios desde Firebase
      // Por ahora usamos datos de ejemplo
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'admin@test.com',
          displayName: 'Administrador',
          role: ROLES.ADMIN,
          createdAt: new Date(),
          lastLogin: new Date()
        },
        {
          id: '2',
          email: 'almacenero@test.com',
          displayName: 'Almacenero Principal',
          role: ROLES.ALMACENERO,
          createdAt: new Date(),
          lastLogin: new Date()
        },
        {
          id: '3',
          email: 'registrador@test.com',
          displayName: 'Registrador',
          role: ROLES.USER,
          createdAt: new Date(),
          lastLogin: new Date()
        }
      ];

      // Filtrar usuarios según permisos
      const filtered = mockUsers.filter(u => {
        // Si no eres developer, ocultar otros developers
        if (!isDeveloper && u.role === ROLES.DEVELOPER) return false;
        // Siempre ocultar al usuario actual
        if (currentUser && u.id === currentUser.uid) return false;
        return true;
      });

      setUsers(filtered);
    } catch (err) {
      console.error('Error loading users:', err);
      error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadUsers();
    }, [])
  );

  // Filtrar y buscar usuarios
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filtrar por rol
    if (selectedRole !== 'todos') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Buscar por nombre o email
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user =>
        user.displayName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [users, selectedRole, searchQuery]);

  // Opciones de roles disponibles
  const availableRoles = useMemo(() => {
    const roles = [
      { value: ROLES.USER, label: 'Registrador' },
      { value: ROLES.ADMIN, label: 'Administrador' },
      { value: ROLES.ALMACENERO, label: 'Almacenero' },
    ];

    // Solo developers pueden asignar rol developer
    if (isDeveloper) {
      roles.push({ value: ROLES.DEVELOPER, label: 'Developer' });
    }

    return roles;
  }, [isDeveloper]);

  // Crear usuario
  const handleCreateUser = async () => {
    if (!createForm.email.trim() || !createForm.password || !createForm.displayName.trim()) {
      error('Todos los campos son obligatorios');
      return;
    }

    if (createForm.password.length < 6) {
      error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setCreatingUser(true);
    try {
      // Aquí iría la lógica para crear usuario en Firebase
      console.log('Creating user:', createForm);

      // Simular creación
      await new Promise(resolve => setTimeout(resolve, 2000));

      success('Usuario creado correctamente');
      setShowCreateModal(false);
      setCreateForm({ email: '', password: '', displayName: '', role: ROLES.USER });
      loadUsers(); // Recargar lista
    } catch (err) {
      console.error('Error creating user:', err);
      error('Error al crear usuario');
    } finally {
      setCreatingUser(false);
    }
  };

  // Cambiar rol de usuario
  const handleChangeRole = async (user: User, newRole: string) => {
    setUpdatingRole(true);
    try {
      // Aquí iría la lógica para actualizar el rol en Firebase
      console.log('Updating role for user:', user.id, 'to:', newRole);

      // Simular actualización
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Actualizar localmente
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, role: newRole } : u
      ));

      success('Rol actualizado correctamente');
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error updating role:', err);
      error('Error al actualizar rol');
    } finally {
      setUpdatingRole(false);
    }
  };

  // Resetear contraseña
  const handleResetPassword = async (user: User) => {
    Alert.alert(
      'Resetear Contraseña',
      `¿Enviar email de reseteo de contraseña a ${user.email}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            try {
              // Aquí iría la lógica para enviar reset password
              console.log('Sending password reset to:', user.email);

              // Simular envío
              await new Promise(resolve => setTimeout(resolve, 1000));

              success(`Email de reseteo enviado a ${user.email}`);
            } catch (err) {
              console.error('Error sending reset:', err);
              error('Error al enviar email de reseteo');
            }
          }
        }
      ]
    );
  };

  // Renderizar item de usuario
  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>
            {item.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.displayName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
            <Text style={styles.roleText}>{ROLE_LABELS[item.role] || item.role}</Text>
          </View>
        </View>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setSelectedUser(item);
            setShowRoleModal(true);
          }}
        >
          <Icon name="edit" size={20} color="#3B82F6" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleResetPassword(item)}
        >
          <Icon name="lock-reset" size={20} color="#F59E0B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Obtener color del rol
  const getRoleColor = (role: string) => {
    switch (role) {
      case ROLES.ADMIN: return '#EF4444';
      case ROLES.DEVELOPER: return '#8B5CF6';
      case ROLES.ALMACENERO: return '#10B981';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#3B82F6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Administrar Usuarios</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Icon name="person-add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filtros y búsqueda */}
      <View style={styles.filters}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="clear" size={20} color="#6B7280" />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFilters}>
          {[
            { value: 'todos', label: 'Todos' },
            ...availableRoles.map(role => ({ value: role.value, label: role.label }))
          ].map(role => (
            <TouchableOpacity
              key={role.value}
              style={[
                styles.roleFilter,
                selectedRole === role.value && styles.roleFilterActive
              ]}
              onPress={() => setSelectedRole(role.value)}
            >
              <Text style={[
                styles.roleFilterText,
                selectedRole === role.value && styles.roleFilterTextActive
              ]}>
                {role.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de usuarios */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No hay usuarios</Text>
            <Text style={styles.emptyText}>
              {searchQuery || selectedRole !== 'todos'
                ? 'No se encontraron usuarios con los filtros aplicados'
                : 'Comienza creando el primer usuario'
              }
            </Text>
          </View>
        }
      />

      {/* Modal Crear Usuario */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Crear Usuario</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre Completo *</Text>
              <TextInput
                style={styles.input}
                value={createForm.displayName}
                onChangeText={(text) => setCreateForm(f => ({ ...f, displayName: text }))}
                placeholder="Nombre del usuario"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={createForm.email}
                onChangeText={(text) => setCreateForm(f => ({ ...f, email: text.toLowerCase() }))}
                placeholder="usuario@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña *</Text>
              <TextInput
                style={styles.input}
                value={createForm.password}
                onChangeText={(text) => setCreateForm(f => ({ ...f, password: text }))}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rol</Text>
              {availableRoles.map(role => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleOption,
                    createForm.role === role.value && styles.roleOptionSelected
                  ]}
                  onPress={() => setCreateForm(f => ({ ...f, role: role.value }))}
                >
                  <Text style={[
                    styles.roleOptionText,
                    createForm.role === role.value && styles.roleOptionTextSelected
                  ]}>
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.createButton, creatingUser && styles.createButtonDisabled]}
              onPress={handleCreateUser}
              disabled={creatingUser}
            >
              {creatingUser ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="person-add" size={20} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Crear Usuario</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal Cambiar Rol */}
      <Modal
        visible={showRoleModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.roleModalContent}>
            <Text style={styles.roleModalTitle}>
              Cambiar rol de {selectedUser?.displayName}
            </Text>

            {availableRoles.map(role => (
              <TouchableOpacity
                key={role.value}
                style={[
                  styles.roleOption,
                  selectedUser?.role === role.value && styles.roleOptionSelected
                ]}
                onPress={() => selectedUser && handleChangeRole(selectedUser, role.value)}
                disabled={updatingRole}
              >
                {updatingRole ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Text style={[
                    styles.roleOptionText,
                    selectedUser?.role === role.value && styles.roleOptionTextSelected
                  ]}>
                    {role.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowRoleModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filters: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    fontSize: 16,
  },
  roleFilters: {
    flexDirection: 'row',
  },
  roleFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  roleFilterActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  roleFilterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  roleFilterTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  userActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
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
  inputGroup: {
    marginBottom: 20,
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
  roleOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  roleOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  roleOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  roleOptionTextSelected: {
    color: '#FFFFFF',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
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
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 40,
    width: '80%',
    maxWidth: 300,
  },
  roleModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default AdminUsersScreen;
