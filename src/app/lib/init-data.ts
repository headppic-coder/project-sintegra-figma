import { api } from './api';

export async function initializeSampleData() {
  try {
    console.log('📦 Checking if sample data exists...');
    
    // Check if data already exists - with timeout to prevent hanging
    const checkResponse = await Promise.race([
      api.get('sales-orders'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      )
    ]) as any;
    
    if (checkResponse.data && checkResponse.data.length > 0) {
      console.log('✅ Sample data already exists, skipping initialization');
      return;
    }

    console.log('📝 Creating sample data...');
    
    // Create data sequentially to avoid overwhelming the database
    // Initialize sample customers
    await api.post('customers', {
      companyName: 'PT Indofood Sukses Makmur',
      contactPerson: 'Budi Santoso',
      phone: '021-5555-1234',
      email: 'budi@indofood.co.id',
      address: 'Jakarta Selatan',
      npwp: '01.234.567.8-901.000',
    });

    await api.post('customers', {
      companyName: 'PT Unilever Indonesia',
      contactPerson: 'Siti Rahayu',
      phone: '021-5555-5678',
      email: 'siti@unilever.co.id',
      address: 'Tangerang',
      npwp: '02.345.678.9-012.000',
    });

    // Initialize sample sales orders
    await api.post('sales-orders', {
      customerName: 'PT Indofood Sukses Makmur',
      productName: 'Kemasan Snack Chitato',
      quantity: '5000',
      deadline: '2026-04-15',
      filmType: 'OPP',
      colorCount: '5',
      inkType: 'Solvent',
      notes: 'Finishing glossy'
    });

    await api.post('sales-orders', {
      customerName: 'PT Unilever Indonesia',
      productName: 'Kemasan Sabun Lux',
      quantity: '10000',
      deadline: '2026-04-20',
      filmType: 'PET',
      colorCount: 'full',
      inkType: 'Water-based',
      notes: 'Perhatian color matching'
    });

    // Initialize sample machines
    await api.post('machines', {
      machineId: 'M001',
      machineName: 'Rotogravure Line 1',
      machineType: 'Rotogravure',
      capacity: 120,
      manufacturer: 'Bobst',
      yearInstalled: 2018,
    });

    await api.post('machines', {
      machineId: 'M002',
      machineName: 'Rotogravure Line 2',
      machineType: 'Rotogravure',
      capacity: 110,
      manufacturer: 'Bobst',
      yearInstalled: 2015,
    });

    await api.post('machines', {
      machineId: 'M003',
      machineName: 'Offset Press 1',
      machineType: 'Offset',
      capacity: 80,
      manufacturer: 'Heidelberg',
      yearInstalled: 2017,
    });

    // Initialize sample items
    await api.post('items', {
      itemName: 'Film PET 12 micron',
      category: 'Raw Material',
      unit: 'Roll',
      minStock: 50,
      maxStock: 200,
    });

    await api.post('items', {
      itemName: 'Film OPP 15 micron',
      category: 'Raw Material',
      unit: 'Roll',
      minStock: 30,
      maxStock: 150,
    });

    await api.post('items', {
      itemName: 'Tinta Cyan',
      category: 'Raw Material',
      unit: 'Kg',
      minStock: 20,
      maxStock: 100,
    });

    // Initialize sample employees
    await api.post('employees', {
      fullName: 'John Doe',
      email: 'john.doe@company.com',
      phone: '081234567890',
      division: 'Produksi',
      position: 'Operator Mesin',
      joinDate: '2020-01-15',
    });

    await api.post('employees', {
      fullName: 'Jane Smith',
      email: 'jane.smith@company.com',
      phone: '081234567891',
      division: 'Sales',
      position: 'Sales Manager',
      joinDate: '2018-03-20',
    });

    // Initialize sample divisions
    await api.post('divisions', {
      divisionCode: 'PROD',
      divisionName: 'Produksi',
      head: 'Ahmad Kurniawan',
      description: 'Divisi Produksi Manufacturing',
    });

    await api.post('divisions', {
      divisionCode: 'SALES',
      divisionName: 'Sales',
      head: 'Jane Smith',
      description: 'Divisi Penjualan',
    });

    await api.post('divisions', {
      divisionCode: 'PPIC',
      divisionName: 'PPIC',
      head: 'Rudi Hartono',
      description: 'Divisi Perencanaan dan Kontrol Produksi',
    });

    // Initialize sample suppliers
    await api.post('suppliers', {
      supplierName: 'PT Film Indonesia',
      contactPerson: 'Agus Wijaya',
      phone: '021-7777-1234',
      email: 'agus@filmindonesia.co.id',
      address: 'Jakarta Timur',
      paymentTerm: 'NET 30',
    });

    await api.post('suppliers', {
      supplierName: 'CV Tinta Jaya',
      contactPerson: 'Dewi Lestari',
      phone: '021-7777-5678',
      email: 'dewi@tintajaya.co.id',
      address: 'Bekasi',
      paymentTerm: 'NET 45',
    });

  } catch (error) {
    // Re-throw error so App.tsx can handle it
    console.error('❌ Failed to initialize sample data:', error);
    throw error;
  }
}