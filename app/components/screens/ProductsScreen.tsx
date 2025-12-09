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
} from 'react-native';
import React, { useState, useEffect } from 'react';
import ThemedText from '../ThemedText';
import IconSymbol from '../ui/IconSymbol';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../../constants/Theme';
import { API_ENDPOINTS, fetchWithTimeout } from '../../../constants/Api';

interface Product {
  id: number;
  name: string;
  category: string;
  default_price: number;
  default_cost: number;
  sizes: string;
  description: string;
  in_stock: number;
  created_at: string;
}

interface ProductsScreenProps {
  onSelectProduct?: (product: Product) => void;
  selectionMode?: boolean;
  onClose?: () => void;
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

export default function ProductsScreen({ onSelectProduct, selectionMode = false, onClose }: ProductsScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    default_price: '',
    default_cost: '',
    sizes: '',
    description: '',
    in_stock: true,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

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

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      default_price: '',
      default_cost: '',
      sizes: '',
      description: '',
      in_stock: true,
    });
    setEditingProduct(null);
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

      const response = await fetchWithTimeout(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          default_price: parseFloat(formData.default_price) || 0,
          default_cost: parseFloat(formData.default_cost) || 0,
        }),
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
      category: product.category || '',
      default_price: product.default_price?.toString() || '',
      default_cost: product.default_cost?.toString() || '',
      sizes: product.sizes || '',
      description: product.description || '',
      in_stock: product.in_stock === 1,
    });
    setShowAddModal(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderProductCard = (product: Product) => (
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
          </View>
          {product.category && (
            <ThemedText style={styles.productCategory}>{product.category}</ThemedText>
          )}
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
        <View style={styles.priceRow}>
          <View style={styles.priceItem}>
            <ThemedText style={styles.priceLabel}>Fiyat</ThemedText>
            <ThemedText style={styles.priceValue}>{formatPrice(product.default_price || 0)}</ThemedText>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceItem}>
            <ThemedText style={styles.priceLabel}>Maliyet</ThemedText>
            <ThemedText style={[styles.priceValue, { color: COLORS.error.main }]}>
              {formatPrice(product.default_cost || 0)}
            </ThemedText>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceItem}>
            <ThemedText style={styles.priceLabel}>Kar</ThemedText>
            <ThemedText style={[styles.priceValue, { color: COLORS.success.main }]}>
              {formatPrice((product.default_price || 0) - (product.default_cost || 0))}
            </ThemedText>
          </View>
        </View>
        {product.sizes && (
          <View style={styles.sizesRow}>
            <IconSymbol name="ruler" size={14} color={COLORS.light.text.tertiary} />
            <ThemedText style={styles.sizesText}>{product.sizes}</ThemedText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

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

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
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

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
              <ThemedText style={styles.inputLabel}>Fiyat (USD)</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.default_price}
                onChangeText={(text) => setFormData({ ...formData, default_price: text })}
                placeholder="0"
                placeholderTextColor={COLORS.neutral[400]}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.sm }]}>
              <ThemedText style={styles.inputLabel}>Maliyet (USD)</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.default_cost}
                onChangeText={(text) => setFormData({ ...formData, default_cost: text })}
                placeholder="0"
                placeholderTextColor={COLORS.neutral[400]}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Boyutlar</ThemedText>
            <TextInput
              style={styles.input}
              value={formData.sizes}
              onChangeText={(text) => setFormData({ ...formData, sizes: text })}
              placeholder="Orn: 100x150, 150x200, 200x300"
              placeholderTextColor={COLORS.neutral[400]}
            />
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
            placeholder="Urun ara..."
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
  productCategory: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginTop: 2,
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
  sizesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sizesText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
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
});
