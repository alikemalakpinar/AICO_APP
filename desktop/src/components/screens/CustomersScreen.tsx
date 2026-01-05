import React, { useState, useEffect, useContext } from 'react';
import { ApiContext } from '../../App';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  X,
  Save,
  Eye,
  Globe
} from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  passport_no: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

export default function CustomersScreen() {
  const { baseUrl, fetchWithTimeout } = useContext(ApiContext);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    address: '',
    passport_no: '',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/customers`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Müşteriler alınamadı:', error);
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

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery) ||
    customer.country?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        country: customer.country || '',
        city: customer.city || '',
        address: customer.address || '',
        passport_no: customer.passport_no || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        country: '',
        city: '',
        address: '',
        passport_no: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const url = editingCustomer
        ? `${baseUrl}/api/customers/${editingCustomer.id}`
        : `${baseUrl}/api/customers`;

      const response = await fetchWithTimeout(url, {
        method: editingCustomer ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchCustomers();
        setShowModal(false);
      }
    } catch (error) {
      console.error('Müşteri kaydedilemedi:', error);
    }
  };

  const handleDelete = async (customerId: number) => {
    if (!window.confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return;

    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/customers/${customerId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCustomers(customers.filter(c => c.id !== customerId));
      }
    } catch (error) {
      console.error('Müşteri silinemedi:', error);
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Müşteriler</h1>
          <p className="text-neutral-500">Müşteri veritabanınızı yönetin</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchCustomers} className="btn btn-secondary flex items-center gap-2">
            <RefreshCw size={18} />
            Yenile
          </button>
          <button onClick={() => handleOpenModal()} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            Yeni Müşteri
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="İsim, email, telefon veya ülke ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-11"
          />
        </div>
        <div className="mt-4 text-sm text-neutral-500">
          Toplam {filteredCustomers.length} müşteri bulundu
        </div>
      </div>

      {/* Customers Table */}
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
                  <th>Müşteri</th>
                  <th>İletişim</th>
                  <th>Ülke</th>
                  <th>Sipariş</th>
                  <th>Toplam Harcama</th>
                  <th className="text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-accent/10 rounded-full flex items-center justify-center">
                          <span className="font-semibold text-primary-accent">
                            {customer.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-neutral-800">{customer.name}</p>
                          <p className="text-sm text-neutral-500">{customer.passport_no || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="flex items-center gap-1 text-sm">
                          <Mail size={14} className="text-neutral-400" />
                          <span>{customer.email || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-neutral-500">
                          <Phone size={14} className="text-neutral-400" />
                          <span>{customer.phone || '-'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Globe size={14} className="text-neutral-400" />
                        <span>{customer.country || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{customer.total_orders || 0}</span>
                    </td>
                    <td className="font-semibold">{formatCurrency(customer.total_spent || 0)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewCustomer(customer)}
                          className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenModal(customer)}
                          className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-800">
                {editingCustomer ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="label">Ad Soyad</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">E-posta</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Telefon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Ülke</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Şehir</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="label">Adres</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="input"
                  rows={2}
                />
              </div>
              <div>
                <label className="label">Pasaport No</label>
                <input
                  type="text"
                  value={formData.passport_no}
                  onChange={(e) => setFormData(prev => ({ ...prev, passport_no: e.target.value }))}
                  className="input"
                />
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                İptal
              </button>
              <button onClick={handleSave} className="btn btn-primary flex items-center gap-2">
                <Save size={18} />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-accent text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  {selectedCustomer.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-800">{selectedCustomer.name}</h2>
                  <p className="text-neutral-500">{selectedCustomer.country}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-sm text-green-600">Toplam Sipariş</p>
                  <p className="text-2xl font-bold text-green-700">{selectedCustomer.total_orders || 0}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-600">Toplam Harcama</p>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(selectedCustomer.total_spent || 0)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-neutral-400" />
                  <span>{selectedCustomer.email || '-'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-neutral-400" />
                  <span>{selectedCustomer.phone || '-'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-neutral-400" />
                  <span>{selectedCustomer.address || '-'}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex justify-end">
              <button onClick={() => setShowDetailModal(false)} className="btn btn-secondary">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
