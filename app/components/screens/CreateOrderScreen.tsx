import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, Modal, Animated, Dimensions, Alert, StatusBar, ActivityIndicator } from 'react-native';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedText from '../ThemedText';
import IconSymbol from '../ui/IconSymbol';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, fetchWithTimeout } from '../../../constants/Api';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../constants/Theme';

const { width } = Dimensions.get('window');

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
};

interface ExchangeRate {
  currency: string;
  rate: number;
  updated_at: string;
}

// Konum listesi
const LOCATIONS = [
  { id: 'IST', name: 'İstanbul' },
  { id: 'ANK', name: 'Ankara' },
  { id: 'IZM', name: 'İzmir' },
  { id: 'ANT', name: 'Antalya' },
  { id: 'BUR', name: 'Bursa' },
];

type CountryData = {
  [key: string]: string[];
};

// Ülke ve şehir verileri
const COUNTRIES_AND_CITIES: CountryData = {
  'Amerika Birleşik Devletleri': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
  'Polonya': ['Varşova', 'Krakow', 'Lodz', 'Wroclaw', 'Poznan', 'Gdansk', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice'],
  'Almanya': ['Berlin', 'Hamburg', 'Münih', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig'],
  'Fransa': ['Paris', 'Marsilya', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
  'İtalya': ['Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Cenova', 'Bologna', 'Floransa', 'Bari', 'Catania'],
  'İspanya': ['Madrid', 'Barselona', 'Valencia', 'Sevilla', 'Zaragoza', 'Malaga', 'Murcia', 'Palma', 'Bilbao', 'Alicante'],
  'İngiltere': ['Londra', 'Birmingham', 'Leeds', 'Glasgow', 'Sheffield', 'Manchester', 'Edinburgh', 'Liverpool', 'Bristol', 'Cardiff'],
  'Hollanda': ['Amsterdam', 'Rotterdam', 'Lahey', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda', 'Nijmegen'],
  'Belçika': ['Brüksel', 'Antwerp', 'Gent', 'Charleroi', 'Liege', 'Bruges', 'Namur', 'Leuven', 'Mons', 'Aalst'],
  'İsveç': ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping', 'Lund'],
  'Norveç': ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Drammen', 'Fredrikstad', 'Kristiansand', 'Sandnes', 'Tromsø', 'Sarpsborg'],
  'Danimarka': ['Kopenhag', 'Aarhus', 'Odense', 'Aalborg', 'Frederiksberg', 'Esbjerg', 'Gentofte', 'Gladsaxe', 'Randers', 'Kolding'],
  'Finlandiya': ['Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä', 'Lahti', 'Kuopio', 'Pori'],
  'Rusya': ['Moskova', 'St. Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Nizhny Novgorod', 'Samara', 'Omsk', 'Rostov-on-Don', 'Ufa'],
  'Ukrayna': ['Kiev', 'Harkov', 'Odessa', 'Dnipro', 'Donetsk', 'Lviv', 'Zaporijya', 'Mariupol', 'Mykolaiv', 'Vinnitsa'],
  'Çek Cumhuriyeti': ['Prag', 'Brno', 'Ostrava', 'Plzen', 'Liberec', 'Olomouc', 'České Budějovice', 'Hradec Králové', 'Ústí nad Labem', 'Pardubice'],
  'Avusturya': ['Viyana', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten', 'Dornbirn'],
  'İsviçre': ['Zürih', 'Cenevre', 'Basel', 'Bern', 'Lozan', 'Winterthur', 'St. Gallen', 'Lugano', 'Biel', 'Thun'],
  'Portekiz': ['Lizbon', 'Porto', 'Vila Nova de Gaia', 'Amadora', 'Braga', 'Coimbra', 'Funchal', 'Setúbal', 'Agualva-Cacém', 'Queluz'],
  'Yunanistan': ['Atina', 'Selanik', 'Patras', 'Heraklion', 'Larissa', 'Volos', 'Rhodes', 'Ioannina', 'Chania', 'Chalcis'],
  'Macaristan': ['Budapeşte', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs', 'Győr', 'Nyíregyháza', 'Kecskemét', 'Székesfehérvár', 'Szombathely'],
  'Romanya': ['Bükreş', 'Cluj-Napoca', 'Timişoara', 'Iaşi', 'Constanţa', 'Craiova', 'Galaţi', 'Braşov', 'Ploieşti', 'Oradea'],
  'Bulgaristan': ['Sofya', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora', 'Pleven', 'Sliven', 'Dobrich', 'Shumen'],
  'Hırvatistan': ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Zadar', 'Pula', 'Slavonski Brod', 'Karlovac', 'Varaždin', 'Šibenik'],
  'Sırbistan': ['Belgrad', 'Novi Sad', 'Niş', 'Kragujevac', 'Subotica', 'Zrenjanin', 'Pančevo', 'Čačak', 'Kraljevo', 'Smederevo']
};

// Ürün tipleri için interface
interface Product {
  id: string;
  name: string;
  quantity: string;
  size: string;
  price: string;
  cost: string;
  notes: string;
}

type Coordinates = {
  latitude: number;
  longitude: number;
};

type CoordinatesMap = {
  [key: string]: Coordinates;
};

// Koordinat verileri
const COORDINATES: CoordinatesMap = {
  'İstanbul': { latitude: 41.0082, longitude: 28.9784 },
  'Amerika Birleşik Devletleri': { latitude: 37.0902, longitude: -95.7129 },
  'Polonya': { latitude: 51.9194, longitude: 19.1451 },
  'Almanya': { latitude: 51.1657, longitude: 10.4515 },
  'Fransa': { latitude: 46.2276, longitude: 2.2137 },
  'İtalya': { latitude: 41.8719, longitude: 12.5674 },
  'İspanya': { latitude: 40.4637, longitude: -3.7492 },
  'İngiltere': { latitude: 55.3781, longitude: -3.4360 },
  'Hollanda': { latitude: 52.1326, longitude: 5.2913 },
  'Belçika': { latitude: 50.8503, longitude: 4.3517 },
  'İsveç': { latitude: 60.1282, longitude: 18.6435 },
  'Norveç': { latitude: 60.4720, longitude: 8.4689 },
  'Danimarka': { latitude: 56.2639, longitude: 9.5018 },
  'Finlandiya': { latitude: 61.9241, longitude: 25.7482 },
  'Rusya': { latitude: 61.5240, longitude: 105.3188 },
  'Ukrayna': { latitude: 48.3794, longitude: 31.1656 },
  'Çek Cumhuriyeti': { latitude: 49.8175, longitude: 15.4730 },
  'Avusturya': { latitude: 47.5162, longitude: 14.5501 },
  'İsviçre': { latitude: 46.8182, longitude: 8.2275 },
  'Portekiz': { latitude: 39.3999, longitude: -8.2245 },
  'Yunanistan': { latitude: 39.0742, longitude: 21.8243 },
  'Macaristan': { latitude: 47.1625, longitude: 19.5033 },
  'Romanya': { latitude: 45.9432, longitude: 24.9668 },
  'Bulgaristan': { latitude: 42.7339, longitude: 25.4858 },
  'Hırvatistan': { latitude: 45.1000, longitude: 15.2000 },
  'Sırbistan': { latitude: 44.0165, longitude: 21.0059 }
};

// Mesafe hesaplama fonksiyonu
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Dünya'nın yarıçapı (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
};

// Kavisli rota koordinatları oluşturma fonksiyonu
const createCurvedPath = (startCoords: Coordinates, endCoords: Coordinates) => {
  const midPoint = {
    latitude: (startCoords.latitude + endCoords.latitude) / 2,
    longitude: (startCoords.longitude + endCoords.longitude) / 2,
  };
  
  // Kavis için kontrol noktası
  const controlPoint = {
    latitude: midPoint.latitude + (Math.random() * 10 - 5),
    longitude: midPoint.longitude + (Math.random() * 10 - 5),
  };

  const path = [];
  for (let t = 0; t <= 1; t += 0.01) {
    const lat = Math.pow(1-t, 2) * startCoords.latitude + 
                2 * (1-t) * t * controlPoint.latitude + 
                Math.pow(t, 2) * endCoords.latitude;
    
    const lng = Math.pow(1-t, 2) * startCoords.longitude + 
                2 * (1-t) * t * controlPoint.longitude + 
                Math.pow(t, 2) * endCoords.longitude;
    
    path.push({
      latitude: lat,
      longitude: lng,
    });
  }
  return path;
};

// Sipariş kaydetme fonksiyonu
const saveOrder = async (orderData: any) => {
  try {
    const response = await fetchWithTimeout(API_ENDPOINTS.orders, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error('Sipariş kaydedilemedi');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API hatası:', error);
    throw error;
  }
};

export default function CreateOrderScreen() {
  const insets = useSafeAreaInsets();
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    orderNo: '',
    location: 'İstanbul',
    customerInfo: {
      nameSurname: '',
      address: '',
      state: '',
      zipCode: '',
      country: '',
      city: '',
      phone: '',
      cell: '',
      email: '',
    },
    shipping: {
      type: 'IMMEDIATE',
      salesman: '',
      conference: '',
      cruise: '',
      agency: '',
      guide: '',
      pax: '',
    },
    products: [{
      id: Date.now().toString(),
      name: '',
      quantity: '',
      size: '',
      price: '',
      cost: '',
      notes: '',
    }] as Product[],
  });

  const availableCities = useMemo(() => {
    return formData.customerInfo.country ? COUNTRIES_AND_CITIES[formData.customerInfo.country] : [];
  }, [formData.customerInfo.country]);

  // Döviz kurlarını çek
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  // Ülke değiştiğinde telefon kodunu otomatik ayarla
  useEffect(() => {
    if (formData.customerInfo.country) {
      const phoneCode = COUNTRY_PHONE_CODES[formData.customerInfo.country] || '';
      if (phoneCode && !formData.customerInfo.phone.startsWith(phoneCode)) {
        setFormData(prev => ({
          ...prev,
          customerInfo: {
            ...prev.customerInfo,
            phone: phoneCode + ' '
          }
        }));
      }
    }
  }, [formData.customerInfo.country]);

  const fetchExchangeRates = async () => {
    setIsLoadingRates(true);
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.exchangeRates, {}, 10000);
      const data = await response.json();
      setExchangeRates(data);
    } catch (error) {
      console.error('Döviz kurları alınamadı:', error);
      // Varsayılan kurlar
      setExchangeRates([
        { currency: 'TRY', rate: 32.50, updated_at: new Date().toISOString() },
        { currency: 'EUR', rate: 0.92, updated_at: new Date().toISOString() },
        { currency: 'GBP', rate: 0.79, updated_at: new Date().toISOString() },
      ]);
    } finally {
      setIsLoadingRates(false);
    }
  };

  // USD'den seçili para birimine çevir
  const convertFromUSD = (usdAmount: number, toCurrency: string): number => {
    if (toCurrency === 'USD') return usdAmount;
    const rate = exchangeRates.find(r => r.currency === toCurrency);
    if (!rate) return usdAmount;
    return usdAmount * rate.rate;
  };

  // Seçili para biriminden USD'ye çevir
  const convertToUSD = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === 'USD') return amount;
    const rate = exchangeRates.find(r => r.currency === fromCurrency);
    if (!rate) return amount;
    return amount / rate.rate;
  };

  // Para birimi sembolünü al
  const getCurrencySymbol = (code: string): string => {
    const currency = CURRENCIES.find(c => c.code === code);
    return currency?.symbol || code;
  };

  const renderPicker = (title: string, items: string[], selectedValue: string, onSelect: (value: string) => void, onClose: () => void) => (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>{title}</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalItem,
                  selectedValue === item && styles.modalItemSelected
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <ThemedText style={[
                  styles.modalItemText,
                  selectedValue === item && styles.modalItemTextSelected
                ]}>{item}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderInput = (label: string, value: string, onChangeText: (text: string) => void, props = {}) => (
    <View style={styles.inputContainer}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#999"
        {...props}
      />
    </View>
  );

  const renderSelectInput = (label: string, value: string, onPress: () => void) => (
    <View style={styles.inputContainer}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TouchableOpacity style={styles.selectInput} onPress={onPress}>
        <ThemedText style={styles.selectInputText}>{value || `Seçiniz...`}</ThemedText>
        <IconSymbol name="chevron-down" size={24} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const handleSave = () => {
    setShowOverview(true);
  };

  const handleConfirmOrder = async () => {
    try {
      // Siparişi API'ye gönder
      const result = await saveOrder(formData);
      console.log('Sipariş başarıyla kaydedildi:', result);
      
      // Başarılı mesajını göster
      Alert.alert(
        'Başarılı',
        'Sipariş başarıyla oluşturuldu ve kaydedildi.',
        [{ text: 'Tamam' }]
      );
      
      // Modal'ı kapat
      setShowOverview(false);

      // Form verilerini sıfırla
      setFormData({
        date: new Date().toISOString().split('T')[0],
        orderNo: '',
        location: 'İstanbul',
        customerInfo: {
          nameSurname: '',
          address: '',
          state: '',
          zipCode: '',
          country: '',
          city: '',
          phone: '',
          cell: '',
          email: '',
        },
        shipping: {
          type: 'IMMEDIATE',
          salesman: '',
          conference: '',
          cruise: '',
          agency: '',
          guide: '',
          pax: '',
        },
        products: [{
          id: Date.now().toString(),
          name: '',
          quantity: '',
          size: '',
          price: '',
          cost: '',
          notes: '',
        }],
      });
    } catch (error) {
      console.error('Sipariş kaydedilirken hata oluştu:', error);
      Alert.alert(
        'Hata',
        'Sipariş kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.',
        [{ text: 'Tamam' }]
      );
    }
  };

  const renderFormSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  // Yeni ürün ekleme fonksiyonu
  const handleAddProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: '',
      quantity: '',
      size: '',
      price: '',
      cost: '',
      notes: '',
    };
    setFormData({
      ...formData,
      products: [...formData.products, newProduct],
    });
  };

  // Ürün silme fonksiyonu
  const handleRemoveProduct = (productId: string) => {
    setFormData({
      ...formData,
      products: formData.products.filter(p => p.id !== productId),
    });
  };

  // Ürün güncelleme fonksiyonu
  const handleUpdateProduct = (productId: string, field: keyof Product, value: string) => {
    setFormData({
      ...formData,
      products: formData.products.map(p =>
        p.id === productId ? { ...p, [field]: value } : p
      ),
    });
  };

  // Ürün kartı bileşeni
  const renderProductCard = (product: Product, index: number) => (
    <View key={product.id} style={styles.productCard}>
      <View style={styles.productHeader}>
        <ThemedText style={styles.productTitle}>Ürün {index + 1}</ThemedText>
        {index > 0 && (
          <TouchableOpacity
            onPress={() => handleRemoveProduct(product.id)}
            style={styles.removeButton}
          >
            <IconSymbol name="close" size={24} color="#ff4444" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.productFields}>
        <View style={styles.productField}>
          <ThemedText style={styles.fieldLabel}>Ürün Adı</ThemedText>
          <TextInput
            style={styles.fieldInput}
            value={product.name}
            onChangeText={(text) => handleUpdateProduct(product.id, 'name', text)}
            placeholder="Ürün adını girin"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.productField, { flex: 1, marginRight: 8 }]}>
            <ThemedText style={styles.fieldLabel}>Adet</ThemedText>
            <TextInput
              style={styles.fieldInput}
              value={product.quantity}
              onChangeText={(text) => handleUpdateProduct(product.id, 'quantity', text)}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          <View style={[styles.productField, { flex: 1, marginLeft: 8 }]}>
            <ThemedText style={styles.fieldLabel}>Boyut</ThemedText>
            <TextInput
              style={styles.fieldInput}
              value={product.size}
              onChangeText={(text) => handleUpdateProduct(product.id, 'size', text)}
              placeholder="Örn: 80x150"
            />
          </View>
        </View>

        <View style={styles.productField}>
          <ThemedText style={styles.fieldLabel}>Fiyat</ThemedText>
          <TextInput
            style={styles.fieldInput}
            value={product.price}
            onChangeText={(text) => handleUpdateProduct(product.id, 'price', text)}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>

        <View style={styles.productField}>
          <ThemedText style={styles.fieldLabel}>Maliyet</ThemedText>
          <TextInput
            style={styles.fieldInput}
            value={product.cost}
            onChangeText={(text) => handleUpdateProduct(product.id, 'cost', text)}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
        </View>

        <View style={styles.productField}>
          <ThemedText style={styles.fieldLabel}>Notlar</ThemedText>
          <TextInput
            style={[styles.fieldInput, styles.textArea]}
            value={product.notes}
            onChangeText={(text) => handleUpdateProduct(product.id, 'notes', text)}
            multiline
            numberOfLines={3}
            placeholder="Ürün hakkında ek bilgiler..."
          />
        </View>
      </View>
    </View>
  );

  const renderOverviewModal = () => {
    const sourceCoords = COORDINATES['İstanbul'];
    const destCoords = COORDINATES[formData.customerInfo.country];
    const distance = destCoords ? calculateDistance(
      sourceCoords.latitude,
      sourceCoords.longitude,
      destCoords.latitude,
      destCoords.longitude
    ) : 0;

    // Sabit rota koordinatlarını useMemo ile oluştur
    const pathCoordinates = useMemo(() => {
      if (!destCoords) return [];
      
      const midPoint = {
        latitude: (sourceCoords.latitude + destCoords.latitude) / 2,
        longitude: (sourceCoords.longitude + destCoords.longitude) / 2,
      };
      
      // Sabit bir kontrol noktası kullan
      const controlPoint = {
        latitude: midPoint.latitude + 3,
        longitude: midPoint.longitude,
      };

      const path = [];
      for (let t = 0; t <= 1; t += 0.01) {
        const lat = Math.pow(1-t, 2) * sourceCoords.latitude + 
                    2 * (1-t) * t * controlPoint.latitude + 
                    Math.pow(t, 2) * destCoords.latitude;
        
        const lng = Math.pow(1-t, 2) * sourceCoords.longitude + 
                    2 * (1-t) * t * controlPoint.longitude + 
                    Math.pow(t, 2) * destCoords.longitude;
        
        path.push({
          latitude: lat,
          longitude: lng,
        });
      }
      return path;
    }, [destCoords]);

    const [markerIndex, setMarkerIndex] = useState(0);

    useEffect(() => {
      if (showOverview && destCoords && pathCoordinates.length > 0) {
        const interval = setInterval(() => {
          setMarkerIndex((current) => {
            if (current >= pathCoordinates.length - 1) return 0;
            return current + 1;
          });
        }, 100); // Hızı biraz yavaşlattım

        return () => clearInterval(interval);
      }
    }, [showOverview, destCoords, pathCoordinates.length]);

    return (
      <Modal
        visible={showOverview}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.overviewOverlay}>
          <View style={styles.overviewContent}>
            <View style={styles.overviewHeader}>
              <ThemedText style={styles.overviewTitle}>Sipariş Önizleme</ThemedText>
              <TouchableOpacity onPress={() => setShowOverview(false)}>
                <IconSymbol name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.overviewScroll}>
              {/* Harita Bölümü */}
              <View style={styles.overviewSection}>
                <View style={styles.overviewSectionHeader}>
                  <IconSymbol name="map-marker-distance" size={20} color="#00b51a" />
                  <ThemedText style={styles.overviewSectionTitle}>
                    Teslimat Rotası ({distance} km)
                  </ThemedText>
                </View>
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: (sourceCoords.latitude + (destCoords?.latitude || sourceCoords.latitude)) / 2,
                      longitude: (sourceCoords.longitude + (destCoords?.longitude || sourceCoords.longitude)) / 2,
                      latitudeDelta: 40,
                      longitudeDelta: 40,
                    }}
                    mapType="hybrid"
                  >
                    {/* Sabit rota çizgisi */}
                    {destCoords && (
                      <Polyline
                        coordinates={pathCoordinates}
                        strokeColor="#00b51a"
                        strokeWidth={3}
                        lineDashPattern={[5, 5]}
                      />
                    )}

                    {/* Başlangıç noktası */}
                    <Marker
                      coordinate={sourceCoords}
                      title="İstanbul"
                    >
                      <View style={styles.markerContainer}>
                        <IconSymbol name="home" size={24} color="#00b51a" />
                      </View>
                    </Marker>

                    {/* Hedef noktası */}
                    {destCoords && (
                      <Marker
                        coordinate={destCoords}
                        title={formData.customerInfo.country}
                      >
                        <View style={styles.markerContainer}>
                          <IconSymbol name="map-marker" size={24} color="#ff4444" />
                        </View>
                      </Marker>
                    )}

                    {/* Hareketli sipariş ikonu */}
                    {destCoords && pathCoordinates.length > 0 && (
                      <Marker
                        coordinate={pathCoordinates[markerIndex]}
                      >
                        <View style={styles.movingMarker}>
                          <IconSymbol name="package-variant" size={24} color="#00b51a" />
                        </View>
                      </Marker>
                    )}
                  </MapView>
                </View>
              </View>

              {/* Temel Bilgiler */}
              <View style={styles.overviewSection}>
                <View style={styles.overviewSectionHeader}>
                  <IconSymbol name="information" size={20} color="#00b51a" />
                  <ThemedText style={styles.overviewSectionTitle}>Temel Bilgiler</ThemedText>
                </View>
                <View style={styles.overviewDetails}>
                  <View style={styles.overviewRow}>
                    <ThemedText style={styles.overviewLabel}>Tarih:</ThemedText>
                    <ThemedText style={styles.overviewValue}>{formData.date}</ThemedText>
                  </View>
                  <View style={styles.overviewRow}>
                    <ThemedText style={styles.overviewLabel}>Sipariş No:</ThemedText>
                    <ThemedText style={styles.overviewValue}>{formData.orderNo}</ThemedText>
                  </View>
                  <View style={styles.overviewRow}>
                    <ThemedText style={styles.overviewLabel}>Konum:</ThemedText>
                    <ThemedText style={styles.overviewValue}>{formData.location}</ThemedText>
                  </View>
                </View>
              </View>

              {/* Müşteri Bilgileri */}
              <View style={styles.overviewSection}>
                <View style={styles.overviewSectionHeader}>
                  <IconSymbol name="account" size={20} color="#00b51a" />
                  <ThemedText style={styles.overviewSectionTitle}>Müşteri Bilgileri</ThemedText>
                </View>
                <View style={styles.overviewDetails}>
                  <View style={styles.overviewRow}>
                    <ThemedText style={styles.overviewLabel}>Ad Soyad:</ThemedText>
                    <ThemedText style={styles.overviewValue}>{formData.customerInfo.nameSurname}</ThemedText>
                  </View>
                  <View style={styles.overviewRow}>
                    <ThemedText style={styles.overviewLabel}>Adres:</ThemedText>
                    <ThemedText style={styles.overviewValue}>{formData.customerInfo.address}</ThemedText>
                  </View>
                  <View style={styles.overviewRow}>
                    <ThemedText style={styles.overviewLabel}>Ülke/Şehir:</ThemedText>
                    <ThemedText style={styles.overviewValue}>
                      {formData.customerInfo.country} / {formData.customerInfo.city}
                    </ThemedText>
                  </View>
                  <View style={styles.overviewRow}>
                    <ThemedText style={styles.overviewLabel}>Telefon:</ThemedText>
                    <ThemedText style={styles.overviewValue}>{formData.customerInfo.phone}</ThemedText>
                  </View>
                  <View style={styles.overviewRow}>
                    <ThemedText style={styles.overviewLabel}>E-posta:</ThemedText>
                    <ThemedText style={styles.overviewValue}>{formData.customerInfo.email}</ThemedText>
                  </View>
                </View>
              </View>

              {/* Sevkiyat Bilgileri */}
              <View style={styles.overviewSection}>
                <View style={styles.overviewSectionHeader}>
                  <IconSymbol name="truck-delivery" size={20} color="#00b51a" />
                  <ThemedText style={styles.overviewSectionTitle}>Sevkiyat Bilgileri</ThemedText>
                </View>
                <View style={styles.overviewDetails}>
                  <View style={styles.overviewRow}>
                    <ThemedText style={styles.overviewLabel}>Satış Temsilcisi:</ThemedText>
                    <ThemedText style={styles.overviewValue}>{formData.shipping.salesman}</ThemedText>
                  </View>
                  <View style={styles.overviewRow}>
                    <ThemedText style={styles.overviewLabel}>Konferans:</ThemedText>
                    <ThemedText style={styles.overviewValue}>{formData.shipping.conference}</ThemedText>
                  </View>
                  <View style={styles.overviewRow}>
                    <ThemedText style={styles.overviewLabel}>Acenta:</ThemedText>
                    <ThemedText style={styles.overviewValue}>{formData.shipping.agency}</ThemedText>
                  </View>
                  <View style={styles.overviewRow}>
                    <ThemedText style={styles.overviewLabel}>Rehber:</ThemedText>
                    <ThemedText style={styles.overviewValue}>{formData.shipping.guide}</ThemedText>
                  </View>
                </View>
              </View>

              {/* Ürün Bilgileri */}
              <View style={styles.overviewSection}>
                <View style={styles.overviewSectionHeader}>
                  <IconSymbol name="package-variant" size={20} color="#00b51a" />
                  <ThemedText style={styles.overviewSectionTitle}>Ürün Bilgileri</ThemedText>
                </View>
                {formData.products.map((product, index) => (
                  <View key={product.id} style={styles.overviewProductCard}>
                    <View style={styles.overviewProductHeader}>
                      <ThemedText style={styles.overviewProductTitle}>Ürün {index + 1}</ThemedText>
                    </View>
                    <View style={styles.overviewDetails}>
                      <View style={styles.overviewRow}>
                        <ThemedText style={styles.overviewLabel}>Ürün Adı:</ThemedText>
                        <ThemedText style={styles.overviewValue}>{product.name}</ThemedText>
                      </View>
                      <View style={styles.overviewRow}>
                        <ThemedText style={styles.overviewLabel}>Adet:</ThemedText>
                        <ThemedText style={styles.overviewValue}>{product.quantity}</ThemedText>
                      </View>
                      <View style={styles.overviewRow}>
                        <ThemedText style={styles.overviewLabel}>Boyut:</ThemedText>
                        <ThemedText style={styles.overviewValue}>{product.size}</ThemedText>
                      </View>
                      <View style={styles.overviewRow}>
                        <ThemedText style={styles.overviewLabel}>Fiyat:</ThemedText>
                        <ThemedText style={styles.overviewValue}>{product.price} USD</ThemedText>
                      </View>
                      <View style={styles.overviewRow}>
                        <ThemedText style={styles.overviewLabel}>Maliyet:</ThemedText>
                        <ThemedText style={styles.overviewValue}>{product.cost} USD</ThemedText>
                      </View>
                      {product.notes && (
                        <View style={styles.overviewRow}>
                          <ThemedText style={styles.overviewLabel}>Notlar:</ThemedText>
                          <ThemedText style={styles.overviewValue}>{product.notes}</ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.overviewActions}>
              <TouchableOpacity 
                style={[styles.overviewButton, styles.overviewCancelButton]} 
                onPress={() => setShowOverview(false)}
              >
                <ThemedText style={styles.overviewButtonText}>İptal</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.overviewButton, styles.overviewConfirmButton]}
                onPress={handleConfirmOrder}
              >
                <ThemedText style={[styles.overviewButtonText, styles.overviewConfirmText]}>
                  Siparişi Onayla
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Başlık */}
        <View style={styles.header}>
          <LinearGradient
            colors={COLORS.gradients.primary as [string, string]}
            style={styles.headerIconBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <IconSymbol name="file-document-edit" size={22} color="#fff" />
          </LinearGradient>
          <ThemedText style={styles.headerTitle}>Yeni Sipariş Oluştur</ThemedText>
        </View>

        {/* Döviz Kurları */}
        <View style={styles.exchangeRateSection}>
          <View style={styles.exchangeRateHeader}>
            <IconSymbol name="currency-usd" size={20} color={COLORS.primary.main} />
            <ThemedText style={styles.exchangeRateTitle}>Güncel Döviz Kurları</ThemedText>
            <TouchableOpacity onPress={fetchExchangeRates} style={styles.refreshButton}>
              <IconSymbol name="refresh" size={18} color={COLORS.primary.accent} />
            </TouchableOpacity>
          </View>
          {isLoadingRates ? (
            <ActivityIndicator size="small" color={COLORS.primary.main} />
          ) : (
            <View style={styles.exchangeRateList}>
              {exchangeRates.map((rate) => (
                <View key={rate.currency} style={styles.exchangeRateItem}>
                  <ThemedText style={styles.exchangeRateCurrency}>{rate.currency}</ThemedText>
                  <ThemedText style={styles.exchangeRateValue}>
                    1 USD = {rate.rate.toFixed(2)} {rate.currency}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Temel Bilgiler */}
        {renderFormSection('Temel Bilgiler', (
          <>
            {renderInput('Tarih', formData.date,
              (text) => setFormData({ ...formData, date: text }), { placeholder: 'GG/AA/YYYY' })}
            {renderInput('Sipariş No', formData.orderNo,
              (text) => setFormData({ ...formData, orderNo: text }), { placeholder: 'Örn: 100926' })}
            {renderSelectInput('Konum', formData.location, () => setShowLocationPicker(true))}

            {/* Para Birimi Seçici */}
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Para Birimi</ThemedText>
              <TouchableOpacity
                style={styles.currencySelector}
                onPress={() => setShowCurrencyPicker(true)}
              >
                <ThemedText style={styles.currencyText}>
                  {getCurrencySymbol(selectedCurrency)} {selectedCurrency}
                </ThemedText>
                <IconSymbol name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </>
        ))}

        {/* Müşteri Bilgileri */}
        {renderFormSection('Müşteri Bilgileri', (
          <>
            {renderInput('Ad Soyad', formData.customerInfo.nameSurname,
              (text) => setFormData({ ...formData, customerInfo: { ...formData.customerInfo, nameSurname: text } }))}
            {renderInput('Adres', formData.customerInfo.address,
              (text) => setFormData({ ...formData, customerInfo: { ...formData.customerInfo, address: text } }),
              { multiline: true, numberOfLines: 2 })}
            {renderInput('Posta Kodu', formData.customerInfo.zipCode,
              (text) => setFormData({ ...formData, customerInfo: { ...formData.customerInfo, zipCode: text } }))}
            {renderSelectInput('Ülke', formData.customerInfo.country, () => setShowCountryPicker(true))}
            {renderSelectInput('Şehir', formData.customerInfo.city,
              () => formData.customerInfo.country && setShowCityPicker(true))}
            {renderInput('Telefon', formData.customerInfo.phone,
              (text) => setFormData({ ...formData, customerInfo: { ...formData.customerInfo, phone: text } }), 
              { keyboardType: 'phone-pad' })}
            {renderInput('E-posta', formData.customerInfo.email,
              (text) => setFormData({ ...formData, customerInfo: { ...formData.customerInfo, email: text } }),
              { keyboardType: 'email-address', autoCapitalize: 'none' })}
          </>
        ))}

        {/* Sevkiyat Bilgileri */}
        {renderFormSection('Sevkiyat Bilgileri', (
          <>
            {renderInput('Satış Temsilcisi', formData.shipping.salesman,
              (text) => setFormData({ ...formData, shipping: { ...formData.shipping, salesman: text } }))}
            {renderInput('Konferans', formData.shipping.conference,
              (text) => setFormData({ ...formData, shipping: { ...formData.shipping, conference: text } }))}
            {renderInput('Acenta', formData.shipping.agency,
              (text) => setFormData({ ...formData, shipping: { ...formData.shipping, agency: text } }))}
            {renderInput('Rehber', formData.shipping.guide,
              (text) => setFormData({ ...formData, shipping: { ...formData.shipping, guide: text } }))}
          </>
        ))}

        {/* Ürün Bilgileri */}
        {renderFormSection('Ürün Bilgileri', (
          <View>
            {formData.products.map((product, index) => renderProductCard(product, index))}
            
            <TouchableOpacity
              style={styles.addProductButton}
              onPress={handleAddProduct}
            >
              <IconSymbol name="plus-circle" size={24} color="#fff" />
              <ThemedText style={styles.addProductButtonText}>Yeni Ürün Ekle</ThemedText>
            </TouchableOpacity>
          </View>
        ))}

        {showLocationPicker && renderPicker(
          'Konum Seçin',
          LOCATIONS.map(loc => loc.name),
          formData.location,
          (value) => setFormData({ ...formData, location: value }),
          () => setShowLocationPicker(false)
        )}

        {showCountryPicker && renderPicker(
          'Ülke Seçin',
          Object.keys(COUNTRIES_AND_CITIES),
          formData.customerInfo.country,
          (value) => setFormData({
            ...formData,
            customerInfo: {
              ...formData.customerInfo,
              country: value,
              city: '' // Ülke değiştiğinde şehri sıfırla
            }
          }),
          () => setShowCountryPicker(false)
        )}

        {showCityPicker && renderPicker(
          'Şehir Seçin',
          availableCities,
          formData.customerInfo.city,
          (value) => setFormData({
            ...formData,
            customerInfo: {
              ...formData.customerInfo,
              city: value
            }
          }),
          () => setShowCityPicker(false)
        )}

        {showCurrencyPicker && (
          <Modal
            visible={true}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>Para Birimi Seçin</ThemedText>
                  <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                    <IconSymbol name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalList}>
                  {CURRENCIES.map((currency) => (
                    <TouchableOpacity
                      key={currency.code}
                      style={[
                        styles.modalItem,
                        selectedCurrency === currency.code && styles.modalItemSelected
                      ]}
                      onPress={() => {
                        setSelectedCurrency(currency.code);
                        setShowCurrencyPicker(false);
                      }}
                    >
                      <View style={styles.currencyItemContent}>
                        <ThemedText style={styles.currencySymbol}>{currency.symbol}</ThemedText>
                        <View>
                          <ThemedText style={[
                            styles.modalItemText,
                            selectedCurrency === currency.code && styles.modalItemTextSelected
                          ]}>{currency.code}</ThemedText>
                          <ThemedText style={styles.currencyName}>{currency.name}</ThemedText>
                        </View>
                      </View>
                      {selectedCurrency === currency.code && (
                        <IconSymbol name="check" size={20} color={COLORS.primary.main} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* Kaydet Butonu */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
          <LinearGradient
            colors={COLORS.gradients.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            <IconSymbol name="check-circle" size={22} color="#fff" />
            <ThemedText style={styles.saveButtonText}>Siparişi Kaydet</ThemedText>
          </LinearGradient>
        </TouchableOpacity>

        {renderOverviewModal()}

        {/* Bottom padding for navigation bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.light.surface,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
    marginLeft: SPACING.md,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
  },
  headerIconBg: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS['2xl'],
    marginHorizontal: SPACING.base,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  sectionHeader: {
    padding: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.divider,
    backgroundColor: COLORS.light.surfaceSecondary,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  sectionContent: {
    padding: SPACING.base,
  },
  inputContainer: {
    marginBottom: SPACING.base,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.secondary,
    marginBottom: SPACING.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.light.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
    backgroundColor: COLORS.light.surface,
  },
  saveButton: {
    margin: SPACING.base,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalList: {
    padding: 16,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalItemSelected: {
    backgroundColor: '#00b51a15',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalItemTextSelected: {
    color: '#00b51a',
    fontWeight: '600',
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  selectInputText: {
    fontSize: 16,
    color: '#333',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  removeButton: {
    padding: 4,
  },
  productFields: {
    padding: 12,
  },
  productField: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary.accent,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.sm,
    ...SHADOWS.sm,
  },
  addProductButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    marginLeft: SPACING.sm,
  },
  overviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  overviewContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  overviewScroll: {
    padding: 16,
  },
  overviewSection: {
    marginBottom: 20,
  },
  overviewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  overviewDetails: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  overviewRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  overviewLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  overviewValue: {
    flex: 2,
    fontSize: 14,
    color: '#333',
  },
  overviewProductCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  overviewProductHeader: {
    backgroundColor: '#00b51a15',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  overviewProductTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00b51a',
  },
  overviewActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'flex-end',
  },
  overviewButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginLeft: 12,
  },
  overviewCancelButton: {
    backgroundColor: '#f5f5f5',
  },
  overviewConfirmButton: {
    backgroundColor: '#00b51a',
  },
  overviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  overviewConfirmText: {
    color: '#fff',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00b51a',
  },
  movingMarker: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00b51a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Exchange Rate Styles
  exchangeRateSection: {
    backgroundColor: COLORS.light.surface,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  exchangeRateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  exchangeRateTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  refreshButton: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary.accent + '15',
  },
  exchangeRateList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  exchangeRateItem: {
    backgroundColor: COLORS.light.surfaceSecondary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  exchangeRateCurrency: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary.main,
  },
  exchangeRateValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.secondary,
  },
  // Currency Selector Styles
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: COLORS.light.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.light.surface,
  },
  currencyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  currencyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  currencySymbol: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary.main,
    width: 30,
    textAlign: 'center',
  },
  currencyName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
}); 