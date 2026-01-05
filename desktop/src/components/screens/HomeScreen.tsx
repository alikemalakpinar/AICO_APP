import React, { useState, useEffect, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { ApiContext, UserContext } from '../../App';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts';

interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  monthlyRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
  completedOrders: number;
}

interface RecentOrder {
  id: number;
  order_no: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

const COLORS = ['#3182ce', '#38a169', '#d69e2e', '#e53e3e', '#805ad5'];

export default function HomeScreen() {
  const { baseUrl, fetchWithTimeout } = useContext(ApiContext);
  const { user } = useContext(UserContext);
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayOrders: 0,
    monthlyRevenue: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sample chart data
  const salesData = [
    { name: 'Pzt', value: 4500 },
    { name: 'Sal', value: 5200 },
    { name: 'Çar', value: 4800 },
    { name: 'Per', value: 6100 },
    { name: 'Cum', value: 5800 },
    { name: 'Cmt', value: 7200 },
    { name: 'Paz', value: 3500 },
  ];

  const categoryData = [
    { name: 'Halı', value: 45 },
    { name: 'Kilim', value: 25 },
    { name: 'Yolluk', value: 15 },
    { name: 'Paspas', value: 10 },
    { name: 'Diğer', value: 5 },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch dashboard stats
      const statsResponse = await fetchWithTimeout(`${baseUrl}/api/analytics/dashboard`);
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats({
          todaySales: data.todaySales || 12500,
          todayOrders: data.todayOrders || 8,
          monthlyRevenue: data.monthlyRevenue || 245000,
          totalCustomers: data.totalCustomers || 1240,
          pendingOrders: data.pendingOrders || 15,
          completedOrders: data.completedOrders || 142,
        });
      }

      // Fetch recent orders
      const ordersResponse = await fetchWithTimeout(`${baseUrl}/api/orders?limit=5`);
      if (ordersResponse.ok) {
        const orders = await ordersResponse.json();
        setRecentOrders(orders.slice(0, 5));
      }
    } catch (error) {
      console.error('Dashboard veri hatası:', error);
      // Use mock data
      setStats({
        todaySales: 12500,
        todayOrders: 8,
        monthlyRevenue: 245000,
        totalCustomers: 1240,
        pendingOrders: 15,
        completedOrders: 142,
      });
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

  const StatCard = ({ icon: Icon, title, value, change, changeType, color }: any) => (
    <div className="card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-neutral-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${changeType === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
              {changeType === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span>{change}% geçen haftaya göre</span>
            </div>
          )}
        </div>
        <div className={`stat-icon ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-500">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-main to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Hoş geldin, {user?.username}! 👋
            </h1>
            <p className="text-white/80">
              Bugün {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <NavLink
            to="/orders/new"
            className="bg-white text-primary-main px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
          >
            <ShoppingCart size={20} />
            Yeni Sipariş
          </NavLink>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={DollarSign}
          title="Bugünkü Satış"
          value={formatCurrency(stats.todaySales)}
          change={12}
          changeType="up"
          color="bg-green-500"
        />
        <StatCard
          icon={ShoppingCart}
          title="Bugünkü Sipariş"
          value={stats.todayOrders}
          change={8}
          changeType="up"
          color="bg-blue-500"
        />
        <StatCard
          icon={Users}
          title="Toplam Müşteri"
          value={stats.totalCustomers.toLocaleString('tr-TR')}
          change={5}
          changeType="up"
          color="bg-purple-500"
        />
        <StatCard
          icon={Package}
          title="Bekleyen Sipariş"
          value={stats.pendingOrders}
          color="bg-orange-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-800">Haftalık Satışlar</h3>
              <p className="text-sm text-neutral-500">Son 7 günlük satış grafiği</p>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <TrendingUp size={20} />
              <span className="font-medium">+15.3%</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3182ce" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3182ce" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Satış']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3182ce"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Chart */}
        <div className="card">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-800">Kategori Dağılımı</h3>
            <p className="text-sm text-neutral-500">Ürün kategorilerine göre</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {categoryData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-neutral-600">{item.name}</span>
                </div>
                <span className="font-medium text-neutral-800">%{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-800">Son Siparişler</h3>
            <NavLink
              to="/orders"
              className="text-primary-accent hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
            >
              Tümünü Gör <ArrowRight size={16} />
            </NavLink>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Sipariş No</th>
                  <th>Müşteri</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="font-medium text-primary-accent">{order.order_no}</td>
                      <td>{order.customer_name || 'Bilinmiyor'}</td>
                      <td className="font-semibold">{formatCurrency(order.total || 0)}</td>
                      <td>
                        <span className={`badge ${order.status === 'completed' ? 'badge-success' :
                          order.status === 'pending' ? 'badge-warning' : 'badge-info'
                          }`}>
                          {order.status === 'completed' ? 'Tamamlandı' :
                            order.status === 'pending' ? 'Bekliyor' : order.status}
                        </span>
                      </td>
                      <td className="text-neutral-500">
                        {new Date(order.created_at).toLocaleDateString('tr-TR')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-neutral-500 py-8">
                      Henüz sipariş bulunmuyor
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Tamamlanan Siparişler</p>
                <p className="text-2xl font-bold">{stats.completedOrders}</p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Bekleyen Siparişler</p>
                <p className="text-2xl font-bold">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Aylık Gelir</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
