import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import ThemedText from '../ThemedText';
import IconSymbol from '../ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../constants/Theme';

const { width } = Dimensions.get('window');

interface Order {
  id: number;
  order_no: string;
  date: string;
  customer_name: string;
  customer_address: string;
  customer_country: string;
  customer_city: string;
  customer_phone: string;
  customer_email: string;
  salesman: string;
  conference: string;
  agency: string;
  guide: string;
  process: string;
  products: string;
}

interface Product {
  name: string;
  quantity: string;
  size: string;
  price: string;
  cost: string;
  notes: string;
}

interface StatusFilter {
  label: string;
  value: string;
  color: string;
  icon: string;
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [tempProcess, setTempProcess] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const statusFilters: StatusFilter[] = [
    { label: 'Tumu', value: 'all', color: COLORS.light.text.secondary, icon: 'format-list-bulleted' },
    { label: 'Bekleyen', value: 'Sipariş Oluşturuldu', color: COLORS.info.main, icon: 'clock-outline' },
    { label: 'Transfer', value: 'Transfer Aşamasında', color: COLORS.warning.main, icon: 'truck-fast-outline' },
    { label: 'Teslim', value: 'Teslim Edildi', color: COLORS.success.main, icon: 'check-circle-outline' },
    { label: 'Iptal', value: 'İptal Edildi', color: COLORS.error.main, icon: 'close-circle-outline' },
  ];

  useEffect(() => {
    fetchOrders();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchQuery, orders, activeFilter]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://192.168.0.13:3000/api/orders');
      const data = await response.json();
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('Siparisler yuklenirken hata:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(order => order.process === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_no.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.customer_country.toLowerCase().includes(query) ||
        order.customer_city.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusConfig = (process: string) => {
    switch (process) {
      case 'Sipariş Oluşturuldu':
        return { color: COLORS.info.main, bg: COLORS.info.bg, icon: 'clipboard-plus-outline', label: 'Bekleyen' };
      case 'Transfer Aşamasında':
        return { color: COLORS.warning.main, bg: COLORS.warning.bg, icon: 'truck-fast-outline', label: 'Transferde' };
      case 'Teslim Edildi':
        return { color: COLORS.success.main, bg: COLORS.success.bg, icon: 'check-circle', label: 'Teslim Edildi' };
      case 'İptal Edildi':
        return { color: COLORS.error.main, bg: COLORS.error.bg, icon: 'close-circle', label: 'Iptal' };
      default:
        return { color: COLORS.light.text.tertiary, bg: COLORS.light.surfaceVariant, icon: 'help-circle', label: 'Bilinmiyor' };
    }
  };

  const handleProcessUpdate = async (orderId: number, newProcess: string) => {
    try {
      const response = await fetch(`http://192.168.0.13:3000/api/orders/${orderId}/process`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ process: newProcess }),
      });

      if (response.ok) {
        fetchOrders();
        setShowProcessModal(false);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Durum guncellenirken hata:', error);
    }
  };

  const calculateOrderTotal = (products: Product[]) => {
    return products.reduce((sum, product) => {
      return sum + (parseFloat(product.price) * parseInt(product.quantity || '0'));
    }, 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderFilterChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterContainer}
    >
      {statusFilters.map((filter) => {
        const isActive = activeFilter === filter.value;
        return (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterChip,
              isActive && { backgroundColor: filter.color }
            ]}
            onPress={() => setActiveFilter(filter.value)}
            activeOpacity={0.7}
          >
            <IconSymbol
              name={filter.icon}
              size={16}
              color={isActive ? '#fff' : filter.color}
            />
            <ThemedText style={[
              styles.filterChipText,
              isActive && { color: '#fff' }
            ]}>
              {filter.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderOrderCard = (order: Order, index: number) => {
    const status = getStatusConfig(order.process);
    const products: Product[] = JSON.parse(order.products);
    const total = calculateOrderTotal(products);

    return (
      <Animated.View
        key={order.id}
        style={[
          styles.orderCard,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setSelectedOrder(order);
            setShowModal(true);
          }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.orderNoContainer}>
                <ThemedText style={styles.orderNo}>#{order.order_no}</ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <IconSymbol name={status.icon} size={12} color={status.color} />
                  <ThemedText style={[styles.statusText, { color: status.color }]}>
                    {status.label}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.orderDate}>
                {formatDate(order.date)}
              </ThemedText>
            </View>
            <View style={styles.cardHeaderRight}>
              <ThemedText style={styles.totalLabel}>Toplam</ThemedText>
              <ThemedText style={styles.totalAmount}>${total.toFixed(2)}</ThemedText>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.customerInfo}>
              <View style={styles.customerAvatar}>
                <ThemedText style={styles.avatarText}>
                  {order.customer_name.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
              <View style={styles.customerDetails}>
                <ThemedText style={styles.customerName}>{order.customer_name}</ThemedText>
                <View style={styles.locationRow}>
                  <IconSymbol name="map-marker-outline" size={14} color={COLORS.light.text.tertiary} />
                  <ThemedText style={styles.locationText}>
                    {order.customer_city}, {order.customer_country}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.productsPreview}>
              <View style={styles.productsInfo}>
                <IconSymbol name="package-variant" size={16} color={COLORS.primary.main} />
                <ThemedText style={styles.productsCount}>
                  {products.length} urun
                </ThemedText>
              </View>
              <IconSymbol name="chevron-right" size={20} color={COLORS.light.text.tertiary} />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderDetailModal = () => {
    if (!selectedOrder) return null;

    const status = getStatusConfig(selectedOrder.process);
    const products: Product[] = JSON.parse(selectedOrder.products);
    const total = calculateOrderTotal(products);

    return (
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <ThemedText style={styles.modalOrderNo}>#{selectedOrder.order_no}</ThemedText>
                <ThemedText style={styles.modalDate}>{formatDate(selectedOrder.date)}</ThemedText>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <IconSymbol name="close" size={24} color={COLORS.light.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.statusCard, { backgroundColor: status.bg }]}
                onPress={() => {
                  setTempProcess(selectedOrder.process);
                  setShowProcessModal(true);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.statusCardContent}>
                  <IconSymbol name={status.icon} size={24} color={status.color} />
                  <View style={styles.statusCardText}>
                    <ThemedText style={[styles.statusCardTitle, { color: status.color }]}>
                      {selectedOrder.process}
                    </ThemedText>
                    <ThemedText style={styles.statusCardSubtitle}>Durumu degistirmek icin dokun</ThemedText>
                  </View>
                </View>
                <IconSymbol name="chevron-right" size={20} color={status.color} />
              </TouchableOpacity>

              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Musteri Bilgileri</ThemedText>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <IconSymbol name="account" size={20} color={COLORS.primary.main} />
                    <View style={styles.infoContent}>
                      <ThemedText style={styles.infoLabel}>Ad Soyad</ThemedText>
                      <ThemedText style={styles.infoValue}>{selectedOrder.customer_name}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.infoDivider} />
                  <View style={styles.infoRow}>
                    <IconSymbol name="map-marker" size={20} color={COLORS.primary.main} />
                    <View style={styles.infoContent}>
                      <ThemedText style={styles.infoLabel}>Konum</ThemedText>
                      <ThemedText style={styles.infoValue}>
                        {selectedOrder.customer_city}, {selectedOrder.customer_country}
                      </ThemedText>
                    </View>
                  </View>
                  {selectedOrder.customer_phone && (
                    <>
                      <View style={styles.infoDivider} />
                      <View style={styles.infoRow}>
                        <IconSymbol name="phone" size={20} color={COLORS.primary.main} />
                        <View style={styles.infoContent}>
                          <ThemedText style={styles.infoLabel}>Telefon</ThemedText>
                          <ThemedText style={styles.infoValue}>{selectedOrder.customer_phone}</ThemedText>
                        </View>
                      </View>
                    </>
                  )}
                  {selectedOrder.customer_email && (
                    <>
                      <View style={styles.infoDivider} />
                      <View style={styles.infoRow}>
                        <IconSymbol name="email" size={20} color={COLORS.primary.main} />
                        <View style={styles.infoContent}>
                          <ThemedText style={styles.infoLabel}>E-posta</ThemedText>
                          <ThemedText style={styles.infoValue}>{selectedOrder.customer_email}</ThemedText>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {(selectedOrder.salesman || selectedOrder.conference) && (
                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>Satis Bilgileri</ThemedText>
                  <View style={styles.infoCard}>
                    {selectedOrder.salesman && (
                      <View style={styles.infoRow}>
                        <IconSymbol name="account-tie" size={20} color={COLORS.secondary.main} />
                        <View style={styles.infoContent}>
                          <ThemedText style={styles.infoLabel}>Satis Temsilcisi</ThemedText>
                          <ThemedText style={styles.infoValue}>{selectedOrder.salesman}</ThemedText>
                        </View>
                      </View>
                    )}
                    {selectedOrder.conference && (
                      <>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoRow}>
                          <IconSymbol name="presentation" size={20} color={COLORS.secondary.main} />
                          <View style={styles.infoContent}>
                            <ThemedText style={styles.infoLabel}>Konferans</ThemedText>
                            <ThemedText style={styles.infoValue}>{selectedOrder.conference}</ThemedText>
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Urunler ({products.length})</ThemedText>
                <View style={styles.productsCard}>
                  {products.map((product, index) => (
                    <View key={index}>
                      <View style={styles.productItem}>
                        <View style={styles.productInfo}>
                          <ThemedText style={styles.productName}>{product.name}</ThemedText>
                          {product.size && (
                            <ThemedText style={styles.productSize}>Boyut: {product.size}</ThemedText>
                          )}
                        </View>
                        <View style={styles.productPricing}>
                          <ThemedText style={styles.productQuantity}>x{product.quantity}</ThemedText>
                          <ThemedText style={styles.productPrice}>${product.price}</ThemedText>
                        </View>
                      </View>
                      {index < products.length - 1 && <View style={styles.productDivider} />}
                    </View>
                  ))}

                  <LinearGradient
                    colors={COLORS.gradients.primary}
                    style={styles.totalCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <ThemedText style={styles.totalCardLabel}>Toplam Tutar</ThemedText>
                    <ThemedText style={styles.totalCardValue}>${total.toFixed(2)}</ThemedText>
                  </LinearGradient>
                </View>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderProcessModal = () => {
    const processes = [
      { value: 'Sipariş Oluşturuldu', ...getStatusConfig('Sipariş Oluşturuldu') },
      { value: 'Transfer Aşamasında', ...getStatusConfig('Transfer Aşamasında') },
      { value: 'Teslim Edildi', ...getStatusConfig('Teslim Edildi') },
      { value: 'İptal Edildi', ...getStatusConfig('İptal Edildi') },
    ];

    return (
      <Modal
        visible={showProcessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowProcessModal(false)}
      >
        <View style={styles.processModalOverlay}>
          <View style={styles.processModalContent}>
            <ThemedText style={styles.processModalTitle}>Siparis Durumu</ThemedText>

            {processes.map((process) => (
              <TouchableOpacity
                key={process.value}
                style={[
                  styles.processOption,
                  tempProcess === process.value && { backgroundColor: process.bg }
                ]}
                onPress={() => setTempProcess(process.value)}
              >
                <IconSymbol
                  name={process.icon}
                  size={24}
                  color={tempProcess === process.value ? process.color : COLORS.light.text.tertiary}
                />
                <ThemedText style={[
                  styles.processOptionText,
                  tempProcess === process.value && { color: process.color, fontWeight: '600' }
                ]}>
                  {process.value}
                </ThemedText>
                {tempProcess === process.value && (
                  <IconSymbol name="check" size={20} color={process.color} />
                )}
              </TouchableOpacity>
            ))}

            <View style={styles.processModalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowProcessModal(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Iptal</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => selectedOrder && handleProcessUpdate(selectedOrder.id, tempProcess)}
              >
                <LinearGradient
                  colors={COLORS.gradients.primary}
                  style={styles.saveButtonGradient}
                >
                  <ThemedText style={styles.saveButtonText}>Kaydet</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary.main} />
        <ThemedText style={styles.loadingText}>Siparisler yukleniyor...</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={[
          styles.searchBar,
          isSearchFocused && styles.searchBarFocused
        ]}>
          <IconSymbol
            name="magnify"
            size={22}
            color={isSearchFocused ? COLORS.primary.main : COLORS.light.text.tertiary}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Siparis ara..."
            placeholderTextColor={COLORS.light.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="close-circle" size={20} color={COLORS.light.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderFilterChips()}

      <View style={styles.resultsHeader}>
        <ThemedText style={styles.resultsCount}>
          {filteredOrders.length} siparis bulundu
        </ThemedText>
      </View>

      <ScrollView
        style={styles.ordersList}
        contentContainerStyle={styles.ordersListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary.main]}
            tintColor={COLORS.primary.main}
          />
        }
      >
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, index) => renderOrderCard(order, index))
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="package-variant-closed" size={64} color={COLORS.light.border} />
            <ThemedText style={styles.emptyStateTitle}>Siparis Bulunamadi</ThemedText>
            <ThemedText style={styles.emptyStateText}>
              Arama kriterlerinize uygun siparis yok
            </ThemedText>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {renderDetailModal()}
      {renderProcessModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.light.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.light.text.secondary,
  },
  searchSection: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.light.border,
    ...SHADOWS.sm,
  },
  searchBarFocused: {
    borderColor: COLORS.primary.main,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
  },
  filterContainer: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light.surface,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    marginRight: SPACING.sm,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  filterChipText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.light.text.secondary,
  },
  resultsHeader: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
  },
  resultsCount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  ordersList: {
    flex: 1,
  },
  ordersListContent: {
    paddingHorizontal: SPACING.base,
  },
  orderCard: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.borderLight,
  },
  cardHeaderLeft: {},
  cardHeaderRight: {
    alignItems: 'flex-end',
  },
  orderNoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  orderNo: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  orderDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.light.text.tertiary,
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary.main,
  },
  cardBody: {
    padding: SPACING.base,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  customerDetails: {},
  customerName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  productsPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.light.surfaceVariant,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  productsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  productsCount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.light.text.secondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['5xl'],
  },
  emptyStateTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.light.surface,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.light.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  modalOrderNo: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
  },
  modalDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.light.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.base,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.lg,
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  statusCardText: {},
  statusCardTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  statusCardSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.light.text.tertiary,
    marginTop: 2,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
    marginBottom: SPACING.md,
  },
  infoCard: {
    backgroundColor: COLORS.light.surfaceVariant,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  infoContent: {},
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.light.text.tertiary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.light.border,
    marginVertical: SPACING.md,
  },
  productsCard: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    overflow: 'hidden',
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.base,
  },
  productInfo: {},
  productName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.light.text.primary,
    marginBottom: 2,
  },
  productSize: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  productPricing: {
    alignItems: 'flex-end',
  },
  productQuantity: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginBottom: 2,
  },
  productPrice: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.primary.main,
  },
  productDivider: {
    height: 1,
    backgroundColor: COLORS.light.borderLight,
  },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.base,
  },
  totalCardLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: 'rgba(255,255,255,0.8)',
  },
  totalCardValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  processModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  processModalContent: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.lg,
  },
  processModalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  processOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  processOptionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.secondary,
  },
  processModalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.light.surfaceVariant,
    borderRadius: RADIUS.lg,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.secondary,
  },
  saveButton: {
    flex: 1,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: '#FFFFFF',
  },
});
