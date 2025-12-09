import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import ThemedText from '../ThemedText';
import IconSymbol from '../ui/IconSymbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../constants/Theme';
import { API_ENDPOINTS, fetchWithTimeout } from '../../../constants/Api';
import { Linking } from 'react-native';

const { width } = Dimensions.get('window');

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  notes: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

interface CustomersScreenProps {
  onSelectCustomer?: (customer: Customer) => void;
  selectionMode?: boolean;
  onClose?: () => void;
}

export default function CustomersScreen({ onSelectCustomer, selectionMode = false, onClose }: CustomersScreenProps) {
  const insets = useSafeAreaInsets();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.customers);
      const data = await response.json();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('Musteri listesi alinamadi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      country: '',
      city: '',
      address: '',
      notes: '',
    });
    setEditingCustomer(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Uyari', 'Musteri adi gerekli');
      return;
    }

    try {
      const url = editingCustomer
        ? `${API_ENDPOINTS.customers}/${editingCustomer.id}`
        : API_ENDPOINTS.customers;

      const response = await fetchWithTimeout(url, {
        method: editingCustomer ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        Alert.alert('Basarili', editingCustomer ? 'Musteri guncellendi' : 'Musteri eklendi');
        setShowAddModal(false);
        resetForm();
        fetchCustomers();
      } else {
        throw new Error('Islem basarisiz');
      }
    } catch (error) {
      Alert.alert('Hata', 'Islem sirasinda bir hata olustu');
    }
  };

  const handleDelete = (customer: Customer) => {
    Alert.alert(
      'Musteri Sil',
      `${customer.name} adli musteriyi silmek istediginize emin misiniz?`,
      [
        { text: 'Iptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetchWithTimeout(`${API_ENDPOINTS.customers}/${customer.id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                Alert.alert('Basarili', 'Musteri silindi');
                fetchCustomers();
              }
            } catch (error) {
              Alert.alert('Hata', 'Musteri silinemedi');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      country: customer.country || '',
      city: customer.city || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setShowAddModal(true);
  };

  const handleCall = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleWhatsApp = (phone: string, name: string) => {
    if (phone) {
      const message = encodeURIComponent(`Merhaba ${name}, Koyuncu Halı'dan yazıyorum.`);
      Linking.openURL(`whatsapp://send?phone=${phone.replace(/[^0-9]/g, '')}&text=${message}`);
    }
  };

  const renderCustomerCard = (customer: Customer) => (
    <TouchableOpacity
      key={customer.id}
      style={styles.customerCard}
      onPress={() => {
        if (selectionMode && onSelectCustomer) {
          onSelectCustomer(customer);
        } else {
          handleEdit(customer);
        }
      }}
      activeOpacity={0.7}
    >
      <View style={styles.customerHeader}>
        <View style={styles.customerAvatar}>
          <ThemedText style={styles.avatarText}>
            {customer.name.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.customerInfo}>
          <ThemedText style={styles.customerName}>{customer.name}</ThemedText>
          {customer.city && customer.country && (
            <ThemedText style={styles.customerLocation}>
              {customer.city}, {customer.country}
            </ThemedText>
          )}
        </View>
        {!selectionMode && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(customer)}
          >
            <IconSymbol name="trash-can-outline" size={20} color={COLORS.error.main} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.customerDetails}>
        {customer.phone && (
          <View style={styles.detailRow}>
            <IconSymbol name="phone" size={16} color={COLORS.light.text.tertiary} />
            <ThemedText style={styles.detailText}>{customer.phone}</ThemedText>
          </View>
        )}
        {customer.email && (
          <View style={styles.detailRow}>
            <IconSymbol name="email" size={16} color={COLORS.light.text.tertiary} />
            <ThemedText style={styles.detailText}>{customer.email}</ThemedText>
          </View>
        )}
      </View>

      {!selectionMode && customer.phone && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={() => handleCall(customer.phone)}
          >
            <IconSymbol name="phone" size={18} color={COLORS.success.main} />
            <ThemedText style={[styles.actionButtonText, { color: COLORS.success.main }]}>Ara</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.whatsappButton]}
            onPress={() => handleWhatsApp(customer.phone, customer.name)}
          >
            <IconSymbol name="whatsapp" size={18} color="#25D366" />
            <ThemedText style={[styles.actionButtonText, { color: '#25D366' }]}>WhatsApp</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        setShowAddModal(false);
        resetForm();
      }}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
            <ThemedText style={styles.modalCancel}>Iptal</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.modalTitle}>
            {editingCustomer ? 'Musteri Duzenle' : 'Yeni Musteri'}
          </ThemedText>
          <TouchableOpacity onPress={handleSave}>
            <ThemedText style={styles.modalSave}>Kaydet</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Ad Soyad *</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Musteri adi"
              placeholderTextColor={COLORS.neutral[400]}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>E-posta</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="ornek@email.com"
              placeholderTextColor={COLORS.neutral[400]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Telefon</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="+90 5XX XXX XX XX"
              placeholderTextColor={COLORS.neutral[400]}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
              <ThemedText style={styles.inputLabel}>Ulke</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.country}
                onChangeText={(text) => setFormData({ ...formData, country: text })}
                placeholder="Ulke"
                placeholderTextColor={COLORS.neutral[400]}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.sm }]}>
              <ThemedText style={styles.inputLabel}>Sehir</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="Sehir"
                placeholderTextColor={COLORS.neutral[400]}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Adres</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Tam adres"
              placeholderTextColor={COLORS.neutral[400]}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Notlar</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Ek notlar..."
              placeholderTextColor={COLORS.neutral[400]}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, !selectionMode && { paddingTop: 0 }]}>
      {/* Header */}
      <View style={styles.header}>
        {selectionMode && onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="close" size={24} color={COLORS.light.text.primary} />
          </TouchableOpacity>
        )}
        <ThemedText style={styles.headerTitle}>
          {selectionMode ? 'Musteri Sec' : 'Musteriler'}
        </ThemedText>
        {!selectionMode && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <IconSymbol name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <IconSymbol name="magnify" size={20} color={COLORS.light.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Musteri ara..."
            placeholderTextColor={COLORS.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="close-circle" size={20} color={COLORS.light.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Customer List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary.main} />
        }
      >
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="account-group-outline" size={64} color={COLORS.neutral[300]} />
            <ThemedText style={styles.emptyText}>
              {searchQuery ? 'Musteri bulunamadi' : 'Henuz musteri eklenmemis'}
            </ThemedText>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowAddModal(true)}
              >
                <ThemedText style={styles.emptyButtonText}>Musteri Ekle</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredCustomers.map(renderCustomerCard)
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {renderAddModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.light.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
    paddingVertical: SPACING.xs,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.base,
    gap: SPACING.md,
  },
  customerCard: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    marginBottom: SPACING.md,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  customerLocation: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginTop: 2,
  },
  deleteButton: {
    padding: SPACING.sm,
  },
  customerDetails: {
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  callButton: {
    backgroundColor: COLORS.success.muted,
  },
  whatsappButton: {
    backgroundColor: '#E7F9EE',
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['3xl'],
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.tertiary,
    marginTop: SPACING.md,
  },
  emptyButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary.main,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  modalCancel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.error.main,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  modalSave: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.primary.accent,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.base,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.light.text.secondary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
  },
});
