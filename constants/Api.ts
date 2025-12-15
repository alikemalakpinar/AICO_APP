import { Platform } from 'react-native';

// API Configuration
// Android Emulator uses 10.0.2.2 to access host machine's localhost
// iOS Simulator uses localhost directly
// For physical devices, use your computer's local IP address

const getBaseUrl = (): string => {
  // For development, detect platform
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Android emulator
      return 'http://10.0.2.2:3000';
    } else if (Platform.OS === 'ios') {
      // iOS simulator
      return 'http://localhost:3000';
    } else {
      // Web
      return 'http://localhost:3000';
    }
  }

  // Production URL (update this when deploying)
  return 'http://localhost:3000';
};

export const API_BASE_URL = getBaseUrl();

export const API_ENDPOINTS = {
  // Auth
  login: `${API_BASE_URL}/api/login`,
  loginSales: `${API_BASE_URL}/api/login/sales`,
  register: `${API_BASE_URL}/api/register`,
  // Core
  orders: `${API_BASE_URL}/api/orders`,
  users: `${API_BASE_URL}/api/users`,
  customers: `${API_BASE_URL}/api/customers`,
  customersSearch: `${API_BASE_URL}/api/customers/search`,
  products: `${API_BASE_URL}/api/products`,
  // Branches
  branches: `${API_BASE_URL}/api/branches`,
  branchUsers: (branchId: number) => `${API_BASE_URL}/api/branches/${branchId}/users`,
  // Payments
  payments: `${API_BASE_URL}/api/payments`,
  // Exchange Rates
  exchangeRates: `${API_BASE_URL}/api/exchange-rates`,
  // Activity Logs
  activityLogs: `${API_BASE_URL}/api/activity-logs`,
  // Notifications
  notifications: `${API_BASE_URL}/api/notifications`,
  // Utils
  countryCodes: `${API_BASE_URL}/api/utils/country-codes`,
  // Analytics
  analyticsDashboard: `${API_BASE_URL}/api/analytics/dashboard`,
  analyticsMonthlyTrends: `${API_BASE_URL}/api/analytics/monthly-trends`,
  analyticsOrdersByCountry: `${API_BASE_URL}/api/analytics/orders-by-country`,
  analyticsTopProducts: `${API_BASE_URL}/api/analytics/top-products`,
  analyticsTopCustomers: `${API_BASE_URL}/api/analytics/top-customers`,
};

// Fetch with timeout wrapper
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> => {
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
      throw new Error('Baglanti zaman asimina ugradi. Lutfen internet baglantinizi kontrol edin.');
    }
    throw error;
  }
};
