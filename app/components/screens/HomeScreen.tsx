import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Animated,
  RefreshControl,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import ThemedText from '../ThemedText';
import IconSymbol from '../ui/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../constants/Theme';

const { width } = Dimensions.get('window');
const cardWidth = (width - SPACING.base * 3) / 2;

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

interface StatCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  gradient: string[];
  trend?: string;
  trendUp?: boolean;
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
  const [showReports, setShowReports] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardAnimations = useRef([...Array(8)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    fetchOrderStats();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card animations
    cardAnimations.forEach((anim, index) => {
      setTimeout(() => {
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }, index * 100);
    });
  };

  const fetchOrderStats = async () => {
    try {
      const response = await fetch('http://192.168.0.13:3000/api/orders');
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

      const netProfit = monthlyRevenue - monthlyExpenses;

      setStats({
        totalOrders,
        monthlyRevenue,
        monthlyExpenses,
        netProfit,
        deliveredOrders,
        inTransferOrders,
        cancelledOrders,
        pendingOrders,
      });
    } catch (error) {
      console.error('Istatistikler yuklenirken hata:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderStats();
  };

  const canViewFinancials = userRole === 'Patron' || permissions.includes('finansal_goruntuleme');
  const canViewReports = userRole === 'Patron' || permissions.includes('rapor_goruntuleme');
  const canCreateOrder = userRole !== 'Depo Görevlisi' && userRole !== 'Lojistik Sorumlusu';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Gunaydin';
    if (hour < 18) return 'Iyi gunler';
    return 'Iyi aksamlar';
  };

  const statusCards: StatCard[] = [
    {
      title: 'Toplam Siparis',
      value: stats.totalOrders.toString(),
      icon: 'package-variant',
      color: COLORS.primary.main,
      gradient: COLORS.gradients.primary,
    },
    {
      title: 'Bekleyen',
      value: stats.pendingOrders.toString(),
      icon: 'clock-outline',
      color: COLORS.info.main,
      gradient: COLORS.gradients.info,
    },
    {
      title: 'Transferde',
      value: stats.inTransferOrders.toString(),
      icon: 'truck-fast-outline',
      color: COLORS.warning.main,
      gradient: COLORS.gradients.warning,
    },
    {
      title: 'Teslim Edildi',
      value: stats.deliveredOrders.toString(),
      icon: 'check-circle-outline',
      color: COLORS.success.main,
      gradient: COLORS.gradients.success,
    },
  ];

  const financeCards: StatCard[] = canViewFinancials ? [
    {
      title: 'Aylik Ciro',
      value: `$${stats.monthlyRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
      icon: 'trending-up',
      color: COLORS.info.main,
      gradient: COLORS.gradients.info,
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: 'Giderler',
      value: `$${stats.monthlyExpenses.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
      icon: 'trending-down',
      color: COLORS.error.main,
      gradient: COLORS.gradients.error,
      trend: '-3.2%',
      trendUp: false,
    },
    {
      title: 'Net Kar',
      value: `$${stats.netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
      icon: 'chart-line',
      color: COLORS.success.main,
      gradient: COLORS.gradients.success,
      trend: '+8.7%',
      trendUp: true,
    },
  ] : [];

  const renderStatCard = (stat: StatCard, index: number, isLarge: boolean = false) => {
    const animation = cardAnimations[index] || new Animated.Value(1);
    const scale = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    return (
      <Animated.View
        key={stat.title}
        style={[
          isLarge ? styles.financeCard : styles.statusCard,
          { opacity: animation, transform: [{ scale }] }
        ]}
      >
        <TouchableOpacity activeOpacity={0.8} style={styles.cardTouchable}>
          <LinearGradient
            colors={stat.gradient}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <IconSymbol name={stat.icon} size={isLarge ? 28 : 24} color="#fff" />
              </View>
              {stat.trend && (
                <View style={[
                  styles.trendBadge,
                  { backgroundColor: stat.trendUp ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)' }
                ]}>
                  <IconSymbol
                    name={stat.trendUp ? 'arrow-up' : 'arrow-down'}
                    size={12}
                    color="#fff"
                  />
                  <ThemedText style={styles.trendText}>{stat.trend}</ThemedText>
                </View>
              )}
            </View>
            <View style={styles.cardContent}>
              <ThemedText style={[styles.cardValue, isLarge && styles.cardValueLarge]}>
                {stat.value}
              </ThemedText>
              <ThemedText style={styles.cardTitle}>{stat.title}</ThemedText>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderQuickAction = (
    title: string,
    subtitle: string,
    icon: string,
    gradient: string[],
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={styles.quickAction}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={gradient}
        style={styles.quickActionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.quickActionIcon}>
          <IconSymbol name={icon} size={28} color="#fff" />
        </View>
        <View style={styles.quickActionText}>
          <ThemedText style={styles.quickActionTitle}>{title}</ThemedText>
          <ThemedText style={styles.quickActionSubtitle}>{subtitle}</ThemedText>
        </View>
        <IconSymbol name="chevron-right" size={24} color="rgba(255,255,255,0.7)" />
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderReportsModal = () => (
    <Modal
      visible={showReports}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowReports(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Finansal Ozet</ThemedText>
            <TouchableOpacity
              onPress={() => setShowReports(false)}
              style={styles.modalCloseButton}
            >
              <IconSymbol name="close" size={24} color={COLORS.light.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {/* Summary Cards */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: COLORS.info.bg }]}>
                <IconSymbol name="cash-multiple" size={32} color={COLORS.info.main} />
                <ThemedText style={styles.summaryLabel}>Toplam Satis</ThemedText>
                <ThemedText style={[styles.summaryValue, { color: COLORS.info.main }]}>
                  ${stats.monthlyRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </ThemedText>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: COLORS.error.bg }]}>
                <IconSymbol name="cash-minus" size={32} color={COLORS.error.main} />
                <ThemedText style={styles.summaryLabel}>Toplam Gider</ThemedText>
                <ThemedText style={[styles.summaryValue, { color: COLORS.error.main }]}>
                  ${stats.monthlyExpenses.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </ThemedText>
              </View>
            </View>

            {/* Net Profit Card */}
            <LinearGradient
              colors={COLORS.gradients.success}
              style={styles.profitCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.profitContent}>
                <ThemedText style={styles.profitLabel}>Net Kar</ThemedText>
                <ThemedText style={styles.profitValue}>
                  ${stats.netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </ThemedText>
              </View>
              <IconSymbol name="chart-areaspline" size={48} color="rgba(255,255,255,0.3)" />
            </LinearGradient>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statItemValue}>{stats.totalOrders}</ThemedText>
                <ThemedText style={styles.statItemLabel}>Toplam Siparis</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statItemValue}>
                  ${stats.totalOrders > 0 ? (stats.monthlyRevenue / stats.totalOrders).toFixed(0) : '0'}
                </ThemedText>
                <ThemedText style={styles.statItemLabel}>Ort. Siparis</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statItemValue}>
                  {stats.totalOrders > 0 ? ((stats.deliveredOrders / stats.totalOrders) * 100).toFixed(0) : '0'}%
                </ThemedText>
                <ThemedText style={styles.statItemLabel}>Teslim Orani</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statItemValue}>
                  {stats.totalOrders > 0 ? ((stats.netProfit / stats.monthlyRevenue) * 100).toFixed(0) : '0'}%
                </ThemedText>
                <ThemedText style={styles.statItemLabel}>Kar Marji</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
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
      {/* Welcome Header */}
      <Animated.View style={[
        styles.welcomeSection,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        <View style={styles.welcomeContent}>
          <ThemedText style={styles.greeting}>{getGreeting()}</ThemedText>
          <ThemedText style={styles.userName}>{userName}</ThemedText>
          <View style={styles.dateContainer}>
            <IconSymbol name="calendar-today" size={14} color={COLORS.light.text.tertiary} />
            <ThemedText style={styles.dateText}>
              {new Date().toLocaleDateString('tr-TR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </ThemedText>
          </View>
        </View>
        <View style={styles.roleBadge}>
          <LinearGradient
            colors={COLORS.gradients.primary}
            style={styles.roleBadgeGradient}
          >
            <IconSymbol name="shield-account" size={16} color="#fff" />
            <ThemedText style={styles.roleText}>{userRole}</ThemedText>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Status Cards */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Siparis Durumu</ThemedText>
        <View style={styles.statusGrid}>
          {statusCards.map((card, index) => renderStatCard(card, index))}
        </View>
      </View>

      {/* Finance Cards */}
      {canViewFinancials && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Finansal Ozet</ThemedText>
            {canViewReports && (
              <TouchableOpacity onPress={() => setShowReports(true)}>
                <ThemedText style={styles.seeAllText}>Detaylar</ThemedText>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.financeGrid}>
            {financeCards.map((card, index) => renderStatCard(card, index + 4, true))}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Hizli Islemler</ThemedText>
        <View style={styles.quickActionsContainer}>
          {canCreateOrder && renderQuickAction(
            'Yeni Siparis',
            'Hizlica siparis olustur',
            'plus-circle',
            COLORS.gradients.primary,
            () => onTabChange(1)
          )}
          {renderQuickAction(
            'Siparisleri Gor',
            'Tum siparisleri listele',
            'format-list-bulleted',
            COLORS.gradients.secondary,
            () => onTabChange(canCreateOrder ? 2 : 1)
          )}
        </View>
      </View>

      {/* Bottom Padding for Navigation */}
      <View style={{ height: 100 }} />

      {renderReportsModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  scrollContent: {
    paddingTop: SPACING.base,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.xl,
  },
  welcomeContent: {
    flex: 1,
  },
  greeting: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.light.text.tertiary,
    marginBottom: SPACING.xs,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
    marginBottom: SPACING.sm,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dateText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
  roleBadge: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  roleBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  roleText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: '#FFFFFF',
  },
  section: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
    marginBottom: SPACING.md,
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.primary.main,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statusCard: {
    width: cardWidth,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  financeGrid: {
    gap: SPACING.md,
  },
  financeCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  cardTouchable: {
    flex: 1,
  },
  cardGradient: {
    padding: SPACING.base,
    minHeight: 120,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.full,
    gap: 2,
  },
  trendText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: '#FFFFFF',
  },
  cardContent: {
    marginTop: 'auto',
  },
  cardValue: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardValueLarge: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  quickActionsContainer: {
    gap: SPACING.md,
  },
  quickAction: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
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
    maxHeight: '85%',
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
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.light.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: SPACING.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  summaryCard: {
    flex: 1,
    padding: SPACING.base,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.secondary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  profitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.lg,
  },
  profitContent: {
    flex: 1,
  },
  profitLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.xs,
  },
  profitValue: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.light.surfaceVariant,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  statItem: {
    width: '50%',
    padding: SPACING.base,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: COLORS.light.border,
  },
  statItemValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
    marginBottom: SPACING.xs,
  },
  statItemLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
  },
});
