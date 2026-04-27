/**
 * Accurate Sync Service
 *
 * Service untuk sinkronisasi data antara ERP Manufacturing dan Accurate Online
 */

import { api } from '../app/lib/api';
import accurateService, { AccurateCustomer, AccurateSalesInvoice } from './accurate-api';
import { toast } from 'sonner';

/**
 * Mapping ERP Customer to Accurate Customer
 */
function mapERPCustomerToAccurate(erpCustomer: any): AccurateCustomer {
  return {
    name: erpCustomer.customerName || '',
    email: erpCustomer.contacts?.[0]?.email || erpCustomer.billingAddress?.email || '',
    mobilePhone: erpCustomer.companyPhone || erpCustomer.contacts?.[0]?.phone || '',
    address: erpCustomer.billingAddress?.fullAddress || erpCustomer.billingAddress?.street || '',
    city: erpCustomer.billingAddress?.city || '',
    province: erpCustomer.billingAddress?.province || '',
    customerType: erpCustomer.customerCategory || 'REGULAR',
  };
}

/**
 * Mapping Accurate Customer to ERP Customer
 */
function mapAccurateCustomerToERP(accCustomer: AccurateCustomer): any {
  return {
    customerName: accCustomer.name,
    companyPhone: accCustomer.mobilePhone || '',
    billingAddress: {
      fullAddress: accCustomer.address || '',
      city: accCustomer.city || '',
      province: accCustomer.province || '',
      email: accCustomer.email || '',
    },
    contacts: [
      {
        name: accCustomer.name,
        email: accCustomer.email || '',
        phone: accCustomer.mobilePhone || '',
      }
    ],
    // Accurate sync metadata
    accurateCustomerId: accCustomer.id,
    accurateCustomerNo: accCustomer.customerNo,
    syncedToAccurate: true,
    lastSyncedAt: new Date().toISOString(),
  };
}

/**
 * Accurate Sync Service
 */
export class AccurateSyncService {
  /**
   * Sync single customer to Accurate
   */
  async syncCustomerToAccurate(customerId: string): Promise<boolean> {
    try {
      // Get customer from ERP
      const customers = await api.getCustomers();
      const erpCustomer = customers.find((c: any) => c.id === customerId);

      if (!erpCustomer) {
        throw new Error('Customer not found');
      }

      // Map to Accurate format
      const accurateCustomer = mapERPCustomerToAccurate(erpCustomer);

      // Check if already synced
      if (erpCustomer.accurateCustomerId) {
        // Update existing customer in Accurate
        const response = await accurateService.updateCustomer(
          erpCustomer.accurateCustomerId,
          accurateCustomer
        );

        if (response.s) {
          toast.success('Customer berhasil diupdate di Accurate');
          return true;
        }
      } else {
        // Create new customer in Accurate
        const response = await accurateService.createCustomer(accurateCustomer);

        if (response.s && response.r) {
          // Update ERP customer with Accurate ID
          await api.updateCustomer(customerId, {
            accurateCustomerId: response.r.id,
            accurateCustomerNo: response.r.customerNo,
            syncedToAccurate: true,
            lastSyncedAt: new Date().toISOString(),
          });

          toast.success('Customer berhasil dibuat di Accurate');
          return true;
        }
      }

      return false;
    } catch (error: any) {
      console.error('Error syncing customer to Accurate:', error);
      toast.error(`Gagal sync customer: ${error.message}`);
      return false;
    }
  }

  /**
   * Sync all customers to Accurate
   */
  async syncAllCustomersToAccurate(): Promise<{ success: number; failed: number }> {
    const customers = await api.getCustomers();
    let success = 0;
    let failed = 0;

    for (const customer of customers) {
      const result = await this.syncCustomerToAccurate(customer.id);
      if (result) {
        success++;
      } else {
        failed++;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    toast.success(`Sync selesai: ${success} berhasil, ${failed} gagal`);
    return { success, failed };
  }

  /**
   * Pull customers from Accurate to ERP
   */
  async pullCustomersFromAccurate(): Promise<number> {
    try {
      const response = await accurateService.getCustomers({ page: 1, pageSize: 100 });

      if (!response.s || !response.d) {
        throw new Error('Failed to fetch customers from Accurate');
      }

      let imported = 0;

      for (const accCustomer of response.d) {
        // Check if customer already exists in ERP
        const erpCustomers = await api.getCustomers();
        const existing = erpCustomers.find(
          (c: any) => c.accurateCustomerId === accCustomer.id
        );

        if (!existing) {
          // Create new customer in ERP
          const erpCustomerData = mapAccurateCustomerToERP(accCustomer);
          await api.createCustomer(erpCustomerData);
          imported++;
        }
      }

      toast.success(`${imported} customer baru diimport dari Accurate`);
      return imported;
    } catch (error: any) {
      console.error('Error pulling customers from Accurate:', error);
      toast.error(`Gagal import customer: ${error.message}`);
      return 0;
    }
  }

  /**
   * Create Sales Invoice in Accurate from Sales Order
   */
  async createSalesInvoiceInAccurate(orderId: string): Promise<boolean> {
    try {
      // Get sales order from ERP
      const orders = await api.getSalesOrders();
      const order = orders.find((o: any) => o.id === orderId);

      if (!order) {
        throw new Error('Sales order not found');
      }

      // Get customer info
      const customers = await api.getCustomers();
      const customer = customers.find((c: any) => c.customerName === order.customerName);

      if (!customer || !customer.accurateCustomerNo) {
        throw new Error('Customer not synced to Accurate. Sync customer first.');
      }

      // Prepare sales invoice data
      const invoice: AccurateSalesInvoice = {
        transDate: order.orderDate || new Date().toISOString().split('T')[0],
        customerNo: customer.accurateCustomerNo,
        description: order.notes || `Sales Order ${order.orderNumber}`,
        detailItem: [
          // Simplified - in real scenario, need to get items from order details
          {
            itemNo: 'ITEM-001', // Replace with actual item no
            quantity: order.itemQty || 1,
            unitPrice: order.totalAmount || 0,
          }
        ],
      };

      // Create invoice in Accurate
      const response = await accurateService.createSalesInvoice(invoice);

      if (response.s && response.r) {
        // Update sales order with Accurate invoice info
        await api.update(orderId, {
          accurateInvoiceId: response.r.id,
          accurateInvoiceNo: response.r.number,
          syncedToAccurate: true,
          lastSyncedAt: new Date().toISOString(),
        });

        toast.success(`Sales Invoice ${response.r.number} berhasil dibuat di Accurate`);
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Error creating sales invoice in Accurate:', error);
      toast.error(`Gagal buat invoice: ${error.message}`);
      return false;
    }
  }

  /**
   * Test connection to Accurate
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await accurateService.testConnection();

      if (result) {
        toast.success('✅ Koneksi ke Accurate Online berhasil!');
      } else {
        toast.error('❌ Koneksi ke Accurate Online gagal');
      }

      return result;
    } catch (error: any) {
      toast.error(`❌ Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get sync status for a customer
   */
  async getCustomerSyncStatus(customerId: string): Promise<{
    synced: boolean;
    accurateId?: number;
    accurateNo?: string;
    lastSyncedAt?: string;
  }> {
    const customers = await api.getCustomers();
    const customer = customers.find((c: any) => c.id === customerId);

    if (!customer) {
      return { synced: false };
    }

    return {
      synced: customer.syncedToAccurate || false,
      accurateId: customer.accurateCustomerId,
      accurateNo: customer.accurateCustomerNo,
      lastSyncedAt: customer.lastSyncedAt,
    };
  }
}

// Create singleton instance
export const accurateSyncService = new AccurateSyncService();

export default accurateSyncService;
