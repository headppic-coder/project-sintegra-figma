import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { api } from '../../lib/api';

interface QuotationItem {
  id?: string;
  namaItem: string;
  deskripsi: string;
  qty: number;
  satuan: string;
  hargaSatuan: number;
  diskon: number;
  totalHarga: number;
}

interface Customer {
  id: string;
  customerName: string;
  accurateId?: string;
}

interface Pipeline {
  id: string;
  customerName: string;
  prospect: string;
  stage: string;
  estimatedValue?: number;
}

interface PipelineFollowUp {
  id: string;
  pipelineId: string;
  customerName: string;
  followUpDate: string;
  notes?: string;
}

export function QuotationFormNew() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [followups, setFollowups] = useState<PipelineFollowUp[]>([]);

  const [formData, setFormData] = useState({
    tanggal: '20/04/2026',
    validHingga: '',
    customer: '',
    customerId: '',
    pipelineId: '',
    alamatCustomer: '',
    salesPerson: '',
    status: 'Draft',
    catatan: '',
    items: [] as QuotationItem[],
  });

  useEffect(() => {
    fetchCustomers();
    fetchPipelines();
    fetchFollowups();
  }, []);

  const fetchCustomers = async () => {
    try {
      const result = await api.getCustomers();
      setCustomers(result || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchPipelines = async () => {
    try {
      const result = await api.getPipelines();
      setPipelines(result || []);
    } catch (error) {
      console.error('Error fetching pipelines:', error);
    }
  };

  const fetchFollowups = async () => {
    try {
      const result = await api.getPipelineFollowUps();
      setFollowups(result || []);
    } catch (error) {
      console.error('Error fetching followups:', error);
    }
  };

  const addItem = () => {
    const newItem: QuotationItem = {
      namaItem: '',
      deskripsi: '',
      qty: 1,
      satuan: 'Pcs',
      hargaSatuan: 0,
      diskon: 0,
      totalHarga: 0,
    };
    setFormData({
      ...formData,
      items: [...formData.items, newItem],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) {
      toast.error('Minimal harus ada 1 item');
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
    const newItems = [...formData.items];
    (newItems[index] as any)[field] = value;

    // Auto calculate total price
    if (field === 'qty' || field === 'hargaSatuan' || field === 'diskon') {
      const qty = newItems[index].qty || 0;
      const hargaSatuan = newItems[index].hargaSatuan || 0;
      const diskon = newItems[index].diskon || 0;
      const subtotal = qty * hargaSatuan;
      newItems[index].totalHarga = subtotal - diskon;
    }

    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer) {
      toast.error('Customer wajib diisi');
      return;
    }

    if (!formData.tanggal) {
      toast.error('Tanggal wajib diisi');
      return;
    }

    if (!formData.validHingga) {
      toast.error('Valid Hingga wajib diisi');
      return;
    }

    if (formData.items.length === 0) {
      toast.error('Minimal harus ada 1 item');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        pipelineId: formData.pipelineId === 'none' ? '' : formData.pipelineId,
        createdAt: new Date().toISOString(),
      };

      await api.createQuotation(payload);
      toast.success('Penawaran berhasil dibuat');
      navigate('/sales/quotations');
    } catch (error) {
      console.error('Error saving quotation:', error);
      toast.error('Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-0 m-0">
      {/* Breadcrumb */}
      <div className="p-2 m-0">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <a href="/dashboard" className="hover:text-foreground">Dashboard</a>
          <span>&gt;</span>
          <a href="/sales" className="hover:text-foreground">Sales</a>
          <span>&gt;</span>
          <a href="/sales/quotations" className="hover:text-foreground">Penawaran</a>
          <span>&gt;</span>
          <span className="text-foreground font-medium">Buat Baru</span>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="m-0 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-1 m-0">
          <h1 className="text-xl font-bold text-gray-900">Buat Penawaran Baru</h1>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/sales/quotations')}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </Button>
        </div>

        {/* Informasi Penawaran */}
        <div className="bg-white border rounded-lg p-4 m-0">
          <h2 className="font-semibold mb-4">Informasi Penawaran</h2>

          <div className="flex flex-col gap-4">
            {/* Tanggal */}
            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <Label htmlFor="tanggal" className="text-sm font-medium">
                Tanggal <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="tanggal"
                  type="text"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="h-10 pl-10"
                  placeholder="dd/mm/yyyy"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                </svg>
              </div>
            </div>

            {/* Valid Hingga */}
            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <Label htmlFor="validHingga" className="text-sm font-medium">
                Valid Hingga <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="validHingga"
                  type="text"
                  value={formData.validHingga}
                  onChange={(e) => setFormData({ ...formData, validHingga: e.target.value })}
                  className="h-10 pl-10"
                  placeholder="Pilih tanggal berakhir"
                />
                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                </svg>
              </div>
            </div>

            {/* Customer */}
            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <Label htmlFor="customer" className="text-sm font-medium">
                Customer <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.customer}
                onValueChange={(value) => {
                  const selected = customers.find(c => c.id === value);
                  setFormData({
                    ...formData,
                    customer: value,
                    customerId: value,
                  });
                }}
              >
                <SelectTrigger id="customer" className="h-10">
                  <SelectValue placeholder="Pilih customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.filter(c => c.id && typeof c.id === 'string' && c.id.trim() !== '').map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pipeline */}
            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <Label htmlFor="pipeline" className="text-sm font-medium">Pipeline</Label>
              <Select
                value={formData.pipelineId}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    pipelineId: value,
                  });
                }}
              >
                <SelectTrigger id="pipeline" className="h-10">
                  <SelectValue placeholder="Pilih pipeline (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak Ada</SelectItem>
                  {pipelines.filter(p => p.id && typeof p.id === 'string' && p.id.trim() !== '').map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.customerName} - {pipeline.prospect} ({pipeline.stage})
                    </SelectItem>
                  ))}
                  {followups.filter(f => f.id && typeof f.id === 'string' && f.id.trim() !== '').map((followup) => (
                    <SelectItem key={followup.id} value={followup.id}>
                      [Follow-up] {followup.customerName} - {followup.followUpDate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Alamat Customer */}
            <div className="grid grid-cols-[200px_1fr] items-start gap-4">
              <Label htmlFor="alamatCustomer" className="text-sm font-medium pt-2">Alamat Customer</Label>
              <Textarea
                id="alamatCustomer"
                value={formData.alamatCustomer}
                onChange={(e) => setFormData({ ...formData, alamatCustomer: e.target.value })}
                placeholder="Alamat lengkap customer"
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Sales Person */}
            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <Label htmlFor="salesPerson" className="text-sm font-medium">Sales Person</Label>
              <Input
                id="salesPerson"
                value={formData.salesPerson}
                onChange={(e) => setFormData({ ...formData, salesPerson: e.target.value })}
                placeholder="Nama sales person"
                className="h-10"
              />
            </div>

            {/* Status */}
            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <Label htmlFor="status" className="text-sm font-medium">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status" className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Sent">Sent</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Catatan */}
            <div className="grid grid-cols-[200px_1fr] items-start gap-4">
              <Label htmlFor="catatan" className="text-sm font-medium pt-2">Catatan</Label>
              <Textarea
                id="catatan"
                value={formData.catatan}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                placeholder="Catatan tambahan untuk penawaran ini"
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </div>

        {/* Item Penawaran */}
        <div className="bg-white border rounded-lg p-2 m-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Item Penawaran</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="gap-1 h-8"
            >
              <Plus className="w-4 h-4" />
              Tambah Item
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            {formData.items.map((item, index) => (
              <div key={index} className="border rounded-lg p-2 bg-gray-50 m-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-medium text-gray-700">Item {index + 1}</h3>
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label htmlFor={`namaItem-${index}`} className="text-xs">
                      Nama Item <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`namaItem-${index}`}
                      value={item.namaItem}
                      onChange={(e) => updateItem(index, 'namaItem', e.target.value)}
                      placeholder=""
                      className="h-9 mt-0.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`deskripsi-${index}`} className="text-xs">Deskripsi</Label>
                    <Input
                      id={`deskripsi-${index}`}
                      value={item.deskripsi}
                      onChange={(e) => updateItem(index, 'deskripsi', e.target.value)}
                      placeholder=""
                      className="h-9 mt-0.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`qty-${index}`} className="text-xs">
                      Qty <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id={`qty-${index}`}
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
                      placeholder=""
                      className="h-9 mt-0.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`satuan-${index}`} className="text-xs">Satuan</Label>
                    <Input
                      id={`satuan-${index}`}
                      value={item.satuan}
                      onChange={(e) => updateItem(index, 'satuan', e.target.value)}
                      placeholder=""
                      className="h-9 mt-0.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`hargaSatuan-${index}`} className="text-xs">Harga Satuan</Label>
                    <Input
                      id={`hargaSatuan-${index}`}
                      type="number"
                      value={item.hargaSatuan}
                      onChange={(e) => updateItem(index, 'hargaSatuan', parseFloat(e.target.value) || 0)}
                      placeholder=""
                      className="h-9 mt-0.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`diskon-${index}`} className="text-xs">Diskon</Label>
                    <Input
                      id={`diskon-${index}`}
                      type="number"
                      value={item.diskon}
                      onChange={(e) => updateItem(index, 'diskon', parseFloat(e.target.value) || 0)}
                      placeholder=""
                      className="h-9 mt-0.5"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs">Total Harga</Label>
                    <div className="h-9 flex items-center px-3 bg-gray-100 rounded-md border mt-0.5">
                      <span className="text-sm font-semibold">
                        Rp{item.totalHarga.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {formData.items.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm m-0">
                <p>Belum ada item. Klik "Tambah Item" untuk menambahkan.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 px-2 py-2 m-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/sales/quotations')}
            className="px-4 h-9"
          >
            Batal
          </Button>
          <Button
            type="submit"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 h-9"
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Simpan Penawaran'}
          </Button>
        </div>
      </form>
    </div>
  );
}