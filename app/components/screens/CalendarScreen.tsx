import { View, StyleSheet, TouchableOpacity, Platform, Modal, ScrollView, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Calendar, WeekCalendar } from 'react-native-calendars';
import ThemedText from '../ThemedText';
import IconSymbol from '../ui/IconSymbol';

type ViewType = 'month' | 'week' | 'day';
type DateData = {
  dateString: string;
  day: number;
  month: number;
  year: number;
  timestamp: number;
};

interface Event {
  name: string;
  time: string;
  type: 'delivery' | 'meeting' | 'inventory';
}

interface Events {
  [date: string]: Event[];
}

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

  // Örnek etkinlikler
  const events: Events = {
    '2024-02-15': [{ name: 'Halı Teslimatı', time: '10:00', type: 'delivery' }],
    '2024-02-16': [{ name: 'Müşteri Görüşmesi', time: '14:30', type: 'meeting' }],
    '2024-02-17': [{ name: 'Stok Kontrolü', time: '09:00', type: 'inventory' }],
  };

  // Siparişleri getir ve işaretle
  const fetchOrders = async () => {
    try {
      const response = await fetch('http://192.168.0.13:3000/api/orders');
      const orders: Order[] = await response.json();
      
      // Tarihleri işaretle
      const marked: any = {};
      orders.forEach(order => {
        const date = order.date.split('T')[0];
        marked[date] = {
          marked: true,
          dotColor: '#00b51a',
          selectedColor: '#00b51a',
          customStyles: {
            container: {
              borderWidth: 1,
              borderColor: '#00b51a',
            },
            text: {
              color: '#333',
            }
          }
        };
      });
      
      setMarkedDates(marked);
    } catch (error) {
      console.error('Siparişler yüklenirken hata:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Seçilen tarihe ait siparişleri getir
  const fetchOrdersByDate = async (date: string) => {
    setLoading(true);
    try {
      const response = await fetch('http://192.168.0.13:3000/api/orders');
      const orders: Order[] = await response.json();
      
      // Seçilen tarihe ait siparişleri filtrele
      const dateOrders = orders.filter(order => order.date.split('T')[0] === date);
      setSelectedDateOrders(dateOrders);
    } catch (error) {
      console.error('Siparişler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    fetchOrdersByDate(day.dateString);
    setShowOrdersModal(true);
  };

  // Sipariş durumuna göre renk belirleme
  const getProcessColor = (process: string) => {
    switch (process) {
      case 'Sipariş Oluşturuldu':
        return '#2196F3';
      case 'Transfer Aşamasında':
        return '#FF9800';
      case 'Teslim Edildi':
        return '#4CAF50';
      case 'İptal Edildi':
        return '#F44336';
      default:
        return '#666';
    }
  };

  // Sipariş durumuna göre ikon belirleme
  const getProcessIcon = (process: string) => {
    switch (process) {
      case 'Sipariş Oluşturuldu':
        return 'clipboard-plus-outline';
      case 'Transfer Aşamasında':
        return 'truck-delivery';
      case 'Teslim Edildi':
        return 'check-circle';
      case 'İptal Edildi':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderViewTypeButton = (type: ViewType, label: string, icon: string) => (
    <TouchableOpacity
      style={[styles.viewTypeButton, viewType === type && styles.viewTypeButtonActive]}
      onPress={() => setViewType(type)}
    >
      <IconSymbol name={icon} size={20} color={viewType === type ? '#fff' : '#00b51a'} />
      <ThemedText style={[styles.viewTypeText, viewType === type && styles.viewTypeTextActive]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <ThemedText style={styles.headerTitle}>Takvim</ThemedText>
      <View style={styles.viewTypeContainer}>
        {renderViewTypeButton('month', 'Ay', 'calendar-month')}
        {renderViewTypeButton('week', 'Hafta', 'calendar-week')}
        {renderViewTypeButton('day', 'Gün', 'calendar-today')}
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
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              {new Date(selectedDate).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </ThemedText>
            <TouchableOpacity onPress={() => setShowOrdersModal(false)}>
              <IconSymbol name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00b51a" />
            </View>
          ) : selectedDateOrders.length > 0 ? (
            <ScrollView style={styles.modalBody}>
              {selectedDateOrders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View>
                      <ThemedText style={styles.orderNo}>#{order.order_no}</ThemedText>
                      <View style={styles.customerInfo}>
                        <IconSymbol name="account" size={16} color="#666" />
                        <ThemedText style={styles.customerName}>{order.customer_name}</ThemedText>
                      </View>
                    </View>
                    <View style={[
                      styles.processStatus,
                      { backgroundColor: getProcessColor(order.process) + '15' }
                    ]}>
                      <IconSymbol
                        name={getProcessIcon(order.process)}
                        size={16}
                        color={getProcessColor(order.process)}
                      />
                      <ThemedText style={[
                        styles.processText,
                        { color: getProcessColor(order.process) }
                      ]}>
                        {order.process}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={styles.orderDetails}>
                    <View style={styles.detailRow}>
                      <IconSymbol name="map-marker" size={16} color="#00b51a" />
                      <ThemedText style={styles.detailText}>
                        {order.customer_city}, {order.customer_country}
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <IconSymbol name="account-tie" size={16} color="#00b51a" />
                      <ThemedText style={styles.detailText}>{order.salesman}</ThemedText>
                    </View>
                    {order.conference && (
                      <View style={styles.detailRow}>
                        <IconSymbol name="presentation" size={16} color="#00b51a" />
                        <ThemedText style={styles.detailText}>{order.conference}</ThemedText>
                      </View>
                    )}
                  </View>

                  <View style={styles.productsContainer}>
                    {JSON.parse(order.products).map((product: Product, index: number) => (
                      <View key={index} style={styles.productItem}>
                        <ThemedText style={styles.productName}>{product.name}</ThemedText>
                        <ThemedText style={styles.productQuantity}>x{product.quantity}</ThemedText>
                        <ThemedText style={styles.productPrice}>${product.price}</ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noOrdersContainer}>
              <IconSymbol name="calendar-blank" size={48} color="#ddd" />
              <ThemedText style={styles.noOrdersText}>
                Bu tarihte sipariş bulunmuyor
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderCalendarView = () => {
    const commonTheme = {
      backgroundColor: '#ffffff',
      calendarBackground: '#ffffff',
      textSectionTitleColor: '#333',
      selectedDayBackgroundColor: '#00b51a',
      selectedDayTextColor: '#ffffff',
      todayTextColor: '#00b51a',
      dayTextColor: '#333',
      textDisabledColor: '#d9e1e8',
      dotColor: '#00b51a',
      selectedDotColor: '#ffffff',
      arrowColor: '#00b51a',
      monthTextColor: '#333',
      textDayFontSize: 16,
      textMonthFontSize: 20,
      textDayHeaderFontSize: 14,
      'stylesheet.calendar.main': {
        container: {
          backgroundColor: '#fff',
          borderRadius: 16,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          padding: 8,
        },
        week: {
          marginVertical: 2,
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingHorizontal: 0,
        },
        dayContainer: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          aspectRatio: 1,
          margin: 2,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#f0f0f0',
          backgroundColor: '#fff',
        }
      },
      'stylesheet.calendar.header': {
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 16,
          backgroundColor: '#f8f8f8',
          borderRadius: 12,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: '#f0f0f0',
        },
        monthText: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#333',
        },
        dayHeader: {
          width: 40,
          textAlign: 'center',
          fontSize: 14,
          fontWeight: '600',
          color: '#666',
          marginBottom: 8,
        },
        dayTextAtIndex0: { color: '#ff4444' },
        dayTextAtIndex6: { color: '#ff4444' },
      }
    };

    switch (viewType) {
      case 'month':
        return (
          <Calendar
            current={selectedDate}
            onDayPress={handleDayPress}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                ...(markedDates[selectedDate] || {}),
                selected: true,
                selectedColor: '#00b51a'
              }
            }}
            markingType="custom"
            theme={commonTheme}
            style={styles.calendar}
          />
        );
      case 'week':
        return (
          <WeekCalendar
            current={selectedDate}
            onDayPress={handleDayPress}
            firstDay={1}
            hideExtraDays={true}
            enableSwipeMonths={true}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                ...(markedDates[selectedDate] || {}),
                selected: true,
                selectedColor: '#00b51a'
              }
            }}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#333',
              dayTextColor: '#333',
              textDisabledColor: '#d9e1e8',
              dotColor: '#00b51a',
              selectedDotColor: '#ffffff',
              arrowColor: '#00b51a',
              monthTextColor: '#333',
              textDayFontSize: 16,
              textMonthFontSize: 20,
              textDayHeaderFontSize: 14,
              todayBackgroundColor: '#e6f4ea',
              todayTextColor: '#00b51a',
              selectedDayBackgroundColor: '#00b51a',
              selectedDayTextColor: '#ffffff'
            }}
            style={{
              borderRadius: 16,
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              backgroundColor: '#fff',
              padding: 10,
              marginBottom: 10
            }}
          />
        );
      case 'day':
        return (
          <View style={styles.dayView}>
            <ThemedText style={styles.dayViewDate}>
              {new Date(selectedDate).toLocaleDateString('tr-TR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </ThemedText>
            {selectedDateOrders.length > 0 ? (
              <ScrollView>
                {selectedDateOrders.map((order) => (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <View>
                        <ThemedText style={styles.orderNo}>#{order.order_no}</ThemedText>
                        <View style={styles.customerInfo}>
                          <IconSymbol name="account" size={16} color="#666" />
                          <ThemedText style={styles.customerName}>{order.customer_name}</ThemedText>
                        </View>
                      </View>
                      <View style={[
                        styles.processStatus,
                        { backgroundColor: getProcessColor(order.process) + '15' }
                      ]}>
                        <IconSymbol
                          name={getProcessIcon(order.process)}
                          size={16}
                          color={getProcessColor(order.process)}
                        />
                        <ThemedText style={[
                          styles.processText,
                          { color: getProcessColor(order.process) }
                        ]}>
                          {order.process}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.orderDetails}>
                      <View style={styles.detailRow}>
                        <IconSymbol name="map-marker" size={16} color="#00b51a" />
                        <ThemedText style={styles.detailText}>
                          {order.customer_city}, {order.customer_country}
                        </ThemedText>
                      </View>
                      <View style={styles.detailRow}>
                        <IconSymbol name="account-tie" size={16} color="#00b51a" />
                        <ThemedText style={styles.detailText}>{order.salesman}</ThemedText>
                      </View>
                      {order.conference && (
                        <View style={styles.detailRow}>
                          <IconSymbol name="presentation" size={16} color="#00b51a" />
                          <ThemedText style={styles.detailText}>{order.conference}</ThemedText>
                        </View>
                      )}
                    </View>

                    <View style={styles.productsContainer}>
                      {JSON.parse(order.products).map((product: Product, index: number) => (
                        <View key={index} style={styles.productItem}>
                          <ThemedText style={styles.productName}>{product.name}</ThemedText>
                          <ThemedText style={styles.productQuantity}>x{product.quantity}</ThemedText>
                          <ThemedText style={styles.productPrice}>${product.price}</ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noOrdersContainer}>
                <IconSymbol name="calendar-blank" size={48} color="#ddd" />
                <ThemedText style={styles.noOrdersText}>
                  Bu tarihte sipariş bulunmuyor
                </ThemedText>
              </View>
            )}
          </View>
        );
    }
  };

  // İstatistikleri hesapla
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
      console.error('İstatistikler hesaplanırken hata:', error);
    }
  };

  useEffect(() => {
    calculateStats();
  }, [selectedDate]);

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <IconSymbol name="shopping" size={24} color="#00b51a" />
          </View>
          <View style={styles.statContent}>
            <ThemedText style={styles.statValue}>{monthlyStats.totalOrders}</ThemedText>
            <ThemedText style={styles.statLabel}>Toplam Sipariş</ThemedText>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <IconSymbol name="cash" size={24} color="#2196F3" />
          </View>
          <View style={styles.statContent}>
            <ThemedText style={styles.statValue}>${monthlyStats.totalRevenue.toFixed(2)}</ThemedText>
            <ThemedText style={styles.statLabel}>Toplam Gelir</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <IconSymbol name="check-circle" size={24} color="#4CAF50" />
          </View>
          <View style={styles.statContent}>
            <ThemedText style={styles.statValue}>{monthlyStats.deliveredOrders}</ThemedText>
            <ThemedText style={styles.statLabel}>Teslim Edilen</ThemedText>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <IconSymbol name="truck-delivery" size={24} color="#FF9800" />
          </View>
          <View style={styles.statContent}>
            <ThemedText style={styles.statValue}>{monthlyStats.pendingOrders}</ThemedText>
            <ThemedText style={styles.statLabel}>Transfer Aşamasında</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <View style={styles.content}>
        <View style={styles.calendarContainer}>
          {renderCalendarView()}
        </View>
      </View>
      {renderOrdersModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  viewTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
  },
  viewTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  viewTypeButtonActive: {
    backgroundColor: '#00b51a',
  },
  viewTypeText: {
    fontSize: 14,
    color: '#00b51a',
    marginLeft: 4,
  },
  viewTypeTextActive: {
    color: '#fff',
  },
  calendarContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  calendar: {
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 16,
  },
  weekCalendar: {
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 16,
    width: '100%',
  },
  dayView: {
    flex: 1,
    padding: 16,
  },
  dayViewDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  eventItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTimeText: {
    fontSize: 14,
    color: '#00b51a',
    marginLeft: 4,
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventName: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: '80%',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noOrdersContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noOrdersText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  orderCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  processStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  processText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  productsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  productQuantity: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#666',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00b51a',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
}); 