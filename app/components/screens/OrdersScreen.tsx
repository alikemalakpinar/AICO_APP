import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Modal, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import ThemedText from '../ThemedText';
import IconSymbol from '../ui/IconSymbol';

interface Order {
  id: number;
  date: string;
  order_no: string;
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
  products: string;
  process: string;
}

export const OrdersHeader = ({ navigation }: any) => (
  <View style={styles.headerContainer}>
    <TouchableOpacity 
      style={styles.createDocButton}
      onPress={() => {
        // Belge oluşturma fonksiyonu buraya gelecek
        Alert.alert('Bilgi', 'Belge oluşturma özelliği yakında eklenecek');
      }}
    >
      <IconSymbol name="file-document-outline" size={20} color="#fff" />
      <ThemedText style={styles.createDocText}>Belge Oluştur</ThemedText>
    </TouchableOpacity>
  </View>
);

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [tempProcess, setTempProcess] = useState<string>('');

  // Sipariş durumu seçenekleri
  const processOptions = [
    { 
      label: 'Sipariş Oluşturuldu', 
      value: 'Sipariş Oluşturuldu',
      icon: 'clipboard-plus-outline',
      color: '#2196F3' // Mavi
    },
    { 
      label: 'Transfer Aşamasında', 
      value: 'Transfer Aşamasında',
      icon: 'truck-delivery',
      color: '#FF9800' // Turuncu
    },
    { 
      label: 'Teslim Edildi', 
      value: 'Teslim Edildi',
      icon: 'check-circle',
      color: '#4CAF50' // Yeşil
    },
    { 
      label: 'İptal Edildi', 
      value: 'İptal Edildi',
      icon: 'close-circle',
      color: '#F44336' // Kırmızı
    },
  ];

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://192.168.0.13:3000/api/orders');
      const data = await response.json();
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error('Siparişler yüklenirken hata:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const filtered = orders.filter(order => 
      order.order_no.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredOrders(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const calculateTotalAmount = (products: string) => {
    try {
      const parsedProducts = JSON.parse(products);
      return parsedProducts.reduce((total: number, product: any) => {
        const price = parseFloat(product.price) || 0;
        const quantity = parseInt(product.quantity) || 0;
        if (isNaN(price) || isNaN(quantity)) {
          console.log('Hatalı ürün verisi:', product);
        }
        return total + (price * quantity);
      }, 0);
    } catch (error) {
      console.error('JSON parse hatası:', error);
      return 0;
    }
  };

  const handleShowDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  // Sipariş durumu güncelleme fonksiyonu
  const handleUpdateProcess = async (orderId: number, newProcess: string) => {
    try {
      console.log('Güncelleme isteği gönderiliyor:', { orderId, newProcess });

      const response = await fetch(`http://192.168.0.13:3000/api/orders/${orderId}/process`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ process: newProcess }),
      });

      const responseData = await response.json();
      console.log('Sunucu yanıtı:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Sipariş durumu güncellenemedi');
      }

      // Başarılı güncelleme sonrası siparişleri yenile
      await fetchOrders();
      setShowProcessModal(false);
      setTempProcess(''); // Geçici durumu sıfırla
      
      // Başarılı mesajı göster
      Alert.alert('Başarılı', 'Sipariş durumu başarıyla güncellendi');
    } catch (error: any) {
      console.error('Sipariş durumu güncelleme hatası:', error);
      Alert.alert(
        'Hata',
        'Sipariş durumu güncellenirken bir hata oluştu. Lütfen tekrar deneyin.\n\nHata detayı: ' + error.message
      );
    }
  };

  // Modal açıldığında geçici durumu ayarla
  const handleOpenProcessModal = (order: Order) => {
    setSelectedOrder(order);
    setTempProcess(order.process);
    setShowProcessModal(true);
  };

  // Modal kapatıldığında geçici durumu sıfırla
  const handleCloseProcessModal = () => {
    setShowProcessModal(false);
    setTempProcess('');
  };

  // Duruma göre renk belirleme
  const getProcessColor = (process: string) => {
    const option = processOptions.find(opt => opt.value === process);
    return option ? option.color : '#666';
  };

  // Duruma göre ikon belirleme
  const getProcessIcon = (process: string) => {
    const option = processOptions.find(opt => opt.value === process);
    return option ? option.icon : 'help-circle';
  };

  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    const parsedProducts = JSON.parse(selectedOrder.products);
    const totalAmount = calculateTotalAmount(selectedOrder.products);

    return (
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Sipariş Detayları</ThemedText>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <IconSymbol name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <ThemedText style={styles.sectionTitle}>Sipariş Bilgileri</ThemedText>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Sipariş No:</ThemedText>
                  <ThemedText style={styles.detailValue}>#{selectedOrder.order_no}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Tarih:</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {new Date(selectedOrder.date).toLocaleDateString('tr-TR')}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.detailSection}>
                <ThemedText style={styles.sectionTitle}>Müşteri Bilgileri</ThemedText>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Ad Soyad:</ThemedText>
                  <ThemedText style={styles.detailValue}>{selectedOrder.customer_name}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Adres:</ThemedText>
                  <ThemedText style={styles.detailValue}>{selectedOrder.customer_address}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Konum:</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {selectedOrder.customer_city}, {selectedOrder.customer_country}
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Telefon:</ThemedText>
                  <ThemedText style={styles.detailValue}>{selectedOrder.customer_phone}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>E-posta:</ThemedText>
                  <ThemedText style={styles.detailValue}>{selectedOrder.customer_email}</ThemedText>
                </View>
              </View>

              <View style={styles.detailSection}>
                <ThemedText style={styles.sectionTitle}>Sevkiyat Bilgileri</ThemedText>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Satış Temsilcisi:</ThemedText>
                  <ThemedText style={styles.detailValue}>{selectedOrder.salesman}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Konferans:</ThemedText>
                  <ThemedText style={styles.detailValue}>{selectedOrder.conference}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Acenta:</ThemedText>
                  <ThemedText style={styles.detailValue}>{selectedOrder.agency}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Rehber:</ThemedText>
                  <ThemedText style={styles.detailValue}>{selectedOrder.guide}</ThemedText>
                </View>
              </View>

              <View style={styles.detailSection}>
                <ThemedText style={styles.sectionTitle}>Ürünler</ThemedText>
                {parsedProducts.map((product: any, index: number) => (
                  <View key={index} style={styles.productItem}>
                    <View style={styles.productHeader}>
                      <ThemedText style={styles.productName}>{product.name}</ThemedText>
                      <ThemedText style={styles.productPrice}>
                        ${(parseFloat(product.price) || 0).toFixed(2)}
                      </ThemedText>
                    </View>
                    <View style={styles.productDetails}>
                      <ThemedText style={styles.productInfo}>
                        {product.quantity} adet • {product.size}
                      </ThemedText>
                      <ThemedText style={styles.productTotal}>
                        ${((parseFloat(product.price) || 0) * (parseInt(product.quantity) || 0)).toFixed(2)}
                      </ThemedText>
                    </View>
                    {product.notes && (
                      <ThemedText style={styles.productNotes}>{product.notes}</ThemedText>
                    )}
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <ThemedText style={styles.totalLabel}>Toplam Tutar</ThemedText>
                  <ThemedText style={styles.totalAmount}>${totalAmount.toFixed(2)}</ThemedText>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Sipariş durumu modal bileşeni
  const renderProcessModal = () => {
    if (!selectedOrder) return null;

    return (
      <Modal
        visible={showProcessModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseProcessModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 0, borderRadius: 16 }]}>
            <View style={[styles.modalHeader, { 
              backgroundColor: '#f8f8f8', 
              borderBottomWidth: 0,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingVertical: 16
            }]}>
              <ThemedText style={[styles.modalTitle, { fontSize: 18 }]}>Sipariş Durumu</ThemedText>
              <TouchableOpacity 
                onPress={handleCloseProcessModal}
                style={styles.closeButton}
              >
                <IconSymbol name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
              {processOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.processOption,
                    tempProcess === option.value && styles.processOptionSelected,
                    { 
                      borderLeftWidth: 3,
                      borderLeftColor: option.color,
                      marginBottom: 8,
                      elevation: 1,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                    }
                  ]}
                  onPress={() => setTempProcess(option.value)}
                >
                  <View style={styles.processOptionContent}>
                    <View style={[
                      styles.processOptionIcon,
                      { 
                        backgroundColor: option.color + '15',
                        padding: 6,
                        borderRadius: 6
                      }
                    ]}>
                      <IconSymbol name={option.icon} size={20} color={option.color} />
                    </View>
                    <ThemedText style={[
                      styles.processOptionText,
                      tempProcess === option.value && styles.processOptionTextSelected
                    ]}>
                      {option.label}
                    </ThemedText>
                    {tempProcess === option.value && (
                      <IconSymbol 
                        name="check-circle" 
                        size={20} 
                        color={option.color} 
                        style={{ marginLeft: 'auto' }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={[styles.modalFooter, { 
              justifyContent: 'center',
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              paddingVertical: 16
            }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { minWidth: 100 }]}
                onPress={handleCloseProcessModal}
              >
                <ThemedText style={styles.cancelButtonText}>İptal</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!tempProcess || tempProcess === selectedOrder.process) && styles.saveButtonDisabled,
                  { minWidth: 100 }
                ]}
                onPress={() => {
                  if (tempProcess && tempProcess !== selectedOrder.process) {
                    handleUpdateProcess(selectedOrder.id, tempProcess);
                  }
                }}
                disabled={!tempProcess || tempProcess === selectedOrder.process}
              >
                <ThemedText style={[
                  styles.saveButtonText,
                  (!tempProcess || tempProcess === selectedOrder.process) && styles.saveButtonTextDisabled
                ]}>
                  Kaydet
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderOrderCard = (order: Order) => {
    const totalAmount = calculateTotalAmount(order.products);
    const parsedProducts = JSON.parse(order.products);
    const itemCount = parsedProducts.length;
    const processColor = getProcessColor(order.process);
    const processIcon = getProcessIcon(order.process);

    return (
      <View key={order.id} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <View style={styles.orderNoContainer}>
              <ThemedText style={styles.orderNo}>#{order.order_no}</ThemedText>
              <ThemedText style={styles.orderDate}>
                <IconSymbol name="calendar" size={14} color="#666" style={styles.dateIcon} />
                {new Date(order.date).toLocaleDateString('tr-TR')}
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.processStatus, { backgroundColor: processColor + '15' }]}
            onPress={() => handleOpenProcessModal(order)}
          >
            <IconSymbol
              name={processIcon}
              size={16}
              color={processColor}
            />
            <ThemedText style={[styles.processText, { color: processColor }]}>
              {order.process}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.customerInfo}>
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <IconSymbol name="account" size={16} color="#00b51a" />
            </View>
            <ThemedText style={styles.customerName}>{order.customer_name}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <IconSymbol name="map-marker" size={16} color="#00b51a" />
            </View>
            <ThemedText style={styles.location}>{order.customer_city}, {order.customer_country}</ThemedText>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.orderStats}>
            <View style={styles.statsItem}>
              <IconSymbol name="package-variant" size={16} color="#00b51a" />
              <ThemedText style={styles.itemCount}>{itemCount} Ürün</ThemedText>
            </View>
            <View style={styles.statsItem}>
              <IconSymbol name="cash" size={16} color="#00b51a" />
              <ThemedText style={styles.totalAmount}>${totalAmount.toFixed(2)}</ThemedText>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.detailsButton} 
            onPress={() => handleShowDetails(order)}
          >
            <ThemedText style={styles.detailsButtonText}>Detaylar</ThemedText>
            <IconSymbol name="chevron-right" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <IconSymbol name="magnify" size={24} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Sipariş numarası ile ara..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <IconSymbol name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00b51a" />
        </View>
      ) : (
        <ScrollView
          style={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#00b51a']}
            />
          }
        >
          {filteredOrders.map(renderOrderCard)}
        </ScrollView>
      )}

      {renderProcessModal()}
      {renderOrderDetails()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ordersList: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNoContainer: {
    marginBottom: 4,
  },
  orderNo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: '#666',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  customerInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  customerName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  orderStats: {
    flexDirection: 'column',
    gap: 8,
  },
  statsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00b51a',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00b51a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#00b51a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    maxHeight: '70%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    margin: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    flex: 2,
    fontSize: 14,
    color: '#333',
  },
  productItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  productPrice: {
    fontSize: 15,
    color: '#666',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    fontSize: 14,
    color: '#666',
  },
  productTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00b51a',
  },
  productNotes: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  processStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginLeft: 8,
  },
  processText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  processOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  processOptionSelected: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
  },
  processOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  processOptionIcon: {
    marginRight: 12,
  },
  processOptionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  processOptionTextSelected: {
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#00b51a',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
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