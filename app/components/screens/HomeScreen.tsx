import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import ThemedText from '../ThemedText';
import IconSymbol from '../ui/IconSymbol';

const { width } = Dimensions.get('window');
const statusCardWidth = (width - 60) / 4;
const financeCardWidth = (width - 44) / 2;

interface OrderStats {
  totalOrders: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
  deliveredOrders: number;
  inTransferOrders: number;
  cancelledOrders: number;
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
    cancelledOrders: 0
  });
  const [showReports, setShowReports] = useState(false);

  const fetchOrderStats = async () => {
    try {
      const response = await fetch('http://192.168.0.13:3000/api/orders');
      const orders = await response.json();
      
      // Toplam sipariş sayısı
      const totalOrders = orders.length;
      
      // Durumlara göre sipariş sayıları
      const deliveredOrders = orders.filter((order: any) => order.process === 'Teslim Edildi').length;
      const inTransferOrders = orders.filter((order: any) => order.process === 'Transfer Aşamasında').length;
      const cancelledOrders = orders.filter((order: any) => order.process === 'İptal Edildi').length;
      
      // Aylık ciro ve gider hesaplama
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

      // Net kar hesaplama
      const netProfit = monthlyRevenue - monthlyExpenses;

      setStats({
        totalOrders,
        monthlyRevenue,
        monthlyExpenses,
        netProfit,
        deliveredOrders,
        inTransferOrders,
        cancelledOrders
      });
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    }
  };

  useEffect(() => {
    fetchOrderStats();
  }, []);

  const canViewFinancials = userRole === 'Patron' || permissions.includes('finansal_goruntuleme');
  const canViewReports = userRole === 'Patron' || permissions.includes('rapor_goruntuleme');

  const statCards = [
    { 
      title: 'Toplam Sipariş', 
      value: stats.totalOrders.toString(), 
      icon: 'shopping', 
      color: '#00b51a' 
    },
    { 
      title: 'Teslim Edilen', 
      value: stats.deliveredOrders.toString(), 
      icon: 'check-circle', 
      color: '#4CAF50' 
    },
    { 
      title: 'Transfer Aşamasında', 
      value: stats.inTransferOrders.toString(), 
      icon: 'truck-delivery', 
      color: '#FF9800' 
    },
    { 
      title: 'İptal Edilen', 
      value: stats.cancelledOrders.toString(), 
      icon: 'close-circle', 
      color: '#F44336' 
    },
    ...(canViewFinancials ? [
      { 
        title: 'Aylık Ciro', 
        value: `$${stats.monthlyRevenue.toFixed(2)}`, 
        icon: 'cash', 
        color: '#2196F3' 
      },
      { 
        title: 'Giderler', 
        value: `$${stats.monthlyExpenses.toFixed(2)}`, 
        icon: 'currency-usd-off', 
        color: '#FF5722' 
      },
      { 
        title: 'Net Kar', 
        value: `$${stats.netProfit.toFixed(2)}`, 
        icon: 'chart-line-variant', 
        color: '#4CAF50' 
      }
    ] : [])
  ];

  // Define all quick actions
  const allQuickActions = [
    {
      title: 'Yeni Sipariş',
      icon: 'cart-plus',
      color: '#4CAF50',
      onPress: () => onTabChange(1)
    },
    ...(canViewReports ? [{
      title: 'Raporlar',
      icon: 'chart-bar',
      color: '#2196F3',
      onPress: () => setShowReports(true)
    }] : [])
  ];

  // Filter quick actions based on user role
  const quickActions = allQuickActions.filter(action => {
    if (action.title === 'Yeni Sipariş') {
      return userRole !== 'Depo Görevlisi' && userRole !== 'Lojistik Sorumlusu';
    }
    return true;
  });

  const renderStatCard = (stat: any) => {
    const isFinanceCard = ['Aylık Ciro', 'Giderler', 'Net Kar'].includes(stat.title);
    
    return (
      <View key={stat.title} style={[
        styles.statCard,
        isFinanceCard ? styles.financeCard : styles.statusCard
      ]}>
        <View style={[
          styles.statIconContainer,
          isFinanceCard ? styles.financeIconContainer : styles.statusIconContainer,
          { backgroundColor: stat.color + '15' }
        ]}>
          <IconSymbol 
            name={stat.icon} 
            size={isFinanceCard ? 28 : 24} 
            color={stat.color} 
          />
        </View>
        <ThemedText style={[
          styles.statValue,
          isFinanceCard ? styles.financeValue : styles.statusValue
        ]}>{stat.value}</ThemedText>
        <ThemedText style={[
          styles.statTitle,
          isFinanceCard ? styles.financeTitle : styles.statusTitle
        ]}>{stat.title}</ThemedText>
      </View>
    );
  };

  const renderQuickAction = (action: any) => (
    <TouchableOpacity key={action.title} style={styles.quickAction} onPress={action.onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
        <IconSymbol name={action.icon} size={24} color={action.color} />
      </View>
      <ThemedText style={styles.quickActionTitle}>{action.title}</ThemedText>
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
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Finansal Özet</ThemedText>
            <TouchableOpacity onPress={() => setShowReports(false)}>
              <IconSymbol name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.reportCard}>
              <View style={styles.reportRow}>
                <ThemedText style={styles.reportLabel}>Bu Ayki Toplam Satış</ThemedText>
                <ThemedText style={styles.reportValue}>${stats.monthlyRevenue.toFixed(2)}</ThemedText>
              </View>
              <View style={styles.reportRow}>
                <ThemedText style={styles.reportLabel}>Bu Ayki Toplam Gider</ThemedText>
                <ThemedText style={[styles.reportValue, { color: '#FF5722' }]}>${stats.monthlyExpenses.toFixed(2)}</ThemedText>
              </View>
              <View style={styles.reportDivider} />
              <View style={styles.reportRow}>
                <ThemedText style={styles.reportLabel}>Net Kar</ThemedText>
                <ThemedText style={[styles.reportValue, { color: '#4CAF50' }]}>${stats.netProfit.toFixed(2)}</ThemedText>
              </View>
            </View>

            <View style={styles.reportCard}>
              <View style={styles.reportRow}>
                <ThemedText style={styles.reportLabel}>Toplam Sipariş Sayısı</ThemedText>
                <ThemedText style={styles.reportValue}>{stats.totalOrders}</ThemedText>
              </View>
              <View style={styles.reportRow}>
                <ThemedText style={styles.reportLabel}>Ortalama Sipariş Değeri</ThemedText>
                <ThemedText style={styles.reportValue}>
                  ${stats.totalOrders > 0 ? (stats.monthlyRevenue / stats.totalOrders).toFixed(2) : '0.00'}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.welcomeText}>
            Hoş Geldiniz <ThemedText style={[styles.welcomeText, styles.nameText]}>{userName};</ThemedText>
          </ThemedText>
          <ThemedText style={styles.dateText}>
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </ThemedText>
          <ThemedText style={styles.roleText}>
            Ünvanı: <ThemedText style={styles.roleValue}>{userRole}</ThemedText>
          </ThemedText>
        </View>
      </View>

      <View style={styles.statsContainer}>
        {statCards.map(renderStatCard)}
      </View>

      {quickActions.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Hızlı İşlemler</ThemedText>
          </View>
          <View style={styles.quickActionsContainer}>
            {quickActions.map(renderQuickAction)}
          </View>
        </View>
      )}

      {(userRole === 'Patron' || permissions.includes('rapor_goruntuleme')) && renderReportsModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  nameText: {
    color: '#00b51a',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  roleValue: {
    color: '#00b51a',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    color: '#666',
  },
  statusCard: {
    width: statusCardWidth,
    padding: 10,
    borderRadius: 10,
  },
  statusIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statusTitle: {
    fontSize: 11,
    color: '#666',
  },
  financeCard: {
    width: financeCardWidth,
    padding: 16,
    borderRadius: 12,
  },
  financeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  financeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  financeTitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 16,
  },
  quickAction: {
    width: financeCardWidth,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 0,
  },
  quickActionTitle: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '90%',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportLabel: {
    fontSize: 15,
    color: '#666',
  },
  reportValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reportDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
}); 