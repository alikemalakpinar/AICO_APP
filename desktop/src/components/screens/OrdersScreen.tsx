import React, { useState, useEffect, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { ApiContext } from '../../App';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw
} from 'lucide-react';

interface Order {
  id: number;
  order_no: string;
  date: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_country: string;
  products: any[];
  total: number;
  status: string;
  payment_method: string;
  created_at: string;
  branch_name?: string;
  agency?: string;
  guide?: string;
}

export default function OrdersScreen() {
  const { baseUrl, fetchWithTimeout } = useContext(ApiContext);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Siparişler alınamadı:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { class: string; label: string }> = {
      pending: { class: 'badge-warning', label: 'Bekliyor' },
      processing: { class: 'badge-info', label: 'İşleniyor' },
      completed: { class: 'badge-success', label: 'Tamamlandı' },
      cancelled: { class: 'badge-error', label: 'İptal' },
    };
    const config = statusConfig[status] || { class: 'badge-info', label: status };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  // Filter and search orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.order_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!window.confirm('Bu siparişi silmek istediğinize emin misiniz?')) return;

    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/orders/${orderId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setOrders(orders.filter(o => o.id !== orderId));
      }
    } catch (error) {
      console.error('Sipariş silinemedi:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Siparişler</h1>
          <p className="text-neutral-500">Tüm siparişleri görüntüle ve yönet</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Yenile
          </button>
          <button className="btn btn-secondary flex items-center gap-2">
            <Download size={18} />
            Dışa Aktar
          </button>
          <NavLink
            to="/orders/new"
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Yeni Sipariş
          </NavLink>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Sipariş no, müşteri adı veya email ile ara..."
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
            <option value="pending">Bekliyor</option>
            <option value="processing">İşleniyor</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal</option>
          </select>
        </div>

        <div className="mt-4 text-sm text-neutral-500">
          Toplam {filteredOrders.length} sipariş bulundu
        </div>
      </div>

      {/* Orders Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Sipariş No</th>
                  <th>Müşteri</th>
                  <th>Ülke</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                  <th className="text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span className="font-medium text-primary-accent">{order.order_no}</span>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-neutral-800">{order.customer_name || '-'}</p>
                          <p className="text-sm text-neutral-500">{order.customer_email || '-'}</p>
                        </div>
                      </td>
                      <td>{order.customer_country || '-'}</td>
                      <td className="font-semibold">{formatCurrency(order.total || 0)}</td>
                      <td>{getStatusBadge(order.status || 'pending')}</td>
                      <td className="text-neutral-500">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString('tr-TR') : '-'}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600"
                            title="Görüntüle"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600"
                            title="Düzenle"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                            title="Sil"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-neutral-500">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Aramanızla eşleşen sipariş bulunamadı'
                        : 'Henüz sipariş bulunmuyor'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200">
            <p className="text-sm text-neutral-500">
              Sayfa {currentPage} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary p-2 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium ${currentPage === pageNum
                        ? 'bg-primary-accent text-white'
                        : 'hover:bg-neutral-100 text-neutral-600'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary p-2 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-800">
                    Sipariş #{selectedOrder.order_no}
                  </h2>
                  <p className="text-neutral-500">
                    {selectedOrder.created_at && new Date(selectedOrder.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
                {getStatusBadge(selectedOrder.status || 'pending')}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-3">Müşteri Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-500">Ad Soyad</p>
                    <p className="font-medium">{selectedOrder.customer_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">E-posta</p>
                    <p className="font-medium">{selectedOrder.customer_email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Telefon</p>
                    <p className="font-medium">{selectedOrder.customer_phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Ülke</p>
                    <p className="font-medium">{selectedOrder.customer_country || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-3">Sipariş Detayları</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-500">Şube</p>
                    <p className="font-medium">{selectedOrder.branch_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Acenta</p>
                    <p className="font-medium">{selectedOrder.agency || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Rehber</p>
                    <p className="font-medium">{selectedOrder.guide || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Ödeme Yöntemi</p>
                    <p className="font-medium">{selectedOrder.payment_method || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Products */}
              {selectedOrder.products && selectedOrder.products.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-500 uppercase mb-3">Ürünler</h3>
                  <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                    {selectedOrder.products.map((product: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-neutral-500">
                            {product.size && `Boyut: ${product.size}`} {product.quantity && `• Adet: ${product.quantity}`}
                          </p>
                        </div>
                        <p className="font-semibold">{formatCurrency(parseFloat(product.price) || 0)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                <span className="text-lg font-semibold">Toplam</span>
                <span className="text-2xl font-bold text-primary-accent">
                  {formatCurrency(selectedOrder.total || 0)}
                </span>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn btn-secondary"
              >
                Kapat
              </button>
              <button className="btn btn-primary">
                Düzenle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
