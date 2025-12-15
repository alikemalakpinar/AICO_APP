import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, Modal, Animated, Dimensions, Alert, StatusBar, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import ThemedText from '../ThemedText';
import IconSymbol from '../ui/IconSymbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, fetchWithTimeout, API_BASE_URL } from '../../../constants/Api';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../constants/Theme';

const { width, height } = Dimensions.get('window');

// Tablet/iPad detection
const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = height / width;
  return Math.min(width, height) >= 600 && aspectRatio < 1.6;
};

// Ödeme yöntemleri
const PAYMENT_METHODS = [
  { id: 'mastercard', name: 'Mastercard', icon: 'credit-card' },
  { id: 'maestro', name: 'Maestro', icon: 'credit-card-outline' },
  { id: 'visa', name: 'Visa', icon: 'credit-card' },
  { id: 'mailorder', name: 'Mail Order', icon: 'email-outline' },
  { id: 'installment', name: 'Taksit', icon: 'calendar-clock' },
  { id: 'cash', name: 'Nakit', icon: 'cash' },
];

// Para birimleri
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'ABD Doları' },
  { code: 'TRY', symbol: '₺', name: 'Türk Lirası' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'İngiliz Sterlini' },
];

// Ülke telefon kodları
const COUNTRY_PHONE_CODES: { [key: string]: string } = {
  'Amerika Birleşik Devletleri': '+1',
  'Polonya': '+48',
  'Almanya': '+49',
  'Fransa': '+33',
  'İtalya': '+39',
  'İspanya': '+34',
  'İngiltere': '+44',
  'Hollanda': '+31',
  'Belçika': '+32',
  'İsveç': '+46',
  'Norveç': '+47',
  'Danimarka': '+45',
  'Finlandiya': '+358',
  'Rusya': '+7',
  'Ukrayna': '+380',
  'Çek Cumhuriyeti': '+420',
  'Avusturya': '+43',
  'İsviçre': '+41',
  'Portekiz': '+351',
  'Yunanistan': '+30',
  'Macaristan': '+36',
  'Romanya': '+40',
  'Bulgaristan': '+359',
  'Hırvatistan': '+385',
  'Sırbistan': '+381',
  'Türkiye': '+90',
  'Japonya': '+81',
  'Çin': '+86',
  'Güney Kore': '+82',
  'Avustralya': '+61',
  'Kanada': '+1',
  'Meksika': '+52',
  'Brezilya': '+55',
  'Arjantin': '+54',
};

type CountryData = {
  [key: string]: { cities: string[]; states: string[] };
};

// Ülke, eyalet ve şehir verileri
const COUNTRIES_DATA: CountryData = {
  'Amerika Birleşik Devletleri': {
    states: ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'],
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
  },
  'Almanya': {
    states: ['Bayern', 'Baden-Württemberg', 'Nordrhein-Westfalen', 'Niedersachsen', 'Hessen'],
    cities: ['Berlin', 'Hamburg', 'Münih', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund'],
  },
  'İngiltere': {
    states: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    cities: ['Londra', 'Birmingham', 'Manchester', 'Leeds', 'Liverpool', 'Bristol', 'Edinburgh', 'Glasgow'],
  },
  'Fransa': {
    states: ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine'],
    cities: ['Paris', 'Marsilya', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Bordeaux', 'Lille'],
  },
  'Türkiye': {
    states: ['Marmara', 'Ege', 'Akdeniz', 'İç Anadolu', 'Karadeniz', 'Doğu Anadolu', 'Güneydoğu Anadolu'],
    cities: ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep'],
  },
  'İtalya': {
    states: ['Lombardia', 'Lazio', 'Campania', 'Sicilia', 'Veneto', 'Emilia-Romagna', 'Piemonte', 'Puglia'],
    cities: ['Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze'],
  },
  'İspanya': {
    states: ['Andalucía', 'Cataluña', 'Madrid', 'Valencia', 'Galicia', 'País Vasco'],
    cities: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Murcia', 'Bilbao'],
  },
  'Hollanda': {
    states: ['Noord-Holland', 'Zuid-Holland', 'Utrecht', 'Noord-Brabant', 'Gelderland'],
    cities: ['Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen'],
  },
  'Belçika': {
    states: ['Flanders', 'Wallonia', 'Brussels-Capital'],
    cities: ['Brüksel', 'Antwerp', 'Gent', 'Charleroi', 'Liège', 'Bruges'],
  },
  'Rusya': {
    states: ['Moscow Oblast', 'Saint Petersburg', 'Krasnodar Krai', 'Sverdlovsk Oblast'],
    cities: ['Moskova', 'St. Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan'],
  },
  'Japonya': {
    states: ['Kanto', 'Kansai', 'Chubu', 'Kyushu', 'Hokkaido'],
    cities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe'],
  },
  'Avustralya': {
    states: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia'],
    cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra', 'Gold Coast'],
  },
};

interface ExchangeRate {
  currency: string;
  rate: number;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  quantity: string;
  size: string;
  priceUSD: string;
  barcode: string;
  notes: string;
}

// Adım tanımları
const STEPS = [
  { id: 1, title: 'Temel Bilgiler', icon: 'information-outline' },
  { id: 2, title: 'Sevkiyat', icon: 'truck-delivery-outline' },
  { id: 3, title: 'Ürünler', icon: 'package-variant' },
  { id: 4, title: 'Müşteri', icon: 'account-outline' },
];

interface CreateOrderScreenProps {
  userBranchId?: number | null;
  userBranchName?: string;
  userRole?: string;
}

export default function CreateOrderScreen({ userBranchId, userBranchName, userRole }: CreateOrderScreenProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isTabletDevice = screenWidth >= 600;
  const [currentStep, setCurrentStep] = useState(1);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [passportImage, setPassportImage] = useState<string | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [formData, setFormData] = useState({
    // Temel Bilgiler
    date: new Date().toISOString().split('T')[0],
    orderNo: `ORD-${Date.now().toString().slice(-6)}`,
    branchId: null as number | null,
    branchName: '',

    // Sevkiyat Bilgileri
    shipping: {
      salesman: '',
      conference: '',
      cruise: '',
      agency: '',
      guide: '',
      pax: '',
    },

    // Ürün Bilgileri
    products: [{
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      quantity: '1',
      size: '',
      priceUSD: '',
      barcode: '',
      notes: '',
    }] as Product[],
    paymentMethod: '',

    // Müşteri Bilgileri
    customer: {
      nameSurname: '',
      email: '',
      phone: '',
      address: '',
      state: '',
      city: '',
      zipCode: '',
      country: '',
      passportNo: '',
      taxNo: '',
    },
  });

  // Yönetici rolleri - bu roller şube seçimi yapabilir
  const isAdminRole = userRole === 'Patron' || userRole === 'Operasyon Sorumlusu';

  useEffect(() => {
    fetchExchangeRates();
    fetchBranches();
  }, []);

  // Kullanıcı zaten bir şubeyle giriş yaptıysa otomatik şube seçimi yap
  useEffect(() => {
    if (userBranchId && !isAdminRole) {
      setFormData(prev => ({
        ...prev,
        branchId: userBranchId,
        branchName: userBranchName || ''
      }));
    }
  }, [userBranchId, userBranchName, isAdminRole]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep - 1) / (STEPS.length - 1),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Ülke değiştiğinde telefon kodunu otomatik ayarla
  useEffect(() => {
    if (formData.customer.country) {
      const phoneCode = COUNTRY_PHONE_CODES[formData.customer.country] || '';
      if (phoneCode && !formData.customer.phone.startsWith(phoneCode)) {
        setFormData(prev => ({
          ...prev,
          customer: { ...prev.customer, phone: phoneCode + ' ' }
        }));
      }
    }
  }, [formData.customer.country]);

  const fetchExchangeRates = async () => {
    setIsLoadingRates(true);
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.exchangeRates, {}, 10000);
      const data = await response.json();
      setExchangeRates(data);
    } catch (error) {
      setExchangeRates([
        { currency: 'TRY', rate: 32.50, updated_at: new Date().toISOString() },
        { currency: 'EUR', rate: 0.92, updated_at: new Date().toISOString() },
        { currency: 'GBP', rate: 0.79, updated_at: new Date().toISOString() },
      ]);
    } finally {
      setIsLoadingRates(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.branches);
      const data = await response.json();
      setBranches(data);
    } catch (error) {
      console.error('Şubeler alınamadı:', error);
    }
  };

  // USD'den seçili para birimine çevir
  const convertFromUSD = (usdAmount: number): string => {
    if (selectedCurrency === 'USD') return `$${usdAmount.toFixed(2)}`;
    const rate = exchangeRates.find(r => r.currency === selectedCurrency);
    if (!rate) return `$${usdAmount.toFixed(2)}`;
    const converted = usdAmount * rate.rate;
    const symbol = CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || selectedCurrency;
    return `${symbol}${converted.toFixed(2)}`;
  };

  // Toplam tutarı hesapla
  const calculateTotal = (): number => {
    return formData.products.reduce((sum, p) => {
      const qty = parseFloat(p.quantity) || 0;
      const price = parseFloat(p.priceUSD) || 0;
      return sum + (qty * price);
    }, 0);
  };

  // Barkod tarama
  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);

    const { data: barcodeData } = result;

    try {
      const response = await fetchWithTimeout(`${API_ENDPOINTS.products}?barcode=${barcodeData}`);
      const existingProducts = await response.json();

      if (existingProducts && existingProducts.length > 0) {
        const product = existingProducts[0];
        const newProduct: Product = {
          id: Date.now().toString(),
          name: product.name || '',
          quantity: '1',
          size: product.sizes || `${product.width}x${product.height}`,
          priceUSD: product.price_usd?.toString() || '',
          barcode: barcodeData,
          notes: '',
        };
        setFormData(prev => ({
          ...prev,
          products: [...prev.products.filter(p => p.name), newProduct]
        }));
        Alert.alert('Ürün Bulundu', `"${product.name}" eklendi.`);
      } else {
        Alert.alert('Yeni Barkod', 'Bu barkod sistemde kayıtlı değil.');
      }
    } catch (error) {
      console.error('Barkod arama hatası:', error);
    }

    setShowBarcodeScanner(false);
    setTimeout(() => setScanned(false), 1000);
  };

  const openBarcodeScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Kamera İzni Gerekli', 'Barkod taramak için kamera izni vermeniz gerekiyor.');
        return;
      }
    }
    setScanned(false);
    setShowBarcodeScanner(true);
  };

  // Pasaport fotoğrafı çek
  const takePassportPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Kamera İzni Gerekli', 'Fotoğraf çekmek için kamera izni vermeniz gerekiyor.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPassportImage(result.assets[0].uri);
    }
  };

  // Ürün ekleme/silme
  const addProduct = () => {
    const newProduct: Product = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      quantity: '1',
      size: '',
      priceUSD: '',
      barcode: '',
      notes: '',
    };
    setFormData(prev => ({ ...prev, products: [...prev.products, newProduct] }));
  };

  const removeProduct = (id: string) => {
    if (formData.products.length > 1) {
      setFormData(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id)
      }));
    }
  };

  const updateProduct = (id: string, field: keyof Product, value: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  // Sonraki adıma geç
  const nextStep = () => {
    // Step 1 validasyonu - şube seçilmiş olmalı
    // Satış kullanıcıları için userBranchId zaten var ise validasyonu atla
    const hasBranch = formData.branchId || (userBranchId && !isAdminRole);
    if (currentStep === 1 && !hasBranch) {
      Alert.alert('Uyarı', 'Lütfen devam etmeden önce bir şube seçin.');
      return;
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  // Önceki adıma dön
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Siparişi gönder
  const handleSubmit = async () => {
    try {
      // Satış kullanıcıları için branchId'yi userBranchId'den al
      const finalBranchId = formData.branchId || userBranchId;
      const finalBranchName = formData.branchName || userBranchName || '';

      const orderData = {
        ...formData,
        branchId: finalBranchId,
        branchName: finalBranchName,
        total: calculateTotal(),
        currency: selectedCurrency,
        passportImage,
        created_at: new Date().toISOString(),
      };

      const response = await fetchWithTimeout(API_ENDPOINTS.orders, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        Alert.alert('Başarılı', 'Sipariş başarıyla oluşturuldu!', [
          { text: 'Tamam', onPress: () => resetForm() }
        ]);
      } else {
        throw new Error('Sipariş kaydedilemedi');
      }
    } catch (error) {
      Alert.alert('Hata', 'Sipariş oluşturulurken bir hata oluştu.');
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    // Satış kullanıcıları için şube bilgisini koru
    const preservedBranchId = userBranchId && !isAdminRole ? userBranchId : null;
    const preservedBranchName = userBranchId && !isAdminRole ? (userBranchName || '') : '';

    setFormData({
      date: new Date().toISOString().split('T')[0],
      orderNo: `ORD-${Date.now().toString().slice(-6)}`,
      branchId: preservedBranchId,
      branchName: preservedBranchName,
      shipping: { salesman: '', conference: '', cruise: '', agency: '', guide: '', pax: '' },
      products: [{ id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name: '', quantity: '1', size: '', priceUSD: '', barcode: '', notes: '' }],
      paymentMethod: '',
      customer: { nameSurname: '', email: '', phone: '', address: '', state: '', city: '', zipCode: '', country: '', passportNo: '', taxNo: '' },
    });
    setPassportImage(null);
  };

  // Input renderer
  const renderInput = (label: string, value: string, onChange: (text: string) => void, props: any = {}) => (
    <View style={styles.inputContainer}>
      <ThemedText style={styles.inputLabel}>{label}</ThemedText>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholderTextColor={COLORS.neutral[400]}
        {...props}
      />
    </View>
  );

  // Select input renderer
  const renderSelect = (label: string, value: string, onPress: () => void, placeholder: string = 'Seçiniz...') => (
    <View style={styles.inputContainer}>
      <ThemedText style={styles.inputLabel}>{label}</ThemedText>
      <TouchableOpacity style={styles.selectInput} onPress={onPress}>
        <ThemedText style={value ? styles.selectText : styles.selectPlaceholder}>
          {value || placeholder}
        </ThemedText>
        <IconSymbol name="chevron-down" size={20} color={COLORS.neutral[500]} />
      </TouchableOpacity>
    </View>
  );

  // Step 1: Temel Bilgiler
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <IconSymbol name="information-outline" size={28} color={COLORS.primary.accent} />
        <View style={styles.stepHeaderText}>
          <ThemedText style={styles.stepTitle}>Temel Bilgiler</ThemedText>
          <ThemedText style={styles.stepSubtitle}>Sipariş temel bilgilerini girin</ThemedText>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Sipariş No</ThemedText>
          <ThemedText style={styles.infoValue}>{formData.orderNo}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Tarih</ThemedText>
          <ThemedText style={styles.infoValue}>{formData.date}</ThemedText>
        </View>
      </View>

      {/* Satış kullanıcıları için şube otomatik seçilir ve değiştirilemez */}
      {userBranchId && !isAdminRole ? (
        <View style={styles.inputContainer}>
          <ThemedText style={styles.inputLabel}>Şube</ThemedText>
          <View style={[styles.selectInput, { backgroundColor: COLORS.light.surfaceSecondary }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <IconSymbol name="store" size={20} color={COLORS.primary.accent} />
              <ThemedText style={styles.selectText}>{formData.branchName}</ThemedText>
            </View>
            <IconSymbol name="lock" size={16} color={COLORS.neutral[400]} />
          </View>
        </View>
      ) : (
        renderSelect('Şube', formData.branchName, () => setShowBranchPicker(true), 'Şube seçiniz...')
      )}

      {/* Döviz Kurları */}
      <View style={styles.exchangeCard}>
        <View style={styles.exchangeHeader}>
          <IconSymbol name="currency-usd" size={20} color={COLORS.secondary.gold} />
          <ThemedText style={styles.exchangeTitle}>Güncel Döviz Kurları</ThemedText>
          <TouchableOpacity onPress={fetchExchangeRates}>
            <IconSymbol name="refresh" size={18} color={COLORS.primary.accent} />
          </TouchableOpacity>
        </View>
        {isLoadingRates ? (
          <ActivityIndicator size="small" color={COLORS.primary.accent} />
        ) : (
          <View style={styles.exchangeList}>
            {exchangeRates.map((rate, index) => (
              <View key={`${rate.currency}-${index}`} style={styles.exchangeItem}>
                <ThemedText style={styles.exchangeCurrency}>{rate.currency}</ThemedText>
                <ThemedText style={styles.exchangeRate}>{rate.rate.toFixed(2)}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  // Step 2: Sevkiyat Bilgileri
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <IconSymbol name="truck-delivery-outline" size={28} color={COLORS.primary.accent} />
        <View style={styles.stepHeaderText}>
          <ThemedText style={styles.stepTitle}>Sevkiyat Bilgileri</ThemedText>
          <ThemedText style={styles.stepSubtitle}>Teslimat detaylarını girin</ThemedText>
        </View>
      </View>

      {renderInput('Satış Temsilcisi', formData.shipping.salesman,
        (text) => setFormData(prev => ({ ...prev, shipping: { ...prev.shipping, salesman: text } })),
        { placeholder: 'Temsilci adı' }
      )}
      {renderInput('Konferans', formData.shipping.conference,
        (text) => setFormData(prev => ({ ...prev, shipping: { ...prev.shipping, conference: text } })),
        { placeholder: 'Konferans bilgisi' }
      )}
      {renderInput('Cruise', formData.shipping.cruise,
        (text) => setFormData(prev => ({ ...prev, shipping: { ...prev.shipping, cruise: text } })),
        { placeholder: 'Cruise bilgisi' }
      )}
      {renderInput('Acenta', formData.shipping.agency,
        (text) => setFormData(prev => ({ ...prev, shipping: { ...prev.shipping, agency: text } })),
        { placeholder: 'Acenta adı' }
      )}
      {renderInput('Rehber', formData.shipping.guide,
        (text) => setFormData(prev => ({ ...prev, shipping: { ...prev.shipping, guide: text } })),
        { placeholder: 'Rehber adı' }
      )}
      {renderInput('PAX', formData.shipping.pax,
        (text) => setFormData(prev => ({ ...prev, shipping: { ...prev.shipping, pax: text } })),
        { placeholder: 'Yolcu sayısı', keyboardType: 'numeric' }
      )}
    </View>
  );

  // Step 3: Ürün Bilgileri
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <IconSymbol name="package-variant" size={28} color={COLORS.primary.accent} />
        <View style={styles.stepHeaderText}>
          <ThemedText style={styles.stepTitle}>Ürün Bilgileri</ThemedText>
          <ThemedText style={styles.stepSubtitle}>Siparişe ürün ekleyin</ThemedText>
        </View>
      </View>

      {/* Barkod Tarama Butonu */}
      <TouchableOpacity style={styles.scanButton} onPress={openBarcodeScanner}>
        <LinearGradient
          colors={COLORS.gradients.primary as [string, string]}
          style={styles.scanButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <IconSymbol name="barcode-scan" size={24} color="#FFF" />
          <ThemedText style={styles.scanButtonText}>Barkod Tara</ThemedText>
        </LinearGradient>
      </TouchableOpacity>

      {/* Ürün Listesi */}
      {formData.products.map((product, index) => (
        <View key={product.id} style={styles.productCard}>
          <View style={styles.productHeader}>
            <ThemedText style={styles.productTitle}>Ürün {index + 1}</ThemedText>
            {formData.products.length > 1 && (
              <TouchableOpacity onPress={() => removeProduct(product.id)}>
                <IconSymbol name="close-circle" size={22} color={COLORS.error.main} />
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            style={styles.productInput}
            value={product.name}
            onChangeText={(text) => updateProduct(product.id, 'name', text)}
            placeholder="Ürün adı"
            placeholderTextColor={COLORS.neutral[400]}
          />

          <View style={styles.productRow}>
            <TextInput
              style={[styles.productInput, styles.productInputHalf]}
              value={product.quantity}
              onChangeText={(text) => updateProduct(product.id, 'quantity', text)}
              placeholder="Adet"
              placeholderTextColor={COLORS.neutral[400]}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.productInput, styles.productInputHalf]}
              value={product.size}
              onChangeText={(text) => updateProduct(product.id, 'size', text)}
              placeholder="Boyut (örn: 200x300)"
              placeholderTextColor={COLORS.neutral[400]}
            />
          </View>

          <View style={styles.priceInputContainer}>
            <TextInput
              style={[styles.productInput, { flex: 1 }]}
              value={product.priceUSD}
              onChangeText={(text) => updateProduct(product.id, 'priceUSD', text)}
              placeholder="Fiyat (USD)"
              placeholderTextColor={COLORS.neutral[400]}
              keyboardType="decimal-pad"
            />
            {product.priceUSD && selectedCurrency !== 'USD' && (
              <View style={styles.convertedPrice}>
                <ThemedText style={styles.convertedPriceText}>
                  ≈ {convertFromUSD(parseFloat(product.priceUSD) || 0)}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      ))}

      {/* Ürün Ekle Butonu */}
      <TouchableOpacity style={styles.addProductBtn} onPress={addProduct}>
        <IconSymbol name="plus-circle" size={20} color={COLORS.primary.accent} />
        <ThemedText style={styles.addProductText}>Yeni Ürün Ekle</ThemedText>
      </TouchableOpacity>

      {/* Para Birimi Seçimi */}
      <View style={styles.currencySection}>
        <ThemedText style={styles.sectionLabel}>Ödeme Para Birimi</ThemedText>
        {renderSelect('', CURRENCIES.find(c => c.code === selectedCurrency)?.name || 'USD',
          () => setShowCurrencyPicker(true)
        )}
      </View>

      {/* Toplam */}
      <View style={styles.totalCard}>
        <ThemedText style={styles.totalLabel}>Toplam Tutar</ThemedText>
        <View style={styles.totalRow}>
          <ThemedText style={styles.totalUSD}>${calculateTotal().toFixed(2)}</ThemedText>
          {selectedCurrency !== 'USD' && (
            <ThemedText style={styles.totalConverted}>
              ≈ {convertFromUSD(calculateTotal())}
            </ThemedText>
          )}
        </View>
      </View>

      {/* Ödeme Yöntemi */}
      <ThemedText style={styles.sectionLabel}>Ödeme Yöntemi</ThemedText>
      <View style={styles.paymentMethods}>
        {PAYMENT_METHODS.map(method => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.paymentMethod,
              formData.paymentMethod === method.id && styles.paymentMethodSelected
            ]}
            onPress={() => setFormData(prev => ({ ...prev, paymentMethod: method.id }))}
          >
            <IconSymbol
              name={method.icon}
              size={20}
              color={formData.paymentMethod === method.id ? COLORS.primary.accent : COLORS.neutral[500]}
            />
            <ThemedText style={[
              styles.paymentMethodText,
              formData.paymentMethod === method.id && styles.paymentMethodTextSelected
            ]}>
              {method.name}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Step 4: Müşteri Bilgileri
  const renderStep4 = () => {
    const countryData = formData.customer.country ? COUNTRIES_DATA[formData.customer.country] : null;

    return (
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <IconSymbol name="account-outline" size={28} color={COLORS.primary.accent} />
          <View style={styles.stepHeaderText}>
            <ThemedText style={styles.stepTitle}>Müşteri Bilgileri</ThemedText>
            <ThemedText style={styles.stepSubtitle}>Müşteri detaylarını girin</ThemedText>
          </View>
        </View>

        {renderInput('Ad Soyad *', formData.customer.nameSurname,
          (text) => setFormData(prev => ({ ...prev, customer: { ...prev.customer, nameSurname: text } })),
          { placeholder: 'Müşteri adı soyadı' }
        )}

        {renderInput('E-posta', formData.customer.email,
          (text) => setFormData(prev => ({ ...prev, customer: { ...prev.customer, email: text } })),
          { placeholder: 'ornek@mail.com', keyboardType: 'email-address', autoCapitalize: 'none' }
        )}

        {renderSelect('Ülke *', formData.customer.country, () => setShowCountryPicker(true), 'Ülke seçiniz...')}

        {renderInput('Telefon *', formData.customer.phone,
          (text) => setFormData(prev => ({ ...prev, customer: { ...prev.customer, phone: text } })),
          { placeholder: 'Telefon numarası', keyboardType: 'phone-pad' }
        )}

        {renderInput('Adres *', formData.customer.address,
          (text) => setFormData(prev => ({ ...prev, customer: { ...prev.customer, address: text } })),
          { placeholder: 'Sokak, cadde, bina no...', multiline: true, numberOfLines: 2 }
        )}

        {renderSelect('Eyalet/Bölge', formData.customer.state,
          () => countryData && setShowStatePicker(true),
          'Eyalet seçiniz...'
        )}

        {renderSelect('Şehir', formData.customer.city,
          () => countryData && setShowCityPicker(true),
          'Şehir seçiniz...'
        )}

        {renderInput('Posta Kodu', formData.customer.zipCode,
          (text) => setFormData(prev => ({ ...prev, customer: { ...prev.customer, zipCode: text } })),
          { placeholder: 'Posta kodu' }
        )}

        {/* Pasaport ve Vergi Numarası */}
        <View style={styles.documentsSection}>
          <ThemedText style={styles.sectionTitle}>Belgeler</ThemedText>

          {renderInput('Pasaport No', formData.customer.passportNo,
            (text) => setFormData(prev => ({ ...prev, customer: { ...prev.customer, passportNo: text } })),
            { placeholder: 'Pasaport numarası', autoCapitalize: 'characters' }
          )}

          {renderInput('Vergi No', formData.customer.taxNo,
            (text) => setFormData(prev => ({ ...prev, customer: { ...prev.customer, taxNo: text } })),
            { placeholder: 'Vergi numarası' }
          )}

          {/* Pasaport Fotoğrafı */}
          <ThemedText style={styles.inputLabel}>Pasaport Fotoğrafı</ThemedText>
          <TouchableOpacity style={styles.passportPhotoBtn} onPress={takePassportPhoto}>
            {passportImage ? (
              <Image source={{ uri: passportImage }} style={styles.passportImage} />
            ) : (
              <View style={styles.passportPlaceholder}>
                <IconSymbol name="camera" size={32} color={COLORS.neutral[400]} />
                <ThemedText style={styles.passportPlaceholderText}>Fotoğraf Çek</ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Picker Modal
  const renderPickerModal = (
    visible: boolean,
    title: string,
    items: string[],
    selectedValue: string,
    onSelect: (value: string) => void,
    onClose: () => void
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>{title}</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol name="close" size={24} color={COLORS.neutral[600]} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={`${item}-${index}`}
                style={[styles.modalItem, selectedValue === item && styles.modalItemSelected]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <ThemedText style={[styles.modalItemText, selectedValue === item && styles.modalItemTextSelected]}>
                  {item}
                </ThemedText>
                {selectedValue === item && (
                  <IconSymbol name="check" size={20} color={COLORS.primary.accent} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Barkod Tarayıcı Modal
  const renderBarcodeScanner = () => (
    <Modal visible={showBarcodeScanner} animationType="slide">
      <View style={styles.scannerContainer}>
        <View style={styles.scannerHeader}>
          <TouchableOpacity style={styles.scannerClose} onPress={() => setShowBarcodeScanner(false)}>
            <IconSymbol name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <ThemedText style={styles.scannerTitle}>Barkod Tara</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <ThemedText style={styles.scannerHint}>Barkodu çerçeve içine hizalayın</ThemedText>
          </View>
        </CameraView>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Yeni Sipariş</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Adım {currentStep} / {STEPS.length}</ThemedText>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%']
              })}
            ]}
          />
        </View>
        <View style={styles.stepsIndicator}>
          {STEPS.map((step) => (
            <View key={`step-${step.id}`} style={styles.stepDot}>
              <View style={[
                styles.dot,
                currentStep >= step.id && styles.dotActive,
                currentStep === step.id && styles.dotCurrent
              ]}>
                {currentStep > step.id ? (
                  <IconSymbol name="check" size={12} color="#FFF" />
                ) : (
                  <ThemedText style={[styles.dotText, currentStep >= step.id && styles.dotTextActive]}>
                    {step.id}
                  </ThemedText>
                )}
              </View>
              <ThemedText style={[styles.stepLabel, currentStep === step.id && styles.stepLabelActive]}>
                {step.title}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 180,
          paddingHorizontal: isTabletDevice ? SPACING.xl : 0,
          maxWidth: isTabletDevice ? 800 : '100%',
          alignSelf: 'center',
          width: '100%'
        }}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {/* Navigation Buttons - Fixed at bottom */}
      <View style={[
        styles.navigation,
        {
          paddingBottom: Math.max(insets.bottom, 20) + 70,
          paddingHorizontal: isTabletDevice ? SPACING.xl : SPACING.base,
        }
      ]}>
        <View style={[
          styles.navigationInner,
          isTabletDevice && { maxWidth: 800, alignSelf: 'center', width: '100%' }
        ]}>
          {currentStep > 1 ? (
            <TouchableOpacity style={styles.backButton} onPress={prevStep}>
              <IconSymbol name="chevron-left" size={20} color={COLORS.primary.accent} />
              <ThemedText style={styles.backButtonText}>Geri</ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 80 }} />
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              isTabletDevice && { maxWidth: 300 }
            ]}
            onPress={nextStep}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={COLORS.gradients.primary as [string, string]}
              style={styles.nextButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <ThemedText style={[
                styles.nextButtonText,
                isTabletDevice && { fontSize: TYPOGRAPHY.fontSize.lg }
              ]}>
                {currentStep === STEPS.length ? 'Siparişi Tamamla' : 'Devam'}
              </ThemedText>
              <IconSymbol name={currentStep === STEPS.length ? 'check' : 'chevron-right'} size={22} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      {renderBarcodeScanner()}

      {renderPickerModal(
        showBranchPicker,
        'Şube Seçin',
        branches.map(b => b.name),
        formData.branchName,
        (value) => {
          const branch = branches.find(b => b.name === value);
          setFormData(prev => ({ ...prev, branchId: branch?.id, branchName: value }));
        },
        () => setShowBranchPicker(false)
      )}

      {renderPickerModal(
        showCountryPicker,
        'Ülke Seçin',
        Object.keys(COUNTRIES_DATA),
        formData.customer.country,
        (value) => setFormData(prev => ({
          ...prev,
          customer: { ...prev.customer, country: value, state: '', city: '' }
        })),
        () => setShowCountryPicker(false)
      )}

      {renderPickerModal(
        showStatePicker,
        'Eyalet Seçin',
        formData.customer.country ? COUNTRIES_DATA[formData.customer.country]?.states || [] : [],
        formData.customer.state,
        (value) => setFormData(prev => ({ ...prev, customer: { ...prev.customer, state: value } })),
        () => setShowStatePicker(false)
      )}

      {renderPickerModal(
        showCityPicker,
        'Şehir Seçin',
        formData.customer.country ? COUNTRIES_DATA[formData.customer.country]?.cities || [] : [],
        formData.customer.city,
        (value) => setFormData(prev => ({ ...prev, customer: { ...prev.customer, city: value } })),
        () => setShowCityPicker(false)
      )}

      {renderPickerModal(
        showCurrencyPicker,
        'Para Birimi Seçin',
        CURRENCIES.map(c => c.name),
        CURRENCIES.find(c => c.code === selectedCurrency)?.name || '',
        (value) => {
          const currency = CURRENCIES.find(c => c.name === value);
          if (currency) setSelectedCurrency(currency.code);
        },
        () => setShowCurrencyPicker(false)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  header: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginTop: SPACING.xs,
  },
  progressContainer: {
    backgroundColor: COLORS.light.surface,
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.light.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary.accent,
    borderRadius: 2,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  stepDot: {
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  dotActive: {
    backgroundColor: COLORS.primary.accent,
  },
  dotCurrent: {
    backgroundColor: COLORS.primary.accent,
    borderWidth: 3,
    borderColor: COLORS.primary.accentLight,
  },
  dotText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.neutral[500],
  },
  dotTextActive: {
    color: '#FFF',
  },
  stepLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.light.text.tertiary,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: COLORS.primary.accent,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: SPACING.base,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  stepHeaderText: {
    marginLeft: SPACING.md,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
  },
  stepSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginTop: SPACING.xs,
  },
  inputContainer: {
    marginBottom: SPACING.base,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.light.text.secondary,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.light.surface,
    borderWidth: 1.5,
    borderColor: COLORS.light.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.light.surface,
    borderWidth: 1.5,
    borderColor: COLORS.light.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  selectText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
  },
  selectPlaceholder: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.neutral[400],
  },
  infoCard: {
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  exchangeCard: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    marginTop: SPACING.md,
  },
  exchangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  exchangeTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
    marginLeft: SPACING.sm,
  },
  exchangeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  exchangeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light.surfaceSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    gap: SPACING.xs,
  },
  exchangeCurrency: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.secondary.gold,
  },
  exchangeRate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.secondary,
  },
  scanButton: {
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  scanButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: '#FFF',
  },
  productCard: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  productTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  productInput: {
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
    marginBottom: SPACING.sm,
  },
  productRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  productInputHalf: {
    flex: 1,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  convertedPrice: {
    backgroundColor: COLORS.secondary.gold + '20',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  convertedPriceText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.secondary.gold,
  },
  addProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary.accent,
    borderRadius: RADIUS.xl,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  addProductText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary.accent,
  },
  currencySection: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
    marginBottom: SPACING.sm,
  },
  totalCard: {
    backgroundColor: COLORS.primary.main,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.neutral[300],
    marginBottom: SPACING.xs,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.md,
  },
  totalUSD: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFF',
  },
  totalConverted: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.secondary.gold,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light.surface,
    borderWidth: 1.5,
    borderColor: COLORS.light.border,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  paymentMethodSelected: {
    borderColor: COLORS.primary.accent,
    backgroundColor: COLORS.primary.accent + '10',
  },
  paymentMethodText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.secondary,
  },
  paymentMethodTextSelected: {
    color: COLORS.primary.accent,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  documentsSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
    marginBottom: SPACING.md,
  },
  passportPhotoBtn: {
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.light.border,
  },
  passportImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  passportPlaceholder: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passportPlaceholderText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.neutral[400],
    marginTop: SPACING.sm,
  },
  navigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.light.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
    ...SHADOWS.lg,
  },
  navigationInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary.accent,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  nextButton: {
    flex: 1,
    marginLeft: SPACING.md,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    minHeight: 52,
    ...SHADOWS.md,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    minHeight: 52,
  },
  nextButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.light.surface,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  modalList: {
    padding: SPACING.md,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xs,
  },
  modalItemSelected: {
    backgroundColor: COLORS.primary.accent + '15',
  },
  modalItemText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
  },
  modalItemTextSelected: {
    color: COLORS.primary.accent,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: 60,
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.7)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scannerClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: '#FFF',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: width * 0.75,
    height: width * 0.5,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.primary.accent,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: RADIUS.lg,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: RADIUS.lg,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: RADIUS.lg,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: RADIUS.lg,
  },
  scannerHint: {
    marginTop: SPACING.xl,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: '#FFF',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
});
