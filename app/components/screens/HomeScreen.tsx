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
  Platform,
  useWindowDimensions,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import ThemedText from '../ThemedText';
import IconSymbol from '../ui/IconSymbol';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, ORDER_STATUS, ANIMATIONS } from '../../../constants/Theme';
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

interface RecentOrder {
  id: number;
  order_no: string;
  customer_name: string;
  date: string;
  process: string;
  products: string;
  total: number;
  currency: string;
}

interface Activity {
  id: number;
  action_type: string;
  entity_type: string;
  entity_name: string;
  description: string;
  user_name: string;
  created_at: string;
}

interface HomeScreenProps {
  onTabChange: (index: number) => void;
  userName: string;
  userRole: string;
  permissions?: string[];
  canCreateOrder?: boolean;
}

export default function HomeScreen({ onTabChange, userName, userRole, permissions = [], canCreateOrder = true }: HomeScreenProps) {
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 600;
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
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [showFinancials, setShowFinancials] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const cardAnims = useRef([...Array(4)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    fetchOrderStats();
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Main fade and slide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        ...ANIMATIONS.spring.default,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...ANIMATIONS.spring.gentle,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card animations
    cardAnims.forEach((anim, index) => {
      setTimeout(() => {
        Animated.spring(anim, {
          toValue: 1,
          ...ANIMATIONS.spring.bouncy,
          useNativeDriver: true,
        }).start();
      }, index * ANIMATIONS.stagger.fast);
    });
  };

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

      // Get recent orders (last 5)
      const recent = orders.slice(0, 5).map((order: any) => ({
        id: order.id,
        order_no: order.order_no,
        customer_name: order.customer_name || 'Müşteri',
        date: order.date,
        process: order.process,
        products: order.products || '[]',
        total: order.total || 0,
        currency: order.currency || 'USD',
      }));

      setRecentOrders(recent);
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

  const fetchActivities = async () => {
    setActivitiesLoading(true);
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.activityLogs);
      const data = await response.json();
      setActivities(data.slice(0, 20)); // Son 20 aktivite
    } catch (error) {
      console.error('Aktiviteler alınamadı:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const openActivities = () => {
    setShowActivities(true);
    fetchActivities();
  };

  const getActivityIcon = (actionType: string, entityType: string) => {
    if (entityType === 'order') {
      if (actionType === 'create') return 'cart-plus';
      if (actionType === 'update') return 'cart-arrow-down';
      if (actionType === 'delete') return 'cart-remove';
    }
    if (entityType === 'user') {
      if (actionType === 'login') return 'login';
      if (actionType === 'logout') return 'logout';
      if (actionType === 'create') return 'account-plus';
    }
    if (entityType === 'payment') return 'cash-multiple';
    if (entityType === 'branch') return 'store';
    if (entityType === 'product') return 'package-variant';
    return 'information-outline';
  };

  const getActivityColor = (actionType: string) => {
    switch (actionType) {
      case 'create': return COLORS.success.main;
      case 'update': return COLORS.info.main;
      case 'delete': return COLORS.error.main;
      case 'login': return COLORS.secondary.teal;
      case 'logout': return COLORS.warning.main;
      default: return COLORS.neutral[500];
    }
  };

  const formatActivityTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
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

  const getStatusConfig = (process: string) => {
    switch (process) {
      case 'Teslim Edildi':
        return ORDER_STATUS.delivered;
      case 'Transfer Aşamasında':
        return ORDER_STATUS.transfer;
      case 'İptal Edildi':
        return ORDER_STATUS.cancelled;
      default:
        return ORDER_STATUS.created;
    }
  };

  const statusCards = [
    {
      title: 'Bekleyen',
      value: stats.pendingOrders,
      color: COLORS.info.main,
      lightColor: COLORS.info.light,
      bgColor: COLORS.info.muted,
      gradient: COLORS.gradients.info,
      icon: 'clock-outline',
    },
    {
      title: 'Transferde',
      value: stats.inTransferOrders,
      color: COLORS.warning.main,
      lightColor: COLORS.warning.light,
      bgColor: COLORS.warning.muted,
      gradient: COLORS.gradients.warning,
      icon: 'truck-outline',
    },
    {
      title: 'Teslim',
      value: stats.deliveredOrders,
      color: COLORS.success.main,
      lightColor: COLORS.success.light,
      bgColor: COLORS.success.muted,
      gradient: COLORS.gradients.success,
      icon: 'check-circle-outline',
    },
    {
      title: 'İptal',
      value: stats.cancelledOrders,
      color: COLORS.error.main,
      lightColor: COLORS.error.light,
      bgColor: COLORS.error.muted,
      gradient: COLORS.gradients.error,
      icon: 'close-circle-outline',
    },
  ];

  const ordersTabIndex = canCreateOrder ? 2 : 1;
  const calendarTabIndex = canCreateOrder ? 3 : 2;

  const quickActions = [
    ...(canCreateOrder ? [{
      title: 'Yeni Sipariş',
      subtitle: 'Sipariş oluştur',
      icon: 'plus',
      gradient: COLORS.gradients.primary,
      onPress: () => onTabChange(1),
    }] : []),
    {
      title: 'Siparişler',
      subtitle: 'Tümünü görüntüle',
      icon: 'format-list-bulleted',
      gradient: COLORS.gradients.purple,
      onPress: () => onTabChange(ordersTabIndex),
    },
    {
      title: 'Takvim',
      subtitle: 'Planla ve takip et',
      icon: 'calendar-outline',
      gradient: COLORS.gradients.cyan,
      onPress: () => onTabChange(calendarTabIndex),
    },
  ];

  const calculateOrderTotal = (productsStr: string) => {
    try {
      const products = JSON.parse(productsStr);
      return products.reduce((sum: number, p: any) => sum + (parseFloat(p.price) * parseInt(p.quantity || '0')), 0);
    } catch {
      return 0;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && {
            paddingHorizontal: SPACING.xl,
            maxWidth: 900,
            alignSelf: 'center',
            width: '100%',
          }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary.accent}
            colors={[COLORS.primary.accent]}
          />
        }
      >
        {/* Header Section */}
        <Animated.View style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
          }
        ]}>
          <View style={styles.greetingSection}>
            <ThemedText style={styles.greeting}>{getGreeting()},</ThemedText>
            <ThemedText style={styles.userName}>{userName || 'Kullanıcı'}</ThemedText>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton} onPress={openActivities}>
              <IconSymbol name="bell-outline" size={22} color={COLORS.light.text.secondary} />
              {activities.length > 0 && <View style={styles.notificationBadge} />}
            </TouchableOpacity>
            <View style={styles.roleTag}>
              <LinearGradient
                colors={COLORS.gradients.primary as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.roleTagGradient}
              >
                <ThemedText style={styles.roleText}>{userRole}</ThemedText>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* Main Stats Card */}
        <Animated.View style={[styles.mainStatsCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={COLORS.gradients.primary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainStatsGradient}
          >
            <View style={styles.mainStatsHeader}>
              <View>
                <ThemedText style={styles.mainStatsLabel}>Toplam Sipariş</ThemedText>
                <ThemedText style={styles.mainStatsValue}>{stats.totalOrders}</ThemedText>
              </View>
              {canViewFinancials && (
                <TouchableOpacity
                  style={styles.financialButton}
                  onPress={() => setShowFinancials(true)}
                >
                  <IconSymbol name="chart-line" size={18} color="#fff" />
                  <ThemedText style={styles.financialButtonText}>Finansal</ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {/* Progress Section */}
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View style={[styles.progressSegment, { backgroundColor: COLORS.success.light, flex: stats.deliveredOrders || 0.1 }]} />
                <View style={[styles.progressSegment, { backgroundColor: COLORS.warning.light, flex: stats.inTransferOrders || 0.1 }]} />
                <View style={[styles.progressSegment, { backgroundColor: '#fff', opacity: 0.5, flex: stats.pendingOrders || 0.1 }]} />
              </View>
              <View style={styles.progressLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.success.light }]} />
                  <ThemedText style={styles.legendText}>Teslim</ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: COLORS.warning.light }]} />
                  <ThemedText style={styles.legendText}>Transfer</ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: 'rgba(255,255,255,0.5)' }]} />
                  <ThemedText style={styles.legendText}>Bekleyen</ThemedText>
                </View>
              </View>
            </View>

            {/* Decorative Elements */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
          </LinearGradient>
        </Animated.View>

        {/* Status Grid */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, isTablet && { fontSize: TYPOGRAPHY.fontSize.xl }]}>Sipariş Durumları</ThemedText>
          <View style={[styles.statusGrid, isTablet && { gap: SPACING.lg }]}>
            {statusCards.map((card, index) => (
              <Animated.View
                key={card.title}
                style={[
                  styles.statusCard,
                  {
                    opacity: cardAnims[index],
                    transform: [{
                      translateY: cardAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    }]
                  }
                ]}
              >
                <LinearGradient
                  colors={card.gradient as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.statusIconContainer}
                >
                  <IconSymbol name={card.icon} size={20} color="#fff" />
                </LinearGradient>
                <ThemedText style={styles.statusValue}>{card.value}</ThemedText>
                <ThemedText style={styles.statusTitle}>{card.title}</ThemedText>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, isTablet && { fontSize: TYPOGRAPHY.fontSize.xl }]}>Hızlı İşlemler</ThemedText>
          <View style={[styles.actionsGrid, isTablet && { gap: SPACING.lg }]}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={action.title}
                style={styles.actionCard}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={action.gradient as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionGradient}
                >
                  <View style={styles.actionIconWrapper}>
                    <IconSymbol name={action.icon} size={24} color="#fff" />
                  </View>
                  <ThemedText style={styles.actionTitle}>{action.title}</ThemedText>
                  <ThemedText style={styles.actionSubtitle}>{action.subtitle}</ThemedText>
                  <View style={styles.actionArrow}>
                    <IconSymbol name="arrow-right" size={18} color="rgba(255,255,255,0.7)" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Son Siparişler</ThemedText>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => onTabChange(ordersTabIndex)}
              >
                <ThemedText style={styles.viewAllText}>Tümü</ThemedText>
                <IconSymbol name="chevron-right" size={16} color={COLORS.primary.accent} />
              </TouchableOpacity>
            </View>
            <View style={styles.recentOrdersList}>
              {recentOrders.map((order, index) => {
                const statusConfig = getStatusConfig(order.process);
                const total = order.total || calculateOrderTotal(order.products);
                const currencySymbol = order.currency === 'EUR' ? '€' : order.currency === 'GBP' ? '£' : order.currency === 'TRY' ? '₺' : '$';
                return (
                  <TouchableOpacity
                    key={`recent-order-${order.id}`}
                    style={[
                      styles.recentOrderCard,
                      index === recentOrders.length - 1 && styles.lastOrderCard
                    ]}
                    activeOpacity={0.7}
                    onPress={() => onTabChange(ordersTabIndex)}
                  >
                    <View style={[styles.orderStatusDot, { backgroundColor: statusConfig.color }]} />
                    <View style={styles.orderInfo}>
                      <ThemedText style={styles.orderCustomer}>{order.customer_name}</ThemedText>
                      <ThemedText style={styles.orderMeta}>
                        #{order.order_no} • {formatDate(order.date)}
                      </ThemedText>
                    </View>
                    <View style={styles.orderRight}>
                      <ThemedText style={styles.orderTotal}>{currencySymbol}{total.toFixed(2)}</ThemedText>
                      <View style={[styles.orderStatusBadge, { backgroundColor: statusConfig.bgColor }]}>
                        <ThemedText style={[styles.orderStatusText, { color: statusConfig.textColor }]}>
                          {statusConfig.label}
                        </ThemedText>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Revenue Summary for Patron */}
        {canViewFinancials && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Bu Ay Özet</ThemedText>
            <View style={styles.revenueCard}>
              <View style={styles.revenueItem}>
                <View style={[styles.revenueIconBg, { backgroundColor: COLORS.success.muted }]}>
                  <IconSymbol name="trending-up" size={20} color={COLORS.success.main} />
                </View>
                <View style={styles.revenueContent}>
                  <ThemedText style={styles.revenueLabel}>Gelir</ThemedText>
                  <ThemedText style={[styles.revenueValue, { color: COLORS.success.main }]}>
                    {formatCurrency(stats.monthlyRevenue)}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.revenueDivider} />
              <View style={styles.revenueItem}>
                <View style={[styles.revenueIconBg, { backgroundColor: COLORS.error.muted }]}>
                  <IconSymbol name="trending-down" size={20} color={COLORS.error.main} />
                </View>
                <View style={styles.revenueContent}>
                  <ThemedText style={styles.revenueLabel}>Gider</ThemedText>
                  <ThemedText style={[styles.revenueValue, { color: COLORS.error.main }]}>
                    {formatCurrency(stats.monthlyExpenses)}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.revenueDivider} />
              <View style={styles.revenueItem}>
                <View style={[styles.revenueIconBg, { backgroundColor: COLORS.primary.accent + '20' }]}>
                  <IconSymbol name="wallet-outline" size={20} color={COLORS.primary.accent} />
                </View>
                <View style={styles.revenueContent}>
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
              <LinearGradient
                colors={COLORS.gradients.success as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.financialCardGradient}
              >
                <View style={styles.financialCardIcon}>
                  <IconSymbol name="trending-up" size={28} color="#fff" />
                </View>
                <ThemedText style={styles.financialCardLabel}>Aylık Gelir</ThemedText>
                <ThemedText style={styles.financialCardValue}>
                  {formatCurrency(stats.monthlyRevenue)}
                </ThemedText>
              </LinearGradient>
            </View>

            {/* Expense Card */}
            <View style={styles.financialCard}>
              <LinearGradient
                colors={COLORS.gradients.error as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.financialCardGradient}
              >
                <View style={styles.financialCardIcon}>
                  <IconSymbol name="trending-down" size={28} color="#fff" />
                </View>
                <ThemedText style={styles.financialCardLabel}>Aylık Gider</ThemedText>
                <ThemedText style={styles.financialCardValue}>
                  {formatCurrency(stats.monthlyExpenses)}
                </ThemedText>
              </LinearGradient>
            </View>

            {/* Profit Card */}
            <View style={styles.financialCard}>
              <LinearGradient
                colors={COLORS.gradients.primary as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.financialCardGradient}
              >
                <View style={styles.financialCardIcon}>
                  <IconSymbol name="wallet-outline" size={28} color="#fff" />
                </View>
                <ThemedText style={styles.financialCardLabel}>Net Kar</ThemedText>
                <ThemedText style={styles.financialCardValue}>
                  {formatCurrency(stats.netProfit)}
                </ThemedText>
                <View style={styles.profitMarginRow}>
                  <ThemedText style={styles.profitMarginLabel}>Kar Marjı</ThemedText>
                  <ThemedText style={styles.profitMarginValue}>
                    {stats.monthlyRevenue > 0
                      ? `${((stats.netProfit / stats.monthlyRevenue) * 100).toFixed(1)}%`
                      : '0%'}
                  </ThemedText>
                </View>
              </LinearGradient>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Activities Modal */}
      <Modal
        visible={showActivities}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowActivities(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowActivities(false)}
            >
              <IconSymbol name="close" size={24} color={COLORS.light.text.primary} />
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>Son Aktiviteler</ThemedText>
            <TouchableOpacity
              style={styles.refreshActivitiesBtn}
              onPress={fetchActivities}
            >
              <IconSymbol name="refresh" size={20} color={COLORS.primary.accent} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.activityScrollContent}>
            {activitiesLoading ? (
              <View style={styles.activityLoading}>
                <ThemedText style={styles.activityLoadingText}>Yükleniyor...</ThemedText>
              </View>
            ) : activities.length === 0 ? (
              <View style={styles.activityEmpty}>
                <IconSymbol name="bell-off-outline" size={48} color={COLORS.neutral[300]} />
                <ThemedText style={styles.activityEmptyText}>Henüz aktivite yok</ThemedText>
              </View>
            ) : (
              activities.map((activity, index) => (
                <View key={activity.id || index} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.action_type) + '20' }]}>
                    <IconSymbol
                      name={getActivityIcon(activity.action_type, activity.entity_type)}
                      size={20}
                      color={getActivityColor(activity.action_type)}
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <ThemedText style={styles.activityTitle} numberOfLines={2}>
                      {activity.description || `${activity.entity_type} ${activity.action_type}`}
                    </ThemedText>
                    <View style={styles.activityMeta}>
                      {activity.user_name && (
                        <ThemedText style={styles.activityUser}>{activity.user_name}</ThemedText>
                      )}
                      <ThemedText style={styles.activityTime}>
                        {formatActivityTime(activity.created_at)}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              ))
            )}
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
    paddingBottom: 120,
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
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  userName: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    marginTop: SPACING.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error.main,
    borderWidth: 2,
    borderColor: COLORS.light.surface,
  },
  roleTag: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  roleTagGradient: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  roleText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: '#fff',
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },

  // Main Stats Card
  mainStatsCard: {
    marginHorizontal: SPACING.base,
    borderRadius: RADIUS['3xl'],
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    ...SHADOWS.xl,
  },
  mainStatsGradient: {
    padding: SPACING.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  mainStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
  },
  mainStatsLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  mainStatsValue: {
    fontSize: TYPOGRAPHY.fontSize['5xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
  },
  financialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  financialButtonText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: '#fff',
  },
  decorCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -30,
    right: 50,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  // Progress Section
  progressSection: {
    marginTop: SPACING.sm,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: 'rgba(255,255,255,0.8)',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Section
  section: {
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: TYPOGRAPHY.letterSpacing.wider,
    marginBottom: SPACING.base,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.base,
  },
  viewAllText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.primary.accent,
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
    borderRadius: RADIUS['2xl'],
    padding: SPACING.base,
    ...SHADOWS.md,
  },
  statusIconContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statusValue: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
    marginBottom: SPACING.xs,
  },
  statusTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionCard: {
    flex: 1,
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  actionGradient: {
    padding: SPACING.base,
    minHeight: 140,
    position: 'relative',
  },
  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  actionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
    marginBottom: SPACING.xs,
  },
  actionSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  actionArrow: {
    position: 'absolute',
    bottom: SPACING.base,
    right: SPACING.base,
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Recent Orders
  recentOrdersList: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  recentOrderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.divider,
  },
  lastOrderCard: {
    borderBottomWidth: 0,
  },
  orderStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.md,
  },
  orderInfo: {
    flex: 1,
  },
  orderCustomer: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: COLORS.light.text.primary,
  },
  orderMeta: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.light.text.tertiary,
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
    marginBottom: SPACING.xs,
  },
  orderStatusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  orderStatusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },

  // Revenue Card
  revenueCard: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.base,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  revenueItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  revenueIconBg: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  revenueContent: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.light.text.tertiary,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  revenueValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginTop: 2,
  },
  revenueDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.light.divider,
    marginHorizontal: SPACING.sm,
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
    fontWeight: TYPOGRAPHY.fontWeight.bold,
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
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  financialCardGradient: {
    padding: SPACING.xl,
  },
  financialCardIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  financialCardLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginBottom: SPACING.xs,
  },
  financialCardValue: {
    fontSize: TYPOGRAPHY.fontSize['4xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
  },
  profitMarginRow: {
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
    color: 'rgba(255,255,255,0.8)',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  profitMarginValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: '#fff',
  },

  // Activity Styles
  refreshActivitiesBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityScrollContent: {
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  activityLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
  },
  activityLoadingText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.neutral[500],
    marginTop: SPACING.md,
  },
  activityEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
  },
  activityEmptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.neutral[400],
    marginTop: SPACING.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.light.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    color: COLORS.light.text.primary,
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  activityUser: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary.accent,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  activityTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.neutral[400],
  },
});
