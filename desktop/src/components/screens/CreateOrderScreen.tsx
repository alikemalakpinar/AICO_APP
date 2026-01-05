import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiContext, UserContext } from '../../App';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  Truck,
  Package,
  User,
  Plus,
  Trash2,
  AlertTriangle,
  DollarSign,
  Calculator,
  Building2
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  quantity: string;
  size: string;
  priceUSD: string;
  barcode: string;
  notes: string;
  cost: string;
  minSalePrice: string;
}

interface Agency {
  id: number;
  code: string;
  name: string;
  region: string;
  commission_rate: number;
}

interface Guide {
  id: number;
  agency_id: number | null;
  name: string;
  badge_number: string;
  commission_rate: number;
}

const STEPS = [
  { id: 1, title: 'Temel Bilgiler', icon: Info },
  { id: 2, title: 'Sevkiyat', icon: Truck },
  { id: 3, title: 'Ürünler', icon: Package },
  { id: 4, title: 'Müşteri', icon: User },
];

const PAYMENT_METHODS = [
  { id: 'mastercard', name: 'Mastercard' },
  { id: 'visa', name: 'Visa' },
  { id: 'cash', name: 'Nakit' },
  { id: 'transfer', name: 'Havale/EFT' },
  { id: 'installment', name: 'Taksit' },
];

const COUNTRIES = [
  'Amerika Birleşik Devletleri', 'Almanya', 'İngiltere', 'Fransa', 'İtalya',
  'İspanya', 'Hollanda', 'Belçika', 'Rusya', 'Japonya', 'Avustralya', 'Türkiye'
];

export default function CreateOrderScreen() {
  const navigate = useNavigate();
  const { baseUrl, fetchWithTimeout } = useContext(ApiContext);
  const { user } = useContext(UserContext);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [filteredGuides, setFilteredGuides] = useState<Guide[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [showProfitWarning, setShowProfitWarning] = useState(false);
  const [profitResult, setProfitResult] = useState<any>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    orderNo: `ORD-${Date.now().toString().slice(-6)}`,
    branchId: user?.branch_id || null,
    branchName: user?.branch_name || '',
    shipping: {
      salesman: '',
      conference: '',
      cruise: '',
      agency: '',
      agency_id: null as number | null,
      guide: '',
      guide_id: null as number | null,
      pax: '',
    },
    products: [{
      id: crypto.randomUUID(),
      name: '',
      quantity: '1',
      size: '',
      priceUSD: '',
      barcode: '',
      notes: '',
      cost: '',
      minSalePrice: '',
    }] as Product[],
    paymentMethod: '',
    customer: {
      nameSurname: '',
      email: '',
      phone: '',
      address: '',
      state: '',
      city: '',
      zipCode: '',
      country: '',
      passportNo: '',
      taxNo: '',
    },
  });

  useEffect(() => {
    fetchAgencies();
    fetchGuides();
    fetchBranches();
  }, []);

  const fetchAgencies = async () => {
    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/agencies`);
      if (response.ok) {
        const data = await response.json();
        setAgencies(data);
      }
    } catch (error) {
      console.error('Acentalar alınamadı:', error);
    }
  };

  const fetchGuides = async () => {
    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/guides`);
      if (response.ok) {
        const data = await response.json();
        setGuides(data);
        setFilteredGuides(data);
      }
    } catch (error) {
      console.error('Rehberler alınamadı:', error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/branches`);
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
      }
    } catch (error) {
      console.error('Şubeler alınamadı:', error);
    }
  };

  const handleAgencyChange = (agencyId: string) => {
    const agency = agencies.find(a => a.id === parseInt(agencyId));
    if (agency) {
      setFormData(prev => ({
        ...prev,
        shipping: {
          ...prev.shipping,
          agency: agency.name,
          agency_id: agency.id,
          guide: '',
          guide_id: null
        }
      }));
      const filtered = guides.filter(g => g.agency_id === agency.id || g.agency_id === null);
      setFilteredGuides(filtered);
    } else {
      setFormData(prev => ({
        ...prev,
        shipping: { ...prev.shipping, agency: '', agency_id: null, guide: '', guide_id: null }
      }));
      setFilteredGuides(guides);
    }
  };

  const handleGuideChange = (guideId: string) => {
    const guide = guides.find(g => g.id === parseInt(guideId));
    if (guide) {
      setFormData(prev => ({
        ...prev,
        shipping: { ...prev.shipping, guide: guide.name, guide_id: guide.id }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        shipping: { ...prev.shipping, guide: '', guide_id: null }
      }));
    }
  };

  const calculateTotal = () => {
    return formData.products.reduce((sum, p) => {
      const qty = parseFloat(p.quantity) || 0;
      const price = parseFloat(p.priceUSD) || 0;
      return sum + (qty * price);
    }, 0);
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, {
        id: crypto.randomUUID(),
        name: '',
        quantity: '1',
        size: '',
        priceUSD: '',
        barcode: '',
        notes: '',
        cost: '',
        minSalePrice: '',
      }]
    }));
  };

  const removeProduct = (id: string) => {
    if (formData.products.length > 1) {
      setFormData(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id)
      }));
    }
  };

  const updateProduct = (id: string, field: keyof Product, value: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        return formData.branchId || user?.branch_id;
      case 2:
        return true;
      case 3:
        return formData.products.some(p => p.name.trim());
      case 4:
        return formData.customer.nameSurname.trim() &&
          formData.customer.country &&
          formData.customer.phone.trim() &&
          formData.customer.address.trim();
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep()) {
      alert('Lütfen gerekli alanları doldurun.');
      return;
    }
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (forceSubmit: boolean = false) => {
    if (!validateStep()) {
      alert('Lütfen tüm gerekli alanları doldurun.');
      return;
    }

    // Check profitability
    if (!forceSubmit) {
      const totalCost = formData.products.reduce((sum, p) => {
        return sum + (parseFloat(p.quantity) || 1) * (parseFloat(p.cost) || 0);
      }, 0);
      const total = calculateTotal();
      const agencyRate = agencies.find(a => a.id === formData.shipping.agency_id)?.commission_rate || 0;
      const guideRate = guides.find(g => g.id === formData.shipping.guide_id)?.commission_rate || 0;

      const taxAmount = (total * 20) / 120;
      const netBase = total - taxAmount;
      const commissions = (netBase * (agencyRate + guideRate)) / 100;
      const netProfit = netBase - commissions - totalCost;

      if (netProfit < 0 || (total > 0 && (netProfit / total) * 100 < 5)) {
        setProfitResult({
          total,
          totalCost,
          taxAmount,
          commissions,
          netProfit,
          profitMargin: total > 0 ? (netProfit / total) * 100 : 0,
          isLoss: netProfit < 0
        });
        setShowProfitWarning(true);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        date: formData.date,
        order_no: formData.orderNo,
        branch_id: formData.branchId || user?.branch_id,
        branch_name: formData.branchName || user?.branch_name,
        customerInfo: formData.customer,
        shipping: formData.shipping,
        agency_id: formData.shipping.agency_id,
        guide_id: formData.shipping.guide_id,
        products: formData.products.filter(p => p.name.trim()).map(p => ({
          name: p.name,
          quantity: p.quantity,
          size: p.size,
          price: p.priceUSD,
          cost: p.cost || '0',
          notes: p.notes,
          barcode: p.barcode,
        })),
        payment_method: formData.paymentMethod,
        total: calculateTotal(),
        created_at: new Date().toISOString(),
      };

      const response = await fetchWithTimeout(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        alert('Sipariş başarıyla oluşturuldu!');
        navigate('/orders');
      } else {
        throw new Error('Sipariş kaydedilemedi');
      }
    } catch (error) {
      console.error('Sipariş hatası:', error);
      alert('Sipariş oluşturulurken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-800 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Siparişlere Dön</span>
        </button>
        <h1 className="text-2xl font-bold text-neutral-800">Yeni Sipariş Oluştur</h1>
        <p className="text-neutral-500">Sipariş bilgilerini adım adım girin</p>
      </div>

      {/* Progress Steps */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : currentStep === step.id
                      ? 'bg-primary-accent text-white'
                      : 'bg-neutral-200 text-neutral-500'
                  }`}>
                  {currentStep > step.id ? <Check size={20} /> : step.id}
                </div>
                <div className="hidden md:block">
                  <p className={`font-medium ${currentStep >= step.id ? 'text-neutral-800' : 'text-neutral-400'}`}>
                    {step.title}
                  </p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-4 rounded ${currentStep > step.id ? 'bg-green-500' : 'bg-neutral-200'
                  }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="card mb-6">
        {/* Step 1: Temel Bilgiler */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
              <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
                <Info className="w-5 h-5 text-primary-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-800">Temel Bilgiler</h2>
                <p className="text-sm text-neutral-500">Sipariş temel bilgilerini girin</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Sipariş No</label>
                <input type="text" value={formData.orderNo} className="input bg-neutral-50" readOnly />
              </div>
              <div>
                <label className="label">Tarih</label>
                <input type="date" value={formData.date} className="input bg-neutral-50" readOnly />
              </div>
            </div>

            <div>
              <label className="label">Şube *</label>
              {user?.branch_id ? (
                <div className="input bg-neutral-50 flex items-center gap-2">
                  <Building2 size={18} className="text-primary-accent" />
                  <span>{user.branch_name}</span>
                </div>
              ) : (
                <select
                  value={formData.branchId || ''}
                  onChange={(e) => {
                    const branch = branches.find(b => b.id === parseInt(e.target.value));
                    setFormData(prev => ({
                      ...prev,
                      branchId: branch?.id || null,
                      branchName: branch?.name || ''
                    }));
                  }}
                  className="select"
                >
                  <option value="">Şube seçin...</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Sevkiyat */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
              <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-800">Sevkiyat Bilgileri</h2>
                <p className="text-sm text-neutral-500">Teslimat detaylarını girin</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Satış Temsilcisi</label>
                <input
                  type="text"
                  value={formData.shipping.salesman}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shipping: { ...prev.shipping, salesman: e.target.value }
                  }))}
                  className="input"
                  placeholder="Temsilci adı"
                />
              </div>
              <div>
                <label className="label">PAX (Yolcu Sayısı)</label>
                <input
                  type="number"
                  value={formData.shipping.pax}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shipping: { ...prev.shipping, pax: e.target.value }
                  }))}
                  className="input"
                  placeholder="Yolcu sayısı"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Acenta</label>
                <select
                  value={formData.shipping.agency_id || ''}
                  onChange={(e) => handleAgencyChange(e.target.value)}
                  className="select"
                >
                  <option value="">Acenta seçin...</option>
                  {agencies.map(agency => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name} ({agency.commission_rate}% komisyon)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Rehber</label>
                <select
                  value={formData.shipping.guide_id || ''}
                  onChange={(e) => handleGuideChange(e.target.value)}
                  className="select"
                  disabled={!formData.shipping.agency_id}
                >
                  <option value="">{formData.shipping.agency_id ? 'Rehber seçin...' : 'Önce acenta seçin'}</option>
                  {filteredGuides.map(guide => (
                    <option key={guide.id} value={guide.id}>
                      {guide.name} ({guide.commission_rate}% komisyon)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Konferans</label>
                <input
                  type="text"
                  value={formData.shipping.conference}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shipping: { ...prev.shipping, conference: e.target.value }
                  }))}
                  className="input"
                  placeholder="Konferans bilgisi"
                />
              </div>
              <div>
                <label className="label">Cruise</label>
                <input
                  type="text"
                  value={formData.shipping.cruise}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shipping: { ...prev.shipping, cruise: e.target.value }
                  }))}
                  className="input"
                  placeholder="Cruise bilgisi"
                />
              </div>
            </div>

            {/* Commission Preview */}
            {(formData.shipping.agency_id || formData.shipping.guide_id) && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator size={18} className="text-amber-600" />
                  <span className="font-medium text-amber-800">Komisyon Özeti</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-amber-700">Acenta Komisyonu:</span>
                    <span className="font-medium ml-2">
                      %{agencies.find(a => a.id === formData.shipping.agency_id)?.commission_rate || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-amber-700">Rehber Komisyonu:</span>
                    <span className="font-medium ml-2">
                      %{guides.find(g => g.id === formData.shipping.guide_id)?.commission_rate || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Ürünler */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
              <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-primary-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-800">Ürün Bilgileri</h2>
                <p className="text-sm text-neutral-500">Siparişe ürün ekleyin</p>
              </div>
            </div>

            {formData.products.map((product, index) => (
              <div key={product.id} className="p-4 bg-neutral-50 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-700">Ürün {index + 1}</span>
                  {formData.products.length > 1 && (
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="label">Ürün Adı *</label>
                    <input
                      type="text"
                      value={product.name}
                      onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                      className="input"
                      placeholder="Ürün adı"
                    />
                  </div>
                  <div>
                    <label className="label">Adet</label>
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => updateProduct(product.id, 'quantity', e.target.value)}
                      className="input"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="label">Boyut</label>
                    <input
                      type="text"
                      value={product.size}
                      onChange={(e) => updateProduct(product.id, 'size', e.target.value)}
                      className="input"
                      placeholder="örn: 200x300"
                    />
                  </div>
                  <div>
                    <label className="label">Fiyat (USD) *</label>
                    <input
                      type="number"
                      value={product.priceUSD}
                      onChange={(e) => updateProduct(product.id, 'priceUSD', e.target.value)}
                      className="input"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="label">Maliyet (USD)</label>
                    <input
                      type="number"
                      value={product.cost}
                      onChange={(e) => updateProduct(product.id, 'cost', e.target.value)}
                      className="input"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={addProduct}
              className="w-full py-3 border-2 border-dashed border-primary-accent text-primary-accent rounded-xl hover:bg-primary-accent/5 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Yeni Ürün Ekle
            </button>

            {/* Payment Method */}
            <div>
              <label className="label">Ödeme Yöntemi</label>
              <div className="grid grid-cols-3 gap-3">
                {PAYMENT_METHODS.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.id }))}
                    className={`p-3 rounded-lg border-2 transition-colors ${formData.paymentMethod === method.id
                        ? 'border-primary-accent bg-primary-accent/10 text-primary-accent'
                        : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                  >
                    {method.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="p-4 bg-primary-main text-white rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Toplam Tutar</span>
                <span className="text-2xl font-bold">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Müşteri */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
              <div className="w-10 h-10 bg-primary-accent/10 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-primary-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-800">Müşteri Bilgileri</h2>
                <p className="text-sm text-neutral-500">Müşteri detaylarını girin</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Ad Soyad *</label>
                <input
                  type="text"
                  value={formData.customer.nameSurname}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, nameSurname: e.target.value }
                  }))}
                  className="input"
                  placeholder="Müşteri adı soyadı"
                />
              </div>
              <div>
                <label className="label">E-posta</label>
                <input
                  type="email"
                  value={formData.customer.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, email: e.target.value }
                  }))}
                  className="input"
                  placeholder="ornek@mail.com"
                />
              </div>
              <div>
                <label className="label">Telefon *</label>
                <input
                  type="tel"
                  value={formData.customer.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, phone: e.target.value }
                  }))}
                  className="input"
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="col-span-2">
                <label className="label">Ülke *</label>
                <select
                  value={formData.customer.country}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, country: e.target.value }
                  }))}
                  className="select"
                >
                  <option value="">Ülke seçin...</option>
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Adres *</label>
                <textarea
                  value={formData.customer.address}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, address: e.target.value }
                  }))}
                  className="input"
                  rows={3}
                  placeholder="Sokak, cadde, bina no..."
                />
              </div>
              <div>
                <label className="label">Şehir</label>
                <input
                  type="text"
                  value={formData.customer.city}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, city: e.target.value }
                  }))}
                  className="input"
                  placeholder="Şehir"
                />
              </div>
              <div>
                <label className="label">Posta Kodu</label>
                <input
                  type="text"
                  value={formData.customer.zipCode}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, zipCode: e.target.value }
                  }))}
                  className="input"
                  placeholder="Posta kodu"
                />
              </div>
              <div>
                <label className="label">Pasaport No</label>
                <input
                  type="text"
                  value={formData.customer.passportNo}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, passportNo: e.target.value }
                  }))}
                  className="input"
                  placeholder="Pasaport numarası"
                />
              </div>
              <div>
                <label className="label">Vergi No</label>
                <input
                  type="text"
                  value={formData.customer.taxNo}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, taxNo: e.target.value }
                  }))}
                  className="input"
                  placeholder="Vergi numarası"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="btn btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          <ArrowLeft size={18} />
          Geri
        </button>

        <button
          onClick={() => nextStep()}
          disabled={isSubmitting}
          className="btn btn-primary flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Kaydediliyor...</span>
            </>
          ) : currentStep === STEPS.length ? (
            <>
              <Check size={18} />
              <span>Siparişi Tamamla</span>
            </>
          ) : (
            <>
              <span>Devam</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>

      {/* Profit Warning Modal */}
      {showProfitWarning && profitResult && (
        <div className="modal-overlay" onClick={() => setShowProfitWarning(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className={`p-6 text-white ${profitResult.isLoss ? 'bg-red-500' : 'bg-amber-500'}`}>
              <div className="flex items-center gap-3">
                <AlertTriangle size={28} />
                <h2 className="text-xl font-bold">
                  {profitResult.isLoss ? 'ZARAR UYARISI!' : 'Düşük Kâr Marjı'}
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-center font-medium text-neutral-700">
                {profitResult.isLoss
                  ? `Bu satış ${formatCurrency(Math.abs(profitResult.netProfit))} zarar edecek!`
                  : `Kâr marjı düşük: %${profitResult.profitMargin.toFixed(1)}`}
              </p>

              <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Satış Tutarı:</span>
                  <span className="font-medium">{formatCurrency(profitResult.total)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>KDV (%20):</span>
                  <span>-{formatCurrency(profitResult.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Komisyonlar:</span>
                  <span>-{formatCurrency(profitResult.commissions)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Maliyet:</span>
                  <span>-{formatCurrency(profitResult.totalCost)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-200">
                  <span className="font-semibold">Net Kâr:</span>
                  <span className={`font-bold ${profitResult.netProfit < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(profitResult.netProfit)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex gap-3">
              <button
                onClick={() => setShowProfitWarning(false)}
                className="flex-1 btn btn-secondary"
              >
                Fiyatı Düzenle
              </button>
              <button
                onClick={() => {
                  setShowProfitWarning(false);
                  handleSubmit(true);
                }}
                className={`flex-1 btn ${profitResult.isLoss ? 'btn-danger' : 'btn-warning'}`}
              >
                Yine de Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
