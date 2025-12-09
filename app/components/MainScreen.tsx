import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useRef, useEffect } from 'react';
import IconSymbol from './ui/IconSymbol';
import ThemedText from './ThemedText';
import { router, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants/Theme';
import { API_ENDPOINTS, fetchWithTimeout } from '../../constants/Api';

// Import screens
import HomeScreen from './screens/HomeScreen';
import CreateOrderScreen from './screens/CreateOrderScreen';
import OrdersScreen from './screens/OrdersScreen';
import CalendarScreen from './screens/CalendarScreen';
import SettingsScreen from './screens/SettingsScreen';

const { width, height } = Dimensions.get('window');

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

interface TabItem {
  icon: string;
  iconFilled: string;
  label: string;
  component: React.ComponentType<any>;
}

export default function MainScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const insets = useSafeAreaInsets();
  const { userName, userRole, permissions: permissionsStr } = useLocalSearchParams();
  const permissions = permissionsStr ? JSON.parse(permissionsStr as string) : [];

  // Animation refs
  const tabAnimations = useRef<Animated.Value[]>([]).current;
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  const handleLogout = () => {
    Alert.alert(
      'Cikis Yap',
      'Hesabinizdan cikis yapmak istediginize emin misiniz?',
      [
        { text: 'Iptal', style: 'cancel' },
        {
          text: 'Cikis Yap',
          style: 'destructive',
          onPress: () => router.replace('/')
        }
      ]
    );
  };

  const allTabs: TabItem[] = [
    { icon: 'home-outline', iconFilled: 'home', label: 'Ana Sayfa', component: HomeScreen },
    { icon: 'plus-box-outline', iconFilled: 'plus-box', label: 'Siparis', component: CreateOrderScreen },
    { icon: 'shopping-outline', iconFilled: 'shopping', label: 'Siparisler', component: OrdersScreen },
    { icon: 'calendar-outline', iconFilled: 'calendar', label: 'Takvim', component: CalendarScreen },
    { icon: 'cog-outline', iconFilled: 'cog', label: 'Ayarlar', component: SettingsScreen },
  ];

  // Filter tabs based on user role
  const tabs = allTabs.filter(tab => {
    if (tab.label === 'Siparis') {
      return userRole !== 'Depo Görevlisi' && userRole !== 'Lojistik Sorumlusu';
    }
    return true;
  });

  // Initialize animations
  useEffect(() => {
    tabs.forEach((_, index) => {
      if (!tabAnimations[index]) {
        tabAnimations[index] = new Animated.Value(index === 0 ? 1 : 0);
      }
    });

    // Header fade in
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const getCurrentScreen = () => {
    const currentTab = tabs[activeTab];
    switch (currentTab.label) {
      case 'Ana Sayfa':
        return <HomeScreen onTabChange={handleTabPress} userName={userName as string} userRole={userRole as string} permissions={permissions} />;
      case 'Siparis':
        return <CreateOrderScreen />;
      case 'Siparisler':
        return <OrdersScreen />;
      case 'Takvim':
        return <CalendarScreen />;
      case 'Ayarlar':
        return <SettingsScreen userRole={userRole as string} />;
      default:
        return <HomeScreen onTabChange={handleTabPress} userName={userName as string} userRole={userRole as string} permissions={permissions} />;
    }
  };

  const handleTabPress = (index: number) => {
    if (index === activeTab) return;

    // Animate out old tab
    Animated.timing(tabAnimations[activeTab], {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Animate in new tab
    Animated.spring(tabAnimations[index], {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Move indicator
    const tabWidth = (width - 40) / tabs.length;
    Animated.spring(indicatorPosition, {
      toValue: index * tabWidth,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    setActiveTab(index);
  };

  const generateCSV = async () => {
    try {
      const response = await fetchWithTimeout(API_ENDPOINTS.orders);
      const orders: Order[] = await response.json();

      const headers = [
        'Siparis No', 'Tarih', 'Musteri Adi', 'Ulke', 'Sehir', 'Telefon',
        'Email', 'Satis Temsilcisi', 'Konferans', 'Acenta', 'Rehber', 'Durum',
        'Urunler', 'Toplam Tutar'
      ].join(',');

      const rows = orders.map((order: Order) => {
        const products: Product[] = JSON.parse(order.products);
        const totalAmount = products.reduce((sum: number, product: Product) => {
          return sum + (parseFloat(product.price) * parseInt(product.quantity));
        }, 0);

        return [
          order.order_no,
          new Date(order.date).toLocaleDateString('tr-TR'),
          order.customer_name,
          order.customer_country,
          order.customer_city,
          order.customer_phone,
          order.customer_email,
          order.salesman,
          order.conference,
          order.agency,
          order.guide,
          order.process,
          products.map((p: Product) => `${p.name}(${p.quantity})`).join(';'),
          totalAmount.toFixed(2)
        ].join(',');
      });

      const csvContent = [headers, ...rows].join('\n');
      const fileName = `siparisler_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent, {
        encoding: FileSystem.EncodingType.UTF8
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Siparisler Raporu',
          UTI: 'public.comma-separated-values-text'
        });
      }
    } catch (error) {
      console.error('CSV olusturma hatasi:', error);
      Alert.alert('Hata', 'Belge olusturulurken bir hata olustu.');
    }
  };

  const tabWidth = (width - 40) / tabs.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <Animated.View style={[
        styles.headerContainer,
        { paddingTop: insets.top || 20, opacity: headerOpacity }
      ]}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            {/* Logo and Brand */}
            <View style={styles.headerLeft}>
              <View style={styles.logoWrapper}>
                <LinearGradient
                  colors={COLORS.gradients.primary}
                  style={styles.logoGradient}
                >
                  <Image
                    source={require('../../assets/images/aicologo.png')}
                    style={styles.headerLogo}
                    resizeMode="contain"
                  />
                </LinearGradient>
              </View>
              <View style={styles.brandInfo}>
                <ThemedText style={styles.headerTitle}>Koyuncu Hali</ThemedText>
                <ThemedText style={styles.headerSubtitle}>{userRole}</ThemedText>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.headerRight}>
              {tabs[activeTab].label === 'Siparisler' &&
               (userRole === 'Patron' ||
                userRole === 'Operasyon Sorumlusu' ||
                permissions.includes('belge_olusturma')) && (
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={generateCSV}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={COLORS.gradients.primary}
                    style={styles.exportButtonGradient}
                  >
                    <IconSymbol name="file-export-outline" size={18} color="#fff" />
                    <ThemedText style={styles.exportButtonText}>Disari Aktar</ThemedText>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <IconSymbol name="logout" size={22} color={COLORS.error.main} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Main Content */}
      <View style={styles.content}>
        {getCurrentScreen()}
      </View>

      {/* Bottom Navigation */}
      <View style={[styles.navWrapper, { paddingBottom: insets.bottom || 10 }]}>
        <BlurView intensity={80} tint="light" style={styles.navBlur}>
          <View style={styles.navbar}>
            {/* Animated Indicator */}
            <Animated.View
              style={[
                styles.indicator,
                {
                  width: tabWidth - 16,
                  transform: [{ translateX: Animated.add(indicatorPosition, 8) }]
                }
              ]}
            >
              <LinearGradient
                colors={COLORS.gradients.primary}
                style={styles.indicatorGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>

            {/* Tab Buttons */}
            {tabs.map((tab, index) => {
              const isActive = activeTab === index;
              const animation = tabAnimations[index] || new Animated.Value(0);

              const scale = animation.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.1],
              });

              const translateY = animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -4],
              });

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.tabButton, { width: tabWidth }]}
                  onPress={() => handleTabPress(index)}
                  activeOpacity={0.7}
                >
                  <Animated.View
                    style={[
                      styles.tabContent,
                      { transform: [{ scale }, { translateY }] }
                    ]}
                  >
                    <IconSymbol
                      name={isActive ? tab.iconFilled : tab.icon}
                      size={24}
                      color={isActive ? '#FFFFFF' : COLORS.light.text.tertiary}
                    />
                    {isActive && (
                      <ThemedText style={styles.tabLabel}>{tab.label}</ThemedText>
                    )}
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
  },
  headerContainer: {
    zIndex: 100,
  },
  headerGradient: {
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoWrapper: {
    marginRight: SPACING.md,
  },
  logoGradient: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  headerLogo: {
    width: 30,
    height: 30,
  },
  brandInfo: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary.main,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  exportButton: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  exportButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.error.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  navWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
  },
  navBlur: {
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    ...SHADOWS.xl,
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: RADIUS['2xl'],
    paddingVertical: SPACING.sm,
    paddingHorizontal: 0,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: SPACING.sm,
    bottom: SPACING.sm,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  indicatorGradient: {
    flex: 1,
    borderRadius: RADIUS.xl,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    zIndex: 1,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
    color: '#FFFFFF',
    marginTop: 2,
  },
});
