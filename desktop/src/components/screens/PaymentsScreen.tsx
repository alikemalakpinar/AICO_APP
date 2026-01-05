import React, { useState, useEffect, useContext } from 'react';
import { ApiContext } from '../../App';
import {
  Search,
  Filter,
  CreditCard,
  DollarSign,
  TrendingUp,
  Calendar,
  RefreshCw,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Eye
} from 'lucide-react';

interface Payment {
  id: number;
  order_id: number;
  order_no: string;
  customer_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  created_at: string;
}

export default function PaymentsScreen() {
  const { baseUrl, fetchWithTimeout } = useContext(ApiContext);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    todayRevenue: 0,
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/payments`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data);

        // Calculate stats
        const completed = data.filter((p: Payment) => p.status === 'completed');
        const pending = data.filter((p: Payment) => p.status === 'pending');
        const today = new Date().toISOString().split('T')[0];
        const todayPayments = data.filter((p: Payment) =>
          p.created_at?.startsWith(today) && p.status === 'completed'
        );

        setStats({
          totalRevenue: completed.reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0),
          pendingPayments: pending.length,
          completedPayments: completed.length,
          todayRevenue: todayPayments.reduce((sum: number, p: Payment) => sum + (p.amount || 0), 0),
        });
      }
    } catch (error) {
      console.error('Ödemeler alınamadı:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string; label: string; icon: any }> = {
      completed: { class: 'badge-success', label: 'Tamamlandı', icon: CheckCircle },
      pending: { class: 'badge-warning', label: 'Bekliyor', icon: Clock },
      failed: { class: 'badge-error', label: 'Başarısız', icon: XCircle },
    };
    const config = statusConfig[status] || { class: 'badge-info', label: status, icon: Clock };
    const Icon = config.icon;
    return (
      <span className={`badge ${config.class} flex items-center gap-1`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    const methods: Record<string, string> = {
      mastercard: '💳',
      visa: '💳',
      cash: '💵',
      transfer: '🏦',
      installment: '📅',
    };
    return methods[method] || '💳';
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      payment.order_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Ödemeler</h1>
          <p className="text-neutral-500">Ödeme işlemlerini takip edin</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchPayments} className="btn btn-secondary flex items-center gap-2">
            <RefreshCw size={18} />
            Yenile
          </button>
          <button className="btn btn-secondary flex items-center gap-2">
            <Download size={18} />
            Dışa Aktar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Toplam Gelir</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Bugünkü Gelir</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Tamamlanan</p>
              <p className="text-2xl font-bold">{stats.completedPayments}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Bekleyen</p>
              <p className="text-2xl font-bold">{stats.pendingPayments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Sipariş no veya müşteri adı ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-11"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select w-full md:w-48"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="completed">Tamamlandı</option>
            <option value="pending">Bekliyor</option>
            <option value="failed">Başarısız</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Sipariş No</th>
                  <th>Müşteri</th>
                  <th>Tutar</th>
                  <th>Yöntem</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                  <th className="text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="font-medium text-primary-accent">{payment.order_no}</td>
                      <td>{payment.customer_name || '-'}</td>
                      <td className="font-semibold">
                        {formatCurrency(payment.amount || 0, payment.currency)}
                      </td>
                      <td>
                        <span className="flex items-center gap-2">
                          <span>{getPaymentMethodIcon(payment.payment_method)}</span>
                          <span className="capitalize">{payment.payment_method || '-'}</span>
                        </span>
                      </td>
                      <td>{getStatusBadge(payment.status || 'pending')}</td>
                      <td className="text-neutral-500">
                        {payment.created_at
                          ? new Date(payment.created_at).toLocaleDateString('tr-TR')
                          : '-'}
                      </td>
                      <td>
                        <div className="flex items-center justify-end">
                          <button className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600">
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-neutral-500">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Aramanızla eşleşen ödeme bulunamadı'
                        : 'Henüz ödeme bulunmuyor'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
