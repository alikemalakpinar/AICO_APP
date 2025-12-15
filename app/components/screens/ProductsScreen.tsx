import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Switch,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import ThemedText from '../ThemedText';
import IconSymbol from '../ui/IconSymbol';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../constants/Theme';
import { API_ENDPOINTS, fetchWithTimeout, API_BASE_URL } from '../../../constants/Api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  default_price: number;
  default_cost: number;
  price_local: number;
  price_usd: number;
  currency: string;
  width: number;
  height: number;
  sqm: number;
  unit_type: string;
  sizes: string;
  description: string;
  in_stock: number;
  stock_quantity: number;
  min_stock_alert: number;
  created_at: string;
}

interface ExchangeRate {
  id: number;
  currency_from: string;
  currency_to: string;
  rate: number;
}

interface ProductsScreenProps {
  onSelectProduct?: (product: Product) => void;
  selectionMode?: boolean;
  onClose?: () => void;
  currentUser?: any;
}

const CATEGORIES = [
  'El Dokuma Halı',
  'Makine Halısı',
  'İpek Halı',
  'Kilim',
  'Antik Halı',
  'Modern Halı',
  'Yolluk',
  'Diğer',
];

const UNIT_TYPES = [
  { id: 'piece', name: 'Adet', icon: 'cube-outline' },
  { id: 'sqm', name: 'Metrekare (m²)', icon: 'square-outline' },
];

export default function ProductsScreen({
  onSelectProduct,
  selectionMode = false,
  onClose,
  currentUser
}: ProductsScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'dimensions'>('basic');
  const [autoCalculateUSD, setAutoCalculateUSD] = useState(true);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    default_price: '',
    default_cost: '',
    price_local: '',
    price_usd: '',
    currency: 'TRY',
    width: '',
    height: '',
    unit_type: 'piece',
    sizes: '',
    description: '',
    in_stock: true,
    stock_quantity: '',
    min_stock_alert: '5',
  });

  useEffect(() => {
    fetchProducts();
    fetchExchangeRates();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode?.includes(searchQuery) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  // Auto-calculate USD price when TRY price changes
  useEffect(() => {
    if (autoCalculateUSD && formData.price_local) {
      const usdRate = exchangeRates.find(r => r.currency_from === 'TRY' && r.currency_to === 'USD');
      if (usdRate) {
        const usdPrice = parseFloat(formData.price_local) * usdRate.rate;
        setFormData(prev => ({ ...prev, price_usd: usdPrice.toFixed(2) }));
      }
    }
  }, [formData.price_local, autoCalculateUSD, exchangeRates]);

  // Auto-calculate SQM when dimensions change
  useEffect(() => {
    if (formData.width && formData.height) {
      const sqm = (parseFloat(formData.width) * parseFloat(formData.height)) / 10000;
      // Update default_price if unit_type is sqm
      if (formData.unit_type === 'sqm' && formData.price_local) {
        const totalPrice = sqm * parseFloat(formData.price_local);
        setFormData(prev => ({ ...prev, default_price: totalPrice.toFixed(2) }));
      }
    }
  }, [formData.width, formData.height, formData.unit_type, formData.price_local]);

  const fetchProducts = async () => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.products);
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Urun listesi alinamadi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/exchange-rates`);
      const data = await response.json();
      setExchangeRates(data);
    } catch (error) {
      console.error('Kur oranlari alinamadi:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
    fetchExchangeRates();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      category: '',
      default_price: '',
      default_cost: '',
      price_local: '',
      price_usd: '',
      currency: 'TRY',
      width: '',
      height: '',
      unit_type: 'piece',
      sizes: '',
      description: '',
      in_stock: true,
      stock_quantity: '',
      min_stock_alert: '5',
    });
    setEditingProduct(null);
    setActiveTab('basic');
  };

  const calculateSqm = () => {
    if (formData.width && formData.height) {
      return ((parseFloat(formData.width) * parseFloat(formData.height)) / 10000).toFixed(2);
    }
    return '0';
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Uyari', 'Urun adi gerekli');
      return;
    }

    try {
      const url = editingProduct
        ? `${API_ENDPOINTS.products}/${editingProduct.id}`
        : API_ENDPOINTS.products;

      const sqm = formData.width && formData.height
        ? (parseFloat(formData.width) * parseFloat(formData.height)) / 10000
        : null;

      const payload = {
        name: formData.name,
        sku: formData.sku,
        barcode: formData.barcode,
        category: formData.category,
        default_price: parseFloat(formData.default_price) || parseFloat(formData.price_local) || 0,
        default_cost: parseFloat(formData.default_cost) || 0,
        price_local: parseFloat(formData.price_local) || parseFloat(formData.default_price) || 0,
        price_usd: parseFloat(formData.price_usd) || 0,
        currency: formData.currency,
        width: parseFloat(formData.width) || null,
        height: parseFloat(formData.height) || null,
        unit_type: formData.unit_type,
        sizes: formData.sizes,
        description: formData.description,
        in_stock: formData.in_stock,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock_alert: parseInt(formData.min_stock_alert) || 5,
        created_by: currentUser?.userId,
        updated_by: currentUser?.userId,
      };

      const response = await fetchWithTimeout(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert('Basarili', editingProduct ? 'Urun guncellendi' : 'Urun eklendi');
        setShowAddModal(false);
        resetForm();
        fetchProducts();
      } else {
        throw new Error('Islem basarisiz');
      }
    } catch (error) {
      Alert.alert('Hata', 'Islem sirasinda bir hata olustu');
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Urun Sil',
      `${product.name} adli urunu silmek istediginize emin misiniz?`,
      [
        { text: 'Iptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetchWithTimeout(`${API_ENDPOINTS.products}/${product.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deleted_by: currentUser?.userId }),
              });
              if (response.ok) {
                Alert.alert('Basarili', 'Urun silindi');
                fetchProducts();
              }
            } catch (error) {
              Alert.alert('Hata', 'Urun silinemedi');
            }
          },
        },
      ]
    );
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      barcode: product.barcode || '',
      category: product.category || '',
      default_price: product.default_price?.toString() || '',
      default_cost: product.default_cost?.toString() || '',
      price_local: product.price_local?.toString() || product.default_price?.toString() || '',
      price_usd: product.price_usd?.toString() || '',
      currency: product.currency || 'TRY',
      width: product.width?.toString() || '',
      height: product.height?.toString() || '',
      unit_type: product.unit_type || 'piece',
      sizes: product.sizes || '',
      description: product.description || '',
      in_stock: product.in_stock === 1,
      stock_quantity: product.stock_quantity?.toString() || '0',
      min_stock_alert: product.min_stock_alert?.toString() || '5',
    });
    setShowAddModal(true);
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    const symbols: { [key: string]: string } = { TRY: '₺', USD: '$', EUR: '€' };
    return `${symbols[currency] || currency} ${price.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`;
  };

  // Barkod tarama sonucu isleme
  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);

    const { data: barcodeData } = result;

    // Barkod ile veritabaninda urun ara
    try {
      const response = await fetchWithTimeout(`${API_ENDPOINTS.products}?barcode=${barcodeData}`);
      const existingProducts = await response.json();

      if (existingProducts && existingProducts.length > 0) {
        // Mevcut urun bulundu - bilgileri doldur
        const product = existingProducts[0];
        setFormData({
          name: product.name || '',
          sku: product.sku || '',
          barcode: barcodeData,
          category: product.category || '',
          default_price: product.default_price?.toString() || '',
          default_cost: product.default_cost?.toString() || '',
          price_local: product.price_local?.toString() || product.default_price?.toString() || '',
          price_usd: product.price_usd?.toString() || '',
          currency: product.currency || 'TRY',
          width: product.width?.toString() || '',
          height: product.height?.toString() || '',
          unit_type: product.unit_type || 'piece',
          sizes: product.sizes || '',
          description: product.description || '',
          in_stock: product.in_stock === 1,
          stock_quantity: product.stock_quantity?.toString() || '0',
          min_stock_alert: product.min_stock_alert?.toString() || '5',
        });
        Alert.alert('Urun Bulundu', `"${product.name}" urunu bilgileri yuklendi.`);
      } else {
        // Yeni barkod - sadece barkod alanini doldur
        setFormData(prev => ({ ...prev, barcode: barcodeData }));
        Alert.alert('Yeni Barkod', 'Bu barkod sistemde kayitli degil. Yeni urun olarak ekleyebilirsiniz.');
      }
    } catch (error) {
      // API hatasi durumunda sadece barkod doldur
      setFormData(prev => ({ ...prev, barcode: barcodeData }));
    }

    setShowBarcodeScanner(false);
    setTimeout(() => setScanned(false), 1000);
  };

  // Barkod tarayici modal'i ac
  const openBarcodeScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Kamera Izni Gerekli',
          'Barkod taramak icin kamera erisim izni vermeniz gerekiyor.',
          [{ text: 'Tamam' }]
        );
        return;
      }
    }
    setScanned(false);
    setShowBarcodeScanner(true);
  };

  const renderProductCard = (product: Product) => {
    const isLowStock = product.stock_quantity <= product.min_stock_alert;

    return (
      <TouchableOpacity
        key={product.id}
        style={styles.productCard}
        onPress={() => {
          if (selectionMode && onSelectProduct) {
            onSelectProduct(product);
          } else {
            handleEdit(product);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.productHeader}>
          <View style={[styles.productIcon, !product.in_stock && styles.outOfStock]}>
            <IconSymbol
              name="rug"
              size={24}
              color={product.in_stock ? COLORS.primary.accent : COLORS.neutral[400]}
            />
          </View>
          <View style={styles.productInfo}>
            <View style={styles.productNameRow}>
              <ThemedText style={styles.productName}>{product.name}</ThemedText>
              {!product.in_stock && (
                <View style={styles.outOfStockBadge}>
                  <ThemedText style={styles.outOfStockText}>Stokta Yok</ThemedText>
                </View>
              )}
              {isLowStock && product.in_stock === 1 && (
                <View style={styles.lowStockBadge}>
                  <ThemedText style={styles.lowStockText}>Stok Az</ThemedText>
                </View>
              )}
            </View>
            <View style={styles.productMeta}>
              {product.category && (
                <ThemedText style={styles.productCategory}>{product.category}</ThemedText>
              )}
              {product.sku && (
                <ThemedText style={styles.productSku}>SKU: {product.sku}</ThemedText>
              )}
            </View>
          </View>
          {!selectionMode && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(product)}
            >
              <IconSymbol name="trash-can-outline" size={20} color={COLORS.error.main} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.productDetails}>
          {/* Pricing Row */}
          <View style={styles.priceRow}>
            <View style={styles.priceItem}>
              <ThemedText style={styles.priceLabel}>Fiyat (₺)</ThemedText>
              <ThemedText style={styles.priceValue}>
                {formatPrice(product.price_local || product.default_price || 0, 'TRY')}
              </ThemedText>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceItem}>
              <ThemedText style={styles.priceLabel}>Fiyat ($)</ThemedText>
              <ThemedText style={[styles.priceValue, { color: COLORS.info.main }]}>
                {formatPrice(product.price_usd || 0, 'USD')}
              </ThemedText>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceItem}>
              <ThemedText style={styles.priceLabel}>Stok</ThemedText>
              <ThemedText style={[styles.priceValue, isLowStock ? { color: COLORS.warning.main } : {}]}>
                {product.stock_quantity || 0}
              </ThemedText>
            </View>
          </View>

          {/* Dimensions Row */}
          {(product.width || product.height || product.sqm) && (
            <View style={styles.dimensionsRow}>
              <View style={styles.dimensionItem}>
                <IconSymbol name="ruler" size={14} color={COLORS.light.text.tertiary} />
                <ThemedText style={styles.dimensionText}>
                  {product.width} x {product.height} cm
                </ThemedText>
              </View>
              {product.sqm && (
                <View style={styles.dimensionItem}>
                  <IconSymbol name="square-outline" size={14} color={COLORS.light.text.tertiary} />
                  <ThemedText style={styles.dimensionText}>
                    {product.sqm.toFixed(2)} m²
                  </ThemedText>
                </View>
              )}
              <View style={styles.unitBadge}>
                <ThemedText style={styles.unitText}>
                  {product.unit_type === 'sqm' ? 'm² bazlı' : 'Adet bazlı'}
                </ThemedText>
              </View>
            </View>
          )}

          {product.barcode && (
            <View style={styles.barcodeRow}>
              <IconSymbol name="barcode" size={14} color={COLORS.light.text.tertiary} />
              <ThemedText style={styles.barcodeText}>{product.barcode}</ThemedText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryPicker = () => (
    <Modal
      visible={showCategoryPicker}
      transparent
      animationType="slide"
    >
      <View style={styles.pickerOverlay}>
        <View style={styles.pickerContent}>
          <View style={styles.pickerHeader}>
            <ThemedText style={styles.pickerTitle}>Kategori Sec</ThemedText>
            <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
              <IconSymbol name="close" size={24} color={COLORS.light.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.pickerItem,
                  formData.category === cat && styles.pickerItemSelected,
                ]}
                onPress={() => {
                  setFormData({ ...formData, category: cat });
                  setShowCategoryPicker(false);
                }}
              >
                <ThemedText
                  style={[
                    styles.pickerItemText,
                    formData.category === cat && styles.pickerItemTextSelected,
                  ]}
                >
                  {cat}
                </ThemedText>
                {formData.category === cat && (
                  <IconSymbol name="check" size={20} color={COLORS.primary.accent} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
            {editingProduct ? 'Urun Duzenle' : 'Yeni Urun'}
          </ThemedText>
          <TouchableOpacity onPress={handleSave}>
            <ThemedText style={styles.modalSave}>Kaydet</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'basic' && styles.activeTab]}
            onPress={() => setActiveTab('basic')}
          >
            <IconSymbol name="information" size={18} color={activeTab === 'basic' ? COLORS.primary.main : COLORS.light.text.tertiary} />
            <ThemedText style={[styles.tabText, activeTab === 'basic' && styles.activeTabText]}>Temel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pricing' && styles.activeTab]}
            onPress={() => setActiveTab('pricing')}
          >
            <IconSymbol name="cash" size={18} color={activeTab === 'pricing' ? COLORS.primary.main : COLORS.light.text.tertiary} />
            <ThemedText style={[styles.tabText, activeTab === 'pricing' && styles.activeTabText]}>Fiyat</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'dimensions' && styles.activeTab]}
            onPress={() => setActiveTab('dimensions')}
          >
            <IconSymbol name="ruler" size={18} color={activeTab === 'dimensions' ? COLORS.primary.main : COLORS.light.text.tertiary} />
            <ThemedText style={[styles.tabText, activeTab === 'dimensions' && styles.activeTabText]}>Boyut</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'basic' && (
            <>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Urun Adi *</ThemedText>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Urun adi"
                  placeholderTextColor={COLORS.neutral[400]}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                  <ThemedText style={styles.inputLabel}>SKU</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formData.sku}
                    onChangeText={(text) => setFormData({ ...formData, sku: text.toUpperCase() })}
                    placeholder="ED-001"
                    placeholderTextColor={COLORS.neutral[400]}
                    autoCapitalize="characters"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.sm }]}>
                  <ThemedText style={styles.inputLabel}>Barkod</ThemedText>
                  <View style={styles.barcodeInputRow}>
                    <TextInput
                      style={[styles.input, styles.barcodeInput]}
                      value={formData.barcode}
                      onChangeText={(text) => setFormData({ ...formData, barcode: text })}
                      placeholder="8690001000001"
                      placeholderTextColor={COLORS.neutral[400]}
                      keyboardType="number-pad"
                    />
                    <TouchableOpacity
                      style={styles.scanButton}
                      onPress={openBarcodeScanner}
                    >
                      <IconSymbol name="barcode-scan" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Kategori</ThemedText>
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => setShowCategoryPicker(true)}
                >
                  <ThemedText style={formData.category ? styles.selectText : styles.selectPlaceholder}>
                    {formData.category || 'Kategori sec'}
                  </ThemedText>
                  <IconSymbol name="chevron-down" size={20} color={COLORS.light.text.tertiary} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Aciklama</ThemedText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Urun aciklamasi..."
                  placeholderTextColor={COLORS.neutral[400]}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.switchRow}>
                <View>
                  <ThemedText style={styles.switchLabel}>Stokta Mevcut</ThemedText>
                  <ThemedText style={styles.switchDescription}>
                    Urun satis icin uygun mu?
                  </ThemedText>
                </View>
                <Switch
                  value={formData.in_stock}
                  onValueChange={(value) => setFormData({ ...formData, in_stock: value })}
                  trackColor={{ false: COLORS.light.border, true: `${COLORS.success.main}50` }}
                  thumbColor={formData.in_stock ? COLORS.success.main : COLORS.neutral[200]}
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                  <ThemedText style={styles.inputLabel}>Stok Adedi</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formData.stock_quantity}
                    onChangeText={(text) => setFormData({ ...formData, stock_quantity: text })}
                    placeholder="0"
                    placeholderTextColor={COLORS.neutral[400]}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.sm }]}>
                  <ThemedText style={styles.inputLabel}>Min. Stok Uyarisi</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formData.min_stock_alert}
                    onChangeText={(text) => setFormData({ ...formData, min_stock_alert: text })}
                    placeholder="5"
                    placeholderTextColor={COLORS.neutral[400]}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </>
          )}

          {activeTab === 'pricing' && (
            <>
              <View style={styles.infoBox}>
                <IconSymbol name="information" size={20} color={COLORS.info.main} />
                <ThemedText style={styles.infoText}>
                  TL fiyati girildiginde USD fiyati otomatik hesaplanir
                </ThemedText>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Satis Fiyati (₺ TRY)</ThemedText>
                <TextInput
                  style={styles.input}
                  value={formData.price_local}
                  onChangeText={(text) => setFormData({ ...formData, price_local: text })}
                  placeholder="0"
                  placeholderTextColor={COLORS.neutral[400]}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <ThemedText style={styles.inputLabel}>Satis Fiyati ($ USD)</ThemedText>
                  <TouchableOpacity
                    style={styles.autoToggle}
                    onPress={() => setAutoCalculateUSD(!autoCalculateUSD)}
                  >
                    <IconSymbol
                      name={autoCalculateUSD ? 'link' : 'link-off'}
                      size={16}
                      color={autoCalculateUSD ? COLORS.success.main : COLORS.neutral[400]}
                    />
                    <ThemedText style={[styles.autoToggleText, autoCalculateUSD && styles.autoToggleActive]}>
                      {autoCalculateUSD ? 'Otomatik' : 'Manuel'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, autoCalculateUSD && styles.inputDisabled]}
                  value={formData.price_usd}
                  onChangeText={(text) => setFormData({ ...formData, price_usd: text })}
                  placeholder="0"
                  placeholderTextColor={COLORS.neutral[400]}
                  keyboardType="decimal-pad"
                  editable={!autoCalculateUSD}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Maliyet (₺ TRY)</ThemedText>
                <TextInput
                  style={styles.input}
                  value={formData.default_cost}
                  onChangeText={(text) => setFormData({ ...formData, default_cost: text })}
                  placeholder="0"
                  placeholderTextColor={COLORS.neutral[400]}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Profit Calculation */}
              {formData.price_local && formData.default_cost && (
                <View style={styles.profitBox}>
                  <ThemedText style={styles.profitLabel}>Kar Hesabi</ThemedText>
                  <View style={styles.profitRow}>
                    <View style={styles.profitItem}>
                      <ThemedText style={styles.profitItemLabel}>Kar (₺)</ThemedText>
                      <ThemedText style={[styles.profitItemValue, { color: COLORS.success.main }]}>
                        ₺ {(parseFloat(formData.price_local) - parseFloat(formData.default_cost)).toLocaleString('tr-TR')}
                      </ThemedText>
                    </View>
                    <View style={styles.profitItem}>
                      <ThemedText style={styles.profitItemLabel}>Kar Orani</ThemedText>
                      <ThemedText style={[styles.profitItemValue, { color: COLORS.success.main }]}>
                        %{(((parseFloat(formData.price_local) - parseFloat(formData.default_cost)) / parseFloat(formData.price_local)) * 100).toFixed(1)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}

          {activeTab === 'dimensions' && (
            <>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Hesaplama Birimi</ThemedText>
                <View style={styles.unitSelector}>
                  {UNIT_TYPES.map(unit => (
                    <TouchableOpacity
                      key={unit.id}
                      style={[
                        styles.unitOption,
                        formData.unit_type === unit.id && styles.unitOptionSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, unit_type: unit.id })}
                    >
                      <IconSymbol
                        name={unit.icon}
                        size={20}
                        color={formData.unit_type === unit.id ? COLORS.primary.main : COLORS.light.text.tertiary}
                      />
                      <ThemedText style={[
                        styles.unitOptionText,
                        formData.unit_type === unit.id && styles.unitOptionTextSelected,
                      ]}>
                        {unit.name}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                  <ThemedText style={styles.inputLabel}>En (cm)</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formData.width}
                    onChangeText={(text) => setFormData({ ...formData, width: text })}
                    placeholder="200"
                    placeholderTextColor={COLORS.neutral[400]}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.sm }]}>
                  <ThemedText style={styles.inputLabel}>Boy (cm)</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formData.height}
                    onChangeText={(text) => setFormData({ ...formData, height: text })}
                    placeholder="300"
                    placeholderTextColor={COLORS.neutral[400]}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* SQM Calculation */}
              {formData.width && formData.height && (
                <View style={styles.sqmBox}>
                  <IconSymbol name="square-outline" size={24} color={COLORS.primary.main} />
                  <View style={styles.sqmInfo}>
                    <ThemedText style={styles.sqmLabel}>Hesaplanan Metrekare</ThemedText>
                    <ThemedText style={styles.sqmValue}>{calculateSqm()} m²</ThemedText>
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Mevcut Boyutlar</ThemedText>
                <TextInput
                  style={styles.input}
                  value={formData.sizes}
                  onChangeText={(text) => setFormData({ ...formData, sizes: text })}
                  placeholder="Orn: 100x150, 150x200, 200x300"
                  placeholderTextColor={COLORS.neutral[400]}
                />
                <ThemedText style={styles.inputHint}>
                  Virgülle ayirarak birden fazla boyut girebilirsiniz
                </ThemedText>
              </View>
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {renderCategoryPicker()}
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {selectionMode && onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="close" size={24} color={COLORS.light.text.primary} />
          </TouchableOpacity>
        )}
        <ThemedText style={styles.headerTitle}>
          {selectionMode ? 'Urun Sec' : 'Urun Katalogu'}
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
            placeholder="Urun, barkod, SKU ara..."
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
            <ThemedText style={styles.statNumber}>{products.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Toplam Urun</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>
              {products.filter(p => p.in_stock === 1).length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Stokta</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={[styles.statNumber, { color: COLORS.warning.main }]}>
              {products.filter(p => p.stock_quantity <= p.min_stock_alert && p.in_stock === 1).length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Stok Az</ThemedText>
          </View>
        </View>
      )}

      {/* Product List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary.main} />
        }
      >
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="package-variant" size={64} color={COLORS.neutral[300]} />
            <ThemedText style={styles.emptyText}>
              {searchQuery ? 'Urun bulunamadi' : 'Henuz urun eklenmemis'}
            </ThemedText>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowAddModal(true)}
              >
                <ThemedText style={styles.emptyButtonText}>Urun Ekle</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredProducts.map(renderProductCard)
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {renderAddModal()}

      {/* Barkod Tarayici Modal */}
      <Modal
        visible={showBarcodeScanner}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowBarcodeScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              style={styles.scannerCloseButton}
              onPress={() => setShowBarcodeScanner(false)}
            >
              <IconSymbol name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <ThemedText style={styles.scannerTitle}>Barkod Tara</ThemedText>
            <View style={{ width: 40 }} />
          </View>

          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'qr'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          >
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame}>
                <View style={[styles.scannerCorner, styles.topLeft]} />
                <View style={[styles.scannerCorner, styles.topRight]} />
                <View style={[styles.scannerCorner, styles.bottomLeft]} />
                <View style={[styles.scannerCorner, styles.bottomRight]} />
              </View>
              <ThemedText style={styles.scannerHint}>
                Barkodu cerceve icine hizalayin
              </ThemedText>
            </View>
          </CameraView>

          <View style={styles.scannerFooter}>
            <ThemedText style={styles.scannerFooterText}>
              EAN-13, EAN-8, UPC-A, Code128, Code39, QR desteklenir
            </ThemedText>
          </View>
        </View>
      </Modal>
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
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary.main,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.light.text.tertiary,
    marginTop: 2,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.base,
  },
  productCard: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    marginBottom: SPACING.md,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  productIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  outOfStock: {
    backgroundColor: COLORS.neutral[100],
  },
  productInfo: {
    flex: 1,
  },
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  productName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  outOfStockBadge: {
    backgroundColor: COLORS.error.muted,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  outOfStockText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.error.main,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  lowStockBadge: {
    backgroundColor: COLORS.warning.muted,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  lowStockText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.warning.main,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: SPACING.md,
  },
  productCategory: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  productSku: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.light.text.tertiary,
  },
  deleteButton: {
    padding: SPACING.sm,
  },
  productDetails: {
    gap: SPACING.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.light.text.tertiary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  priceDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.light.border,
  },
  dimensionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  dimensionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dimensionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  unitBadge: {
    backgroundColor: COLORS.primary.muted,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  unitText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary.main,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  barcodeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    fontFamily: 'monospace',
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.light.text.secondary,
    marginBottom: SPACING.sm,
  },
  inputHint: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.light.text.tertiary,
    marginTop: SPACING.xs,
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
  inputDisabled: {
    backgroundColor: COLORS.neutral[100],
    color: COLORS.neutral[500],
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  selectText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
  },
  selectPlaceholder: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.neutral[400],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  switchLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.light.text.primary,
  },
  switchDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info.muted,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.info.main,
  },
  autoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  autoToggleText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.neutral[400],
  },
  autoToggleActive: {
    color: COLORS.success.main,
  },
  profitBox: {
    backgroundColor: COLORS.success.muted,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  profitLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.success.main,
    marginBottom: SPACING.sm,
  },
  profitRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  profitItem: {
    flex: 1,
  },
  profitItemLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.light.text.tertiary,
  },
  profitItemValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginTop: 2,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  unitOption: {
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
  unitOptionSelected: {
    backgroundColor: COLORS.primary.muted,
    borderColor: COLORS.primary.main,
  },
  unitOptionText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  unitOptionTextSelected: {
    color: COLORS.primary.main,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  sqmBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary.muted,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  sqmInfo: {
    flex: 1,
  },
  sqmLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  sqmValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary.main,
  },

  // Picker Styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: COLORS.light.surface,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  pickerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  pickerItemSelected: {
    backgroundColor: COLORS.primary.accent + '10',
  },
  pickerItemText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
  },
  pickerItemTextSelected: {
    color: COLORS.primary.accent,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Barcode Input Styles
  barcodeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  barcodeInput: {
    flex: 1,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Barcode Scanner Modal Styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: 60,
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.8)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scannerCloseButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: '#FFFFFF',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  scannerFrame: {
    width: screenWidth * 0.75,
    height: screenWidth * 0.5,
    borderRadius: RADIUS.xl,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  scannerCorner: {
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
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  scannerFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
  },
  scannerFooterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
  },
});
