import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
  RefreshControl,
  StatusBar,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import ThemedText from '../ThemedText';
import IconSymbol from '../ui/IconSymbol';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ORDER_STATUS } from '../../../constants/Theme';
import { API_ENDPOINTS, fetchWithTimeout } from '../../../constants/Api';

const { width } = Dimensions.get('window');

interface OrderStats {
  totalOrders: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
  deliveredOrders: number;
  inTransferOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
}

interface HomeScreenProps {
  onTabChange: (index: number) => void;
  userName: string;
  userRole: string;
  permissions?: string[];
}

export default function HomeScreen({ onTabChange, userName, userRole, permissions = [] }: HomeScreenProps) {
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    netProfit: 0,
    deliveredOrders: 0,
    inTransferOrders: 0,
    cancelledOrders: 0,
    pendingOrders: 0,
  });
  const [showFinancials, setShowFinancials] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fetchOrderStats();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchOrderStats = async () => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.orders);
      const orders = await response.json();

      const totalOrders = orders.length;
      const deliveredOrders = orders.filter((order: any) => order.process === 'Teslim Edildi').length;
      const inTransferOrders = orders.filter((order: any) => order.process === 'Transfer Aşamasında').length;
      const cancelledOrders = orders.filter((order: any) => order.process === 'İptal Edildi').length;
      const pendingOrders = orders.filter((order: any) => order.process === 'Sipariş Oluşturuldu').length;

      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      let monthlyRevenue = 0;
      let monthlyExpenses = 0;

      orders.forEach((order: any) => {
        const orderDate = new Date(order.date);
        if (orderDate >= firstDayOfMonth) {
          const products = JSON.parse(order.products);
          products.forEach((product: any) => {
            const price = parseFloat(product.price) || 0;
            const cost = parseFloat(product.cost) || 0;
            const quantity = parseInt(product.quantity) || 0;
            monthlyRevenue += price * quantity;
            monthlyExpenses += cost * quantity;
          });
        }
      });

      setStats({
        totalOrders,
        monthlyRevenue,
        monthlyExpenses,
        netProfit: monthlyRevenue - monthlyExpenses,
        deliveredOrders,
        inTransferOrders,
        cancelledOrders,
        pendingOrders,
      });
    } catch (error) {
      console.error('Istatistikler alinirken hata:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderStats();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  const canViewFinancials = userRole === 'Patron' || permissions.includes('finansal_goruntuleme');

  const statusCards = [
    {
      title: 'Bekleyen',
      value: stats.pendingOrders,
      color: COLORS.info.main,
      bgColor: COLORS.info.muted,
      icon: 'clock-outline',
    },
    {
      title: 'Transferde',
      value: stats.inTransferOrders,
      color: COLORS.warning.main,
      bgColor: COLORS.warning.muted,
      icon: 'truck-outline',
    },
    {
      title: 'Teslim Edildi',
      value: stats.deliveredOrders,
      color: COLORS.success.main,
      bgColor: COLORS.success.muted,
      icon: 'check-circle-outline',
    },
    {
      title: 'İptal',
      value: stats.cancelledOrders,
      color: COLORS.error.main,
      bgColor: COLORS.error.muted,
      icon: 'close-circle-outline',
    },
  ];

  const quickActions = [
    {
      title: 'Yeni Sipariş',
      subtitle: 'Sipariş oluştur',
      icon: 'plus',
      onPress: () => onTabChange(1),
    },
    {
      title: 'Siparişler',
      subtitle: 'Tümünü gör',
      icon: 'format-list-bulleted',
      onPress: () => onTabChange(2),
    },
    {
      title: 'Takvim',
      subtitle: 'Planla',
      icon: 'calendar-outline',
      onPress: () => onTabChange(3),
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary.main} />
        }
      >
        {/* Header Section */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.greetingSection}>
            <ThemedText style={styles.greeting}>{getGreeting()},</ThemedText>
            <ThemedText style={styles.userName}>{userName || 'Kullanıcı'}</ThemedText>
          </View>
          <View style={styles.roleTag}>
            <ThemedText style={styles.roleText}>{userRole}</ThemedText>
          </View>
        </Animated.View>

        {/* Stats Overview Card */}
        <Animated.View style={[styles.overviewCard, { opacity: fadeAnim }]}>
          <View style={styles.overviewHeader}>
            <View>
              <ThemedText style={styles.overviewLabel}>Toplam Sipariş</ThemedText>
              <ThemedText style={styles.overviewValue}>{stats.totalOrders}</ThemedText>
            </View>
            {canViewFinancials && (
              <TouchableOpacity
                style={styles.financialButton}
                onPress={() => setShowFinancials(true)}
              >
                <IconSymbol name="chart-line" size={18} color={COLORS.primary.accent} />
                <ThemedText style={styles.financialButtonText}>Finansal</ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: COLORS.success.main,
                    flex: stats.deliveredOrders || 0.1,
                  }
                ]}
              />
              <View
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: COLORS.warning.main,
                    flex: stats.inTransferOrders || 0.1,
                  }
                ]}
              />
              <View
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: COLORS.info.main,
                    flex: stats.pendingOrders || 0.1,
                  }
                ]}
              />
            </View>
            <View style={styles.progressLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.success.main }]} />
                <ThemedText style={styles.legendText}>Teslim</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.warning.main }]} />
                <ThemedText style={styles.legendText}>Transfer</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.info.main }]} />
                <ThemedText style={styles.legendText}>Bekleyen</ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Status Grid */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Sipariş Durumları</ThemedText>
          <View style={styles.statusGrid}>
            {statusCards.map((card, index) => (
              <Animated.View
                key={card.title}
                style={[
                  styles.statusCard,
                  { opacity: fadeAnim }
                ]}
              >
                <View style={[styles.statusIconContainer, { backgroundColor: card.bgColor }]}>
                  <IconSymbol name={card.icon} size={20} color={card.color} />
                </View>
                <ThemedText style={styles.statusValue}>{card.value}</ThemedText>
                <ThemedText style={styles.statusTitle}>{card.title}</ThemedText>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Hızlı İşlemler</ThemedText>
          <View style={styles.actionsContainer}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={action.title}
                style={styles.actionCard}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconContainer}>
                  <IconSymbol name={action.icon} size={22} color={COLORS.light.text.primary} />
                </View>
                <View style={styles.actionContent}>
                  <ThemedText style={styles.actionTitle}>{action.title}</ThemedText>
                  <ThemedText style={styles.actionSubtitle}>{action.subtitle}</ThemedText>
                </View>
                <IconSymbol name="chevron-right" size={20} color={COLORS.light.text.tertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Revenue Summary for Patron */}
        {canViewFinancials && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Bu Ay</ThemedText>
            <View style={styles.revenueCard}>
              <View style={styles.revenueRow}>
                <View style={styles.revenueItem}>
                  <ThemedText style={styles.revenueLabel}>Gelir</ThemedText>
                  <ThemedText style={[styles.revenueValue, { color: COLORS.success.main }]}>
                    {formatCurrency(stats.monthlyRevenue)}
                  </ThemedText>
                </View>
                <View style={styles.revenueDivider} />
                <View style={styles.revenueItem}>
                  <ThemedText style={styles.revenueLabel}>Gider</ThemedText>
                  <ThemedText style={[styles.revenueValue, { color: COLORS.error.main }]}>
                    {formatCurrency(stats.monthlyExpenses)}
                  </ThemedText>
                </View>
                <View style={styles.revenueDivider} />
                <View style={styles.revenueItem}>
                  <ThemedText style={styles.revenueLabel}>Net Kar</ThemedText>
                  <ThemedText style={[styles.revenueValue, { color: COLORS.light.text.primary }]}>
                    {formatCurrency(stats.netProfit)}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Financial Details Modal */}
      <Modal
        visible={showFinancials}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFinancials(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFinancials(false)}
            >
              <IconSymbol name="close" size={24} color={COLORS.light.text.primary} />
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>Finansal Özet</ThemedText>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
            {/* Revenue Card */}
            <View style={styles.financialCard}>
              <View style={styles.financialCardHeader}>
                <View style={[styles.financialIconContainer, { backgroundColor: COLORS.success.muted }]}>
                  <IconSymbol name="trending-up" size={24} color={COLORS.success.main} />
                </View>
                <ThemedText style={styles.financialCardTitle}>Aylık Gelir</ThemedText>
              </View>
              <ThemedText style={[styles.financialCardValue, { color: COLORS.success.main }]}>
                {formatCurrency(stats.monthlyRevenue)}
              </ThemedText>
            </View>

            {/* Expense Card */}
            <View style={styles.financialCard}>
              <View style={styles.financialCardHeader}>
                <View style={[styles.financialIconContainer, { backgroundColor: COLORS.error.muted }]}>
                  <IconSymbol name="trending-down" size={24} color={COLORS.error.main} />
                </View>
                <ThemedText style={styles.financialCardTitle}>Aylık Gider</ThemedText>
              </View>
              <ThemedText style={[styles.financialCardValue, { color: COLORS.error.main }]}>
                {formatCurrency(stats.monthlyExpenses)}
              </ThemedText>
            </View>

            {/* Profit Card */}
            <View style={[styles.financialCard, styles.profitCard]}>
              <View style={styles.financialCardHeader}>
                <View style={[styles.financialIconContainer, { backgroundColor: COLORS.light.surfaceSecondary }]}>
                  <IconSymbol name="wallet-outline" size={24} color={COLORS.light.text.primary} />
                </View>
                <ThemedText style={styles.financialCardTitle}>Net Kar</ThemedText>
              </View>
              <ThemedText style={styles.profitValue}>
                {formatCurrency(stats.netProfit)}
              </ThemedText>
              <View style={styles.profitMargin}>
                <ThemedText style={styles.profitMarginLabel}>Kar Marjı</ThemedText>
                <ThemedText style={styles.profitMarginValue}>
                  {stats.monthlyRevenue > 0
                    ? `${((stats.netProfit / stats.monthlyRevenue) * 100).toFixed(1)}%`
                    : '0%'}
                </ThemedText>
              </View>
            </View>
          </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.xl,
  },
  greetingSection: {},
  greeting: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.tertiary,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
    letterSpacing: -0.5,
    marginTop: SPACING.xs,
  },
  roleTag: {
    backgroundColor: COLORS.light.surfaceSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  roleText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.secondary,
  },

  // Overview Card
  overviewCard: {
    backgroundColor: COLORS.light.surface,
    marginHorizontal: SPACING.base,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    marginBottom: SPACING.xl,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  overviewLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginBottom: SPACING.xs,
  },
  overviewValue: {
    fontSize: TYPOGRAPHY.fontSize['4xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
    letterSpacing: -1,
  },
  financialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light.surfaceSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  financialButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary.accent,
  },

  // Progress Section
  progressSection: {},
  progressBar: {
    height: 8,
    backgroundColor: COLORS.light.surfaceSecondary,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressSegment: {
    height: '100%',
  },
  progressLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
  },
  legendText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.light.text.tertiary,
  },

  // Section
  section: {
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.base,
  },

  // Status Grid
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statusCard: {
    width: (width - SPACING.base * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.base,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
    marginBottom: SPACING.xs,
  },
  statusTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },

  // Actions
  actionsContainer: {
    gap: SPACING.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.light.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  actionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginTop: 2,
  },

  // Revenue Card
  revenueCard: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  revenueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  revenueItem: {
    flex: 1,
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.light.text.tertiary,
    marginBottom: SPACING.xs,
  },
  revenueValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  revenueDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.light.divider,
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
    gap: SPACING.md,
  },

  // Financial Cards
  financialCard: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  financialCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  financialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  financialCardTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.light.text.secondary,
  },
  financialCardValue: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  profitCard: {
    backgroundColor: COLORS.primary.main,
  },
  profitValue: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.inverse,
  },
  profitMargin: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  profitMarginLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  profitMarginValue: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.inverse,
  },
});
