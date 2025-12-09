import { StyleSheet, View, TouchableOpacity, Animated, Platform, Dimensions, Image, Alert, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useRef } from 'react';
import IconSymbol from './ui/IconSymbol';
import ThemedText from './ThemedText';
import { router, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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

export default function MainScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const insets = useSafeAreaInsets();
  const { userName, userRole, permissions: permissionsStr } = useLocalSearchParams();
  const permissions = permissionsStr ? JSON.parse(permissionsStr as string) : [];

  const handleLogout = () => {
    router.replace('/');
  };

  const allTabs = [
    { icon: 'home', label: 'Ana Sayfa', component: HomeScreen },
    { icon: 'plus-box', label: 'Sipariş Oluştur', component: CreateOrderScreen },
    { icon: 'shopping', label: 'Siparişler', component: OrdersScreen },
    { icon: 'calendar', label: 'Takvim', component: CalendarScreen },
    { icon: 'cog', label: 'Ayarlar', component: SettingsScreen },
  ];

  // Filter tabs based on user role
  const tabs = allTabs.filter(tab => {
    if (tab.label === 'Sipariş Oluştur') {
      return userRole !== 'Depo Görevlisi' && userRole !== 'Lojistik Sorumlusu';
    }
    return true;
  });

  // Get current screen component based on tab label instead of index
  const getCurrentScreen = () => {
    const currentTab = tabs[activeTab];
    switch (currentTab.label) {
      case 'Ana Sayfa':
        return <HomeScreen onTabChange={handleTabPress} userName={userName as string} userRole={userRole as string} permissions={permissions} />;
      case 'Sipariş Oluştur':
        return <CreateOrderScreen />;
      case 'Siparişler':
        return <OrdersScreen />;
      case 'Takvim':
        return <CalendarScreen />;
      case 'Ayarlar':
        return <SettingsScreen userRole={userRole as string} />;
      default:
        return <HomeScreen onTabChange={handleTabPress} userName={userName as string} userRole={userRole as string} permissions={permissions} />;
    }
  };

  const tabAnimations = useRef(tabs.map(() => new Animated.Value(0))).current;

  const handleTabPress = (index: number) => {
    setActiveTab(index);
    // Reset all animations
    tabAnimations.forEach((anim, i) => {
      if (i !== index) {
        Animated.spring(anim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    });
    // Animate selected tab
    Animated.sequence([
      Animated.spring(tabAnimations[index], {
        toValue: -10,
        useNativeDriver: true,
      }),
      Animated.spring(tabAnimations[index], {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const generateCSV = async () => {
    try {
      // Siparişleri API'den çek
      const response = await fetch('http://192.168.0.13:3000/api/orders');
      const orders: Order[] = await response.json();

      // CSV başlıkları
      const headers = [
        'Sipariş No',
        'Tarih',
        'Müşteri Adı',
        'Ülke',
        'Şehir',
        'Telefon',
        'Email',
        'Satış Temsilcisi',
        'Konferans',
        'Acenta',
        'Rehber',
        'Durum',
        'Ürünler',
        'Toplam Tutar'
      ].join(',');

      // CSV satırlarını oluştur
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

      // CSV içeriğini oluştur
      const csvContent = [headers, ...rows].join('\n');

      // Dosya adını oluştur
      const fileName = `siparisler_${new Date().toISOString().split('T')[0]}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      // Dosyayı kaydet
      await FileSystem.writeAsStringAsync(filePath, csvContent, {
        encoding: FileSystem.EncodingType.UTF8
      });

      // Paylaşım için dosyayı aç
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Siparişler Raporu',
          UTI: 'public.comma-separated-values-text'
        });
      }
    } catch (error) {
      console.error('CSV oluşturma hatası:', error);
      Alert.alert(
        'Hata',
        'Belge oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.'
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top || 20 }]}>
        <View style={styles.header}>
          {/* Logo and Title */}
          <View style={styles.headerLeft}>
            <Image 
              source={require('../../assets/images/aicologo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <ThemedText style={styles.headerTitle}>Koyuncu Halı</ThemedText>
          </View>

          {/* Profile and Logout */}
          <View style={styles.headerRight}>
            {tabs[activeTab].label === 'Siparişler' && 
             (userRole === 'Patron' || 
              userRole === 'Operasyon Sorumlusu' || 
              permissions.includes('belge_olusturma')) && (
              <TouchableOpacity 
                style={styles.createDocButton}
                onPress={generateCSV}
              >
                <IconSymbol name="file-document-outline" size={20} color="#fff" />
                <ThemedText style={styles.createDocText}>Belge Oluştur</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerIcon} onPress={handleLogout}>
              <IconSymbol name="logout" size={28} color="#00b51a" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {getCurrentScreen()}
      </View>

      {/* Navigation Bar */}
      <View style={[styles.navContainer, { paddingBottom: insets.bottom || 10 }]}>
        <View style={styles.navbar}>
          {tabs.map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tabButton,
                { width: `${100 / tabs.length}%` } // Dinamik genişlik
              ]}
              onPress={() => handleTabPress(index)}
            >
              <Animated.View style={[
                styles.tabItem,
                {
                  transform: [{ translateY: tabAnimations[index] }]
                }
              ]}>
                <IconSymbol
                  name={tab.icon}
                  size={24}
                  color={activeTab === index ? '#00b51a' : '#666'}
                  style={styles.icon}
                />
                <ThemedText style={[
                  styles.tabLabel,
                  activeTab === index && styles.activeLabel
                ]}>
                  {tab.label}
                </ThemedText>
              </Animated.View>
            </TouchableOpacity>
          ))}
          <View style={styles.indicatorContainer}>
            <Animated.View style={[
              styles.indicator,
              {
                width: `${100 / tabs.length}%`,
                transform: [{
                  translateX: Animated.multiply(
                    activeTab,
                    Animated.multiply(width - 20, 1 / tabs.length)
                  )
                }]
              }
            ]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  navContainer: {
    width: '100%',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 0,
    width: '100%',
    alignSelf: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    position: 'relative',
  },
  tabButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  icon: {
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activeLabel: {
    color: '#00b51a',
    fontWeight: '600',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    alignItems: 'flex-start',
  },
  indicator: {
    height: 3,
    backgroundColor: '#00b51a',
    borderRadius: 3,
    position: 'absolute',
    bottom: 0,
  },
  headerContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00b51a',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    padding: 8,
    marginLeft: 8,
  },
  createDocButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00b51a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
  },
  createDocText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
}); 