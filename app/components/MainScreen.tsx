import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Alert,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useRef, useEffect } from 'react';
import IconSymbol from './ui/IconSymbol';
import ThemedText from './ThemedText';
import { router, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants/Theme';
import { API_ENDPOINTS, fetchWithTimeout } from '../../constants/Api';

const SESSION_KEY = 'user_session';

// Import screens
import HomeScreen from './screens/HomeScreen';
import CreateOrderScreen from './screens/CreateOrderScreen';
import OrdersScreen from './screens/OrdersScreen';
import CalendarScreen from './screens/CalendarScreen';
import SettingsScreen from './screens/SettingsScreen';

const { width } = Dimensions.get('window');

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
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = screenWidth >= 600;
  const { userName, userRole, permissions: permissionsStr, branchId, branchName } = useLocalSearchParams();
  const permissions = permissionsStr ? JSON.parse(permissionsStr as string) : [];
  const userBranchId = branchId ? parseInt(branchId as string) : null;
  const userBranchName = branchName as string || '';

  // Animation refs
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
          onPress: async () => {
            // Clear saved session
            await AsyncStorage.removeItem(SESSION_KEY);
            router.replace('/');
          }
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
    // Header fade in
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Check if user can create orders
  const canCreateOrder = userRole !== 'Depo Görevlisi' && userRole !== 'Lojistik Sorumlusu';

  const getCurrentScreen = () => {
    const currentTab = tabs[activeTab];
    switch (currentTab.label) {
      case 'Ana Sayfa':
        return <HomeScreen onTabChange={handleTabPress} userName={userName as string} userRole={userRole as string} permissions={permissions} canCreateOrder={canCreateOrder} />;
      case 'Siparis':
        return <CreateOrderScreen userBranchId={userBranchId} userBranchName={userBranchName} userRole={userRole as string} />;
      case 'Siparisler':
        return <OrdersScreen />;
      case 'Takvim':
        return <CalendarScreen />;
      case 'Ayarlar':
        return <SettingsScreen userRole={userRole as string} />;
      default:
        return <HomeScreen onTabChange={handleTabPress} userName={userName as string} userRole={userRole as string} permissions={permissions} canCreateOrder={canCreateOrder} />;
    }
  };

  // Calculate navbar width - max 600 on tablets
  const navbarWidth = isTablet ? Math.min(screenWidth - 32, 600) : screenWidth - 32;
  const tabWidthCalc = navbarWidth / tabs.length;

  const handleTabPress = (index: number) => {
    if (index === activeTab) return;

    // Move indicator
    Animated.spring(indicatorPosition, {
      toValue: index * tabWidthCalc,
      tension: 60,
      friction: 8,
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.light.background} />

      {/* Minimal Header */}
      <Animated.View style={[
        styles.headerContainer,
        { paddingTop: insets.top || 20, opacity: headerOpacity }
      ]}>
        <View style={styles.header}>
          {/* Logo and Brand */}
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/aicologo.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.brandInfo}>
              <ThemedText style={styles.headerTitle}>Koyuncu Hali</ThemedText>
              <View style={styles.roleTag}>
                <ThemedText style={styles.roleText}>{userRole}</ThemedText>
              </View>
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
                activeOpacity={0.7}
              >
                <IconSymbol name="file-export-outline" size={18} color={COLORS.primary.accent} />
                <ThemedText style={styles.exportButtonText}>Aktar</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <IconSymbol name="logout" size={20} color={COLORS.error.main} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Main Content */}
      <View style={styles.content}>
        {getCurrentScreen()}
      </View>

      {/* Clean Bottom Navigation */}
      <View style={[
        styles.navWrapper,
        { paddingBottom: insets.bottom || 10 },
        isTablet && { paddingHorizontal: (screenWidth - navbarWidth - 32) / 2 }
      ]}>
        <View style={[
          styles.navbar,
          isTablet && { maxWidth: navbarWidth + 32, alignSelf: 'center' }
        ]}>
          {/* Sliding Indicator */}
          <Animated.View
            style={[
              styles.indicator,
              {
                width: tabWidthCalc - 12,
                transform: [{ translateX: Animated.add(indicatorPosition, 6) }]
              }
            ]}
          />

          {/* Tab Buttons */}
          {tabs.map((tab, index) => {
            const isActive = activeTab === index;

            return (
              <TouchableOpacity
                key={index}
                style={[styles.tabButton, { width: tabWidthCalc }]}
                onPress={() => handleTabPress(index)}
                activeOpacity={0.7}
              >
                <View style={styles.tabContent}>
                  <IconSymbol
                    name={isActive ? tab.iconFilled : tab.icon}
                    size={isTablet ? 26 : 22}
                    color={isActive ? '#FFFFFF' : COLORS.light.text.tertiary}
                  />
                  <ThemedText style={[
                    styles.tabLabel,
                    isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                    isTablet && { fontSize: TYPOGRAPHY.fontSize.sm }
                  ]}>
                    {tab.label}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.backgroundSecondary,
  },
  headerContainer: {
    backgroundColor: COLORS.light.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
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
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  headerLogo: {
    width: 26,
    height: 26,
    tintColor: '#FFFFFF',
  },
  brandInfo: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.light.text.primary,
    letterSpacing: -0.3,
  },
  roleTag: {
    backgroundColor: COLORS.primary.accent + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginTop: 2,
  },
  roleText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary.accent,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary.accent + '10',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  exportButtonText: {
    color: COLORS.primary.accent,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semiBold,
  },
  logoutButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.error.muted,
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
    paddingHorizontal: SPACING.base,
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.light.border,
    ...SHADOWS.md,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary.main,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    zIndex: 1,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.fontSize['2xs'],
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  tabLabelInactive: {
    color: COLORS.light.text.tertiary,
  },
});
