/**
 * Accurate Online API Integration Service
 *
 * API Documentation: https://accurate.id/api-myob-accurate-online
 * Authentication: API Token + HMAC Signature
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import crypto from 'crypto-js';

// Configuration from environment variables
const ACCURATE_CONFIG = {
  apiToken: import.meta.env.VITE_ACCURATE_API_TOKEN || '',
  signatureSecret: import.meta.env.VITE_ACCURATE_SIGNATURE_SECRET || '',
  baseURL: import.meta.env.VITE_ACCURATE_API_BASE_URL || 'https://public-api.accurate.id/api',
  databaseId: import.meta.env.VITE_ACCURATE_DATABASE_ID || '717557',
};

/**
 * Generate HMAC SHA-256 signature for request
 */
function generateSignature(method: string, url: string, body: string = ''): string {
  const timestamp = Date.now().toString();
  const message = `${method.toUpperCase()}|${url}|${body}|${timestamp}`;

  const signature = crypto.HmacSHA256(message, ACCURATE_CONFIG.signatureSecret);
  const signatureBase64 = crypto.enc.Base64.stringify(signature);

  return `${signatureBase64}|${timestamp}`;
}

/**
 * Accurate API Client
 */
class AccurateAPIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ACCURATE_CONFIG.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCURATE_CONFIG.apiToken}`,
      },
    });

    // Add request interceptor to add signature
    this.client.interceptors.request.use((config) => {
      const method = config.method?.toUpperCase() || 'GET';
      const url = config.url || '';
      const body = config.data ? JSON.stringify(config.data) : '';

      const signature = generateSignature(method, url, body);
      config.headers['X-Accurate-Signature'] = signature;

      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Accurate API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Generic request method
   */
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: any): Promise<T> {
    return this.request<T>({ method: 'GET', url: endpoint, params });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>({ method: 'POST', url: endpoint, data });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>({ method: 'PUT', url: endpoint, data });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', url: endpoint });
  }
}

// Create singleton instance
const accurateClient = new AccurateAPIClient();

/**
 * Accurate API Response Types
 */
interface AccurateResponse<T> {
  s: boolean; // success
  d: T; // data
  r: any; // result
  sp: any; // session parameter
}

interface AccurateCustomer {
  id?: number;
  customerNo?: string;
  name: string;
  email?: string;
  mobilePhone?: string;
  address?: string;
  city?: string;
  province?: string;
  customerType?: string;
  salesmanId?: number;
  termId?: number;
}

interface AccurateSalesInvoice {
  transDate: string;
  dueDate?: string;
  customerNo: string;
  description?: string;
  branchId?: number;
  warehouseId?: number;
  detailItem: Array<{
    itemNo: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxId?: number;
  }>;
}

interface AccurateItem {
  itemNo?: string;
  name: string;
  itemType?: string; // 'INVENTORY', 'SERVICE', 'NON_INVENTORY'
  unitPrice?: number;
  purchasePrice?: number;
  unit?: string;
  taxId?: number;
}

/**
 * Accurate API Service
 */
export const accurateService = {
  // ==================== CUSTOMER ====================

  /**
   * Get all customers
   */
  async getCustomers(params?: { page?: number; pageSize?: number }): Promise<AccurateResponse<AccurateCustomer[]>> {
    return accurateClient.get('/customer/list.do', {
      sp: ACCURATE_CONFIG.databaseId,
      ...params
    });
  },

  /**
   * Get customer by ID or No
   */
  async getCustomer(id: number | string): Promise<AccurateResponse<AccurateCustomer>> {
    return accurateClient.get('/customer/detail.do', {
      sp: ACCURATE_CONFIG.databaseId,
      id: typeof id === 'number' ? id : undefined,
      customerNo: typeof id === 'string' ? id : undefined,
    });
  },

  /**
   * Create new customer
   */
  async createCustomer(customer: AccurateCustomer): Promise<AccurateResponse<any>> {
    return accurateClient.post('/customer/save.do', {
      sp: ACCURATE_CONFIG.databaseId,
      ...customer,
    });
  },

  /**
   * Update existing customer
   */
  async updateCustomer(id: number, customer: Partial<AccurateCustomer>): Promise<AccurateResponse<any>> {
    return accurateClient.post('/customer/save.do', {
      sp: ACCURATE_CONFIG.databaseId,
      id,
      ...customer,
    });
  },

  /**
   * Delete customer
   */
  async deleteCustomer(id: number): Promise<AccurateResponse<any>> {
    return accurateClient.post('/customer/delete.do', {
      sp: ACCURATE_CONFIG.databaseId,
      id,
    });
  },

  // ==================== SALES INVOICE ====================

  /**
   * Get all sales invoices
   */
  async getSalesInvoices(params?: { page?: number; pageSize?: number }): Promise<AccurateResponse<any[]>> {
    return accurateClient.get('/sales-invoice/list.do', {
      sp: ACCURATE_CONFIG.databaseId,
      ...params
    });
  },

  /**
   * Get sales invoice by ID or Number
   */
  async getSalesInvoice(id: number | string): Promise<AccurateResponse<any>> {
    return accurateClient.get('/sales-invoice/detail.do', {
      sp: ACCURATE_CONFIG.databaseId,
      id: typeof id === 'number' ? id : undefined,
      number: typeof id === 'string' ? id : undefined,
    });
  },

  /**
   * Create sales invoice
   */
  async createSalesInvoice(invoice: AccurateSalesInvoice): Promise<AccurateResponse<any>> {
    return accurateClient.post('/sales-invoice/save.do', {
      sp: ACCURATE_CONFIG.databaseId,
      ...invoice,
    });
  },

  /**
   * Update sales invoice
   */
  async updateSalesInvoice(id: number, invoice: Partial<AccurateSalesInvoice>): Promise<AccurateResponse<any>> {
    return accurateClient.post('/sales-invoice/save.do', {
      sp: ACCURATE_CONFIG.databaseId,
      id,
      ...invoice,
    });
  },

  /**
   * Delete sales invoice
   */
  async deleteSalesInvoice(id: number): Promise<AccurateResponse<any>> {
    return accurateClient.post('/sales-invoice/delete.do', {
      sp: ACCURATE_CONFIG.databaseId,
      id,
    });
  },

  // ==================== ITEM ====================

  /**
   * Get all items
   */
  async getItems(params?: { page?: number; pageSize?: number }): Promise<AccurateResponse<AccurateItem[]>> {
    return accurateClient.get('/item/list.do', {
      sp: ACCURATE_CONFIG.databaseId,
      ...params
    });
  },

  /**
   * Get item by ID or No
   */
  async getItem(id: number | string): Promise<AccurateResponse<AccurateItem>> {
    return accurateClient.get('/item/detail.do', {
      sp: ACCURATE_CONFIG.databaseId,
      id: typeof id === 'number' ? id : undefined,
      itemNo: typeof id === 'string' ? id : undefined,
    });
  },

  /**
   * Create new item
   */
  async createItem(item: AccurateItem): Promise<AccurateResponse<any>> {
    return accurateClient.post('/item/save.do', {
      sp: ACCURATE_CONFIG.databaseId,
      ...item,
    });
  },

  /**
   * Update existing item
   */
  async updateItem(id: number, item: Partial<AccurateItem>): Promise<AccurateResponse<any>> {
    return accurateClient.post('/item/save.do', {
      sp: ACCURATE_CONFIG.databaseId,
      id,
      ...item,
    });
  },

  // ==================== PURCHASE INVOICE ====================

  /**
   * Get all purchase invoices
   */
  async getPurchaseInvoices(params?: { page?: number; pageSize?: number }): Promise<AccurateResponse<any[]>> {
    return accurateClient.get('/purchase-invoice/list.do', {
      sp: ACCURATE_CONFIG.databaseId,
      ...params
    });
  },

  /**
   * Create purchase invoice
   */
  async createPurchaseInvoice(invoice: any): Promise<AccurateResponse<any>> {
    return accurateClient.post('/purchase-invoice/save.do', {
      sp: ACCURATE_CONFIG.databaseId,
      ...invoice,
    });
  },

  // ==================== UTILITY ====================

  /**
   * Test connection to Accurate API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.getCustomers({ page: 1, pageSize: 1 });
      return response.s === true;
    } catch (error) {
      console.error('Accurate connection test failed:', error);
      return false;
    }
  },

  /**
   * Get database info
   */
  async getDatabaseInfo(): Promise<AccurateResponse<any>> {
    return accurateClient.get('/db-list.do');
  },
};

export default accurateService;

// Export types
export type {
  AccurateResponse,
  AccurateCustomer,
  AccurateSalesInvoice,
  AccurateItem,
};
