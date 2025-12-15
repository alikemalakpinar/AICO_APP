import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../../constants/Theme';
import { API_URL } from '../../../../constants/Api';

interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  manager_id: number | null;
  manager_name: string | null;
  is_active: number;
  user_count: number;
  order_count: number;
  created_at: string;
}

interface User {
  id: number;
  Ad_Soyad: string;
  yetki: string;
}

interface BranchManagementScreenProps {
  onBack: () => void;
  currentUser: any;
}

export default function BranchManagementScreen({ onBack, currentUser }: BranchManagementScreenProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    country: 'Türkiye',
    phone: '',
    email: '',
    manager_id: null as number | null,
  });

  useEffect(() => {
    fetchBranches();
    fetchUsers();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${API_URL}/api/branches`);
      const data = await response.json();
      setBranches(data);
    } catch (error) {
      console.error('Şube listesi hatası:', error);
      Alert.alert('Hata', 'Şubeler yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Kullanıcı listesi hatası:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      Alert.alert('Hata', 'Şube adı ve kodu zorunludur');
      return;
    }

    try {
      const url = editingBranch
        ? `${API_URL}/api/branches/${editingBranch.id}`
        : `${API_URL}/api/branches`;

      const method = editingBranch ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          is_active: true,
          created_by: currentUser?.userId,
          updated_by: currentUser?.userId,
        }),
      });

      if (response.ok) {
        Alert.alert('Başarılı', editingBranch ? 'Şube güncellendi' : 'Şube eklendi');
        setModalVisible(false);
        resetForm();
        fetchBranches();
      } else {
        const error = await response.json();
        Alert.alert('Hata', error.error || 'İşlem başarısız');
      }
    } catch (error) {
      console.error('Kayıt hatası:', error);
      Alert.alert('Hata', 'Kayıt işlemi başarısız');
    }
  };

  const handleDelete = (branch: Branch) => {
    if (branch.user_count > 0) {
      Alert.alert('Uyarı', 'Bu şubede kullanıcılar mevcut. Önce kullanıcıları başka şubeye aktarın.');
      return;
    }

    Alert.alert(
      'Şube Sil',
      `"${branch.name}" şubesini silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/branches/${branch.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deleted_by: currentUser?.userId }),
              });

              if (response.ok) {
                Alert.alert('Başarılı', 'Şube silindi');
                fetchBranches();
              } else {
                const error = await response.json();
                Alert.alert('Hata', error.error || 'Silme işlemi başarısız');
              }
            } catch (error) {
              console.error('Silme hatası:', error);
              Alert.alert('Hata', 'Silme işlemi başarısız');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      country: branch.country || 'Türkiye',
      phone: branch.phone || '',
      email: branch.email || '',
      manager_id: branch.manager_id,
    });
    setModalVisible(true);
  };

  const openAddModal = () => {
    setEditingBranch(null);
    resetForm();
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      country: 'Türkiye',
      phone: '',
      email: '',
      manager_id: null,
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBranches();
  };

  const renderBranchCard = (branch: Branch) => (
    <TouchableOpacity
      key={branch.id}
      style={styles.branchCard}
      onPress={() => openEditModal(branch)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={branch.is_active ? ['#1E3A5F', '#2D5A87'] : ['#374151', '#4B5563']}
        style={styles.branchCardGradient}
      >
        <View style={styles.branchHeader}>
          <View style={styles.branchIconContainer}>
            <Ionicons name="business" size={24} color="#3B82F6" />
          </View>
          <View style={styles.branchInfo}>
            <Text style={styles.branchName}>{branch.name}</Text>
            <Text style={styles.branchCode}>{branch.code}</Text>
          </View>
          <View style={[styles.statusBadge, branch.is_active ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={styles.statusText}>{branch.is_active ? 'Aktif' : 'Pasif'}</Text>
          </View>
        </View>

        <View style={styles.branchDetails}>
          {branch.city && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color="#9CA3AF" />
              <Text style={styles.detailText}>{branch.city}, {branch.state}</Text>
            </View>
          )}
          {branch.manager_name && (
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color="#9CA3AF" />
              <Text style={styles.detailText}>Yönetici: {branch.manager_name}</Text>
            </View>
          )}
        </View>

        <View style={styles.branchStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{branch.user_count}</Text>
            <Text style={styles.statLabel}>Kullanıcı</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{branch.order_count}</Text>
            <Text style={styles.statLabel}>Sipariş</Text>
          </View>
        </View>

        <View style={styles.branchActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(branch)}
          >
            <Ionicons name="create-outline" size={18} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Düzenle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(branch)}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={[styles.actionButtonText, styles.deleteText]}>Sil</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Şubeler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Şube Yönetimi</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Branch List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        <View style={styles.statsHeader}>
          <View style={styles.totalStat}>
            <Ionicons name="business-outline" size={20} color="#3B82F6" />
            <Text style={styles.totalStatText}>Toplam {branches.length} Şube</Text>
          </View>
        </View>

        {branches.map(renderBranchCard)}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.modalGradient}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingBranch ? 'Şube Düzenle' : 'Yeni Şube Ekle'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Şube Adı *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                    placeholder="Şube adı"
                    placeholderTextColor="#6B7280"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Şube Kodu *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.code}
                    onChangeText={(text) => setFormData({ ...formData, code: text.toUpperCase() })}
                    placeholder="IST-001"
                    placeholderTextColor="#6B7280"
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Şehir</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.city}
                      onChangeText={(text) => setFormData({ ...formData, city: text })}
                      placeholder="İstanbul"
                      placeholderTextColor="#6B7280"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Bölge</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.state}
                      onChangeText={(text) => setFormData({ ...formData, state: text })}
                      placeholder="Marmara"
                      placeholderTextColor="#6B7280"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Adres</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.address}
                    onChangeText={(text) => setFormData({ ...formData, address: text })}
                    placeholder="Tam adres"
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Telefon</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.phone}
                      onChangeText={(text) => setFormData({ ...formData, phone: text })}
                      placeholder="+90 212 XXX XX XX"
                      placeholderTextColor="#6B7280"
                      keyboardType="phone-pad"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                      placeholder="sube@sirket.com"
                      placeholderTextColor="#6B7280"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Şube Yöneticisi</Text>
                  <View style={styles.pickerContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <TouchableOpacity
                        style={[
                          styles.managerOption,
                          formData.manager_id === null && styles.managerOptionSelected,
                        ]}
                        onPress={() => setFormData({ ...formData, manager_id: null })}
                      >
                        <Text style={styles.managerOptionText}>Yok</Text>
                      </TouchableOpacity>
                      {users.filter(u => u.yetki !== 'Depo Görevlisi').map((user) => (
                        <TouchableOpacity
                          key={user.id}
                          style={[
                            styles.managerOption,
                            formData.manager_id === user.id && styles.managerOptionSelected,
                          ]}
                          onPress={() => setFormData({ ...formData, manager_id: user.id })}
                        >
                          <Text style={styles.managerOptionText}>{user.Ad_Soyad}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <LinearGradient
                    colors={['#3B82F6', '#2563EB']}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>
                      {editingBranch ? 'Güncelle' : 'Ekle'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsHeader: {
    marginBottom: 16,
  },
  totalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  totalStatText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  branchCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  branchCardGradient: {
    padding: 16,
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  branchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  branchCode: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  branchDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  branchStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#374151',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  branchActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 4,
  },
  deleteText: {
    color: '#EF4444',
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  formContainer: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#374151',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  managerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#374151',
  },
  managerOptionSelected: {
    backgroundColor: '#3B82F6',
  },
  managerOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
