import React, { useState, useEffect, useContext } from 'react';
import { ApiContext } from '../../App';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Filter,
  Grid,
  List,
  RefreshCw,
  X,
  Save,
  Tag,
  Ruler,
  DollarSign,
  BarChart
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  barcode: string;
  category: string;
  width: number;
  height: number;
  sqm: number;
  price_usd: number;
  default_cost: number;
  min_sale_price: number;
  stock: number;
  status: string;
  origin_region: string;
  material: string;
}

export default function ProductsScreen() {
  const { baseUrl, fetchWithTimeout } = useContext(ApiContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: '',
    width: '',
    height: '',
    price_usd: '',
    default_cost: '',
    stock: '',
    origin_region: '',
    material: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Ürünler alınamadı:', error);
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

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        barcode: product.barcode || '',
        category: product.category || '',
        width: product.width?.toString() || '',
        height: product.height?.toString() || '',
        price_usd: product.price_usd?.toString() || '',
        default_cost: product.default_cost?.toString() || '',
        stock: product.stock?.toString() || '',
        origin_region: product.origin_region || '',
        material: product.material || '',
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        barcode: '',
        category: '',
        width: '',
        height: '',
        price_usd: '',
        default_cost: '',
        stock: '',
        origin_region: '',
        material: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const productData = {
        name: formData.name,
        barcode: formData.barcode,
        category: formData.category,
        width: parseFloat(formData.width) || 0,
        height: parseFloat(formData.height) || 0,
        sqm: (parseFloat(formData.width) || 0) * (parseFloat(formData.height) || 0) / 10000,
        price_usd: parseFloat(formData.price_usd) || 0,
        default_cost: parseFloat(formData.default_cost) || 0,
        stock: parseInt(formData.stock) || 0,
        origin_region: formData.origin_region,
        material: formData.material,
      };

      const url = editingProduct
        ? `${baseUrl}/api/products/${editingProduct.id}`
        : `${baseUrl}/api/products`;

      const response = await fetchWithTimeout(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        fetchProducts();
        setShowModal(false);
      }
    } catch (error) {
      console.error('Ürün kaydedilemedi:', error);
    }
  };

  const handleDelete = async (productId: number) => {
    if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/products/${productId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
      }
    } catch (error) {
      console.error('Ürün silinemedi:', error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Ürünler</h1>
          <p className="text-neutral-500">Ürün envanterinizi yönetin</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchProducts} className="btn btn-secondary flex items-center gap-2">
            <RefreshCw size={18} />
            Yenile
          </button>
          <button onClick={() => handleOpenModal()} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            Yeni Ürün
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Ürün adı, barkod veya kategori ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-11"
            />
          </div>
          <div className="flex items-center gap-2 p-1 bg-neutral-100 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
            >
              <Grid size={18} />
            </button>
          </div>
        </div>
        <div className="mt-4 text-sm text-neutral-500">
          Toplam {filteredProducts.length} ürün bulundu
        </div>
      </div>

      {/* Products */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th>Barkod</th>
                  <th>Boyut (cm)</th>
                  <th>m²</th>
                  <th>Fiyat</th>
                  <th>Maliyet</th>
                  <th>Stok</th>
                  <th className="text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div>
                        <p className="font-medium text-neutral-800">{product.name}</p>
                        <p className="text-sm text-neutral-500">{product.category}</p>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{product.barcode || '-'}</td>
                    <td>{product.width && product.height ? `${product.width}x${product.height}` : '-'}</td>
                    <td>{product.sqm?.toFixed(2) || '-'}</td>
                    <td className="font-semibold">{formatCurrency(product.price_usd || 0)}</td>
                    <td className="text-neutral-500">{formatCurrency(product.default_cost || 0)}</td>
                    <td>
                      <span className={`badge ${product.stock > 0 ? 'badge-success' : 'badge-error'}`}>
                        {product.stock || 0}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-primary-accent/10 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary-accent" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(product)}
                    className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-600"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-neutral-800 mb-1">{product.name}</h3>
              <p className="text-sm text-neutral-500 mb-3">{product.category}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Fiyat</span>
                <span className="font-semibold">{formatCurrency(product.price_usd || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-neutral-500">Stok</span>
                <span className={`badge ${product.stock > 0 ? 'badge-success' : 'badge-error'}`}>
                  {product.stock || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-800">
                {editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Ürün Adı</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Barkod</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Kategori</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">En (cm)</label>
                  <input
                    type="number"
                    value={formData.width}
                    onChange={(e) => setFormData(prev => ({ ...prev, width: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Boy (cm)</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Fiyat (USD)</label>
                  <input
                    type="number"
                    value={formData.price_usd}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_usd: e.target.value }))}
                    className="input"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="label">Maliyet (USD)</label>
                  <input
                    type="number"
                    value={formData.default_cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_cost: e.target.value }))}
                    className="input"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="label">Stok</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Menşei</label>
                  <input
                    type="text"
                    value={formData.origin_region}
                    onChange={(e) => setFormData(prev => ({ ...prev, origin_region: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Malzeme</label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                    className="input"
                  />
                </div>
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
    </div>
  );
}
