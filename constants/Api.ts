import { Platform } from 'react-native';

// API Configuration
// Android Emulator uses 10.0.2.2 to access host machine's localhost
// iOS Simulator uses localhost directly
// For physical devices, use your computer's local IP address

// ÖNEMLİ: Fiziksel cihazda test için bilgisayarınızın yerel IP adresini girin
// Örnek: const PHYSICAL_DEVICE_IP = '192.168.1.100';
const PHYSICAL_DEVICE_IP = '192.168.1.100'; // Değiştirin!

// Production URL - Deploy ettikten sonra buraya gerçek URL'yi girin
const PRODUCTION_URL = 'https://your-app.onrender.com'; // Değiştirin!

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

  // Production URL
  return PRODUCTION_URL;
};

// Fiziksel cihaz için IP tabanlı URL al
export const getPhysicalDeviceUrl = (): string => {
  return `http://${PHYSICAL_DEVICE_IP}:3000`;
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
  health: `${API_BASE_URL}/api/health`,
  // Analytics
  analyticsDashboard: `${API_BASE_URL}/api/analytics/dashboard`,
  analyticsMonthlyTrends: `${API_BASE_URL}/api/analytics/monthly-trends`,
  analyticsOrdersByCountry: `${API_BASE_URL}/api/analytics/orders-by-country`,
  analyticsTopProducts: `${API_BASE_URL}/api/analytics/top-products`,
  analyticsTopCustomers: `${API_BASE_URL}/api/analytics/top-customers`,
  // Barcode & Search
  productByBarcode: (barcode: string) => `${API_BASE_URL}/api/products/barcode/${barcode}`,
  searchByBarcode: `${API_BASE_URL}/api/products/search/barcode`,
  searchBySku: `${API_BASE_URL}/api/products/search/sku`,
  // File Upload
  uploadPassport: `${API_BASE_URL}/api/upload/passport`,
  uploadSignature: `${API_BASE_URL}/api/upload/signature`,
  uploadDocument: `${API_BASE_URL}/api/upload/document`,
  // Order Updates
  orderPassport: (orderId: number) => `${API_BASE_URL}/api/orders/${orderId}/passport`,
  orderSignature: (orderId: number) => `${API_BASE_URL}/api/orders/${orderId}/signature`,
  // ==================== ACENTA & REHBER (ERP) ====================
  // Acentalar (Agencies)
  agencies: `${API_BASE_URL}/api/agencies`,
  agency: (id: number) => `${API_BASE_URL}/api/agencies/${id}`,
  agencyGuides: (id: number) => `${API_BASE_URL}/api/agencies/${id}/guides`,
  // Rehberler (Guides)
  guides: `${API_BASE_URL}/api/guides`,
  guide: (id: number) => `${API_BASE_URL}/api/guides/${id}`,
  guidePayment: (id: number) => `${API_BASE_URL}/api/guides/${id}/payment`,
  // Komisyon Kuralları
  commissionRules: `${API_BASE_URL}/api/commission-rules`,
  commissionPreview: `${API_BASE_URL}/api/commission-preview`,
  // Finansal Raporlar
  reportsAgencyCommissions: `${API_BASE_URL}/api/reports/agency-commissions`,
  reportsGuideCommissions: `${API_BASE_URL}/api/reports/guide-commissions`,
  reportsFinancialSummary: `${API_BASE_URL}/api/reports/financial-summary`,
  // ==================== GOLDIST ERP MODÜLLER ====================
  // Operasyonlar (Grup Giriş/Çıkış)
  operations: `${API_BASE_URL}/api/operations`,
  operationsActive: `${API_BASE_URL}/api/operations/active`,
  operationCheckout: (id: number) => `${API_BASE_URL}/api/operations/${id}/checkout`,
  // Kârlılık Analizi
  profitabilityCheck: `${API_BASE_URL}/api/profitability-check`,
  // Çoklu Ödeme (Split Payment)
  orderPayments: (orderId: number) => `${API_BASE_URL}/api/orders/${orderId}/payments`,
  // Kargo Takip
  orderShipping: (orderId: number) => `${API_BASE_URL}/api/orders/${orderId}/shipping`,
  shippingStatus: (id: number) => `${API_BASE_URL}/api/shipping/${id}/status`,
  // Mal Sahipleri (Konsinye)
  consignmentOwners: `${API_BASE_URL}/api/consignment-owners`,
  consignmentOwnerAccount: (id: number) => `${API_BASE_URL}/api/consignment-owners/${id}/account`,
  // Dashboard
  dashboardLiveStatus: `${API_BASE_URL}/api/dashboard/live-status`,
  dashboardFinancialOverview: `${API_BASE_URL}/api/dashboard/financial-overview`,
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
