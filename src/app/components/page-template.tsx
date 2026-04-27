import { useState, useEffect } from "react";
import { PageHeader } from "./page-header";
import { DataTable } from "./data-table";
import { StatusBadge } from "./status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { api } from "../lib/api";
import { toast } from "sonner";

interface Field {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'email' | 'tel';
  required?: boolean;
  autoGenerate?: boolean; // Flag untuk field yang auto-generate
  readonly?: boolean; // Flag untuk field readonly
}

interface PageTemplateProps {
  title: string;
  breadcrumbs: { label: string; href?: string }[];
  apiEndpoint: string;
  fields: Field[];
  columns: any[];
  generateCode?: (existingData: any[]) => string; // Function untuk generate code otomatis
}

export function PageTemplate({ title, breadcrumbs, apiEndpoint, fields, columns, generateCode }: PageTemplateProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [editingItem, setEditingItem] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.get(apiEndpoint);
      if (response.success) {
        setData(response.data || []);
      }
    } catch (error) {
      console.error(`Error loading ${title}:`, error);
      toast.error(`Gagal memuat data ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Update existing item
        const response = await api.update(editingItem.id, formData);
        if (response.success) {
          toast.success(`${title} berhasil diperbarui`);
          setShowDialog(false);
          setFormData({});
          setEditingItem(null);
          loadData();
        }
      } else {
        // Create new item
        const response = await api.post(apiEndpoint, formData);
        if (response.success) {
          toast.success(`${title} berhasil ditambahkan`);
          setShowDialog(false);
          setFormData({});
          loadData();
        }
      }
    } catch (error) {
      console.error(`Error saving ${title}:`, error);
      toast.error(`Gagal menyimpan ${title.toLowerCase()}`);
    }
  };

  const handleEdit = (row: any) => {
    setEditingItem(row);
    // Populate form with existing data
    const editData: Record<string, string> = {};
    fields.forEach(field => {
      editData[field.name] = row[field.name] || '';
    });
    setFormData(editData);
    setShowDialog(true);
  };

  const handleOpenDialog = () => {
    setEditingItem(null);
    const initialData: Record<string, string> = {};
    
    // Generate code jika ada function generateCode
    if (generateCode) {
      initialData.code = generateCode(data);
    }
    
    setFormData(initialData);
    setShowDialog(true);
  };

  const handleDelete = async (row: any) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        await api.delete(`delete/${row.id}`);
        toast.success('Data berhasil dihapus');
        loadData();
      } catch (error) {
        console.error('Error deleting:', error);
        toast.error('Gagal menghapus data');
      }
    }
  };

  return (
    <div>
      <PageHeader
        title={title}
        breadcrumbs={breadcrumbs}
        onAdd={handleOpenDialog}
        addLabel="Tambah"
      />

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit' : 'Tambah'} {title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label} {field.required && '*'}
                  </Label>
                  <Input
                    id={field.name}
                    type={field.type || 'text'}
                    value={formData[field.name] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    required={field.required}
                    readOnly={field.readonly}
                    className={field.readonly ? 'bg-muted cursor-not-allowed' : ''}
                  />
                  {field.readonly && !editingItem && (
                    <p className="text-xs text-muted-foreground">
                      ✨ Kode otomatis terisi saat menambah data baru
                    </p>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowDialog(false);
                setEditingItem(null);
                setFormData({});
              }}>
                Batal
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {editingItem ? 'Perbarui' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}