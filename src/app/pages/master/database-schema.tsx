import { useState, useEffect } from 'react';
import { Database, Table, Key, ChevronDown, ChevronRight, Search, RefreshCw, Activity } from 'lucide-react';
import { PageHeader } from '../../components/page-header';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { api } from '../../lib/api';

interface FieldInfo {
  name: string;
  types: Set<string>; // Multiple possible types
  nullable: boolean;
  sampleValues: any[];
  description: string;
}

interface DataCollection {
  prefix: string;
  displayName: string;
  description: string;
  count: number;
  fields: FieldInfo[];
  module: string;
  sampleData: any[];
  lastUpdated: string;
}

interface ModuleGroup {
  name: string;
  displayName: string;
  color: string;
  collections: DataCollection[];
  totalRecords: number;
}

// Mapping prefix ke module dan info
const PREFIX_INFO: Record<string, { module: string; displayName: string; description: string }> = {
  'user:': { module: 'system', displayName: 'Users', description: 'Data user dan autentikasi' },
  'role:': { module: 'system', displayName: 'Roles', description: 'Role dan akses kontrol' },
  'permission:': { module: 'system', displayName: 'Permissions', description: 'Permission definitions' },

  'customer:': { module: 'sales', displayName: 'Customers', description: 'Data customer terdaftar' },
  'prospective_customer:': { module: 'sales', displayName: 'Prospective Customers', description: 'Data calon customer' },
  'pipeline:': { module: 'sales', displayName: 'Pipeline', description: 'Sales pipeline dan opportunity' },
  'pipeline_followup:': { module: 'sales', displayName: 'Pipeline Follow-ups', description: 'Follow-up activities' },
  'pipeline_log:': { module: 'sales', displayName: 'Pipeline Logs', description: 'Log history pipeline' },
  'lead_source:': { module: 'sales', displayName: 'Lead Sources', description: 'Master sumber lead' },
  'segment:': { module: 'sales', displayName: 'Segments', description: 'Segmen customer' },
  'product_type:': { module: 'sales', displayName: 'Product Types', description: 'Jenis produk' },
  'price_formula_polos:': { module: 'sales', displayName: 'Price Formula Polos', description: 'Formula harga kantong plastik polos' },
  'price_formula_offset:': { module: 'sales', displayName: 'Price Formula Flexibel', description: 'Formula harga kantong plastik flexibel (full color)' },
  'price_formula_boks:': { module: 'sales', displayName: 'Price Formula Boks', description: 'Formula harga boks/kemasan karton' },
  'price_formula_roto:': { module: 'sales', displayName: 'Price Formula Roto', description: 'Formula harga produk rotogravure/flexo roll' },
  'quotation:': { module: 'sales', displayName: 'Quotations', description: 'Penawaran harga' },
  'quotation_item:': { module: 'sales', displayName: 'Quotation Items', description: 'Item detail penawaran harga' },
  'sales_order:': { module: 'sales', displayName: 'Sales Orders', description: 'Order penjualan' },
  'sales_activity:': { module: 'sales', displayName: 'Sales Activities', description: 'Aktivitas sales' },

  'employee:': { module: 'hrga', displayName: 'Employees', description: 'Data karyawan' },
  'company:': { module: 'hrga', displayName: 'Companies', description: 'Master perusahaan' },
  'department:': { module: 'hrga', displayName: 'Departments', description: 'Master departemen' },
  'division:': { module: 'hrga', displayName: 'Divisions', description: 'Master divisi' },
  'position:': { module: 'hrga', displayName: 'Positions', description: 'Master posisi/jabatan' },

  'region:': { module: 'master', displayName: 'Regions', description: 'Master wilayah' },
  'item:': { module: 'master', displayName: 'Items', description: 'Master barang/produk' },

  'machine:': { module: 'production', displayName: 'Machines', description: 'Master mesin produksi' },
  'production_plan:': { module: 'production', displayName: 'Production Plans', description: 'Rencana produksi' },
  'production_realization:': { module: 'production', displayName: 'Production Realizations', description: 'Realisasi produksi' },

  'delivery_note:': { module: 'delivery', displayName: 'Delivery Notes', description: 'Surat jalan pengiriman' },

  'design_request:': { module: 'design', displayName: 'Design Requests', description: 'Permintaan desain' },

  'stock_movement:': { module: 'warehouse', displayName: 'Stock Movements', description: 'Mutasi stok barang' },

  'supplier:': { module: 'procurement', displayName: 'Suppliers', description: 'Master supplier' },
  'purchase_order:': { module: 'procurement', displayName: 'Purchase Orders', description: 'Order pembelian' },

  'documentation:': { module: 'system', displayName: 'Documentation', description: 'Dokumentasi sistem' },
};

const MODULE_INFO: Record<string, { displayName: string; color: string }> = {
  'system': { displayName: 'System', color: 'violet' },
  'sales': { displayName: 'Sales', color: 'blue' },
  'hrga': { displayName: 'HRGA', color: 'green' },
  'master': { displayName: 'Master Data', color: 'purple' },
  'production': { displayName: 'Production', color: 'orange' },
  'delivery': { displayName: 'Delivery', color: 'cyan' },
  'design': { displayName: 'Design', color: 'pink' },
  'warehouse': { displayName: 'Warehouse', color: 'emerald' },
  'procurement': { displayName: 'Procurement', color: 'amber' },
};

// Mapping field descriptions
const FIELD_DESCRIPTIONS: Record<string, string> = {
  // Common fields
  'id': 'Primary key / Identifier unik',
  'created_at': 'Tanggal dan waktu record dibuat',
  'updated_at': 'Tanggal dan waktu terakhir diupdate',
  'deleted_at': 'Tanggal soft delete (NULL jika aktif)',
  'createdAt': 'Tanggal dan waktu record dibuat',
  'updatedAt': 'Tanggal dan waktu terakhir diupdate',
  'created_by': 'User yang membuat record',
  'updated_by': 'User yang terakhir mengupdate record',

  // User related
  'username': 'Username untuk login',
  'email': 'Alamat email',
  'password': 'Password (encrypted)',
  'nama_user': 'Nama lengkap user',
  'role': 'Role/jabatan user dalam sistem',
  'employee_id': 'Referensi ke data karyawan',
  'is_active': 'Status aktif (true/false)',
  'permissions': 'Daftar permissions yang dimiliki',

  // Customer related
  'customerName': 'Nama customer atau perusahaan',
  'customer': 'Nama customer',
  'phone': 'Nomor telepon',
  'nomorTelepon': 'Nomor telepon',
  'address': 'Alamat lengkap',
  'alamat': 'Alamat lengkap',
  'city': 'Kota/kabupaten',
  'leadSource': 'Sumber lead customer',
  'sumberLead': 'Sumber lead customer',
  'salesPic': 'PIC sales yang menangani',
  'picSales': 'PIC sales yang menangani',
  'notes': 'Catatan tambahan',
  'catatan': 'Catatan tambahan',

  // Pipeline related
  'stage': 'Tahapan pipeline (Cold, Warm, Hot, Closing)',
  'orderType': 'Tipe order (New/Repeat)',
  'estimatedValue': 'Estimasi nilai transaksi',
  'probability': 'Probabilitas closing (%)',
  'expectedCloseDate': 'Tanggal estimasi closing',
  'customerId': 'Referensi ke customer',

  // Employee related
  'employee_code': 'Kode/NIK karyawan',
  'full_name': 'Nama lengkap karyawan',
  'id_number': 'Nomor KTP',
  'date_of_birth': 'Tanggal lahir',
  'place_of_birth': 'Tempat lahir',
  'gender': 'Jenis kelamin',
  'religion': 'Agama',
  'marital_status': 'Status pernikahan',
  'company_id': 'ID perusahaan',
  'company_name': 'Nama perusahaan',
  'department_code': 'Kode departemen',
  'department_name': 'Nama departemen',
  'position_code': 'Kode posisi/jabatan',
  'position_name': 'Nama posisi/jabatan',
  'join_date': 'Tanggal bergabung',
  'employment_status': 'Status kepegawaian (Tetap/Kontrak/Probation)',

  // Company/Department related
  'code': 'Kode unik',
  'name': 'Nama',
  'display_name': 'Nama tampilan',
  'description': 'Deskripsi',
  'companyCode': 'Kode perusahaan',
  'companyName': 'Nama perusahaan',
  'parentCode': 'Kode parent/atasan',
  'level': 'Level hierarki',

  // Product related
  'product': 'Nama produk',
  'quantity': 'Jumlah/kuantitas',
  'unit': 'Satuan',
  'price': 'Harga',
  'amount': 'Total nilai',

  // Order related
  'orderNumber': 'Nomor order',
  'orderDate': 'Tanggal order',
  'deliveryDate': 'Tanggal pengiriran',
  'status': 'Status',
  'totalAmount': 'Total nilai transaksi',

  // Quotation related
  'quotationNumber': 'Nomor penawaran harga (auto-generated)',
  'quotation_number': 'Nomor penawaran harga (auto-generated)',
  'quotationDate': 'Tanggal penawaran',
  'quotation_date': 'Tanggal penawaran',
  'validUntil': 'Berlaku sampai tanggal',
  'valid_until': 'Berlaku sampai tanggal',
  'salesPerson': 'Nama sales person yang handle',
  'sales_person': 'Nama sales person yang handle',
  'jobType': 'Tipe pekerjaan (Order/Quotation)',
  'job_type': 'Tipe pekerjaan (Order/Quotation)',
  'npwp': 'Nomor NPWP customer',
  'dpPercentage': 'Persentase DP (%)',
  'dp_percentage': 'Persentase DP (%)',
  'pembayaran': 'Metode pembayaran',
  'ppnType': 'Tipe PPN (Inc/Exc)',
  'ppn_type': 'Tipe PPN (Inc/Exc)',
  'modeAlamat': 'Mode alamat pengiriman (Manual/Auto)',
  'mode_alamat': 'Mode alamat pengiriman (Manual/Auto)',
  'alamatManual': 'Alamat pengiriman manual',
  'alamat_manual': 'Alamat pengiriman manual',
  'jenisOrder': 'Jenis order (Offset/Polos/Boks/Roto)',
  'jenis_order': 'Jenis order (Offset/Polos/Boks/Roto)',
  'biayaLain': 'Biaya tambahan lain-lain',
  'biaya_lain': 'Biaya tambahan lain-lain',

  // Quotation Item related
  'namaItem': 'Nama item produk',
  'nama_item': 'Nama item produk',
  'deskripsi': 'Deskripsi detail item',
  'qty': 'Quantity/jumlah item',
  'satuan': 'Satuan item (Pcs, Box, Kg, dll)',
  'hargaSatuan': 'Harga per satuan',
  'harga_satuan': 'Harga per satuan',
  'diskon': 'Nominal diskon untuk item',
  'totalHarga': 'Total harga setelah diskon',
  'total_harga': 'Total harga setelah diskon',
  'quotationId': 'Referensi ke quotation',
  'quotation_id': 'Referensi ke quotation',

  // Location related
  'provinsi': 'Provinsi',
  'kotaKabupaten': 'Kota/Kabupaten',
  'kecamatan': 'Kecamatan',
  'negara': 'Negara',

  // Production related
  'machine': 'Nama mesin',
  'machine_code': 'Kode mesin',
  'shift': 'Shift kerja',
  'start_date': 'Tanggal mulai',
  'end_date': 'Tanggal selesai',
};

// Generate description from field name
const generateFieldDescription = (fieldName: string): string => {
  // Check exact match first
  if (FIELD_DESCRIPTIONS[fieldName]) {
    return FIELD_DESCRIPTIONS[fieldName];
  }

  // Check case-insensitive match
  const lowerFieldName = fieldName.toLowerCase();
  const matchedKey = Object.keys(FIELD_DESCRIPTIONS).find(
    key => key.toLowerCase() === lowerFieldName
  );
  if (matchedKey) {
    return FIELD_DESCRIPTIONS[matchedKey];
  }

  // Generate from field name patterns
  if (fieldName.endsWith('_id') || fieldName.endsWith('Id')) {
    const baseName = fieldName.replace(/_id$|Id$/, '').replace(/_/g, ' ');
    return `Referensi ke ${baseName}`;
  }

  if (fieldName.endsWith('_at') || fieldName.endsWith('At')) {
    const baseName = fieldName.replace(/_at$|At$/, '').replace(/_/g, ' ');
    return `Tanggal ${baseName}`;
  }

  if (fieldName.startsWith('is_') || fieldName.startsWith('is')) {
    const baseName = fieldName.replace(/^is_|^is/, '').replace(/_/g, ' ');
    return `Indikator ${baseName} (true/false)`;
  }

  if (fieldName.endsWith('_code') || fieldName.endsWith('Code')) {
    const baseName = fieldName.replace(/_code$|Code$/, '').replace(/_/g, ' ');
    return `Kode ${baseName}`;
  }

  if (fieldName.endsWith('_name') || fieldName.endsWith('Name')) {
    const baseName = fieldName.replace(/_name$|Name$/, '').replace(/_/g, ' ');
    return `Nama ${baseName}`;
  }

  if (fieldName.endsWith('_number') || fieldName.endsWith('Number')) {
    const baseName = fieldName.replace(/_number$|Number$/, '').replace(/_/g, ' ');
    return `Nomor ${baseName}`;
  }

  if (fieldName.endsWith('_date') || fieldName.endsWith('Date')) {
    const baseName = fieldName.replace(/_date$|Date$/, '').replace(/_/g, ' ');
    return `Tanggal ${baseName}`;
  }

  // Default: convert field name to readable format
  const readable = fieldName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/\s+/g, ' ');

  return readable.charAt(0).toUpperCase() + readable.slice(1);
};

export function DatabaseSchema() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});
  const [activeModule, setActiveModule] = useState('system');
  const [loading, setLoading] = useState(true);
  const [moduleGroups, setModuleGroups] = useState<ModuleGroup[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDatabaseSchema();
  }, []);

  // Auto-detect module from prefix
  const detectModule = (prefix: string): string => {
    const cleanPrefix = prefix.replace(':', '').toLowerCase();

    // Sales patterns
    if (cleanPrefix.includes('customer') || cleanPrefix.includes('pipeline') ||
        cleanPrefix.includes('lead') || cleanPrefix.includes('segment') ||
        cleanPrefix.includes('quotation') || cleanPrefix.includes('sales') ||
        cleanPrefix.includes('price_formula')) {
      return 'sales';
    }

    // HRGA patterns
    if (cleanPrefix.includes('employee') || cleanPrefix.includes('company') ||
        cleanPrefix.includes('department') || cleanPrefix.includes('division') ||
        cleanPrefix.includes('position')) {
      return 'hrga';
    }

    // Production patterns
    if (cleanPrefix.includes('production') || cleanPrefix.includes('machine')) {
      return 'production';
    }

    // Procurement patterns
    if (cleanPrefix.includes('supplier') || cleanPrefix.includes('purchase')) {
      return 'procurement';
    }

    // Delivery patterns
    if (cleanPrefix.includes('delivery')) {
      return 'delivery';
    }

    // Design patterns
    if (cleanPrefix.includes('design')) {
      return 'design';
    }

    // Warehouse patterns
    if (cleanPrefix.includes('stock') || cleanPrefix.includes('warehouse') || cleanPrefix.includes('inventory')) {
      return 'warehouse';
    }

    // System patterns
    if (cleanPrefix.includes('user') || cleanPrefix.includes('role') ||
        cleanPrefix.includes('permission') || cleanPrefix.includes('documentation')) {
      return 'system';
    }

    // Master data patterns
    if (cleanPrefix.includes('region') || cleanPrefix.includes('item') ||
        cleanPrefix.includes('product_type') || cleanPrefix.includes('master')) {
      return 'master';
    }

    // Default to master
    return 'master';
  };

  // Auto-generate display name from prefix
  const generateDisplayName = (prefix: string): string => {
    const clean = prefix.replace(':', '').replace(/_/g, ' ');
    return clean.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const fetchDatabaseSchema = async () => {
    try {
      setRefreshing(true);

      // Get ALL keys from KV store to discover all prefixes
      const allKeys = await api.getAllKeys();

      // Extract unique prefixes from all keys
      const discoveredPrefixes = new Set<string>();
      allKeys.forEach((key: string) => {
        const match = key.match(/^([^:]+):/);
        if (match) {
          discoveredPrefixes.add(match[1] + ':');
        }
      });

      // Merge with known prefixes
      const allPrefixes = new Set([...Object.keys(PREFIX_INFO), ...Array.from(discoveredPrefixes)]);

      // Get all data from KV store
      const allDataPromises = Array.from(allPrefixes).map(async (prefix) => {
        try {
          // Extract prefix without colon for API call
          const cleanPrefix = prefix.replace(':', '');

          // Try to get data using api methods
          let data: any[] = [];

          // Map prefix to API method (with fallback to generic kvGetByPrefix)
          if (prefix === 'user:') data = await api.getUsers();
          else if (prefix === 'role:') data = await api.getRoles();
          else if (prefix === 'permission:') data = await api.getPermissions();
          else if (prefix === 'customer:') data = await api.getCustomers();
          else if (prefix === 'prospective_customer:') data = await api.getProspectiveCustomers();
          else if (prefix === 'pipeline:') data = await api.getPipelines();
          else if (prefix === 'pipeline_followup:') data = await api.getPipelineFollowUps();
          else if (prefix === 'pipeline_log:') data = await api.getAllPipelineLogs();
          else if (prefix === 'lead_source:') data = await api.getLeadSources();
          else if (prefix === 'segment:') data = await api.getSegments();
          else if (prefix === 'product_type:') data = await api.getProductTypes();
          else if (prefix === 'price_formula_polos:') data = await api.getPriceFormulasPolos();
          else if (prefix === 'price_formula_offset:') data = await api.getPriceFormulasOffset();
          else if (prefix === 'price_formula_boks:') data = await api.getPriceFormulasBoks();
          else if (prefix === 'price_formula_roto:') data = await api.getPriceFormulasRoto();
          else if (prefix === 'quotation:') data = await api.getQuotations();
          else if (prefix === 'quotation_item:') data = await api.getQuotationItems();
          else if (prefix === 'sales_order:') data = await api.getSalesOrders();
          else if (prefix === 'sales_activity:') data = await api.getSalesActivities();
          else if (prefix === 'employee:') data = await api.getEmployees();
          else if (prefix === 'company:') data = await api.getCompanies();
          else if (prefix === 'department:') data = await api.getDepartments();
          else if (prefix === 'division:') data = await api.getDivisions();
          else if (prefix === 'position:') data = await api.getPositions();
          else if (prefix === 'region:') data = await api.getRegions();
          else if (prefix === 'item:') data = await api.getItems();
          else if (prefix === 'machine:') data = await api.getMachines();
          else if (prefix === 'production_plan:') data = await api.getProductionPlans();
          else if (prefix === 'production_realization:') data = await api.getProductionRealizations();
          else if (prefix === 'delivery_note:') data = await api.getDeliveryNotes();
          else if (prefix === 'design_request:') data = await api.getDesignRequests();
          else if (prefix === 'stock_movement:') data = await api.getStockMovements();
          else if (prefix === 'supplier:') data = await api.getSuppliers();
          else if (prefix === 'purchase_order:') data = await api.getPurchaseOrders();
          else if (prefix === 'documentation:') data = await api.getDocumentation();
          else {
            // Fallback: get by prefix directly
            data = await api.getByPrefix(cleanPrefix);
          }

          return { prefix, data: data || [] };
        } catch (error) {
          console.warn(`Failed to fetch ${prefix}:`, error);
          return { prefix, data: [] };
        }
      });

      const allData = await Promise.all(allDataPromises);

      // Analyze data structure
      const collections: DataCollection[] = allData
        .map(({ prefix, data }) => {
          // Get info from PREFIX_INFO or auto-generate
          const info = PREFIX_INFO[prefix] || {
            module: detectModule(prefix),
            displayName: generateDisplayName(prefix),
            description: `Data ${generateDisplayName(prefix).toLowerCase()}`
          };

          // Show collection even if empty (no data yet)
          if (!data || data.length === 0) {
            return {
              prefix,
              displayName: info.displayName,
              description: info.description,
              count: 0,
              fields: [],
              module: info.module,
              sampleData: [],
              lastUpdated: new Date().toISOString()
            };
          }

          // Analyze fields from sample data
          const fieldsMap = new Map<string, FieldInfo>();

          data.forEach((record: any) => {
            Object.entries(record).forEach(([key, value]) => {
              if (!fieldsMap.has(key)) {
                fieldsMap.set(key, {
                  name: key,
                  types: new Set(),
                  nullable: false,
                  sampleValues: [],
                  description: generateFieldDescription(key)
                });
              }

              const field = fieldsMap.get(key)!;
              const valueType = value === null ? 'null' : typeof value;
              field.types.add(valueType);

              if (value === null || value === undefined) {
                field.nullable = true;
              }

              // Store sample values (max 3 unique)
              if (field.sampleValues.length < 3 && !field.sampleValues.includes(value)) {
                field.sampleValues.push(value);
              }
            });
          });

          const fields = Array.from(fieldsMap.values());

          return {
            prefix,
            displayName: info.displayName,
            description: info.description,
            count: data.length,
            fields,
            module: info.module,
            sampleData: data.slice(0, 3), // Keep first 3 records as samples
            lastUpdated: new Date().toISOString()
          };
        })
        .filter((c): c is DataCollection => c !== null);

      // Group by module
      const groupedByModule = new Map<string, DataCollection[]>();
      collections.forEach(collection => {
        const module = collection.module;
        if (!groupedByModule.has(module)) {
          groupedByModule.set(module, []);
        }
        groupedByModule.get(module)!.push(collection);
      });

      // Create module groups
      const groups: ModuleGroup[] = Array.from(groupedByModule.entries()).map(([moduleName, collections]) => {
        const moduleInfo = MODULE_INFO[moduleName] || { displayName: moduleName, color: 'gray' };
        const totalRecords = collections.reduce((sum, c) => sum + c.count, 0);

        return {
          name: moduleName,
          displayName: moduleInfo.displayName,
          color: moduleInfo.color,
          collections: collections.sort((a, b) => a.displayName.localeCompare(b.displayName)),
          totalRecords
        };
      });

      setModuleGroups(groups.sort((a, b) => a.displayName.localeCompare(b.displayName)));
      setLastRefresh(new Date());
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching database schema:', error);
      toast.error('Gagal memuat database schema');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleCollection = (collectionId: string) => {
    setExpandedCollections(prev => ({
      ...prev,
      [collectionId]: !prev[collectionId],
    }));
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      violet: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400',
      blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
      green: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
      purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
      orange: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
      cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400',
      pink: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400',
      emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
      amber: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
      gray: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
    };
    return colors[color] || colors.gray;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'string': 'bg-blue-100 text-blue-700',
      'number': 'bg-green-100 text-green-700',
      'boolean': 'bg-purple-100 text-purple-700',
      'object': 'bg-orange-100 text-orange-700',
      'null': 'bg-gray-100 text-gray-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value).slice(0, 50) + '...';
    if (typeof value === 'string' && value.length > 50) return value.slice(0, 50) + '...';
    return String(value);
  };

  const filteredGroups = moduleGroups.map(group => ({
    ...group,
    collections: group.collections.filter(collection =>
      collection.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.fields.some(field => field.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
  })).filter(group => group.collections.length > 0);

  const currentGroup = moduleGroups.find(g => g.name === activeModule);

  const totalCollections = moduleGroups.reduce((sum, g) => sum + g.collections.length, 0);
  const totalRecords = moduleGroups.reduce((sum, g) => sum + g.totalRecords, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Menganalisis database schema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Database Schema"
        description="Auto-generated dokumentasi struktur database dari Supabase KV Store"
        icon={Database}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Master' },
          { label: 'Database Schema' },
        ]}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-600" />
            <div>
              <div className="text-sm text-muted-foreground">Modules</div>
              <div className="text-2xl font-bold">{moduleGroups.length}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Table className="w-8 h-8 text-green-600" />
            <div>
              <div className="text-sm text-muted-foreground">Collections</div>
              <div className="text-2xl font-bold">{totalCollections}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-purple-600" />
            <div>
              <div className="text-sm text-muted-foreground">Total Records</div>
              <div className="text-2xl font-bold">{totalRecords.toLocaleString()}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-orange-600" />
            <div>
              <div className="text-sm text-muted-foreground">Last Refresh</div>
              <div className="text-sm font-medium">
                {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Refresh */}
      <Card className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Cari collection, field, atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={fetchDatabaseSchema}
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </Card>

      {/* Module Tabs */}
      <Tabs value={activeModule} onValueChange={setActiveModule}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${moduleGroups.length}, 1fr)` }}>
          {moduleGroups.map(group => (
            <TabsTrigger key={group.name} value={group.name}>
              <Database className="w-4 h-4 mr-2" />
              {group.displayName}
              <Badge variant="secondary" className="ml-2">{group.collections.length}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {moduleGroups.map(group => (
          <TabsContent key={group.name} value={group.name} className="space-y-4 mt-6">
            {/* Module Header */}
            <Card className={`p-4 border-2 ${getColorClass(group.color)}`}>
              <div className="flex items-start gap-4">
                <Database className="w-8 h-8 mt-1" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{group.displayName} Module</h2>
                  <p className="text-sm opacity-80 mt-1">Data collections untuk modul {group.displayName.toLowerCase()}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <Badge variant="outline" className="border-current">
                      {group.collections.length} Collections
                    </Badge>
                    <Badge variant="outline" className="border-current">
                      {group.totalRecords.toLocaleString()} Records
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Collections List */}
            <div className="space-y-3">
              {group.collections.map(collection => {
                const collectionId = `${collection.module}.${collection.prefix}`;
                const isExpanded = expandedCollections[collectionId];

                return (
                  <Card key={collectionId} className="overflow-hidden">
                    {/* Collection Header */}
                    <div
                      className="p-4 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => toggleCollection(collectionId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          )}
                          <Table className="w-5 h-5 text-primary" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{collection.displayName}</h3>
                              <code className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                                {collection.prefix}
                              </code>
                            </div>
                            <p className="text-sm text-muted-foreground">{collection.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={collection.count > 0
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-50 text-gray-500 border-gray-200"
                            }
                          >
                            {collection.count} records
                          </Badge>
                          <Badge
                            variant="outline"
                            className={collection.fields.length > 0
                              ? ""
                              : "bg-gray-50 text-gray-500 border-gray-200"
                            }
                          >
                            {collection.fields.length} fields
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Collection Fields */}
                    {isExpanded && (
                      <div className="p-4">
                        {collection.fields.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Belum ada data di collection ini</p>
                            <p className="text-xs mt-1">Schema fields akan muncul setelah data pertama ditambahkan</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-2 px-3 font-semibold">Field</th>
                                  <th className="text-left py-2 px-3 font-semibold">Types</th>
                                  <th className="text-left py-2 px-3 font-semibold">Nullable</th>
                                  <th className="text-left py-2 px-3 font-semibold">Sample Values</th>
                                  <th className="text-left py-2 px-3 font-semibold">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {collection.fields.map(field => (
                                  <tr key={field.name} className="border-b hover:bg-muted/30">
                                    <td className="py-2 px-3">
                                      <div className="flex items-center gap-2">
                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                          {field.name}
                                        </code>
                                        {field.name === 'id' && (
                                          <Key className="w-4 h-4 text-yellow-600" title="Primary Key" />
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-2 px-3">
                                      <div className="flex gap-1 flex-wrap">
                                        {Array.from(field.types).map(type => (
                                          <Badge key={type} variant="secondary" className={`text-xs ${getTypeColor(type)}`}>
                                            {type}
                                          </Badge>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="py-2 px-3">
                                      <Badge variant={field.nullable ? 'outline' : 'default'} className="text-xs">
                                        {field.nullable ? 'NULL' : 'NOT NULL'}
                                      </Badge>
                                    </td>
                                    <td className="py-2 px-3 text-muted-foreground text-xs">
                                      {field.sampleValues.length > 0 ? (
                                        <div className="space-y-1">
                                          {field.sampleValues.slice(0, 2).map((val, idx) => (
                                            <div key={idx} className="font-mono">
                                              {formatValue(val)}
                                            </div>
                                          ))}
                                        </div>
                                      ) : '-'}
                                    </td>
                                    <td className="py-2 px-3 text-muted-foreground text-xs">
                                      {field.description}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Sample Data */}
                        {collection.sampleData.length > 0 && (
                          <div className="mt-4 p-3 bg-muted/30 rounded-lg border">
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Activity className="w-4 h-4" />
                              Sample Data ({collection.sampleData.length} records)
                            </h4>
                            <div className="space-y-2">
                              {collection.sampleData.map((sample, idx) => (
                                <details key={idx} className="text-xs">
                                  <summary className="cursor-pointer hover:bg-muted/50 p-2 rounded">
                                    Record {idx + 1} - {sample.id || sample.name || 'Unknown'}
                                  </summary>
                                  <pre className="mt-2 p-2 bg-background rounded border overflow-x-auto">
                                    {JSON.stringify(sample, null, 2)}
                                  </pre>
                                </details>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Empty State */}
      {searchQuery && filteredGroups.length === 0 && (
        <Card className="p-12 text-center">
          <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold mb-2">Tidak ada hasil</h3>
          <p className="text-muted-foreground">
            Tidak ditemukan collection atau field yang cocok dengan "{searchQuery}"
          </p>
        </Card>
      )}

      {/* Info Footer */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-2">Auto-Generated Schema</p>
            <ul className="space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Schema dibuat otomatis dengan menganalisis struktur data dari Supabase KV Store (<code>kv_store_6a7942bb</code>)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  <strong>Auto-Detection:</strong> Sistem otomatis mendeteksi <strong>semua collection/tabel baru</strong> yang dibuat di aplikasi tanpa perlu update manual
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Klik tombol <strong>Refresh</strong> untuk update schema terbaru setelah ada penambahan data atau tabel baru
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  <strong>Field Description</strong> di-generate otomatis berdasarkan nama field dan pattern umum (id, created_at, _code, _name, dll.)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  <strong>Module Grouping</strong> otomatis berdasarkan pattern nama collection (sales_, customer_, pipeline_, employee_, dll.)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>
                  Collection baru akan langsung muncul setelah data pertama ditambahkan, tanpa perlu konfigurasi tambahan
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
