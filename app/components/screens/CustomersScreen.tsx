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
  Image,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import ThemedText from '../ThemedText';
import IconSymbol from '../ui/IconSymbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../constants/Theme';
import { API_ENDPOINTS, fetchWithTimeout, API_URL } from '../../../constants/Api';
import { Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  phone_country_code: string;
  phone_formatted: string;
  country: string;
  country_code: string;
  city: string;
  state: string;
  address: string;
  postal_code: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_country: string;
  shipping_postal_code: string;
  tax_number: string;
  passport_number: string;
  id_number: string;
  notes: string;
  customer_type: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
  latitude: number;
  longitude: number;
}

interface Document {
  id: number;
  document_type: string;
  document_name: string;
  created_at: string;
}

interface CountryCode {
  code: string;
  country: string;
  flag: string;
  format: string;
}

interface CustomersScreenProps {
  onSelectCustomer?: (customer: Customer) => void;
  selectionMode?: boolean;
  onClose?: () => void;
  currentUser?: any;
}

const CUSTOMER_TYPES = [
  { id: 'individual', name: 'Bireysel', icon: 'account' },
  { id: 'corporate', name: 'Kurumsal', icon: 'domain' },
];

const DOCUMENT_TYPES = [
  { id: 'passport', name: 'Pasaport' },
  { id: 'id_card', name: 'Kimlik' },
  { id: 'tax_certificate', name: 'Vergi Levhası' },
  { id: 'other', name: 'Diğer' },
];

export default function CustomersScreen({
  onSelectCustomer,
  selectionMode = false,
  onClose,
  currentUser
}: CustomersScreenProps) {
  const insets = useSafeAreaInsets();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCountryCodePicker, setShowCountryCodePicker] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerDocuments, setCustomerDocuments] = useState<Document[]>([]);
  const [countryCodes, setCountryCodes] = useState<CountryCode[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'shipping' | 'documents'>('info');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    phone_country_code: '+90',
    country: '',
    country_code: 'TR',
    city: '',
    state: '',
    address: '',
    postal_code: '',
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_country: '',
    shipping_postal_code: '',
    tax_number: '',
    passport_number: '',
    id_number: '',
    notes: '',
    customer_type: 'individual',
  });

  useEffect(() => {
    fetchCustomers();
    fetchCountryCodes();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery) ||
        c.tax_number?.includes(searchQuery) ||
        c.passport_number?.includes(searchQuery)
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

  const fetchCountryCodes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/utils/country-codes`);
      const data = await response.json();
      setCountryCodes(data);
    } catch (error) {
      console.error('Ulke kodlari alinamadi:', error);
      // Fallback default codes
      setCountryCodes([
        { code: '+90', country: 'Türkiye', flag: '🇹🇷', format: 'XXX XXX XX XX' },
        { code: '+1', country: 'ABD/Kanada', flag: '🇺🇸', format: '(XXX) XXX-XXXX' },
        { code: '+49', country: 'Almanya', flag: '🇩🇪', format: 'XXX XXXXXXXX' },
        { code: '+44', country: 'Birleşik Krallık', flag: '🇬🇧', format: 'XXXX XXXXXX' },
        { code: '+33', country: 'Fransa', flag: '🇫🇷', format: 'X XX XX XX XX' },
      ]);
    }
  };

  const fetchCustomerDocuments = async (customerId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/customers/${customerId}/documents`);
      const data = await response.json();
      setCustomerDocuments(data);
    } catch (error) {
      console.error('Belgeler alinamadi:', error);
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
      phone_country_code: '+90',
      country: '',
      country_code: 'TR',
      city: '',
      state: '',
      address: '',
      postal_code: '',
      shipping_address: '',
      shipping_city: '',
      shipping_state: '',
      shipping_country: '',
      shipping_postal_code: '',
      tax_number: '',
      passport_number: '',
      id_number: '',
      notes: '',
      customer_type: 'individual',
    });
    setEditingCustomer(null);
    setActiveTab('info');
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

      const payload = {
        ...formData,
        created_by: currentUser?.userId,
        updated_by: currentUser?.userId,
      };

      const response = await fetchWithTimeout(url, {
        method: editingCustomer ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deleted_by: currentUser?.userId }),
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
      phone_country_code: customer.phone_country_code || '+90',
      country: customer.country || '',
      country_code: customer.country_code || 'TR',
      city: customer.city || '',
      state: customer.state || '',
      address: customer.address || '',
      postal_code: customer.postal_code || '',
      shipping_address: customer.shipping_address || '',
      shipping_city: customer.shipping_city || '',
      shipping_state: customer.shipping_state || '',
      shipping_country: customer.shipping_country || '',
      shipping_postal_code: customer.shipping_postal_code || '',
      tax_number: customer.tax_number || '',
      passport_number: customer.passport_number || '',
      id_number: customer.id_number || '',
      notes: customer.notes || '',
      customer_type: customer.customer_type || 'individual',
    });
    setShowAddModal(true);
  };

  const handleViewDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    fetchCustomerDocuments(customer.id);
    setShowDetailModal(true);
  };

  const handleCall = (phone: string, countryCode: string = '+90') => {
    if (phone) {
      const fullNumber = `${countryCode}${phone.replace(/\D/g, '')}`;
      Linking.openURL(`tel:${fullNumber}`);
    }
  };

  const handleWhatsApp = (phone: string, name: string, countryCode: string = '+90') => {
    if (phone) {
      const cleanPhone = `${countryCode.replace('+', '')}${phone.replace(/\D/g, '')}`;
      const message = encodeURIComponent(`Merhaba ${name}, Koyuncu Halı'dan yazıyorum.`);
      Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=${message}`);
    }
  };

  const handleUploadDocument = async (customerId: number) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Gerekli', 'Kamera izni gereklidir');
        return;
      }

      Alert.alert(
        'Belge Yukle',
        'Belge kaynagi secin',
        [
          {
            text: 'Kamera',
            onPress: async () => {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                base64: true,
              });

              if (!result.canceled && result.assets[0]) {
                uploadDocument(customerId, result.assets[0]);
              }
            },
          },
          {
            text: 'Galeri',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                base64: true,
              });

              if (!result.canceled && result.assets[0]) {
                uploadDocument(customerId, result.assets[0]);
              }
            },
          },
          { text: 'Iptal', style: 'cancel' },
        ]
      );
    } catch (error) {
      console.error('Belge yukleme hatasi:', error);
      Alert.alert('Hata', 'Belge yuklenemedi');
    }
  };

  const uploadDocument = async (customerId: number, asset: any) => {
    Alert.alert(
      'Belge Turu',
      'Belge turunu secin',
      DOCUMENT_TYPES.map(type => ({
        text: type.name,
        onPress: async () => {
          try {
            const response = await fetch(`${API_URL}/api/customers/${customerId}/documents`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                document_type: type.id,
                document_name: `${type.name}_${Date.now()}`,
                document_data: asset.base64,
                mime_type: 'image/jpeg',
                uploaded_by: currentUser?.userId,
              }),
            });

            if (response.ok) {
              Alert.alert('Basarili', 'Belge yuklendi');
              fetchCustomerDocuments(customerId);
            } else {
              throw new Error('Yukleme basarisiz');
            }
          } catch (error) {
            Alert.alert('Hata', 'Belge yuklenemedi');
          }
        },
      }))
    );
  };

  const handleDeleteDocument = (docId: number) => {
    if (!selectedCustomer) return;

    Alert.alert(
      'Belge Sil',
      'Bu belgeyi silmek istediginize emin misiniz?',
      [
        { text: 'Iptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}/api/customers/${selectedCustomer.id}/documents/${docId}`,
                {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ deleted_by: currentUser?.userId }),
                }
              );
              if (response.ok) {
                Alert.alert('Basarili', 'Belge silindi');
                fetchCustomerDocuments(selectedCustomer.id);
              }
            } catch (error) {
              Alert.alert('Hata', 'Belge silinemedi');
            }
          },
        },
      ]
    );
  };

  const copyShippingAddress = () => {
    setFormData({
      ...formData,
      shipping_address: formData.address,
      shipping_city: formData.city,
      shipping_state: formData.state,
      shipping_country: formData.country,
      shipping_postal_code: formData.postal_code,
    });
  };

  const renderCustomerCard = (customer: Customer) => (
    <TouchableOpacity
      key={customer.id}
      style={styles.customerCard}
      onPress={() => {
        if (selectionMode && onSelectCustomer) {
          onSelectCustomer(customer);
        } else {
          handleViewDetail(customer);
        }
      }}
      activeOpacity={0.7}
    >
      <View style={styles.customerHeader}>
        <View style={[
          styles.customerAvatar,
          customer.customer_type === 'corporate' && styles.corporateAvatar
        ]}>
          <IconSymbol
            name={customer.customer_type === 'corporate' ? 'domain' : 'account'}
            size={24}
            color="#FFFFFF"
          />
        </View>
        <View style={styles.customerInfo}>
          <ThemedText style={styles.customerName}>{customer.name}</ThemedText>
          <View style={styles.customerMeta}>
            {customer.city && customer.country && (
              <View style={styles.metaItem}>
                <IconSymbol name="map-marker" size={12} color={COLORS.light.text.tertiary} />
                <ThemedText style={styles.metaText}>
                  {customer.city}, {customer.country}
                </ThemedText>
              </View>
            )}
            {customer.customer_type === 'corporate' && (
              <View style={styles.corporateBadge}>
                <ThemedText style={styles.corporateText}>Kurumsal</ThemedText>
              </View>
            )}
          </View>
        </View>
        {!selectionMode && (
          <View style={styles.statsContainer}>
            <ThemedText style={styles.statsValue}>{customer.total_orders || 0}</ThemedText>
            <ThemedText style={styles.statsLabel}>Siparis</ThemedText>
          </View>
        )}
      </View>

      <View style={styles.customerDetails}>
        {customer.phone && (
          <View style={styles.detailRow}>
            <IconSymbol name="phone" size={16} color={COLORS.light.text.tertiary} />
            <ThemedText style={styles.detailText}>
              {customer.phone_country_code || '+90'} {customer.phone_formatted || customer.phone}
            </ThemedText>
          </View>
        )}
        {customer.email && (
          <View style={styles.detailRow}>
            <IconSymbol name="email" size={16} color={COLORS.light.text.tertiary} />
            <ThemedText style={styles.detailText}>{customer.email}</ThemedText>
          </View>
        )}
        {customer.tax_number && (
          <View style={styles.detailRow}>
            <IconSymbol name="file-document" size={16} color={COLORS.light.text.tertiary} />
            <ThemedText style={styles.detailText}>VKN: {customer.tax_number}</ThemedText>
          </View>
        )}
      </View>

      {!selectionMode && customer.phone && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={() => handleCall(customer.phone, customer.phone_country_code)}
          >
            <IconSymbol name="phone" size={18} color={COLORS.success.main} />
            <ThemedText style={[styles.actionButtonText, { color: COLORS.success.main }]}>Ara</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.whatsappButton]}
            onPress={() => handleWhatsApp(customer.phone, customer.name, customer.phone_country_code)}
          >
            <IconSymbol name="whatsapp" size={18} color="#25D366" />
            <ThemedText style={[styles.actionButtonText, { color: '#25D366' }]}>WhatsApp</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(customer)}
          >
            <IconSymbol name="pencil" size={18} color={COLORS.primary.main} />
            <ThemedText style={[styles.actionButtonText, { color: COLORS.primary.main }]}>Duzenle</ThemedText>
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

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}
          >
            <IconSymbol name="account" size={20} color={activeTab === 'info' ? COLORS.primary.main : COLORS.light.text.tertiary} />
            <ThemedText style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>Bilgiler</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'shipping' && styles.activeTab]}
            onPress={() => setActiveTab('shipping')}
          >
            <IconSymbol name="truck" size={20} color={activeTab === 'shipping' ? COLORS.primary.main : COLORS.light.text.tertiary} />
            <ThemedText style={[styles.tabText, activeTab === 'shipping' && styles.activeTabText]}>Sevkiyat</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'documents' && styles.activeTab]}
            onPress={() => setActiveTab('documents')}
          >
            <IconSymbol name="file-document" size={20} color={activeTab === 'documents' ? COLORS.primary.main : COLORS.light.text.tertiary} />
            <ThemedText style={[styles.tabText, activeTab === 'documents' && styles.activeTabText]}>Belgeler</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'info' && (
            <>
              {/* Customer Type */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Musteri Tipi</ThemedText>
                <View style={styles.typeSelector}>
                  {CUSTOMER_TYPES.map(type => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeOption,
                        formData.customer_type === type.id && styles.typeOptionSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, customer_type: type.id })}
                    >
                      <IconSymbol
                        name={type.icon}
                        size={20}
                        color={formData.customer_type === type.id ? COLORS.primary.main : COLORS.light.text.tertiary}
                      />
                      <ThemedText style={[
                        styles.typeText,
                        formData.customer_type === type.id && styles.typeTextSelected,
                      ]}>
                        {type.name}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>
                  {formData.customer_type === 'corporate' ? 'Firma Adi *' : 'Ad Soyad *'}
                </ThemedText>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder={formData.customer_type === 'corporate' ? 'Firma adi' : 'Musteri adi'}
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

              {/* Phone with Country Code */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Telefon</ThemedText>
                <View style={styles.phoneRow}>
                  <TouchableOpacity
                    style={styles.countryCodeButton}
                    onPress={() => setShowCountryCodePicker(true)}
                  >
                    <ThemedText style={styles.countryCodeText}>
                      {countryCodes.find(c => c.code === formData.phone_country_code)?.flag || '🌍'} {formData.phone_country_code}
                    </ThemedText>
                    <IconSymbol name="chevron-down" size={16} color={COLORS.light.text.tertiary} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, styles.phoneInput]}
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    placeholder="5XX XXX XX XX"
                    placeholderTextColor={COLORS.neutral[400]}
                    keyboardType="phone-pad"
                  />
                </View>
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

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                  <ThemedText style={styles.inputLabel}>Eyalet/Bolge</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formData.state}
                    onChangeText={(text) => setFormData({ ...formData, state: text })}
                    placeholder="Eyalet"
                    placeholderTextColor={COLORS.neutral[400]}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.sm }]}>
                  <ThemedText style={styles.inputLabel}>Posta Kodu</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formData.postal_code}
                    onChangeText={(text) => setFormData({ ...formData, postal_code: text })}
                    placeholder="34000"
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

              {/* Tax/ID Numbers */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>
                  {formData.customer_type === 'corporate' ? 'Vergi No' : 'TC Kimlik No'}
                </ThemedText>
                <TextInput
                  style={styles.input}
                  value={formData.customer_type === 'corporate' ? formData.tax_number : formData.id_number}
                  onChangeText={(text) => setFormData({
                    ...formData,
                    [formData.customer_type === 'corporate' ? 'tax_number' : 'id_number']: text
                  })}
                  placeholder={formData.customer_type === 'corporate' ? 'Vergi numarasi' : 'TC kimlik no'}
                  placeholderTextColor={COLORS.neutral[400]}
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Pasaport No</ThemedText>
                <TextInput
                  style={styles.input}
                  value={formData.passport_number}
                  onChangeText={(text) => setFormData({ ...formData, passport_number: text })}
                  placeholder="Pasaport numarasi"
                  placeholderTextColor={COLORS.neutral[400]}
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
            </>
          )}

          {activeTab === 'shipping' && (
            <>
              <TouchableOpacity style={styles.copyAddressButton} onPress={copyShippingAddress}>
                <IconSymbol name="content-copy" size={18} color={COLORS.primary.main} />
                <ThemedText style={styles.copyAddressText}>Fatura adresinden kopyala</ThemedText>
              </TouchableOpacity>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Sevkiyat Adresi</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.shipping_address}
                  onChangeText={(text) => setFormData({ ...formData, shipping_address: text })}
                  placeholder="Sevkiyat adresi"
                  placeholderTextColor={COLORS.neutral[400]}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                  <ThemedText style={styles.inputLabel}>Ulke</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formData.shipping_country}
                    onChangeText={(text) => setFormData({ ...formData, shipping_country: text })}
                    placeholder="Ulke"
                    placeholderTextColor={COLORS.neutral[400]}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.sm }]}>
                  <ThemedText style={styles.inputLabel}>Sehir</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formData.shipping_city}
                    onChangeText={(text) => setFormData({ ...formData, shipping_city: text })}
                    placeholder="Sehir"
                    placeholderTextColor={COLORS.neutral[400]}
                  />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                  <ThemedText style={styles.inputLabel}>Eyalet/Bolge</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formData.shipping_state}
                    onChangeText={(text) => setFormData({ ...formData, shipping_state: text })}
                    placeholder="Eyalet"
                    placeholderTextColor={COLORS.neutral[400]}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.sm }]}>
                  <ThemedText style={styles.inputLabel}>Posta Kodu</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formData.shipping_postal_code}
                    onChangeText={(text) => setFormData({ ...formData, shipping_postal_code: text })}
                    placeholder="34000"
                    placeholderTextColor={COLORS.neutral[400]}
                  />
                </View>
              </View>
            </>
          )}

          {activeTab === 'documents' && editingCustomer && (
            <>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handleUploadDocument(editingCustomer.id)}
              >
                <IconSymbol name="camera" size={24} color="#FFFFFF" />
                <ThemedText style={styles.uploadButtonText}>Belge Yukle</ThemedText>
              </TouchableOpacity>

              {customerDocuments.length === 0 ? (
                <View style={styles.emptyDocs}>
                  <IconSymbol name="file-document-outline" size={48} color={COLORS.neutral[300]} />
                  <ThemedText style={styles.emptyDocsText}>Henuz belge yuklenmemis</ThemedText>
                </View>
              ) : (
                customerDocuments.map((doc) => (
                  <View key={doc.id} style={styles.docItem}>
                    <IconSymbol name="file-document" size={24} color={COLORS.primary.main} />
                    <View style={styles.docInfo}>
                      <ThemedText style={styles.docName}>{doc.document_name}</ThemedText>
                      <ThemedText style={styles.docType}>
                        {DOCUMENT_TYPES.find(t => t.id === doc.document_type)?.name || doc.document_type}
                      </ThemedText>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteDocument(doc.id)}>
                      <IconSymbol name="trash-can-outline" size={20} color={COLORS.error.main} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === 'documents' && !editingCustomer && (
            <View style={styles.emptyDocs}>
              <IconSymbol name="information" size={48} color={COLORS.neutral[300]} />
              <ThemedText style={styles.emptyDocsText}>
                Belge yuklemek icin once musteriyi kaydedin
              </ThemedText>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {/* Country Code Picker Modal */}
      <Modal
        visible={showCountryCodePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryCodePicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <ThemedText style={styles.pickerTitle}>Ulke Kodu Sec</ThemedText>
              <TouchableOpacity onPress={() => setShowCountryCodePicker(false)}>
                <IconSymbol name="close" size={24} color={COLORS.light.text.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {countryCodes.map((cc) => (
                <TouchableOpacity
                  key={cc.code}
                  style={styles.pickerItem}
                  onPress={() => {
                    setFormData({ ...formData, phone_country_code: cc.code });
                    setShowCountryCodePicker(false);
                  }}
                >
                  <ThemedText style={styles.pickerFlag}>{cc.flag}</ThemedText>
                  <ThemedText style={styles.pickerCountry}>{cc.country}</ThemedText>
                  <ThemedText style={styles.pickerCode}>{cc.code}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
            placeholder="Musteri, vergi no, pasaport ara..."
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

      {/* Stats */}
      {!selectionMode && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{customers.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Toplam Musteri</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>
              {customers.filter(c => c.customer_type === 'corporate').length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Kurumsal</ThemedText>
          </View>
        </View>
      )}

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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary.main,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginTop: 2,
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
  corporateAvatar: {
    backgroundColor: COLORS.info.main,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  customerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  corporateBadge: {
    backgroundColor: COLORS.info.muted,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  corporateText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.info.main,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  statsContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.light.surfaceSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  statsValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary.main,
  },
  statsLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.light.text.tertiary,
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
  editButton: {
    backgroundColor: COLORS.primary.muted,
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary.main,
  },
  tabText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  activeTabText: {
    color: COLORS.primary.main,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
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
  typeSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.light.surfaceSecondary,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  typeOptionSelected: {
    backgroundColor: COLORS.primary.muted,
    borderColor: COLORS.primary.main,
  },
  typeText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.tertiary,
  },
  typeTextSelected: {
    color: COLORS.primary.main,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    gap: SPACING.xs,
  },
  countryCodeText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
  },
  phoneInput: {
    flex: 1,
  },
  copyAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.primary.muted,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  copyAddressText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary.main,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.primary.main,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  uploadButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: '#FFFFFF',
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  emptyDocs: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
  },
  emptyDocsText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.tertiary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  docType: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginTop: 2,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: COLORS.light.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  pickerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  pickerList: {
    padding: SPACING.base,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  pickerFlag: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  pickerCountry: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
  },
  pickerCode: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.tertiary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});
