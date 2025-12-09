import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'react-native-calendars';
import ThemedText from '../ThemedText';
import IconSymbol from '../ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../constants/Theme';

type ViewType = 'month' | 'week' | 'day';
type DateData = {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
};

interface Order {
  id: number;
  order_no: string;
  date: string;
  customer_name: string;
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
  price: string;
}

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewType, setViewType] = useState<ViewType>('month');
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedDateOrders, setSelectedDateOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [monthlyStats, setMonthlyStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    deliveredOrders: 0,
    pendingOrders: 0
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchOrders();
    calculateStats();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://192.168.0.13:3000/api/orders');
      const orders: Order[] = await response.json();

      const marked: any = {};
      orders.forEach(order => {
        const date = order.date.split('T')[0];
        const statusColor = getStatusColor(order.process);
        marked[date] = {
          marked: true,
          dotColor: statusColor,
          selectedColor: COLORS.primary.main,
        };
      });

      setMarkedDates(marked);
    } catch (error) {
      console.error('Siparisler yuklenirken hata:', error);
    }
  };

  const fetchOrdersByDate = async (date: string) => {
    setLoading(true);
    try {
      const response = await fetch('http://192.168.0.13:3000/api/orders');
      const orders: Order[] = await response.json();

      const dateOrders = orders.filter(order => order.date.split('T')[0] === date);
      setSelectedDateOrders(dateOrders);
    } catch (error) {
      console.error('Siparisler yuklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = async () => {
    try {
      const response = await fetch('http://192.168.0.13:3000/api/orders');
      const orders: Order[] = await response.json();

      const currentMonth = new Date(selectedDate).getMonth();
      const currentYear = new Date(selectedDate).getFullYear();

      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      });

      let totalRevenue = 0;
      const delivered = monthOrders.filter(order => order.process === 'Teslim Edildi').length;
      const pending = monthOrders.filter(order => order.process === 'Transfer Aşamasında').length;

      monthOrders.forEach(order => {
        const products = JSON.parse(order.products);
        products.forEach((product: Product) => {
          totalRevenue += parseFloat(product.price) * parseInt(product.quantity);
        });
      });

      setMonthlyStats({
        totalOrders: monthOrders.length,
        totalRevenue,
        deliveredOrders: delivered,
        pendingOrders: pending
      });
    } catch (error) {
      console.error('Istatistikler hesaplanirken hata:', error);
    }
  };

  useEffect(() => {
    calculateStats();
  }, [selectedDate]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    fetchOrdersByDate(day.dateString);
    setShowOrdersModal(true);
  };

  const getStatusColor = (process: string) => {
    switch (process) {
      case 'Sipariş Oluşturuldu': return COLORS.info.main;
      case 'Transfer Aşamasında': return COLORS.warning.main;
      case 'Teslim Edildi': return COLORS.success.main;
      case 'İptal Edildi': return COLORS.error.main;
      default: return COLORS.light.text.tertiary;
    }
  };

  const getStatusIcon = (process: string) => {
    switch (process) {
      case 'Sipariş Oluşturuldu': return 'clipboard-plus-outline';
      case 'Transfer Aşamasında': return 'truck-fast-outline';
      case 'Teslim Edildi': return 'check-circle';
      case 'İptal Edildi': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const renderViewTypeButton = (type: ViewType, label: string, icon: string) => (
    <TouchableOpacity
      style={[styles.viewTypeButton, viewType === type && styles.viewTypeButtonActive]}
      onPress={() => setViewType(type)}
    >
      {viewType === type ? (
        <LinearGradient
          colors={COLORS.gradients.primary}
          style={styles.viewTypeButtonGradient}
        >
          <IconSymbol name={icon} size={18} color="#fff" />
          <ThemedText style={styles.viewTypeTextActive}>{label}</ThemedText>
        </LinearGradient>
      ) : (
        <>
          <IconSymbol name={icon} size={18} color={COLORS.light.text.tertiary} />
          <ThemedText style={styles.viewTypeText}>{label}</ThemedText>
        </>
      )}
    </TouchableOpacity>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: COLORS.primary.main }]}>
          <IconSymbol name="package-variant" size={20} color={COLORS.primary.main} />
          <ThemedText style={styles.statValue}>{monthlyStats.totalOrders}</ThemedText>
          <ThemedText style={styles.statLabel}>Siparis</ThemedText>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.success.main }]}>
          <IconSymbol name="check-circle" size={20} color={COLORS.success.main} />
          <ThemedText style={styles.statValue}>{monthlyStats.deliveredOrders}</ThemedText>
          <ThemedText style={styles.statLabel}>Teslim</ThemedText>
        </View>
        <View style={[styles.statCard, { borderLeftColor: COLORS.warning.main }]}>
          <IconSymbol name="truck-fast-outline" size={20} color={COLORS.warning.main} />
          <ThemedText style={styles.statValue}>{monthlyStats.pendingOrders}</ThemedText>
          <ThemedText style={styles.statLabel}>Transfer</ThemedText>
        </View>
      </View>
    </View>
  );

  const renderOrdersModal = () => (
    <Modal
      visible={showOrdersModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowOrdersModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View>
              <ThemedText style={styles.modalTitle}>
                {new Date(selectedDate).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </ThemedText>
              <ThemedText style={styles.modalSubtitle}>
                {selectedDateOrders.length} siparis
              </ThemedText>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowOrdersModal(false)}
            >
              <IconSymbol name="close" size={24} color={COLORS.light.text.secondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary.main} />
            </View>
          ) : selectedDateOrders.length > 0 ? (
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedDateOrders.map((order) => {
                const statusColor = getStatusColor(order.process);
                const statusIcon = getStatusIcon(order.process);
                const products: Product[] = JSON.parse(order.products);
                const total = products.reduce((sum, p) => sum + parseFloat(p.price) * parseInt(p.quantity), 0);

                return (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <View>
                        <ThemedText style={styles.orderNo}>#{order.order_no}</ThemedText>
                        <View style={styles.customerInfo}>
                          <IconSymbol name="account" size={14} color={COLORS.light.text.tertiary} />
                          <ThemedText style={styles.customerName}>{order.customer_name}</ThemedText>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                        <IconSymbol name={statusIcon} size={14} color={statusColor} />
                        <ThemedText style={[styles.statusText, { color: statusColor }]}>
                          {order.process === 'Sipariş Oluşturuldu' ? 'Bekliyor' :
                           order.process === 'Transfer Aşamasında' ? 'Transfer' :
                           order.process === 'Teslim Edildi' ? 'Teslim' : 'Iptal'}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.orderDetails}>
                      <View style={styles.detailRow}>
                        <IconSymbol name="map-marker" size={14} color={COLORS.primary.main} />
                        <ThemedText style={styles.detailText}>
                          {order.customer_city}, {order.customer_country}
                        </ThemedText>
                      </View>
                      <View style={styles.detailRow}>
                        <IconSymbol name="package-variant" size={14} color={COLORS.primary.main} />
                        <ThemedText style={styles.detailText}>
                          {products.length} urun
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.orderFooter}>
                      <ThemedText style={styles.totalLabel}>Toplam</ThemedText>
                      <ThemedText style={styles.totalValue}>${total.toFixed(2)}</ThemedText>
                    </View>
                  </View>
                );
              })}
              <View style={{ height: 20 }} />
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol name="calendar-blank" size={64} color={COLORS.light.border} />
              <ThemedText style={styles.emptyStateTitle}>Siparis Yok</ThemedText>
              <ThemedText style={styles.emptyStateText}>
                Bu tarihte siparis bulunmuyor
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const calendarTheme = {
    backgroundColor: 'transparent',
    calendarBackground: 'transparent',
    textSectionTitleColor: COLORS.light.text.tertiary,
    selectedDayBackgroundColor: COLORS.primary.main,
    selectedDayTextColor: '#ffffff',
    todayTextColor: COLORS.primary.main,
    todayBackgroundColor: `${COLORS.primary.main}15`,
    dayTextColor: COLORS.light.text.primary,
    textDisabledColor: COLORS.light.border,
    dotColor: COLORS.primary.main,
    selectedDotColor: '#ffffff',
    arrowColor: COLORS.primary.main,
    monthTextColor: COLORS.light.text.primary,
    textDayFontSize: 15,
    textMonthFontSize: 18,
    textDayHeaderFontSize: 13,
    textDayFontWeight: '500' as const,
    textMonthFontWeight: '700' as const,
    textDayHeaderFontWeight: '600' as const,
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <LinearGradient
        colors={COLORS.gradients.primary}
        style={styles.headerCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <IconSymbol name="calendar-month" size={28} color="#fff" />
          </View>
          <View>
            <ThemedText style={styles.headerTitle}>Takvim</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Siparislerinizi takip edin
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      {/* View Type Selector */}
      <View style={styles.viewTypeContainer}>
        {renderViewTypeButton('month', 'Ay', 'calendar-month')}
        {renderViewTypeButton('week', 'Hafta', 'calendar-week')}
        {renderViewTypeButton('day', 'Gun', 'calendar-today')}
      </View>

      {/* Stats */}
      {renderStats()}

      {/* Calendar */}
      <View style={styles.calendarContainer}>
        <Calendar
          current={selectedDate}
          onDayPress={handleDayPress}
          markedDates={{
            ...markedDates,
            [selectedDate]: {
              ...(markedDates[selectedDate] || {}),
              selected: true,
              selectedColor: COLORS.primary.main
            }
          }}
          theme={calendarTheme}
          style={styles.calendar}
          enableSwipeMonths={true}
          hideExtraDays={true}
          firstDay={1}
        />
      </View>

      {renderOrdersModal()}

      <View style={{ height: 80 }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  headerCard: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.base,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  viewTypeContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.base,
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    padding: 4,
    ...SHADOWS.sm,
  },
  viewTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    gap: SPACING.xs,
  },
  viewTypeButtonActive: {
    overflow: 'hidden',
  },
  viewTypeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.xs,
    width: '100%',
  },
  viewTypeText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.light.text.tertiary,
  },
  viewTypeTextActive: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: '#FFFFFF',
  },
  statsContainer: {
    paddingHorizontal: SPACING.base,
    marginTop: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: 3,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.light.text.tertiary,
    marginTop: 2,
  },
  calendarContainer: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.md,
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  calendar: {
    borderRadius: RADIUS.xl,
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
    maxHeight: '80%',
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
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
  },
  modalSubtitle: {
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
    padding: SPACING.lg,
  },
  loadingContainer: {
    padding: SPACING['3xl'],
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
  },
  emptyStateTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
    marginTop: SPACING.md,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginTop: SPACING.xs,
  },
  orderCard: {
    backgroundColor: COLORS.light.surfaceVariant,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  orderNo: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
    marginBottom: 4,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.secondary,
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
  orderDetails: {
    marginBottom: SPACING.md,
    gap: SPACING.sm,
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
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.primary.main,
  },
});
