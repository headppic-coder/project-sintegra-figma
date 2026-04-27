/**
 * INVENTORY HELPERS - TypeScript/JavaScript
 * Helper functions untuk interact dengan Inventory System di Supabase
 */

import { SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// TYPES
// =====================================================

export interface InventoryType {
  id: string;
  code: string;
  name: string;
  has_stock: boolean;
  has_fifo: boolean;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface ItemType {
  id: string;
  code: string;
  name: string;
  inventory_type_id: string;
  description: string;
  is_active: boolean;
  has_subtypes: boolean;
  created_at: string;
}

export interface ItemSubtype {
  id: string;
  code: string;
  name: string;
  item_type_id: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  inventory_type_id: string;
  item_type_id: string;
  item_subtype_id: string;
  description: string;
  unit: string;
  unit_alt?: string;
  conversion_factor?: number;
  specifications?: Record<string, any>;
  pricing: {
    standard_cost: number;
    average_cost: number;
    last_purchase_price: number;
    selling_price?: number;
  };
  stock_control: {
    min_stock: number;
    max_stock: number;
    reorder_point: number;
    lead_time_days: number;
  };
  supplier_info?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface StockBatch {
  id: string;
  item_id: string;
  warehouse_id: string;
  batch_number: string;
  receipt_date: string;
  quantity_in: number;
  quantity_remaining: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  reference_type: string;
  reference_id: string;
  expiry_date?: string;
  lot_number?: string;
  status: 'active' | 'depleted' | 'expired';
  created_at: string;
  created_by?: string;
}

export interface StockMovement {
  id: string;
  movement_number: string;
  transaction_type: string;
  item_id: string;
  warehouse_id: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  total_cost: number;
  batch_id?: string;
  reference_type: string;
  reference_id: string;
  movement_date: string;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface StockSummary {
  item_id: string;
  warehouse_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  average_cost: number;
  total_value: number;
  last_movement_date?: string;
  last_movement_id?: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string;
  type: string;
  is_active: boolean;
  created_at: string;
}

// =====================================================
// HELPER CLASS
// =====================================================

export class InventoryHelper {
  constructor(private supabase: SupabaseClient) {}

  // ===== MASTER DATA =====

  /**
   * Get all inventory types
   */
  async getInventoryTypes(): Promise<InventoryType[]> {
    const { data, error } = await this.supabase
      .from('kv_store_6a7942bb')
      .select('value')
      .like('key', 'inventory_type:%')
      .not('key', 'eq', 'inventory_type:index');

    if (error) throw error;
    return data.map(d => d.value as InventoryType);
  }

  /**
   * Get all item types
   */
  async getItemTypes(): Promise<ItemType[]> {
    const { data, error } = await this.supabase
      .from('kv_store_6a7942bb')
      .select('value')
      .like('key', 'item_type:%')
      .not('key', 'eq', 'item_type:index');

    if (error) throw error;
    return data.map(d => d.value as ItemType);
  }

  /**
   * Get item subtypes by item_type_id
   */
  async getItemSubtypes(itemTypeId: string): Promise<ItemSubtype[]> {
    // Get subtype IDs from index
    const { data: indexData, error: indexError } = await this.supabase
      .from('kv_store_6a7942bb')
      .select('value')
      .eq('key', `item_subtype:by_item_type:${itemTypeId}`)
      .single();

    if (indexError) throw indexError;

    const subtypeIds = indexData.value.subtype_ids as string[];

    // Get all subtypes
    const { data, error } = await this.supabase
      .from('kv_store_6a7942bb')
      .select('value')
      .in('key', subtypeIds.map(id => `item_subtype:${id}`));

    if (error) throw error;
    return data.map(d => d.value as ItemSubtype);
  }

  /**
   * Get all warehouses
   */
  async getWarehouses(): Promise<Warehouse[]> {
    const { data, error } = await this.supabase
      .from('kv_store_6a7942bb')
      .select('value')
      .like('key', 'warehouse:%')
      .not('key', 'eq', 'warehouse:index');

    if (error) throw error;
    return data.map(d => d.value as Warehouse);
  }

  /**
   * Get all items
   */
  async getItems(filters?: {
    item_type_id?: string;
    item_subtype_id?: string;
    is_active?: boolean;
  }): Promise<Item[]> {
    let query = this.supabase
      .from('kv_store_6a7942bb')
      .select('value')
      .like('key', 'item:%')
      .not('key', 'eq', 'item:index');

    const { data, error } = await query;
    if (error) throw error;

    let items = data.map(d => d.value as Item);

    // Apply filters
    if (filters?.item_type_id) {
      items = items.filter(i => i.item_type_id === filters.item_type_id);
    }
    if (filters?.item_subtype_id) {
      items = items.filter(i => i.item_subtype_id === filters.item_subtype_id);
    }
    if (filters?.is_active !== undefined) {
      items = items.filter(i => i.is_active === filters.is_active);
    }

    return items;
  }

  /**
   * Get single item by ID or code
   */
  async getItem(idOrCode: string): Promise<Item | null> {
    // Try by ID first
    const { data: byId, error: errorId } = await this.supabase
      .from('kv_store_6a7942bb')
      .select('value')
      .eq('key', `item:${idOrCode}`)
      .single();

    if (!errorId && byId) {
      return byId.value as Item;
    }

    // Try by code
    const { data, error } = await this.supabase
      .from('kv_store_6a7942bb')
      .select('value')
      .like('key', 'item:%')
      .eq('value->>code', idOrCode)
      .single();

    if (error) return null;
    return data.value as Item;
  }

  // ===== STOCK OPERATIONS =====

  /**
   * Get stock summary for an item
   */
  async getStockSummary(itemId: string, warehouseId?: string): Promise<StockSummary[]> {
    let pattern = `stock_summary:${itemId}:`;
    if (warehouseId) {
      pattern += warehouseId;
    } else {
      pattern += '%';
    }

    const { data, error } = await this.supabase
      .from('kv_store_6a7942bb')
      .select('value')
      .like('key', pattern);

    if (error) throw error;
    return data.map(d => d.value as StockSummary);
  }

  /**
   * Get active batches for an item (FIFO order)
   */
  async getActiveBatches(itemId: string, warehouseId: string): Promise<StockBatch[]> {
    const { data, error } = await this.supabase.rpc('get_active_batches', {
      p_item_id: itemId,
      p_warehouse_id: warehouseId
    });

    if (error) throw error;
    return data as StockBatch[];
  }

  /**
   * Stock IN transaction
   */
  async stockIn(params: {
    item_id: string;
    warehouse_id: string;
    quantity: number;
    unit: string;
    unit_cost: number;
    transaction_type: string;
    reference_type: string;
    reference_id: string;
    movement_number: string;
    batch_number?: string;
    notes?: string;
    created_by?: string;
  }) {
    const { data, error } = await this.supabase.rpc('complete_stock_in_transaction', {
      p_item_id: params.item_id,
      p_warehouse_id: params.warehouse_id,
      p_quantity: params.quantity,
      p_unit: params.unit,
      p_unit_cost: params.unit_cost,
      p_transaction_type: params.transaction_type,
      p_reference_type: params.reference_type,
      p_reference_id: params.reference_id,
      p_movement_number: params.movement_number,
      p_batch_number: params.batch_number || null,
      p_notes: params.notes || null,
      p_created_by: params.created_by || null
    });

    if (error) throw error;
    return data;
  }

  /**
   * Stock OUT transaction (FIFO)
   */
  async stockOut(params: {
    item_id: string;
    warehouse_id: string;
    quantity: number;
    transaction_type: string;
    reference_type: string;
    reference_id: string;
    movement_number: string;
    notes?: string;
    created_by?: string;
  }) {
    const { data, error } = await this.supabase.rpc('complete_stock_out_transaction', {
      p_item_id: params.item_id,
      p_warehouse_id: params.warehouse_id,
      p_quantity: params.quantity,
      p_transaction_type: params.transaction_type,
      p_reference_type: params.reference_type,
      p_reference_id: params.reference_id,
      p_movement_number: params.movement_number,
      p_notes: params.notes || null,
      p_created_by: params.created_by || null
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get stock movements for an item
   */
  async getStockMovements(itemId: string, limit: number = 50): Promise<StockMovement[]> {
    const { data, error } = await this.supabase
      .from('kv_store_6a7942bb')
      .select('value')
      .like('key', 'stock_movement:%')
      .eq('value->>item_id', itemId)
      .order('value->>movement_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map(d => d.value as StockMovement);
  }

  /**
   * Get stock card (movements with running balance)
   */
  async getStockCard(itemId: string, warehouseId: string) {
    const { data, error } = await this.supabase
      .from('kv_store_6a7942bb')
      .select('value')
      .like('key', 'stock_movement:%')
      .eq('value->>item_id', itemId)
      .eq('value->>warehouse_id', warehouseId)
      .order('value->>movement_date', { ascending: true });

    if (error) throw error;

    const movements = data.map(d => d.value as StockMovement);

    // Calculate running balance
    let balance = 0;
    return movements.map(m => {
      balance += m.quantity;
      return {
        ...m,
        qty_in: m.quantity > 0 ? m.quantity : 0,
        qty_out: m.quantity < 0 ? Math.abs(m.quantity) : 0,
        balance
      };
    });
  }

  // ===== CRUD OPERATIONS =====

  /**
   * Create new item
   */
  async createItem(item: Omit<Item, 'id' | 'created_at'>): Promise<Item> {
    // Get next ID
    const { data: counterId, error: counterError } = await this.supabase.rpc('get_next_counter', {
      entity_type: 'item'
    });

    if (counterError) throw counterError;

    const newItem: Item = {
      ...item,
      id: counterId,
      created_at: new Date().toISOString()
    };

    // Insert item
    const { error } = await this.supabase
      .from('kv_store_6a7942bb')
      .upsert({
        key: `item:${newItem.id}`,
        value: newItem
      });

    if (error) throw error;

    // Update index
    await this.supabase.rpc('exec_sql', {
      sql: `
        UPDATE kv_store_6a7942bb
        SET value = jsonb_set(
          value,
          '{ids}',
          (value->'ids')::jsonb || to_jsonb(ARRAY['${newItem.id}'])
        )
        WHERE key = 'item:index'
      `
    });

    return newItem;
  }

  /**
   * Update item
   */
  async updateItem(itemId: string, updates: Partial<Item>): Promise<void> {
    // Get current item
    const { data: current, error: getError } = await this.supabase
      .from('kv_store_6a7942bb')
      .select('value')
      .eq('key', `item:${itemId}`)
      .single();

    if (getError) throw getError;

    const updated = {
      ...current.value,
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('kv_store_6a7942bb')
      .update({ value: updated })
      .eq('key', `item:${itemId}`);

    if (error) throw error;
  }

  /**
   * Create warehouse
   */
  async createWarehouse(warehouse: Omit<Warehouse, 'created_at'>): Promise<Warehouse> {
    const newWarehouse: Warehouse = {
      ...warehouse,
      created_at: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('kv_store_6a7942bb')
      .upsert({
        key: `warehouse:${newWarehouse.id}`,
        value: newWarehouse
      });

    if (error) throw error;

    // Update index
    await this.supabase.rpc('exec_sql', {
      sql: `
        UPDATE kv_store_6a7942bb
        SET value = jsonb_set(
          value,
          '{ids}',
          (value->'ids')::jsonb || to_jsonb(ARRAY['${newWarehouse.id}'])
        )
        WHERE key = 'warehouse:index'
      `
    });

    return newWarehouse;
  }

  // ===== REPORTS =====

  /**
   * Get stock opname report
   */
  async getStockOpnameReport(warehouseId?: string) {
    const { data, error } = await this.supabase
      .from('v_stock_summary')
      .select('*')
      .gt('quantity_on_hand', 0)
      .order('warehouse_name')
      .order('item_code');

    if (error) throw error;

    if (warehouseId) {
      return data.filter(d => d.warehouse_id === warehouseId);
    }

    return data;
  }

  /**
   * Get low stock alert
   */
  async getLowStockAlert() {
    // This requires a custom query combining stock_summary and items
    const { data: stockData, error: stockError } = await this.supabase
      .from('v_stock_summary')
      .select('*');

    if (stockError) throw stockError;

    const { data: itemsData, error: itemsError } = await this.supabase
      .from('kv_store_6a7942bb')
      .select('value')
      .like('key', 'item:%')
      .not('key', 'eq', 'item:index');

    if (itemsError) throw itemsError;

    const items = itemsData.map(d => d.value as Item);

    // Filter low stock
    return stockData.filter(stock => {
      const item = items.find(i => i.id === stock.item_id);
      if (!item) return false;
      return stock.quantity_on_hand <= item.stock_control.reorder_point;
    }).map(stock => {
      const item = items.find(i => i.id === stock.item_id)!;
      return {
        ...stock,
        reorder_point: item.stock_control.reorder_point,
        min_stock: item.stock_control.min_stock,
        lead_time_days: item.stock_control.lead_time_days
      };
    });
  }

  /**
   * Get total stock value per warehouse
   */
  async getStockValueByWarehouse() {
    const { data, error } = await this.supabase
      .from('v_stock_summary')
      .select('warehouse_id, warehouse_name, total_value');

    if (error) throw error;

    // Group by warehouse
    const grouped = data.reduce((acc, curr) => {
      const existing = acc.find(a => a.warehouse_id === curr.warehouse_id);
      if (existing) {
        existing.total_value += curr.total_value;
        existing.item_count += 1;
      } else {
        acc.push({
          warehouse_id: curr.warehouse_id,
          warehouse_name: curr.warehouse_name,
          total_value: curr.total_value,
          item_count: 1
        });
      }
      return acc;
    }, [] as Array<{ warehouse_id: string; warehouse_name: string; total_value: number; item_count: number }>);

    return grouped;
  }
}

// =====================================================
// USAGE EXAMPLES
// =====================================================

/*

import { createClient } from '@supabase/supabase-js';
import { InventoryHelper } from './inventory-helpers';

const supabase = createClient('YOUR_URL', 'YOUR_KEY');
const inventory = new InventoryHelper(supabase);

// Get master data
const itemTypes = await inventory.getItemTypes();
const subtypes = await inventory.getItemSubtypes('1'); // Bahan Baku
const warehouses = await inventory.getWarehouses();

// Get items
const items = await inventory.getItems({ item_type_id: '1', is_active: true });
const item = await inventory.getItem('ITM00001');

// Stock operations
await inventory.stockIn({
  item_id: 'ITM00001',
  warehouse_id: 'WH003',
  quantity: 1000,
  unit: 'KG',
  unit_cost: 45000,
  transaction_type: 'IN_PURCHASE',
  reference_type: 'purchase_order',
  reference_id: 'PO-2026-001',
  movement_number: 'RCV-2026-001'
});

await inventory.stockOut({
  item_id: 'ITM00001',
  warehouse_id: 'WH003',
  quantity: 500,
  transaction_type: 'OUT_PRODUCTION',
  reference_type: 'work_order',
  reference_id: 'WO-2026-001',
  movement_number: 'OUT-2026-001'
});

// Get stock info
const summary = await inventory.getStockSummary('ITM00001', 'WH003');
const batches = await inventory.getActiveBatches('ITM00001', 'WH003');
const stockCard = await inventory.getStockCard('ITM00001', 'WH003');

// Reports
const opname = await inventory.getStockOpnameReport();
const lowStock = await inventory.getLowStockAlert();
const valueByWarehouse = await inventory.getStockValueByWarehouse();

*/
