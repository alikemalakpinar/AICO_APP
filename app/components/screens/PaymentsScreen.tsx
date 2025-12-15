import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../../constants/Theme';
import { API_URL } from '../../../constants/Api';

interface Payment {
  id: number;
  order_id: number;
  customer_id: number;
  amount: number;
  currency: string;
  payment_method: string;
  card_type: string | null;
  card_last_four: string | null;
  installments: number;
  transaction_id: string | null;
  status: string;
  payment_date: string;
  notes: string | null;
  created_by_name: string | null;
}

interface Order {
  id: number;
  order_no: string;
  customer_name: string;
  total: number;
  payment_status: string;
}

const PAYMENT_METHODS = [
  { id: 'cash', name: 'Nakit', icon: 'cash-outline' },
  { id: 'visa', name: 'Visa', icon: 'card-outline' },
  { id: 'mastercard', name: 'Mastercard', icon: 'card-outline' },
  { id: 'amex', name: 'Amex', icon: 'card-outline' },
  { id: 'maestro', name: 'Maestro (Debit)', icon: 'card-outline' },
  { id: 'mail_order', name: 'Mail Order', icon: 'mail-outline' },
  { id: 'bank_transfer', name: 'Havale/EFT', icon: 'swap-horizontal-outline' },
];

const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP'];

const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 5, 6, 9, 12];

interface PaymentsScreenProps {
  onBack?: () => void;
  currentUser: any;
  orderId?: number;
}

export default function PaymentsScreen({ onBack, currentUser, orderId }: PaymentsScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [orderSelectVisible, setOrderSelectVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    currency: 'TRY',
    payment_method: 'cash',
    card_type: '',
    card_last_four: '',
    installments: 1,
    notes: '',
  });

  const [paymentSummary, setPaymentSummary] = useState({
    orderTotal: 0,
    totalPaid: 0,
    remaining: 0,
  });

  useEffect(() => {
    fetchOrders();
    if (orderId) {
      fetchOrderPayments(orderId);
    }
  }, [orderId]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/orders`);
      const data = await response.json();
      setOrders(data.filter((o: Order) => o.payment_status !== 'paid'));

      if (orderId) {
        const order = data.find((o: Order) => o.id === orderId);
        if (order) setSelectedOrder(order);
      }
    } catch (error) {
      console.error('Sipariş listesi hatası:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOrderPayments = async (oid: number) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${oid}/payments`);
      const data = await response.json();
      setPayments(data.payments || []);
      setPaymentSummary({
        orderTotal: data.orderTotal || 0,
        totalPaid: data.totalPaid || 0,
        remaining: data.remaining || 0,
      });
    } catch (error) {
      console.error('Ödeme listesi hatası:', error);
    }
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setOrderSelectVisible(false);
    fetchOrderPayments(order.id);
  };

  const handleAddPayment = async () => {
    if (!selectedOrder) {
      Alert.alert('Hata', 'Lütfen bir sipariş seçin');
      return;
    }

    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      Alert.alert('Hata', 'Geçerli bir tutar girin');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedOrder.id,
          customer_id: null,
          amount: parseFloat(paymentForm.amount),
          currency: paymentForm.currency,
          payment_method: paymentForm.payment_method,
          card_type: paymentForm.card_type || null,
          card_last_four: paymentForm.card_last_four || null,
          installments: paymentForm.installments,
          notes: paymentForm.notes || null,
          created_by: currentUser?.userId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert('Başarılı', 'Ödeme kaydedildi');
        setModalVisible(false);
        resetPaymentForm();
        fetchOrderPayments(selectedOrder.id);
        fetchOrders();
      } else {
        const error = await response.json();
        Alert.alert('Hata', error.error || 'Ödeme kaydedilemedi');
      }
    } catch (error) {
      console.error('Ödeme kayıt hatası:', error);
      Alert.alert('Hata', 'Ödeme kaydedilemedi');
    }
  };

  const handleCancelPayment = (payment: Payment) => {
    Alert.alert(
      'Ödeme İptal',
      'Bu ödemeyi iptal etmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/payments/${payment.id}/cancel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  cancelled_by: currentUser?.userId,
                  reason: 'Kullanıcı tarafından iptal edildi',
                }),
              });

              if (response.ok) {
                Alert.alert('Başarılı', 'Ödeme iptal edildi');
                if (selectedOrder) {
                  fetchOrderPayments(selectedOrder.id);
                }
                fetchOrders();
              } else {
                Alert.alert('Hata', 'İptal işlemi başarısız');
              }
            } catch (error) {
              console.error('İptal hatası:', error);
              Alert.alert('Hata', 'İptal işlemi başarısız');
            }
          },
        },
      ]
    );
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: '',
      currency: 'TRY',
      payment_method: 'cash',
      card_type: '',
      card_last_four: '',
      installments: 1,
      notes: '',
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
    if (selectedOrder) {
      fetchOrderPayments(selectedOrder.id);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    const found = PAYMENT_METHODS.find(m => m.id === method);
    return found?.icon || 'card-outline';
  };

  const getPaymentMethodName = (method: string) => {
    const found = PAYMENT_METHODS.find(m => m.id === method);
    return found?.name || method;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: { [key: string]: string } = {
      TRY: '₺',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    return `${symbols[currency] || currency} ${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Ödeme Yönetimi</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
      >
        {/* Order Selection */}
        <TouchableOpacity
          style={styles.orderSelector}
          onPress={() => setOrderSelectVisible(true)}
        >
          <View style={styles.orderSelectorContent}>
            <Ionicons name="receipt-outline" size={24} color="#3B82F6" />
            <View style={styles.orderSelectorText}>
              {selectedOrder ? (
                <>
                  <Text style={styles.orderNumber}>{selectedOrder.order_no}</Text>
                  <Text style={styles.customerName}>{selectedOrder.customer_name}</Text>
                </>
              ) : (
                <Text style={styles.selectOrderText}>Sipariş Seçin</Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-down" size={24} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Payment Summary */}
        {selectedOrder && (
          <View style={styles.summaryContainer}>
            <LinearGradient colors={['#1E3A5F', '#2D5A87']} style={styles.summaryGradient}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Sipariş Tutarı</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(paymentSummary.orderTotal, 'TRY')}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Ödenen</Text>
                  <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                    {formatCurrency(paymentSummary.totalPaid, 'TRY')}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Kalan</Text>
                  <Text style={[styles.summaryValue, { color: paymentSummary.remaining > 0 ? '#F59E0B' : '#10B981' }]}>
                    {formatCurrency(paymentSummary.remaining, 'TRY')}
                  </Text>
                </View>
              </View>

              {paymentSummary.remaining > 0 && (
                <TouchableOpacity
                  style={styles.addPaymentButton}
                  onPress={() => setModalVisible(true)}
                >
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.addPaymentText}>Ödeme Ekle</Text>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>
        )}

        {/* Payment History */}
        {selectedOrder && (
          <View style={styles.paymentsSection}>
            <Text style={styles.sectionTitle}>Ödeme Geçmişi</Text>

            {payments.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="card-outline" size={48} color="#4B5563" />
                <Text style={styles.emptyText}>Henüz ödeme yapılmamış</Text>
              </View>
            ) : (
              payments.map((payment) => (
                <View key={payment.id} style={styles.paymentCard}>
                  <View style={styles.paymentHeader}>
                    <View style={styles.paymentMethodContainer}>
                      <View style={styles.paymentMethodIcon}>
                        <Ionicons
                          name={getPaymentMethodIcon(payment.payment_method) as any}
                          size={24}
                          color="#3B82F6"
                        />
                      </View>
                      <View>
                        <Text style={styles.paymentMethod}>
                          {getPaymentMethodName(payment.payment_method)}
                        </Text>
                        {payment.card_last_four && (
                          <Text style={styles.cardInfo}>
                            •••• {payment.card_last_four}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(payment.status)}20` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(payment.status) }]}>
                        {payment.status === 'completed' ? 'Tamamlandı' :
                         payment.status === 'pending' ? 'Bekliyor' : 'İptal'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.paymentDetails}>
                    <View style={styles.paymentAmountRow}>
                      <Text style={styles.paymentAmount}>
                        {formatCurrency(payment.amount, payment.currency)}
                      </Text>
                      {payment.installments > 1 && (
                        <Text style={styles.installmentText}>
                          {payment.installments} Taksit
                        </Text>
                      )}
                    </View>
                    <Text style={styles.paymentDate}>
                      {new Date(payment.payment_date).toLocaleString('tr-TR')}
                    </Text>
                    {payment.notes && (
                      <Text style={styles.paymentNotes}>{payment.notes}</Text>
                    )}
                  </View>

                  {payment.status === 'completed' && (
                    <TouchableOpacity
                      style={styles.cancelPaymentButton}
                      onPress={() => handleCancelPayment(payment)}
                    >
                      <Text style={styles.cancelPaymentText}>İptal Et</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Order Selection Modal */}
      <Modal
        visible={orderSelectVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOrderSelectVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.modalGradient}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sipariş Seçin</Text>
                <TouchableOpacity onPress={() => setOrderSelectVisible(false)}>
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Sipariş no veya müşteri ara..."
                  placeholderTextColor="#6B7280"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <ScrollView style={styles.orderList}>
                {filteredOrders.map((order) => (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.orderItem}
                    onPress={() => handleSelectOrder(order)}
                  >
                    <View style={styles.orderItemInfo}>
                      <Text style={styles.orderItemNo}>{order.order_no}</Text>
                      <Text style={styles.orderItemCustomer}>{order.customer_name}</Text>
                    </View>
                    <View style={styles.orderItemRight}>
                      <Text style={styles.orderItemTotal}>
                        {formatCurrency(order.total, 'TRY')}
                      </Text>
                      <View style={[
                        styles.paymentStatusBadge,
                        { backgroundColor: order.payment_status === 'partial' ? '#F59E0B20' : '#EF444420' }
                      ]}>
                        <Text style={[
                          styles.paymentStatusText,
                          { color: order.payment_status === 'partial' ? '#F59E0B' : '#EF4444' }
                        ]}>
                          {order.payment_status === 'partial' ? 'Kısmi' : 'Ödenmedi'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.modalGradient}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ödeme Ekle</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formContainer}>
                {/* Amount */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Tutar *</Text>
                  <View style={styles.amountRow}>
                    <TextInput
                      style={[styles.input, { flex: 2 }]}
                      value={paymentForm.amount}
                      onChangeText={(text) => setPaymentForm({ ...paymentForm, amount: text })}
                      placeholder="0.00"
                      placeholderTextColor="#6B7280"
                      keyboardType="decimal-pad"
                    />
                    <View style={styles.currencySelector}>
                      {CURRENCIES.map((curr) => (
                        <TouchableOpacity
                          key={curr}
                          style={[
                            styles.currencyOption,
                            paymentForm.currency === curr && styles.currencyOptionSelected,
                          ]}
                          onPress={() => setPaymentForm({ ...paymentForm, currency: curr })}
                        >
                          <Text style={[
                            styles.currencyText,
                            paymentForm.currency === curr && styles.currencyTextSelected,
                          ]}>
                            {curr}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  {paymentSummary.remaining > 0 && (
                    <TouchableOpacity
                      style={styles.fillRemainingButton}
                      onPress={() => setPaymentForm({ ...paymentForm, amount: paymentSummary.remaining.toString() })}
                    >
                      <Text style={styles.fillRemainingText}>
                        Kalan tutarı gir ({formatCurrency(paymentSummary.remaining, 'TRY')})
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Payment Method */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Ödeme Yöntemi *</Text>
                  <View style={styles.methodGrid}>
                    {PAYMENT_METHODS.map((method) => (
                      <TouchableOpacity
                        key={method.id}
                        style={[
                          styles.methodOption,
                          paymentForm.payment_method === method.id && styles.methodOptionSelected,
                        ]}
                        onPress={() => setPaymentForm({ ...paymentForm, payment_method: method.id })}
                      >
                        <Ionicons
                          name={method.icon as any}
                          size={20}
                          color={paymentForm.payment_method === method.id ? '#3B82F6' : '#9CA3AF'}
                        />
                        <Text style={[
                          styles.methodText,
                          paymentForm.payment_method === method.id && styles.methodTextSelected,
                        ]}>
                          {method.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Card Details (if card payment) */}
                {['visa', 'mastercard', 'amex', 'maestro'].includes(paymentForm.payment_method) && (
                  <>
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Kart Son 4 Hane</Text>
                      <TextInput
                        style={styles.input}
                        value={paymentForm.card_last_four}
                        onChangeText={(text) => setPaymentForm({ ...paymentForm, card_last_four: text.slice(0, 4) })}
                        placeholder="1234"
                        placeholderTextColor="#6B7280"
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Taksit</Text>
                      <View style={styles.installmentRow}>
                        {INSTALLMENT_OPTIONS.map((inst) => (
                          <TouchableOpacity
                            key={inst}
                            style={[
                              styles.installmentOption,
                              paymentForm.installments === inst && styles.installmentOptionSelected,
                            ]}
                            onPress={() => setPaymentForm({ ...paymentForm, installments: inst })}
                          >
                            <Text style={[
                              styles.installmentText,
                              paymentForm.installments === inst && styles.installmentTextSelected,
                            ]}>
                              {inst === 1 ? 'Tek' : inst}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </>
                )}

                {/* Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Not</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={paymentForm.notes}
                    onChangeText={(text) => setPaymentForm({ ...paymentForm, notes: text })}
                    placeholder="Ödeme notu..."
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddPayment}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>Ödeme Kaydet</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  orderSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderSelectorText: {
    marginLeft: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  customerName: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  selectOrderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  summaryContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#374151',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  addPaymentText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  paymentsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 12,
  },
  paymentCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardInfo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentDetails: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 12,
  },
  paymentAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  installmentText: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paymentDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  paymentNotes: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  cancelPaymentButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  cancelPaymentText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#FFFFFF',
  },
  orderList: {
    maxHeight: 400,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemNo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderItemCustomer: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  orderItemRight: {
    alignItems: 'flex-end',
  },
  orderItemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formContainer: {
    maxHeight: 450,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#374151',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  amountRow: {
    flexDirection: 'row',
    gap: 8,
  },
  currencySelector: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  currencyOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  currencyOptionSelected: {
    backgroundColor: '#3B82F6',
  },
  currencyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  currencyTextSelected: {
    color: '#FFFFFF',
  },
  fillRemainingButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  fillRemainingText: {
    color: '#3B82F6',
    fontSize: 14,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  methodOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  methodText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 6,
  },
  methodTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  installmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  installmentOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  installmentOptionSelected: {
    backgroundColor: '#3B82F6',
  },
  installmentTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
