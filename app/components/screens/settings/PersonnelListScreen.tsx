import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Modal, Alert, Switch } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import ThemedText from '../../ThemedText';
import IconSymbol from '../../ui/IconSymbol';
import { API_ENDPOINTS, fetchWithTimeout } from '../../../../constants/Api';

interface Personnel {
  id: number;
  Ad_Soyad: string;
  email: string;
  telefon: string;
  yetki: string;
}

interface PersonnelListScreenProps {
  onClose: () => void;
  userRole: string;
}

interface AdditionalPermissions {
  canViewFinancials: boolean;
  canViewReports: boolean;
  canCreateDocuments: boolean;
}

const ROLES = ['Operasyon Sorumlusu', 'Depo Görevlisi', 'Lojistik Sorumlusu'];

export default function PersonnelListScreen({ onClose, userRole }: PersonnelListScreenProps) {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Personnel | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [additionalPermissions, setAdditionalPermissions] = useState<AdditionalPermissions>({
    canViewFinancials: false,
    canViewReports: false,
    canCreateDocuments: false
  });
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const fetchPersonnel = async () => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.users);
      const data = await response.json();
      // Patronu en üste al ve diğerlerini alfabetik sırala
      const sortedData = data.sort((a: Personnel, b: Personnel) => {
        if (a.yetki === 'Patron') return -1;
        if (b.yetki === 'Patron') return 1;
        return a.Ad_Soyad.localeCompare(b.Ad_Soyad);
      });
      setPersonnel(sortedData);
    } catch (error) {
      console.error('Personel listesi alınamadı:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPersonnel();
  };

  const handleRolePress = (person: Personnel) => {
    // Patron rolündeki kullanıcının yetkisi değiştirilemez
    if (person.yetki === 'Patron') return;
    
    if (userRole === 'Patron') {
      setSelectedPerson(person);
      setShowRoleModal(true);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!selectedPerson) return;

    try {
      const response = await fetchWithTimeout(`${API_ENDPOINTS.users}/${selectedPerson.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ yetki: newRole }),
      });

      if (!response.ok) throw new Error('Yetki güncellenemedi');

      // Güncelleme başarılı
      setPersonnel(personnel.map(p =>
        p.id === selectedPerson.id ? { ...p, yetki: newRole } : p
      ));
      setShowRoleModal(false);
      setSelectedPerson(null);
      Alert.alert('Başarılı', 'Personel yetkisi güncellendi.');
    } catch (error) {
      console.error('Yetki güncelleme hatası:', error);
      Alert.alert('Hata', 'Yetki güncellenirken bir hata oluştu.');
    }
  };

  const handlePermissionChange = async () => {
    if (!selectedPerson) return;

    try {
      const permissions = [];
      if (additionalPermissions.canViewFinancials) {
        permissions.push('finansal_goruntuleme');
      }
      if (additionalPermissions.canViewReports) {
        permissions.push('rapor_goruntuleme');
      }
      if (additionalPermissions.canCreateDocuments) {
        permissions.push('belge_olusturma');
      }

      const response = await fetchWithTimeout(`${API_ENDPOINTS.users}/${selectedPerson.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      });

      if (!response.ok) throw new Error('Ek yetkiler güncellenemedi');

      setShowPermissionModal(false);
      setSelectedPerson(null);
      Alert.alert('Başarılı', 'Ek yetkiler güncellendi.');
    } catch (error) {
      console.error('Ek yetki güncelleme hatası:', error);
      Alert.alert('Hata', 'Ek yetkiler güncellenirken bir hata oluştu.');
    }
  };

  // Mevcut yetkileri yükle
  useEffect(() => {
    const loadPermissions = async () => {
      if (!selectedPerson) return;

      try {
        const response = await fetchWithTimeout(`${API_ENDPOINTS.users}/${selectedPerson.id}/permissions`);
        const data = await response.json();

        setAdditionalPermissions({
          canViewFinancials: data.permissions.includes('finansal_goruntuleme'),
          canViewReports: data.permissions.includes('rapor_goruntuleme'),
          canCreateDocuments: data.permissions.includes('belge_olusturma')
        });
      } catch (error) {
        console.error('Ek yetkileri yükleme hatası:', error);
      }
    };

    if (showPermissionModal) {
      loadPermissions();
    }
  }, [selectedPerson, showPermissionModal]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Patron':
        return '#00b51a';
      case 'Operasyon Sorumlusu':
        return '#2196F3';
      case 'Depo Görevlisi':
        return '#FF9800';
      case 'Lojistik Sorumlusu':
        return '#9C27B0';
      default:
        return '#666';
    }
  };

  const renderRoleModal = () => (
    <Modal
      visible={showRoleModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRoleModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ThemedText style={styles.modalTitle}>Yetki Seç</ThemedText>
          
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleOption,
                selectedPerson?.yetki === role && styles.selectedRoleOption
              ]}
              onPress={() => handleRoleChange(role)}
            >
              <ThemedText style={[
                styles.roleOptionText,
                selectedPerson?.yetki === role && styles.selectedRoleOptionText
              ]}>
                {role}
              </ThemedText>
            </TouchableOpacity>
          ))}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowRoleModal(false)}
            >
              <ThemedText style={styles.cancelButtonText}>İptal</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderPermissionModal = () => (
    <Modal
      visible={showPermissionModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPermissionModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Ek Yetkiler</ThemedText>
            <TouchableOpacity onPress={() => setShowPermissionModal(false)}>
              <IconSymbol name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.permissionItem}>
              <ThemedText style={styles.permissionLabel}>Finansal Görüntüleme</ThemedText>
              <Switch
                value={additionalPermissions.canViewFinancials}
                onValueChange={(value) => setAdditionalPermissions(prev => ({
                  ...prev,
                  canViewFinancials: value
                }))}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={additionalPermissions.canViewFinancials ? '#00b51a' : '#f4f3f4'}
              />
            </View>

            <View style={styles.permissionItem}>
              <ThemedText style={styles.permissionLabel}>Rapor Görüntüleme</ThemedText>
              <Switch
                value={additionalPermissions.canViewReports}
                onValueChange={(value) => setAdditionalPermissions(prev => ({
                  ...prev,
                  canViewReports: value
                }))}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={additionalPermissions.canViewReports ? '#00b51a' : '#f4f3f4'}
              />
            </View>

            <View style={styles.permissionItem}>
              <ThemedText style={styles.permissionLabel}>Belge Oluşturma</ThemedText>
              <Switch
                value={additionalPermissions.canCreateDocuments}
                onValueChange={(value) => setAdditionalPermissions(prev => ({
                  ...prev,
                  canCreateDocuments: value
                }))}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={additionalPermissions.canCreateDocuments ? '#00b51a' : '#f4f3f4'}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowPermissionModal(false)}
              >
                <ThemedText style={styles.cancelButtonText}>İptal</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handlePermissionChange}
              >
                <ThemedText style={styles.saveButtonText}>Kaydet</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <IconSymbol name="arrow-left" size={24} color="#00b51a" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Personel Listesi</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00b51a" />
        </View>
      ) : (
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {personnel.map((person) => (
            <View key={person.id} style={styles.personCard}>
              <View style={styles.personInfo}>
                <ThemedText style={styles.personName}>{person.Ad_Soyad}</ThemedText>
                <ThemedText style={styles.personEmail}>{person.email}</ThemedText>
                <ThemedText style={styles.personPhone}>{person.telefon}</ThemedText>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={() => handleRolePress(person)}
                  disabled={person.yetki === 'Patron'}
                  style={[
                    styles.roleTag,
                    { backgroundColor: getRoleColor(person.yetki) + '15' }
                  ]}
                >
                  <ThemedText style={[styles.roleText, { color: getRoleColor(person.yetki) }]}>
                    {person.yetki}
                  </ThemedText>
                </TouchableOpacity>
                {person.yetki !== 'Patron' && (
                  <TouchableOpacity
                    style={[styles.actionButton, { marginLeft: 8 }]}
                    onPress={() => {
                      setSelectedPerson(person);
                      setShowPermissionModal(true);
                    }}
                  >
                    <IconSymbol name="key-star" size={24} color="#00b51a" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {renderRoleModal()}
      {renderPermissionModal()}
    </View>
  );
}

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
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  personCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  personEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  personPhone: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  roleTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  roleOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  selectedRoleOption: {
    backgroundColor: '#00b51a15',
  },
  roleOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedRoleOptionText: {
    color: '#00b51a',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#00b51a',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionOption: {
    marginBottom: 16,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#00b51a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#00b51a',
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  modalBody: {
    padding: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  permissionLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
}); 