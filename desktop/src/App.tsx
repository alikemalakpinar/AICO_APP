import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginScreen from './components/screens/LoginScreen';
import HomeScreen from './components/screens/HomeScreen';
import OrdersScreen from './components/screens/OrdersScreen';
import CreateOrderScreen from './components/screens/CreateOrderScreen';
import ProductsScreen from './components/screens/ProductsScreen';
import CustomersScreen from './components/screens/CustomersScreen';
import PaymentsScreen from './components/screens/PaymentsScreen';
import SettingsScreen from './components/screens/SettingsScreen';

// API Configuration
const API_BASE_URL = 'http://localhost:3000';

export const ApiContext = React.createContext({
  baseUrl: API_BASE_URL,
  fetchWithTimeout: async (url: string, options?: RequestInit, timeout?: number) => {
    return fetch(url, options);
  }
});

// User context
interface User {
  id: number;
  username: string;
  role: string;
  branch_id?: number;
  branch_name?: string;
}

export const UserContext = React.createContext<{
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}>({
  user: null,
  setUser: () => { },
  logout: () => { }
});

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth
    const storedUser = localStorage.getItem('aico_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('aico_user');
      }
    }
    setIsLoading(false);

    // Listen for navigation from Electron menu
    if ((window as any).electronAPI?.onNavigate) {
      (window as any).electronAPI.onNavigate((path: string) => {
        window.location.hash = path;
      });
    }
  }, []);

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('aico_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('aico_user');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('aico_user');
  };

  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout: number = 10000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Bağlantı zaman aşımına uğradı.');
      }
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-main to-blue-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <ApiContext.Provider value={{ baseUrl: API_BASE_URL, fetchWithTimeout }}>
      <UserContext.Provider value={{ user, setUser: handleSetUser, logout: handleLogout }}>
        <BrowserRouter>
          <Routes>
            {!user ? (
              <>
                <Route path="/login" element={<LoginScreen />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : (
              <Route element={<Layout />}>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/orders" element={<OrdersScreen />} />
                <Route path="/orders/new" element={<CreateOrderScreen />} />
                <Route path="/products" element={<ProductsScreen />} />
                <Route path="/customers" element={<CustomersScreen />} />
                <Route path="/payments" element={<PaymentsScreen />} />
                <Route path="/settings" element={<SettingsScreen />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            )}
          </Routes>
        </BrowserRouter>
      </UserContext.Provider>
    </ApiContext.Provider>
  );
}

export default App;
