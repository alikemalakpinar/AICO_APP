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
  StatusBar,
  Linking,
  Alert,
  useWindowDimensions,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import ThemedText from '../ThemedText';
import IconSymbol from '../ui/IconSymbol';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ORDER_STATUS } from '../../../constants/Theme';
import { API_ENDPOINTS, fetchWithTimeout } from '../../../constants/Api';

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

type FilterKey = 'all' | 'pending' | 'transfer' | 'delivered' | 'cancelled';

interface StatusFilter {
  key: FilterKey;
  label: string;
  value: string;
  count?: number;
}

export default function OrdersScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 600;
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const statusFilters: StatusFilter[] = [
    { key: 'all', label: 'Tümü', value: 'all' },
    { key: 'pending', label: 'Bekleyen', value: 'Sipariş Oluşturuldu' },
    { key: 'transfer', label: 'Transfer', value: 'Transfer Aşamasında' },
    { key: 'delivered', label: 'Teslim', value: 'Teslim Edildi' },
    { key: 'cancelled', label: 'İptal', value: 'İptal Edildi' },
  ];

  useEffect(() => {
    fetchOrders();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchQuery, orders, activeFilter]);

  const fetchOrders = async () => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.orders);
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

    const selectedFilter = statusFilters.find(f => f.key === activeFilter);
    if (selectedFilter && selectedFilter.key !== 'all') {
      filtered = filtered.filter(order => order.process === selectedFilter.value);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_no.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        order.customer_country.toLowerCase().includes(query)
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
        return ORDER_STATUS.created;
      case 'Transfer Aşamasında':
        return ORDER_STATUS.transfer;
      case 'Teslim Edildi':
        return ORDER_STATUS.delivered;
      case 'İptal Edildi':
        return ORDER_STATUS.cancelled;
      default:
        return ORDER_STATUS.created;
    }
  };

  const handleProcessUpdate = async (orderId: number, newProcess: string) => {
    try {
      const response = await fetchWithTimeout(`${API_ENDPOINTS.orders}/${orderId}/process`, {
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
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('tr-TR', { month: 'short' });
    return { day, month };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const shareViaWhatsApp = (order: Order) => {
    const products: Product[] = JSON.parse(order.products);
    const total = calculateOrderTotal(products);

    const productsList = products.map(p =>
      `• ${p.name} (${p.quantity} adet) - ${formatCurrency(parseFloat(p.price))}`
    ).join('\n');

    const message = `
🧾 *Sipariş Detayı*
━━━━━━━━━━━━━━━━
📋 Sipariş No: *${order.order_no}*
📅 Tarih: ${new Date(order.date).toLocaleDateString('tr-TR')}

👤 *Müşteri Bilgileri*
Ad: ${order.customer_name}
📞 Tel: ${order.customer_phone}
📍 ${order.customer_city}, ${order.customer_country}

📦 *Ürünler*
${productsList}

💰 *Toplam: ${formatCurrency(total)}*
━━━━━━━━━━━━━━━━
_Koyuncu Halı_
    `.trim();

    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = order.customer_phone.replace(/[^0-9]/g, '');

    if (phoneNumber) {
      Linking.openURL(`whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`);
    } else {
      Linking.openURL(`whatsapp://send?text=${encodedMessage}`);
    }
  };

  const callCustomer = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Hata', 'Telefon numarası bulunamadı');
    }
  };

  const sendEmailToCustomer = (order: Order) => {
    const products: Product[] = JSON.parse(order.products);
    const total = calculateOrderTotal(products);

    const productsList = products.map(p =>
      `• ${p.name} (${p.quantity} adet) - ${formatCurrency(parseFloat(p.price))}`
    ).join('\n');

    const subject = encodeURIComponent(`Sipariş #${order.order_no} - Detayları`);
    const body = encodeURIComponent(`
Sayın ${order.customer_name},

Siparişiniz ile ilgili detaylar aşağıdaki gibidir:

SİPARİŞ BİLGİLERİ
━━━━━━━━━━━━━━━━━
Sipariş No: #${order.order_no}
Tarih: ${new Date(order.date).toLocaleDateString('tr-TR')}
Durum: ${order.process}

ÜRÜNLER
━━━━━━━━━━━━━━━━━
${productsList}

TOPLAM: ${formatCurrency(total)}

İyi günler dileriz.
    `);

    if (order.customer_email) {
      Linking.openURL(`mailto:${order.customer_email}?subject=${subject}&body=${body}`);
    } else {
      Alert.alert(
        'E-posta Adresi Yok',
        'Müşterinin e-posta adresi kayıtlı değil. Manuel olarak e-posta göndermek ister misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Evet', onPress: () => Linking.openURL(`mailto:?subject=${subject}&body=${body}`) }
        ]
      );
    }
  };

  const getFilterCount = (filterKey: FilterKey) => {
    if (filterKey === 'all') return orders.length;
    const filter = statusFilters.find(f => f.key === filterKey);
    if (!filter) return 0;
    return orders.filter(order => order.process === filter.value).length;
  };

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        {statusFilters.map((filter) => {
          const isActive = activeFilter === filter.key;
          const count = getFilterCount(filter.key);
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {filter.label}
              </ThemedText>
              <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                <ThemedText style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                  {count}
                </ThemedText>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderOrderCard = (order: Order, index: number) => {
    const statusConfig = getStatusConfig(order.process);
    const products: Product[] = JSON.parse(order.products);
    const total = calculateOrderTotal(products);
    const { day, month } = formatDate(order.date);

    return (
      <Animated.View
        key={order.id}
        style={[
          styles.orderCard,
          { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}]}
        ]}
      >
        <TouchableOpacity
          style={styles.orderCardContent}
          onPress={() => { setSelectedOrder(order); setShowModal(true); }}
          activeOpacity={0.7}
        >
          {/* Date Column */}
          <View style={styles.dateColumn}>
            <ThemedText style={styles.dateDay}>{day}</ThemedText>
            <ThemedText style={styles.dateMonth}>{month}</ThemedText>
          </View>

          {/* Main Content */}
          <View style={styles.orderMainContent}>
            {/* Header Row */}
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <ThemedText style={styles.orderNo}>#{order.order_no}</ThemedText>
                <ThemedText style={styles.customerName}>{order.customer_name}</ThemedText>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
                <ThemedText style={[styles.statusText, { color: statusConfig.textColor }]}>
                  {statusConfig.label}
                </ThemedText>
              </View>
            </View>

            {/* Details Row */}
            <View style={styles.orderDetails}>
              <View style={styles.detailItem}>
                <IconSymbol name="map-marker-outline" size={14} color={COLORS.light.text.tertiary} />
                <ThemedText style={styles.detailText}>
                  {order.customer_city}, {order.customer_country}
                </ThemedText>
              </View>
              <View style={styles.detailItem}>
                <IconSymbol name="package-variant" size={14} color={COLORS.light.text.tertiary} />
                <ThemedText style={styles.detailText}>
                  {products.length} ürün
                </ThemedText>
              </View>
            </View>

            {/* Footer Row */}
            <View style={styles.orderFooter}>
              <ThemedText style={styles.totalAmount}>{formatCurrency(total)}</ThemedText>
              <IconSymbol name="chevron-right" size={20} color={COLORS.light.text.tertiary} />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderDetailModal = () => {
    if (!selectedOrder) return null;

    const statusConfig = getStatusConfig(selectedOrder.process);
    const products: Product[] = JSON.parse(selectedOrder.products);
    const total = calculateOrderTotal(products);

    return (
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowModal(false)}
            >
              <IconSymbol name="close" size={24} color={COLORS.light.text.primary} />
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>Sipariş Detayı</ThemedText>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            {/* Order Header Card */}
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <View>
                  <ThemedText style={styles.detailOrderNo}>#{selectedOrder.order_no}</ThemedText>
                  <ThemedText style={styles.detailDate}>
                    {new Date(selectedOrder.date).toLocaleDateString('tr-TR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.detailStatusBadge, { backgroundColor: statusConfig.bgColor }]}
                  onPress={() => setShowProcessModal(true)}
                >
                  <ThemedText style={[styles.detailStatusText, { color: statusConfig.textColor }]}>
                    {statusConfig.label}
                  </ThemedText>
                  <IconSymbol name="chevron-down" size={16} color={statusConfig.textColor} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Customer Info */}
            <View style={styles.sectionCard}>
              <ThemedText style={styles.sectionTitle}>Müşteri Bilgileri</ThemedText>
              <View style={styles.infoGrid}>
                <View style={styles.infoRow}>
                  <IconSymbol name="account-outline" size={18} color={COLORS.light.text.tertiary} />
                  <View style={styles.infoContent}>
                    <ThemedText style={styles.infoLabel}>Ad Soyad</ThemedText>
                    <ThemedText style={styles.infoValue}>{selectedOrder.customer_name}</ThemedText>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <IconSymbol name="map-marker-outline" size={18} color={COLORS.light.text.tertiary} />
                  <View style={styles.infoContent}>
                    <ThemedText style={styles.infoLabel}>Adres</ThemedText>
                    <ThemedText style={styles.infoValue}>
                      {selectedOrder.customer_city}, {selectedOrder.customer_country}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <IconSymbol name="phone-outline" size={18} color={COLORS.light.text.tertiary} />
                  <View style={styles.infoContent}>
                    <ThemedText style={styles.infoLabel}>Telefon</ThemedText>
                    <ThemedText style={styles.infoValue}>{selectedOrder.customer_phone}</ThemedText>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <IconSymbol name="email-outline" size={18} color={COLORS.light.text.tertiary} />
                  <View style={styles.infoContent}>
                    <ThemedText style={styles.infoLabel}>E-posta</ThemedText>
                    <ThemedText style={styles.infoValue}>{selectedOrder.customer_email}</ThemedText>
                  </View>
                </View>
              </View>
            </View>

            {/* Products */}
            <View style={styles.sectionCard}>
              <ThemedText style={styles.sectionTitle}>Ürünler</ThemedText>
              {products.map((product, index) => (
                <View key={index} style={[styles.productItem, index !== products.length - 1 && styles.productItemBorder]}>
                  <View style={styles.productInfo}>
                    <ThemedText style={styles.productName}>{product.name}</ThemedText>
                    <ThemedText style={styles.productMeta}>
                      {product.size} • {product.quantity} adet
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.productPrice}>
                    {formatCurrency(parseFloat(product.price) * parseInt(product.quantity))}
                  </ThemedText>
                </View>
              ))}
              <View style={styles.totalRow}>
                <ThemedText style={styles.totalLabel}>Toplam</ThemedText>
                <ThemedText style={styles.totalValue}>{formatCurrency(total)}</ThemedText>
              </View>
            </View>

            {/* Sales Info */}
            <View style={styles.sectionCard}>
              <ThemedText style={styles.sectionTitle}>Satış Bilgileri</ThemedText>
              <View style={styles.salesGrid}>
                {selectedOrder.salesman && (
                  <View style={styles.salesItem}>
                    <ThemedText style={styles.salesLabel}>Satıcı</ThemedText>
                    <ThemedText style={styles.salesValue}>{selectedOrder.salesman}</ThemedText>
                  </View>
                )}
                {selectedOrder.agency && (
                  <View style={styles.salesItem}>
                    <ThemedText style={styles.salesLabel}>Acenta</ThemedText>
                    <ThemedText style={styles.salesValue}>{selectedOrder.agency}</ThemedText>
                  </View>
                )}
                {selectedOrder.guide && (
                  <View style={styles.salesItem}>
                    <ThemedText style={styles.salesLabel}>Rehber</ThemedText>
                    <ThemedText style={styles.salesValue}>{selectedOrder.guide}</ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.callBtn]}
                onPress={() => callCustomer(selectedOrder.customer_phone)}
              >
                <IconSymbol name="phone" size={20} color={COLORS.success.main} />
                <ThemedText style={[styles.actionBtnText, { color: COLORS.success.main }]}>Ara</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.whatsappBtn]}
                onPress={() => shareViaWhatsApp(selectedOrder)}
              >
                <IconSymbol name="whatsapp" size={20} color="#25D366" />
                <ThemedText style={[styles.actionBtnText, { color: '#25D366' }]}>WhatsApp</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.emailBtn]}
                onPress={() => sendEmailToCustomer(selectedOrder)}
              >
                <IconSymbol name="email-outline" size={20} color={COLORS.primary.accent} />
                <ThemedText style={[styles.actionBtnText, { color: COLORS.primary.accent }]}>E-posta</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>

        {/* Process Update Modal */}
        <Modal
          visible={showProcessModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowProcessModal(false)}
        >
          <TouchableOpacity
            style={styles.processModalOverlay}
            activeOpacity={1}
            onPress={() => setShowProcessModal(false)}
          >
            <View style={styles.processModalContent}>
              <ThemedText style={styles.processModalTitle}>Durumu Güncelle</ThemedText>
              {[ORDER_STATUS.created, ORDER_STATUS.transfer, ORDER_STATUS.delivered, ORDER_STATUS.cancelled].map((status) => (
                <TouchableOpacity
                  key={status.key}
                  style={[
                    styles.processOption,
                    selectedOrder.process === status.key && styles.processOptionActive
                  ]}
                  onPress={() => handleProcessUpdate(selectedOrder.id, status.key)}
                >
                  <View style={[styles.processOptionDot, { backgroundColor: status.color }]} />
                  <ThemedText style={styles.processOptionText}>{status.label}</ThemedText>
                  {selectedOrder.process === status.key && (
                    <IconSymbol name="check" size={18} color={COLORS.primary.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[
        styles.header,
        isTablet && { paddingHorizontal: SPACING.xl, maxWidth: 900, alignSelf: 'center', width: '100%' }
      ]}>
        <View style={styles.headerTop}>
          <ThemedText style={[styles.headerTitle, isTablet && { fontSize: TYPOGRAPHY.fontSize['2xl'] }]}>Siparişler</ThemedText>
          <ThemedText style={styles.headerSubtitle}>{orders.length} sipariş</ThemedText>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, isTablet && { maxWidth: 500 }]}>
          <IconSymbol name="magnify" size={20} color={COLORS.light.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Sipariş veya müşteri ara..."
            placeholderTextColor={COLORS.light.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="close-circle" size={18} color={COLORS.light.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      {renderFilterTabs()}

      {/* Orders List */}
      <ScrollView
        style={styles.ordersList}
        contentContainerStyle={[
          styles.ordersListContent,
          isTablet && { paddingHorizontal: SPACING.xl, maxWidth: 900, alignSelf: 'center', width: '100%' }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary.main} />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="package-variant" size={48} color={COLORS.light.text.tertiary} />
            <ThemedText style={styles.emptyStateText}>Sipariş bulunamadı</ThemedText>
          </View>
        ) : (
          filteredOrders.map((order, index) => renderOrderCard(order, index))
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      {renderDetailModal()}
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

  // Header
  header: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.base,
    backgroundColor: COLORS.light.background,
  },
  headerTop: {
    marginBottom: SPACING.base,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginTop: SPACING.xs,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.base,
    paddingHorizontal: SPACING.md,
    height: 44,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
  },

  // Filters
  filterContainer: {
    backgroundColor: COLORS.light.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.divider,
  },
  filterScrollContent: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.light.surfaceSecondary,
    gap: SPACING.sm,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary.main,
  },
  filterTabText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.light.text.secondary,
  },
  filterTabTextActive: {
    color: COLORS.light.text.inverse,
  },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterBadgeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.secondary,
  },
  filterBadgeTextActive: {
    color: COLORS.light.text.inverse,
  },

  // Orders List
  ordersList: {
    flex: 1,
  },
  ordersListContent: {
    padding: SPACING.base,
    gap: SPACING.md,
  },

  // Order Card
  orderCard: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    overflow: 'hidden',
  },
  orderCardContent: {
    flexDirection: 'row',
    padding: SPACING.base,
  },
  dateColumn: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    paddingRight: SPACING.md,
    borderRightWidth: 1,
    borderRightColor: COLORS.light.divider,
  },
  dateDay: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
  },
  dateMonth: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.light.text.tertiary,
    textTransform: 'uppercase',
  },
  orderMainContent: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  orderInfo: {
    flex: 1,
  },
  orderNo: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  customerName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.light.text.primary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  orderDetails: {
    flexDirection: 'row',
    gap: SPACING.base,
    marginBottom: SPACING.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
    gap: SPACING.md,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.tertiary,
  },

  // Modal
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
    borderBottomColor: COLORS.light.divider,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.light.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: SPACING.base,
    gap: SPACING.base,
  },

  // Detail Card
  detailCard: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  detailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailOrderNo: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
  },
  detailDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginTop: SPACING.xs,
  },
  detailStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.base,
    gap: SPACING.xs,
  },
  detailStatusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },

  // Section Card
  sectionCard: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.base,
  },

  // Info Grid
  infoGrid: {
    gap: SPACING.base,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.light.text.tertiary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Products
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  productItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.divider,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.light.text.primary,
  },
  productMeta: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginTop: 2,
  },
  productPrice: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.base,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.divider,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.light.text.secondary,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
  },

  // Sales Grid
  salesGrid: {
    gap: SPACING.base,
  },
  salesItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salesLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  salesValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.light.text.primary,
  },

  // Process Modal
  processModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  processModalContent: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 320,
  },
  processModalTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
    marginBottom: SPACING.base,
    textAlign: 'center',
  },
  processOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.base,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  processOptionActive: {
    backgroundColor: COLORS.light.surfaceSecondary,
  },
  processOptionDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.full,
  },
  processOptionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.primary,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.base,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  callBtn: {
    backgroundColor: COLORS.success.muted,
    borderWidth: 1,
    borderColor: COLORS.success.main + '30',
  },
  whatsappBtn: {
    backgroundColor: '#E7F9EE',
    borderWidth: 1,
    borderColor: '#25D36630',
  },
  emailBtn: {
    backgroundColor: COLORS.primary.accent + '15',
    borderWidth: 1,
    borderColor: COLORS.primary.accent + '30',
  },
  actionBtnText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
});
