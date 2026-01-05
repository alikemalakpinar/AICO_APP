import React, { useContext, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { UserContext } from '../App';
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  PlusCircle,
  BarChart3,
  Calendar,
  Building2
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: Home, label: 'Anasayfa' },
  { path: '/orders', icon: ShoppingCart, label: 'Siparişler' },
  { path: '/products', icon: Package, label: 'Ürünler' },
  { path: '/customers', icon: Users, label: 'Müşteriler' },
  { path: '/payments', icon: CreditCard, label: 'Ödemeler' },
];

const quickActions = [
  { path: '/orders/new', icon: PlusCircle, label: 'Yeni Sipariş', color: 'bg-green-500' },
];

export default function Layout() {
  const { user, logout } = useContext(UserContext);
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Anasayfa';
    if (path === '/orders') return 'Siparişler';
    if (path === '/orders/new') return 'Yeni Sipariş';
    if (path === '/products') return 'Ürünler';
    if (path === '/customers') return 'Müşteriler';
    if (path === '/payments') return 'Ödemeler';
    if (path === '/settings') return 'Ayarlar';
    return 'AICO ERP';
  };

  return (
    <div className="flex h-screen bg-neutral-100">
      {/* Sidebar */}
      <aside
        className={`${isSidebarCollapsed ? 'w-20' : 'w-64'
          } bg-gradient-to-b from-primary-main to-blue-900 text-white flex flex-col transition-all duration-300 ease-in-out`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg">AICO ERP</h1>
                <p className="text-xs text-white/60">v1.0.0</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isSidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-white/10">
          {quickActions.map((action) => (
            <NavLink
              key={action.path}
              to={action.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${action.color} text-white font-medium hover:opacity-90 transition-all ${isSidebarCollapsed ? 'justify-center' : ''
                }`}
            >
              <action.icon size={20} />
              {!isSidebarCollapsed && <span>{action.label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''} ${isSidebarCollapsed ? 'justify-center px-2' : ''
                }`
              }
            >
              <item.icon size={20} />
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Settings & User */}
        <div className="p-4 border-t border-white/10 space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'active' : ''} ${isSidebarCollapsed ? 'justify-center px-2' : ''
              }`
            }
          >
            <Settings size={20} />
            {!isSidebarCollapsed && <span>Ayarlar</span>}
          </NavLink>

          <button
            onClick={logout}
            className={`sidebar-item w-full text-red-300 hover:text-red-200 hover:bg-red-500/20 ${isSidebarCollapsed ? 'justify-center px-2' : ''
              }`}
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && <span>Çıkış Yap</span>}
          </button>
        </div>

        {/* User Info */}
        {!isSidebarCollapsed && user && (
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="font-bold text-sm">
                  {user.username?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.username}</p>
                <p className="text-xs text-white/60 truncate">{user.role}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-neutral-800">{getPageTitle()}</h2>
            {user?.branch_name && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary-accent/10 rounded-full">
                <Building2 size={14} className="text-primary-accent" />
                <span className="text-sm font-medium text-primary-accent">{user.branch_name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Ara..."
                className="w-64 pl-10 pr-4 py-2 bg-neutral-100 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent"
              />
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <Bell size={20} className="text-neutral-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <h3 className="font-semibold text-neutral-800">Bildirimler</h3>
                  </div>
                  <div className="p-4 text-center text-neutral-500 text-sm">
                    Yeni bildirim yok
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-primary-accent text-white rounded-full flex items-center justify-center">
                  <span className="font-bold text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <ChevronDown size={16} className="text-neutral-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="font-medium text-neutral-800">{user?.username}</p>
                    <p className="text-xs text-neutral-500">{user?.role}</p>
                  </div>
                  <NavLink
                    to="/settings"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-100 text-neutral-700"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings size={16} />
                    <span>Ayarlar</span>
                  </NavLink>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-100 text-red-600 w-full"
                  >
                    <LogOut size={16} />
                    <span>Çıkış Yap</span>
                  </button>
                </div>
              )}
            </div>

            {/* Current Date */}
            <div className="flex items-center gap-2 text-neutral-500 text-sm">
              <Calendar size={16} />
              <span>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Click outside to close menus */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </div>
  );
}
